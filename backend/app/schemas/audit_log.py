from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: UUID
    timestamp: datetime
    actor: str
    actionType: str
    description: str | None = None
    affectedRecord: str | None = None
    ip: str | None = None
