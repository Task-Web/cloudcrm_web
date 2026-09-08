import mimetypes
import os
import platform
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from mcp.server.fastmcp import FastMCP

from .config import Settings, get_settings
from .file_store import FileStore
from .schemas import (
    AccountCreate,
    AccountUpdate,
    ActivityCreate,
    ActivityUpdate,
    CaseCreate,
    CaseUpdate,
    ChatterCommentCreate,
    ChatterPostCreate,
    ContactCreate,
    ContactUpdate,
    CrmFileCreate,
    DashboardCreate,
    DashboardUpdate,
    FileMetadata,
    InfoResponse,
    LeadCreate,
    LeadConversionRequest,
    LeadUpdate,
    OpportunityCreate,
    OpportunityUpdate,
    StatePatchRequest,
    StateRequest,
    StateResponse,
    UserProfileUpdate,
)
from .state_store import StateStore

settings = get_settings()
store = StateStore()
file_store = FileStore("files", settings.api_prefix)

tags_metadata = [
    {"name": "files", "description": "Upload and fetch files scoped to a user cookie"},
    {"name": "system", "description": "Environment and health information"},
]


def _resolve_user_cookie(provided: Optional[str]) -> str:
    return provided if provided else str(uuid.uuid4())


def _set_user_cookie(response: Response, user_id: str, settings: Settings) -> None:
    response.set_cookie(
        settings.cookie_name,
        user_id,
        max_age=settings.cookie_max_age,
        httponly=False,
        samesite="lax",
    )


# MCP server mirrors REST API operations via Streamable HTTP
mcp_server = FastMCP(
    name=f"{settings.app_name} MCP",
    instructions=(
        "Streamable HTTP MCP interface mirroring the REST API. "
        "Supply user_cookie to reuse the same per-user state; "
        "omit to generate a new cookie-backed state."
    ),
    host="0.0.0.0",
    streamable_http_path="/",
)

mcp_http_app = mcp_server.streamable_http_app()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start MCP session manager so Streamable HTTP transport works when mounted
    mcp_ctx = mcp_server.session_manager.run()
    await mcp_ctx.__aenter__()
    try:
        yield
    finally:
        await mcp_ctx.__aexit__(None, None, None)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    openapi_tags=tags_metadata,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_user_id(
    request: Request, response: Response, settings: Settings = Depends(get_settings)
) -> str:
    cookie_override = request.query_params.get("cookie")
    user_id = cookie_override or request.cookies.get(settings.cookie_name)
    if not user_id:
        user_id = str(uuid.uuid4())
    _set_user_cookie(response, user_id, settings)
    return user_id


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    # Minimal middleware that ensures each response carries a request id header.
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    response: JSONResponse = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.get("/health", tags=["system"])
async def health() -> Dict[str, str]:
    return {"status": "ok"}


# when build on the basesite, the below endpoints about state management should remain unchanged
@app.get(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    include_in_schema=False,
)
async def get_state(user_id: str = Depends(get_user_id)) -> StateResponse:
    state = await store.get_state(user_id)
    return StateResponse(user_id=user_id, state=state)


@app.put(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Replace state",
    include_in_schema=False,
)
async def put_state(payload: StateRequest, user_id: str = Depends(get_user_id)) -> StateResponse:
    next_state = {"data": payload.data, "note": payload.note}
    if payload.meta is not None:
        next_state["meta"] = payload.meta
    state = await store.replace_state(user_id, next_state)
    return StateResponse(user_id=user_id, state=state)


@app.patch(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Merge into existing state",
    include_in_schema=False,
)
async def patch_state(
    payload: StatePatchRequest, user_id: str = Depends(get_user_id)
) -> StateResponse:
    state = await store.patch_state(user_id, patch=payload.data, note=payload.note)
    return StateResponse(user_id=user_id, state=state)


@app.delete(
    f"{settings.api_prefix}/state",
    response_model=StateResponse,
    tags=["state"],
    summary="Reset and clear state",
    include_in_schema=False,
)
async def delete_state(user_id: str = Depends(get_user_id)) -> StateResponse:
    file_store.delete_user_files(user_id)
    state = await store.reset_state(user_id)
    return StateResponse(user_id=user_id, state=state)


CRM_ID_FIELDS = {
    "accounts": "accountId",
    "activities": "activityId",
    "cases": "caseId",
    "chatterPosts": "postId",
    "contacts": "contactId",
    "dashboards": "dashboardId",
    "files": "fileId",
    "leads": "leadId",
    "opportunities": "opportunityId",
    "users": "userId",
}

