from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from .initial_state import default_state_data

class StateMeta(BaseModel):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: int = 1
    type: str = "unrestricted"


class UserState(BaseModel):
    meta: StateMeta = Field(default_factory=StateMeta)
    data: Dict[str, Any] = Field(default_factory=default_state_data)
    note: Optional[str] = None

    def touch(self) -> None:
        self.meta.updated_at = datetime.now(timezone.utc)
        self.meta.version += 1
