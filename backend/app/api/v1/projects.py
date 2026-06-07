from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.db.models.user import UserRole

router = APIRouter(dependencies=[Depends(require_roles(UserRole.worker, UserRole.admin))])


@router.get("")
async def get_projects():
    return []


@router.get("/{project_id}")
async def get_project(project_id: str):
    return {"id": project_id}


@router.get("/{project_id}/messages")
async def get_project_messages(project_id: str):
    return {"projectId": project_id, "messages": []}


@router.get("/{project_id}/tasks")
async def get_project_tasks(project_id: str):
    return {"projectId": project_id, "tasks": []}
