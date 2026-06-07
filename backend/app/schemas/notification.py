from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: UUID
    title: str
    body: str
    kind: str
    read: bool
    createdAt: datetime
