from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: UUID
    channelId: UUID
    senderId: UUID
    senderName: str
    senderRole: str
    content: str
    attachments: list[dict] = []
    createdAt: datetime