CRM_RESOURCE_ROUTES = {
    "accounts": ("accounts", AccountCreate, AccountUpdate),
    "activities": ("activities", ActivityCreate, ActivityUpdate),
    "cases": ("cases", CaseCreate, CaseUpdate),
    "contacts": ("contacts", ContactCreate, ContactUpdate),
    "dashboards": ("dashboards", DashboardCreate, DashboardUpdate),
    "files": ("file-records", CrmFileCreate, None),
    "leads": ("leads", LeadCreate, LeadUpdate),
    "opportunities": ("opportunities", OpportunityCreate, OpportunityUpdate),
    "users": ("users", None, UserProfileUpdate),
}


def _crm_projection(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    keys = {*CRM_ID_FIELDS, "following", "user"}
    return {"user_id": user_id, "workspace": {key: data.get(key) for key in keys}}


@app.get(f"{settings.api_prefix}/crm/workspace", tags=["crm"])
async def crm_workspace(user_id: str = Depends(get_user_id)) -> Dict[str, Any]:
    state = await store.get_state(user_id)
    return _crm_projection(user_id, state.data)


@app.post(f"{settings.api_prefix}/crm/leads/{{lead_id}}/convert", tags=["crm"])
async def convert_crm_lead(
    lead_id: str,
    payload: LeadConversionRequest,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    if not any((payload.createAccount, payload.createContact, payload.createOpportunity)):
        raise HTTPException(status_code=422, detail="Select at least one record to create")
    if payload.createOpportunity and not payload.createAccount:
        raise HTTPException(
            status_code=422, detail="An opportunity conversion requires an account"
        )

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        lead = next(
            (item for item in data.get("leads", []) if item.get("leadId") == lead_id),
            None,
        )
        if lead is None:
            raise HTTPException(status_code=404, detail="Lead not found")
        if (
            lead.get("isConverted") is True
            or lead.get("status") == "Converted"
            or any(
                lead.get(key)
                for key in (
                    "convertedAccountId", "convertedContactId",
                    "convertedOpportunityId", "convertedDate",
                )
            )
        ):
            raise HTTPException(status_code=409, detail="Lead is already converted")
        now_value = datetime.now(timezone.utc)
        now = now_value.isoformat().replace("+00:00", "Z")
        account_id = None
        contact_id = None
        opportunity_id = None
        if payload.createAccount:
            account_id = f"account_{uuid.uuid4().hex}"
            data.setdefault("accounts", []).append(
                {
                    "accountId": account_id,
                    "name": payload.accountName or lead.get("company", ""),
                    "phone": lead.get("phone", ""),
                    "website": lead.get("website", ""),
                    "type": "Prospect",
                    "industry": lead.get("industry", ""),
                    "revenue": lead.get("revenue", 0),
                    "employees": lead.get("employees", 0),
                    "description": lead.get("description", ""),
                    "ownerId": lead.get("ownerId"),
                    "billingStreet": lead.get("street", ""),
                    "billingCity": lead.get("city", ""),
                    "billingState": lead.get("state", ""),
                    "billingZip": lead.get("zip", ""),
                    "billingCountry": lead.get("country", ""),
                    "shippingStreet": lead.get("street", ""),
                    "shippingCity": lead.get("city", ""),
                    "shippingState": lead.get("state", ""),
                    "shippingZip": lead.get("zip", ""),
                    "shippingCountry": lead.get("country", ""),
                    "createdDate": now,
                    "modifiedDate": now,
                }
            )
        if payload.createContact:
            contact_id = f"contact_{uuid.uuid4().hex}"
            data.setdefault("contacts", []).append(
                {
                    "contactId": contact_id,
                    "accountId": account_id or "",
                    "firstName": lead.get("firstName", ""),
                    "lastName": lead.get("lastName", ""),
                    "title": lead.get("title", ""),
                    "department": "",
                    "email": lead.get("email", ""),
                    "phone": lead.get("phone", ""),
                    "mobile": lead.get("mobile", ""),
                    "mailingStreet": lead.get("street", ""),
                    "mailingCity": lead.get("city", ""),
                    "mailingState": lead.get("state", ""),
                    "mailingZip": lead.get("zip", ""),
                    "mailingCountry": lead.get("country", ""),
                    "ownerId": lead.get("ownerId"),
                    "createdDate": now,
                    "modifiedDate": now,
                }
            )
        if payload.createOpportunity:
            opportunity_id = f"opp_{uuid.uuid4().hex}"
            data.setdefault("opportunities", []).append(
                {
                    "opportunityId": opportunity_id,
                    "name": payload.opportunityName or f"{lead.get('company', '')} - Opportunity",
                    "accountId": account_id,
                    "amount": payload.amount,
                    "closeDate": payload.closeDate
                    or (now_value + timedelta(days=30)).isoformat().replace("+00:00", "Z"),
                    "stage": payload.stage,
                    "probability": 10,
                    "type": "New Business",
                    "leadSource": lead.get("source", ""),
                    "nextStep": "Initial contact",
                    "description": lead.get("description", ""),
                    "ownerId": lead.get("ownerId"),
                    "createdDate": now,
                    "modifiedDate": now,
                }
            )
        lead["status"] = "Qualified"
        lead["isConverted"] = True
        lead["convertedDate"] = now
        lead["convertedAccountId"] = account_id
        lead["convertedContactId"] = contact_id
        lead["convertedOpportunityId"] = opportunity_id
        lead["modifiedDate"] = now
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


def _resource_endpoint(resource: str, action: str, model_type=None):
    id_field = CRM_ID_FIELDS[resource]

    if action == "create":
        async def create(payload: model_type, user_id: str = Depends(get_user_id)):
            values = payload.model_dump(exclude_none=True)
            now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            profile_id = (await store.get_state(user_id)).data.get("user", {}).get("userId")
            if resource == "files":
                upload_id = values.pop("uploadId")
                upload = next(
                    (item for item in file_store.list_files(user_id) if item.id == upload_id),
                    None,
                )
                if upload is None:
                    raise HTTPException(status_code=404, detail="Uploaded file not found")
                values = {
                    "fileId": upload.id,
                    "name": upload.name,
                    "ownerId": profile_id,
                    "size": upload.size,
                    "type": upload.type,
                    "uploadDate": now,
                    "url": upload.url,
                }
            else:
                record_id = f"{id_field.removesuffix('Id')}_{uuid.uuid4().hex}"
                values[id_field] = record_id
                values["createdDate"] = now
                if resource in {"accounts", "contacts", "leads", "opportunities"}:
                    values["modifiedDate"] = now
                    values["ownerId"] = profile_id
                if resource == "cases":
                    values["ownerId"] = profile_id
                if resource == "dashboards":
                    values["createdBy"] = profile_id

            def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
                records = data.setdefault(resource, [])
                record_id = values[id_field]
                if any(record.get(id_field) == record_id for record in records):
                    raise HTTPException(status_code=409, detail="Record already exists")
                if resource == "cases":
                    values["caseNumber"] = f"CASE-{len(records) + 1:04d}"
                records.append(values)
                return data

            state = await store.mutate_data(user_id, mutate)
            return _crm_projection(user_id, state.data)

        create.__name__ = f"create_crm_{resource}"
        return create

    if action == "update":
        async def update(record_id: str, payload: model_type, user_id: str = Depends(get_user_id)):
            values = payload.model_dump(exclude_none=True)
            body_id = values.pop(id_field, None)
            if body_id is not None and body_id != record_id:
                raise HTTPException(status_code=422, detail="Record id cannot be changed")
            if not values:
                raise HTTPException(status_code=422, detail="At least one field is required")
            if resource in {"accounts", "contacts", "leads", "opportunities"}:
                values["modifiedDate"] = datetime.now(timezone.utc).isoformat().replace(
                    "+00:00", "Z"
                )

            def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
                records = data.setdefault(resource, [])
                index = next(
                    (idx for idx, item in enumerate(records) if item.get(id_field) == record_id),
                    None,
                )
                if index is None:
                    raise HTTPException(status_code=404, detail="Record not found")
                records[index] = {**records[index], **values}
                return data

            state = await store.mutate_data(user_id, mutate)
            return _crm_projection(user_id, state.data)

        update.__name__ = f"update_crm_{resource}"
        return update

    async def delete(record_id: str, user_id: str = Depends(get_user_id)):
        def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
            records = data.setdefault(resource, [])
            index = next(
                (idx for idx, item in enumerate(records) if item.get(id_field) == record_id),
                None,
            )
            if index is None:
                raise HTTPException(status_code=404, detail="Record not found")
            records.pop(index)
            return data

        state = await store.mutate_data(user_id, mutate)
        return _crm_projection(user_id, state.data)

    delete.__name__ = f"delete_crm_{resource}"
    return delete


for _resource, (_route, _create_model, _update_model) in CRM_RESOURCE_ROUTES.items():
    _path = f"{settings.api_prefix}/crm/{_route}"
    if _create_model is not None:
        app.add_api_route(
            _path,
            _resource_endpoint(_resource, "create", _create_model),
            methods=["POST"],
            tags=["crm"],
        )
    if _update_model is not None:
        app.add_api_route(
            f"{_path}/{{record_id}}",
            _resource_endpoint(_resource, "update", _update_model),
            methods=["PATCH"],
            tags=["crm"],
        )
    if _resource != "users":
        app.add_api_route(
            f"{_path}/{{record_id}}",
            _resource_endpoint(_resource, "delete"),
            methods=["DELETE"],
            tags=["crm"],
        )


@app.post(f"{settings.api_prefix}/crm/chatter-posts", tags=["crm"])
async def create_chatter_post(
    payload: ChatterPostCreate, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        profile_id = data.get("user", {}).get("userId")
        post = {
            "postId": f"post-{uuid.uuid4().hex}",
            "userId": profile_id,
            "content": payload.content,
            "createdDate": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "likeCount": 0,
            "commentCount": 0,
            "likes": [],
            "comments": [],
        }
        data.setdefault("chatterPosts", []).insert(0, post)
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


def _chatter_post(data: Dict[str, Any], post_id: str) -> Dict[str, Any]:
    post = next(
        (item for item in data.get("chatterPosts", []) if item.get("postId") == post_id),
        None,
    )
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@app.put(f"{settings.api_prefix}/crm/chatter-posts/{{post_id}}/likes/me", tags=["crm"])
async def like_chatter_post(
    post_id: str, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        profile_id = data.get("user", {}).get("userId")
        post = _chatter_post(data, post_id)
        likes = post.setdefault("likes", [])
        if profile_id not in likes:
            likes.append(profile_id)
        post["likeCount"] = len(likes)
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


@app.delete(f"{settings.api_prefix}/crm/chatter-posts/{{post_id}}/likes/me", tags=["crm"])
async def unlike_chatter_post(
    post_id: str, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        profile_id = data.get("user", {}).get("userId")
        post = _chatter_post(data, post_id)
        likes = post.setdefault("likes", [])
        if profile_id in likes:
            likes.remove(profile_id)
        post["likeCount"] = len(likes)
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


@app.post(f"{settings.api_prefix}/crm/chatter-posts/{{post_id}}/comments", tags=["crm"])
async def comment_on_chatter_post(
    post_id: str,
    payload: ChatterCommentCreate,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        profile_id = data.get("user", {}).get("userId")
        post = _chatter_post(data, post_id)
        post.setdefault("comments", []).append(
            {
                "commentId": f"comment-{uuid.uuid4().hex}",
                "userId": profile_id,
                "content": payload.content,
                "createdDate": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "likeCount": 0,
                "likes": [],
            }
        )
        post["commentCount"] = len(post["comments"])
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


@app.patch(f"{settings.api_prefix}/crm/profile/{{profile_id}}", tags=["crm"])
async def update_crm_profile(
    profile_id: str,
    payload: UserProfileUpdate,
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    values = payload.model_dump(exclude_none=True)
    if not values:
        raise HTTPException(status_code=422, detail="At least one field is required")

    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        profile = data.get("user", {})
        if profile.get("userId") != profile_id:
            raise HTTPException(status_code=404, detail="Profile not found")
        data["user"] = {**profile, **values}
        data["users"] = [
            {**item, **values} if item.get("userId") == profile_id else item
            for item in data.get("users", [])
        ]
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


@app.post(f"{settings.api_prefix}/crm/following/{{profile_id}}", tags=["crm"])
async def follow_crm_profile(
    profile_id: str, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        if not any(item.get("userId") == profile_id for item in data.get("users", [])):
            raise HTTPException(status_code=404, detail="Profile not found")
        following = data.setdefault("following", [])
        if profile_id not in following:
            following.append(profile_id)
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


@app.delete(f"{settings.api_prefix}/crm/following/{{profile_id}}", tags=["crm"])
async def unfollow_crm_profile(
    profile_id: str, user_id: str = Depends(get_user_id)
) -> Dict[str, Any]:
    def mutate(data: Dict[str, Any]) -> Dict[str, Any]:
        following = data.setdefault("following", [])
        if profile_id not in following:
            raise HTTPException(status_code=404, detail="Followed profile not found")
        following.remove(profile_id)
        return data

    state = await store.mutate_data(user_id, mutate)
    return _crm_projection(user_id, state.data)


@app.post(
    f"{settings.api_prefix}/files",
    response_model=List[FileMetadata],
    tags=["files"],
    summary="Upload files for the current user",
)
async def upload_files(
    files: List[UploadFile] = File(...), user_id: str = Depends(get_user_id)
) -> List[FileMetadata]:
    return [file_store.save_upload(upload, user_id) for upload in files]


@app.get(
    f"{settings.api_prefix}/files",
    response_model=List[FileMetadata],
    tags=["files"],
    summary="List files for the current user",
)
async def list_files(user_id: str = Depends(get_user_id)) -> List[FileMetadata]:
    return file_store.list_files(user_id)


@app.get(
    f"{settings.api_prefix}/files/{{filename}}",
    tags=["files"],
    summary="Fetch a stored file for the current user",
)
async def get_file(filename: str, user_id: str = Depends(get_user_id)) -> FileResponse:
    target_path = file_store.get_file_path(user_id, filename)
    if not target_path:
        raise HTTPException(status_code=404, detail="File not found")
    display_name = filename.split("__", 1)[1] if "__" in filename else filename
    media_type = mimetypes.guess_type(display_name)[0] or "application/octet-stream"
    response = FileResponse(target_path, media_type=media_type, filename=display_name)
    _set_user_cookie(response, user_id, settings)
    return response


@app.get(
    f"{settings.api_prefix}/info",
    response_model=InfoResponse,
    tags=["system"],
    summary="System and request info",
)
async def info(request: Request, user_id: str = Depends(get_user_id)) -> InfoResponse:
    runtime_env = {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "env_mode": os.getenv("ENV", "dev"),
    }
    request_info: Dict[str, Any] = {
        "client": request.client.host if request.client else "unknown",
        "headers": dict(request.headers),
        "path": request.url.path,
        "method": request.method,
        "user_id": user_id,
    }
    return InfoResponse(
        app_name=settings.app_name,
        python_version=runtime_env["python_version"],
        env=runtime_env,
        request=request_info,
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": request.headers.get("x-request-id")},
    )


@mcp_server.tool(
    name="info",
    description="Return backend environment info and the resolved user id.",
)
async def mcp_info(user_cookie: Optional[str] = None) -> Dict[str, Any]:
    user_id = _resolve_user_cookie(user_cookie)
    runtime_env = {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "env_mode": os.getenv("ENV", "dev"),
    }
    return {
        "app_name": settings.app_name,
        "user_id": user_id,
        "env": runtime_env,
    }


@mcp_server.tool(
    name="get_state",
    description="Return the current state for the provided user cookie.",
)
async def mcp_get_state(user_cookie: Optional[str] = None) -> Dict[str, Any]:
    user_id = _resolve_user_cookie(user_cookie)
    state = await store.get_state(user_id)
    return {"user_id": user_id, "state": state.model_dump(mode="json")}


@mcp_server.tool(
    name="replace_state",
    description="Replace the current state for the provided user cookie.",
)
async def mcp_replace_state(
    data: Dict[str, Any],
    note: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
    user_cookie: Optional[str] = None,
) -> Dict[str, Any]:
    user_id = _resolve_user_cookie(user_cookie)
    next_state: Dict[str, Any] = {"data": data, "note": note}
    if meta is not None:
        next_state["meta"] = meta
    state = await store.replace_state(user_id, next_state)
    return {"user_id": user_id, "state": state.model_dump(mode="json")}


@mcp_server.tool(
    name="patch_state",
    description="Merge the provided data into the current state.",
)
async def mcp_patch_state(
    data: Dict[str, Any],
    note: Optional[str] = None,
    user_cookie: Optional[str] = None,
) -> Dict[str, Any]:
    user_id = _resolve_user_cookie(user_cookie)
    state = await store.patch_state(user_id, patch=data, note=note)
    return {"user_id": user_id, "state": state.model_dump(mode="json")}


@mcp_server.tool(
    name="reset_state",
    description="Reset the current state for the provided user cookie.",
)
async def mcp_reset_state(user_cookie: Optional[str] = None) -> Dict[str, Any]:
    user_id = _resolve_user_cookie(user_cookie)
    file_store.delete_user_files(user_id)
    state = await store.reset_state(user_id)
    return {"user_id": user_id, "state": state.model_dump(mode="json")}


# Mount MCP Streamable HTTP app at /mcp for remote access
app.mount("/mcp", mcp_http_app)
