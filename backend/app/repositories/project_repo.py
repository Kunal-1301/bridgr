from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import ChannelType, MessageType, ProjectMemberStatus, ProjectStatus
from app.db.models.project import Message, Milestone, Project, ProjectChannel, ProjectMember, Task
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    model = Project

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def get_member(self, project_id: UUID, worker_id: UUID) -> ProjectMember | None:
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.worker_id == worker_id,
                ProjectMember.status == ProjectMemberStatus.active,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_worker(
        self,
        worker_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[tuple[Project, ProjectMember]], int]:
        base = (
            select(Project, ProjectMember)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(
                ProjectMember.worker_id == worker_id,
                ProjectMember.status == ProjectMemberStatus.active,
            )
        )
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Project.created_at.desc()).limit(limit).offset(offset)
        )
        rows = [(row[0], row[1]) for row in result.all()]
        return rows, total

    async def count_active_by_worker(self, worker_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(
                ProjectMember.worker_id == worker_id,
                ProjectMember.status == ProjectMemberStatus.active,
                Project.status.in_((ProjectStatus.not_started, ProjectStatus.active)),
            )
        )
        return result.scalar_one()

    async def list_by_client_job_ids(
        self,
        client_job_ids: list[UUID],
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Project], int]:
        if not client_job_ids:
            return [], 0
        base = select(Project).where(Project.client_job_id.in_(client_job_ids))
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Project.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def list_all(
        self,
        status: ProjectStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Project], int]:
        base = select(Project)
        if status:
            base = base.where(Project.status == status)
        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Project.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def count_active(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Project).where(Project.status == ProjectStatus.active)
        )
        return result.scalar_one()

    async def get_channels(self, project_id: UUID, exclude_admin_private: bool = False) -> list[ProjectChannel]:
        stmt = select(ProjectChannel).where(ProjectChannel.project_id == project_id)
        if exclude_admin_private:
            stmt = stmt.where(ProjectChannel.channel_type != ChannelType.admin_private)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_first_general_channel(self, project_id: UUID) -> ProjectChannel | None:
        result = await self.db.execute(
            select(ProjectChannel).where(
                ProjectChannel.project_id == project_id,
                ProjectChannel.channel_type == ChannelType.general,
            ).limit(1)
        )
        return result.scalar_one_or_none()

    async def list_messages(
        self,
        project_id: UUID,
        channel_id: UUID | None = None,
        exclude_admin_private: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Message], int]:
        base = (
            select(Message)
            .join(ProjectChannel, ProjectChannel.id == Message.channel_id)
            .where(Message.project_id == project_id, Message.deleted_at.is_(None))
        )
        if channel_id:
            base = base.where(Message.channel_id == channel_id)
        elif exclude_admin_private:
            base = base.where(ProjectChannel.channel_type != ChannelType.admin_private)

        count_result = await self.db.execute(select(func.count()).select_from(base.subquery()))
        total = count_result.scalar_one()
        result = await self.db.execute(
            base.order_by(Message.created_at.asc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def create_message(
        self,
        project_id: UUID,
        channel_id: UUID,
        sender_id: UUID,
        content: str,
    ) -> Message:
        msg = Message(
            project_id=project_id,
            channel_id=channel_id,
            sender_id=sender_id,
            content=content,
            message_type=MessageType.text,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def get_milestones(self, project_id: UUID) -> list[Milestone]:
        result = await self.db.execute(
            select(Milestone).where(Milestone.project_id == project_id).order_by(Milestone.created_at)
        )
        return list(result.scalars().all())

    async def get_tasks(self, project_id: UUID, assigned_to: UUID | None = None) -> list[Task]:
        stmt = select(Task).where(Task.project_id == project_id)
        if assigned_to:
            stmt = stmt.where(Task.assigned_to == assigned_to)
        result = await self.db.execute(stmt.order_by(Task.created_at))
        return list(result.scalars().all())

    async def get_members(self, project_id: UUID) -> list[ProjectMember]:
        result = await self.db.execute(
            select(ProjectMember).where(ProjectMember.project_id == project_id)
        )
        return list(result.scalars().all())

    async def add_member(
        self,
        project_id: UUID,
        worker_id: UUID,
        role: str,
        agreed_amount: float,
        currency: str,
    ) -> ProjectMember:
        member = ProjectMember(
            project_id=project_id,
            worker_id=worker_id,
            role=role,
            agreed_amount=agreed_amount,
            agreed_currency=currency,
        )
        self.db.add(member)
        await self.db.flush()
        return member

    async def remove_member(self, member_id: UUID) -> bool:
        member = await self.db.get(ProjectMember, member_id)
        if not member:
            return False
        member.status = ProjectMemberStatus.removed
        member.left_at = datetime.now(UTC)
        await self.db.flush()
        return True

    async def create_channel(self, project_id: UUID, name: str, channel_type: ChannelType) -> ProjectChannel:
        channel = ProjectChannel(project_id=project_id, name=name, channel_type=channel_type)
        self.db.add(channel)
        await self.db.flush()
        return channel

    async def create_system_message(
        self,
        project_id: UUID,
        content: str,
        actor_id: UUID,
        channel_id: UUID | None = None,
    ) -> Message | None:
        if not channel_id:
            ch = await self.get_first_general_channel(project_id)
            if not ch:
                return None
            channel_id = ch.id

        from app.db.enums import MessageType
        msg = Message(
            project_id=project_id,
            channel_id=channel_id,
            sender_id=actor_id,
            content=content,
            message_type=MessageType.system,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg
