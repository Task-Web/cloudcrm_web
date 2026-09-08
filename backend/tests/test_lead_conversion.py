import asyncio
from datetime import datetime

import pytest

COLLECTIONS = ("accounts", "contacts", "opportunities")
CONVERSION_FIELDS = (
    "isConverted",
    "convertedDate",
    "convertedAccountId",
    "convertedContactId",
    "convertedOpportunityId",
)


async def create_lead(client, status="Qualified"):
    response = await client.post(
        "/api/crm/leads",
        json={
            "firstName": "Ada",
            "lastName": "Lovelace",
            "company": "Analytical",
            "email": "ada@example.com",
            "status": status,
        },
    )
    assert response.status_code == 200
    workspace = response.json()["workspace"]
    return workspace["leads"][-1], workspace


def find_lead(workspace, lead_id):
    return next(lead for lead in workspace["leads"] if lead["leadId"] == lead_id)


@pytest.mark.asyncio
@pytest.mark.parametrize("status", ["New", "Working", "Qualified"])
async def test_convert_once_with_linked_records(async_client, status):
    lead, before = await create_lead(async_client, status)
    endpoint = f"/api/crm/leads/{lead['leadId']}/convert"
    response = await async_client.post(endpoint, json={"amount": 375000})
    assert response.status_code == 200, response.text
    after = response.json()["workspace"]
    converted = find_lead(after, lead["leadId"])
    assert converted["status"] == "Qualified"
    assert converted["isConverted"] is True
    assert datetime.fromisoformat(converted["convertedDate"].replace("Z", "+00:00")).tzinfo
    for collection, id_field, converted_field in [
        ("accounts", "accountId", "convertedAccountId"),
        ("contacts", "contactId", "convertedContactId"),
        ("opportunities", "opportunityId", "convertedOpportunityId"),
    ]:
        assert len(after[collection]) == len(before[collection]) + 1
        record = next(r for r in after[collection] if r[id_field] == converted[converted_field])
        if collection != "accounts":
            assert record["accountId"] == converted["convertedAccountId"]
    assert after["opportunities"][-1]["amount"] == 375000
    repeated = await async_client.post(endpoint, json={})
    assert repeated.status_code == 409
    assert (await async_client.get("/api/crm/workspace")).json()["workspace"] == after


@pytest.mark.asyncio
async def test_qualifying_does_not_convert(async_client):
    lead, before = await create_lead(async_client, "Working")
    response = await async_client.patch(
        f"/api/crm/leads/{lead['leadId']}", json={"status": "Qualified"}
    )
    assert response.status_code == 200
    after = response.json()["workspace"]
    qualified = find_lead(after, lead["leadId"])
    assert qualified["status"] == "Qualified"
    assert all(not qualified.get(key) for key in CONVERSION_FIELDS)
    assert all(after[key] == before[key] for key in COLLECTIONS)


@pytest.mark.asyncio
async def test_concurrent_conversion_creates_only_one_set(async_client):
    lead, before = await create_lead(async_client)
    endpoint = f"/api/crm/leads/{lead['leadId']}/convert"
    responses = await asyncio.gather(
        async_client.post(endpoint, json={}), async_client.post(endpoint, json={})
    )
    assert sorted(response.status_code for response in responses) == [200, 409]
    after = (await async_client.get("/api/crm/workspace")).json()["workspace"]
    assert all(len(after[key]) == len(before[key]) + 1 for key in COLLECTIONS)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "marker",
    [{"status": "Converted"}]
    + [{key: True if key == "isConverted" else "existing-conversion"} for key in CONVERSION_FIELDS],
)
async def test_existing_conversion_markers_prevent_duplicates(async_client, marker):
    lead, before = await create_lead(async_client, "Working")
    find_lead(before, lead["leadId"]).update(marker)
    seeded = await async_client.put("/api/state", json={"data": before})
    assert seeded.status_code == 200
    response = await async_client.post(f"/api/crm/leads/{lead['leadId']}/convert", json={})
    assert response.status_code == 409
    assert (await async_client.get("/api/crm/workspace")).json()["workspace"] == before


@pytest.mark.asyncio
async def test_status_edit_cannot_reset_conversion(async_client):
    lead, _ = await create_lead(async_client)
    endpoint = f"/api/crm/leads/{lead['leadId']}"
    assert (await async_client.post(f"{endpoint}/convert", json={})).status_code == 200
    edited = await async_client.patch(endpoint, json={"status": "Working", "title": "Director"})
    assert edited.status_code == 200
    assert find_lead(edited.json()["workspace"], lead["leadId"])["isConverted"] is True
    assert (await async_client.post(f"{endpoint}/convert", json={})).status_code == 409


@pytest.mark.asyncio
@pytest.mark.parametrize("field", CONVERSION_FIELDS)
async def test_conversion_fields_are_server_owned(async_client, field):
    lead, _ = await create_lead(async_client)
    value = True if field == "isConverted" else "forged"
    response = await async_client.patch(f"/api/crm/leads/{lead['leadId']}", json={field: value})
    assert response.status_code == 422
    response = await async_client.post(
        "/api/crm/leads",
        json={"firstName": "Grace", "lastName": "Hopper", "company": "Compiler", field: value},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "selection",
    [
        {"createAccount": False, "createContact": False, "createOpportunity": False},
        {"createAccount": False, "createContact": True, "createOpportunity": True},
    ],
)
async def test_invalid_conversion_leaves_state_untouched(async_client, selection):
    lead, before = await create_lead(async_client, "Working")
    response = await async_client.post(f"/api/crm/leads/{lead['leadId']}/convert", json=selection)
    assert response.status_code == 422
    assert (await async_client.get("/api/crm/workspace")).json()["workspace"] == before


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "selection,fields",
    [
        (
            {"createAccount": True, "createContact": False, "createOpportunity": False},
            ["convertedAccountId"],
        ),
        (
            {"createAccount": False, "createContact": True, "createOpportunity": False},
            ["convertedContactId"],
        ),
        (
            {"createAccount": True, "createContact": False, "createOpportunity": True},
            ["convertedAccountId", "convertedOpportunityId"],
        ),
    ],
)
async def test_optional_records_match_conversion_metadata(async_client, selection, fields):
    lead, before = await create_lead(async_client)
    response = await async_client.post(f"/api/crm/leads/{lead['leadId']}/convert", json=selection)
    assert response.status_code == 200
    after = response.json()["workspace"]
    converted = find_lead(after, lead["leadId"])
    assert converted["isConverted"] is True
    for field, collection in zip(CONVERSION_FIELDS[2:], COLLECTIONS):
        assert bool(converted.get(field)) == (field in fields)
        assert len(after[collection]) == len(before[collection]) + int(field in fields)


@pytest.mark.asyncio
async def test_another_cookie_cannot_convert_lead(async_client):
    lead, before = await create_lead(async_client)
    owner = async_client.cookies.get("user_id")
    response = await async_client.post(
        f"/api/crm/leads/{lead['leadId']}/convert",
        params={"cookie": "conversion-other-user"},
        json={},
    )
    assert response.status_code == 404
    response = await async_client.get("/api/crm/workspace", params={"cookie": owner})
    assert response.json()["workspace"] == before
