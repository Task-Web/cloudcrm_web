import pytest


@pytest.mark.asyncio
async def test_workspace_and_lead_create_preserve_unrelated_state(async_client):
    cookie = "crm-api-create"
    await async_client.patch(
        "/api/state",
        params={"cookie": cookie},
        json={
            "data": {
                "evaluator_marker": {"keep": True},
                "developer_tools_open": False,
            }
        },
    )

    workspace = await async_client.get(
        "/api/crm/workspace", params={"cookie": cookie}
    )
    assert workspace.status_code == 200
    assert set(workspace.json()) == {"user_id", "workspace"}
    assert "evaluator_marker" not in workspace.json()["workspace"]

    created = await async_client.post(
        "/api/crm/leads",
        params={"cookie": cookie},
        json={"firstName": "Ada", "lastName": "Lovelace", "company": "Analytical"},
    )
    assert created.status_code == 200
    lead = next(
        item for item in created.json()["workspace"]["leads"] if item["firstName"] == "Ada"
    )
    assert lead["leadId"].startswith("lead_")
    assert lead["ownerId"] == created.json()["workspace"]["user"]["userId"]

    state = (
        await async_client.get("/api/state", params={"cookie": cookie})
    ).json()["state"]["data"]
    assert state["evaluator_marker"] == {"keep": True}
    assert state["developer_tools_open"] is False
    assert any(item["leadId"] == lead["leadId"] for item in state["leads"])


@pytest.mark.asyncio
async def test_lead_routes_reject_arbitrary_internal_and_invalid_fields(async_client):
    cookie = "crm-api-validation"
    valid = {"firstName": "Grace", "lastName": "Hopper", "company": "Compiler"}

    for field in ("arbitrary_state", "developer_tools_open", "leadId"):
        response = await async_client.post(
            "/api/crm/leads",
            params={"cookie": cookie},
            json={**valid, field: "forbidden"},
        )
        assert response.status_code == 422

    response = await async_client.patch(
        "/api/crm/leads/missing-lead",
        params={"cookie": cookie},
        json={"status": "Working"},
    )
    assert response.status_code == 404

    response = await async_client.delete(
        "/api/crm/leads/missing-lead", params={"cookie": cookie}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_lead_conversion_transition_and_cookie_isolation(async_client):
    first_cookie = "crm-api-convert-first"
    second_cookie = "crm-api-convert-second"
    lead = (
        await async_client.post(
            "/api/crm/leads",
            params={"cookie": first_cookie},
            json={"firstName": "Katherine", "lastName": "Johnson", "company": "NASA"},
        )
    ).json()["workspace"]["leads"][-1]

    invalid_transition = await async_client.post(
        f"/api/crm/leads/{lead['leadId']}/convert",
        params={"cookie": first_cookie},
        json={"createAccount": False, "createOpportunity": True},
    )
    assert invalid_transition.status_code == 422

    converted = await async_client.post(
        f"/api/crm/leads/{lead['leadId']}/convert",
        params={"cookie": first_cookie},
        json={
            "createAccount": True,
            "createContact": True,
            "createOpportunity": True,
            "accountName": "NASA",
            "opportunityName": "Orbital program",
            "amount": 250000,
        },
    )
    assert converted.status_code == 200
    converted_lead = next(
        item
        for item in converted.json()["workspace"]["leads"]
        if item["leadId"] == lead["leadId"]
    )
    assert converted_lead["status"] == "Qualified"

    converted_again = await async_client.post(
        f"/api/crm/leads/{lead['leadId']}/convert",
        params={"cookie": first_cookie},
        json={"createAccount": True, "createOpportunity": False},
    )
    assert converted_again.status_code == 409

    other_workspace = (
        await async_client.get("/api/crm/workspace", params={"cookie": second_cookie})
    ).json()["workspace"]
    assert all(item["leadId"] != lead["leadId"] for item in other_workspace["leads"])


@pytest.mark.asyncio
async def test_control_plane_is_hidden_from_public_openapi(async_client):
    schema = (await async_client.get("/api/openapi.json")).json()
    assert "/api/state" not in schema["paths"]
    assert all(tag.get("name") != "state" for tag in schema.get("tags", []))
