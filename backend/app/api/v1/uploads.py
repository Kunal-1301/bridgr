from fastapi import APIRouter, Depends, Query

from app.api.deps import require_roles
from app.db.models.user import UserRole
from app.services.upload_service import UploadService

router = APIRouter(dependencies=[Depends(require_roles(UserRole.worker, UserRole.client, UserRole.admin))])


@router.get("/presign")
async def presign_upload(filename: str = Query(min_length=1), content_type: str = Query(alias="contentType")):
    return await UploadService().presign(filename, content_type)
