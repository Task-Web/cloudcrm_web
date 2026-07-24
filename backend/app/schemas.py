from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field

from .models import StateMeta, UserState


class StateRequest(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    note: Optional[str] = None
    meta: Optional[StateMeta] = None


class StatePatchRequest(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    note: Optional[str] = None


class StateResponse(BaseModel):
    user_id: str
    state: UserState


class InfoResponse(BaseModel):
    app_name: str
    python_version: str
    env: Dict[str, str]
    request: Dict[str, Any]


class FileMetadata(BaseModel):
    id: str
    name: str
    size: int
    type: str
    url: str
    filename: str


class CrmComment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    commentId: str
    content: str
    createdDate: str
    likeCount: int = 0
    likes: list[str] = Field(default_factory=list)
    userId: str


class StrictCrmModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AccountFields(StrictCrmModel):
    billingCity: Optional[str] = None
    billingCountry: Optional[str] = None
    billingState: Optional[str] = None
    billingStreet: Optional[str] = None
    billingZip: Optional[str] = None
    description: Optional[str] = None
    employees: Optional[int] = None
    industry: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    revenue: Optional[float] = None
    shippingCity: Optional[str] = None
    shippingCountry: Optional[str] = None
    shippingState: Optional[str] = None
    shippingStreet: Optional[str] = None
    shippingZip: Optional[str] = None
    type: Optional[str] = None
    website: Optional[str] = None


class AccountCreate(AccountFields):
    name: str


class AccountUpdate(AccountFields):
    pass


class ActivityFields(StrictCrmModel):
    assignedToId: Optional[str] = None
    description: Optional[str] = None
    dueDate: Optional[str] = None
    priority: Optional[str] = None
    relatedToId: Optional[str] = None
    relatedToType: Optional[str] = None
    status: Optional[str] = None
    subject: Optional[str] = None
    type: Optional[str] = None


class ActivityCreate(ActivityFields):
    subject: str


class ActivityUpdate(ActivityFields):
    pass


class CaseFields(StrictCrmModel):
    accountId: Optional[str] = None
    contactId: Optional[str] = None
    description: Optional[str] = None
    origin: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    subject: Optional[str] = None


class CaseCreate(CaseFields):
    subject: str


class CaseUpdate(CaseFields):
    pass


class ChatterPostCreate(StrictCrmModel):
    content: str = Field(min_length=1, max_length=5000)


class ChatterCommentCreate(StrictCrmModel):
    content: str = Field(min_length=1, max_length=2000)


class ContactFields(StrictCrmModel):
    accountId: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    mailingCity: Optional[str] = None
    mailingCountry: Optional[str] = None
    mailingState: Optional[str] = None
    mailingStreet: Optional[str] = None
    mailingZip: Optional[str] = None
    mobile: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None


class ContactCreate(ContactFields):
    firstName: str
    lastName: str


class ContactUpdate(ContactFields):
    pass


class DashboardFields(StrictCrmModel):
    chartType: Optional[str] = None
    description: Optional[str] = None
    name: Optional[str] = None


class DashboardCreate(DashboardFields):
    name: str


class DashboardUpdate(DashboardFields):
    pass


class CrmFileCreate(StrictCrmModel):
    uploadId: str


class LeadFields(StrictCrmModel):
    city: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    employees: Optional[int] = None
    firstName: Optional[str] = None
    industry: Optional[str] = None
    lastName: Optional[str] = None
    mobile: Optional[str] = None
    phone: Optional[str] = None
    rating: Optional[str] = None
    revenue: Optional[float] = None
    source: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    street: Optional[str] = None
    title: Optional[str] = None
    website: Optional[str] = None
    zip: Optional[str] = None


class LeadCreate(LeadFields):
    company: str
    firstName: str
    lastName: str


class LeadUpdate(LeadFields):
    pass


class LeadConversionRequest(StrictCrmModel):
    createAccount: bool = True
    createContact: bool = True
    createOpportunity: bool = True
    accountName: Optional[str] = None
    opportunityName: Optional[str] = None
    amount: float = 0
    closeDate: Optional[str] = None
    stage: str = "Prospecting"


class OpportunityFields(StrictCrmModel):
    accountId: Optional[str] = None
    amount: Optional[float] = None
    closeDate: Optional[str] = None
    description: Optional[str] = None
    leadSource: Optional[str] = None
    name: Optional[str] = None
    nextStep: Optional[str] = None
    probability: Optional[float] = None
    stage: Optional[str] = None
    type: Optional[str] = None


class OpportunityCreate(OpportunityFields):
    name: str


class OpportunityUpdate(OpportunityFields):
    pass


class UserProfileUpdate(StrictCrmModel):
    avatar: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    locale: Optional[str] = None
    phone: Optional[str] = None
    theme: Optional[str] = None
    timezone: Optional[str] = None
    title: Optional[str] = None
