from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.db.models.user import UserRole

router = APIRouter(dependencies=[Depends(require_roles(UserRole.worker, UserRole.admin))])


@router.get("")
async def get_available_jobs():
    return {"jobs": [], "total": 0, "page": 1, "pageSize": 20}


@router.get("/available")
async def get_available_jobs_alias():
    return {"jobs": [], "total": 0, "page": 1, "pageSize": 20}


@router.get("/{job_id}")
async def get_job_by_id(job_id: str):
    return {"id": job_id}


@router.post("/{job_id}/apply")
async def apply_to_job(job_id: str, payload: dict):
    return {"ok": True, "jobId": job_id, **payload}
