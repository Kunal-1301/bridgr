from fastapi import APIRouter, Depends, Query

from app.api.deps import require_roles
from app.db.models.user import UserRole
from app.services.upload_service import UploadService

router = APIRouter(dependencies=[Depends(require_roles(UserRole.worker, UserRole.client, UserRole.admin))])


@router.get("/presign")
async def presign_upload(
    filename: str = Query(min_length=1),
    content_type: str = Query(alias="contentType"),
    category: str = Query(pattern="^(worker-resumes|worker-id-proofs|portfolio-files|project-files|invoices)$"),
    size: int = Query(gt=0, le=10 * 1024 * 1024),
):
    return await UploadService().presign_upload(
        filename=filename,
        content_type=content_type,
        category=category,
        size=size,
    )
