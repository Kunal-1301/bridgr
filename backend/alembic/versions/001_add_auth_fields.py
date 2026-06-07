"""Initial schema — all Bridgr MVP tables.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-06

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Extensions ──────────────────────────────────────────────────────────
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── Enum types (create once, referenced with create_type=False) ──────────
    op.execute("CREATE TYPE application_status AS ENUM ('applied','shortlisted','interview_scheduled','selected','rejected','withdrawn')")
    op.execute("CREATE TYPE availability AS ENUM ('full_time','part_time','weekends','unavailable')")
    op.execute("CREATE TYPE billing_currency AS ENUM ('USD','INR')")
    op.execute("CREATE TYPE channel_type AS ENUM ('general','announcements','files','admin_private')")
    op.execute("CREATE TYPE client_job_status AS ENUM ('submitted','under_review','relisted','in_progress','completed','cancelled')")
    op.execute("CREATE TYPE client_status AS ENUM ('active','inactive','suspended')")
    op.execute("CREATE TYPE client_visible_job_status AS ENUM ('submitted','reviewing','in_progress','completed')")
    op.execute("CREATE TYPE document_type AS ENUM ('resume','portfolio','id_proof','certificate','other')")
    op.execute("CREATE TYPE experience_level AS ENUM ('junior','mid','senior','expert')")
    op.execute("CREATE TYPE interview_mode AS ENUM ('online','offline','assignment')")
    op.execute("CREATE TYPE interview_status AS ENUM ('scheduled','completed','cancelled','no_show')")
    op.execute("CREATE TYPE job_category AS ENUM ('development','design','content','marketing','operations','other')")
    op.execute("CREATE TYPE job_listing_status AS ENUM ('draft','published','paused','closed','staffed','cancelled')")
    op.execute("CREATE TYPE job_listing_type AS ENUM ('open_application','invite_only','direct_assignment')")
    op.execute("CREATE TYPE job_listing_visibility AS ENUM ('all_verified','certified_only','invite_only')")
    op.execute("CREATE TYPE message_type AS ENUM ('text','file','system')")
    op.execute("CREATE TYPE milestone_status AS ENUM ('pending','submitted','approved','paid','disputed')")
    op.execute("CREATE TYPE notification_type AS ENUM ('info','success','warning','error','job','payment','project','verification')")
    op.execute("CREATE TYPE payee_type AS ENUM ('bridgr','worker')")
    op.execute("CREATE TYPE payer_type AS ENUM ('client','bridgr')")
    op.execute("CREATE TYPE payment_direction AS ENUM ('inbound_client_payment','outbound_worker_payout')")
    op.execute("CREATE TYPE payment_method AS ENUM ('bank_transfer','upi','stripe','razorpay','wise','paypal','manual')")
    op.execute("CREATE TYPE payment_status AS ENUM ('pending','received','paid','failed','cancelled')")
    op.execute("CREATE TYPE project_member_role AS ENUM ('worker','team_lead')")
    op.execute("CREATE TYPE project_member_status AS ENUM ('active','removed','completed','left')")
    op.execute("CREATE TYPE project_status AS ENUM ('not_started','active','paused','completed','cancelled','disputed')")
    op.execute("CREATE TYPE referral_status AS ENUM ('clicked','signed_up','approved','first_project','commission_due','paid')")
    op.execute("CREATE TYPE referral_type AS ENUM ('worker','client','affiliate')")
    op.execute("CREATE TYPE task_status AS ENUM ('todo','in_progress','review','done')")
    op.execute("CREATE TYPE user_role AS ENUM ('admin','worker','client','affiliate')")
    op.execute("CREATE TYPE user_status AS ENUM ('active','pending_verification','suspended','rejected','deleted')")
    op.execute("CREATE TYPE verification_status AS ENUM ('draft','submitted','pending','approved','rejected','flagged')")
    op.execute("CREATE TYPE worker_tier AS ENUM ('newcomer','verified','certified','pro','elite')")

    # ── 1. users ─────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", postgresql.ENUM(name="user_role", create_type=False), nullable=False),
        sa.Column("full_name", sa.String(160), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("status", postgresql.ENUM(name="user_status", create_type=False), nullable=False, server_default="active"),
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("email_verification_token", sa.String(500), nullable=True),
        sa.Column("password_reset_token", sa.String(500), nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("idx_users_email", "users", ["email"], unique=True)
    op.create_index("idx_users_role", "users", ["role"])
    op.create_index("idx_users_status", "users", ["status"])
    op.create_index("idx_users_created_at", "users", ["created_at"])

    # ── 2. skills ────────────────────────────────────────────────────────────
    op.create_table(
        "skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_skills"),
    )
    op.create_index("idx_skills_name", "skills", ["name"], unique=True)

    # ── 3. worker_profiles ───────────────────────────────────────────────────
    op.create_table(
        "worker_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("headline", sa.String(200), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("country", sa.String(100), nullable=False, server_default="India"),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=True),
        sa.Column("experience_level", postgresql.ENUM(name="experience_level", create_type=False), nullable=True),
        sa.Column("skills", postgresql.JSONB(), nullable=True),
        sa.Column("hourly_rate_min_inr", sa.Integer(), nullable=True),
        sa.Column("hourly_rate_max_inr", sa.Integer(), nullable=True),
        sa.Column("availability", postgresql.ENUM(name="availability", create_type=False), nullable=True),
        sa.Column("verification_status", postgresql.ENUM(name="verification_status", create_type=False), nullable=False, server_default="draft"),
        sa.Column("tier", postgresql.ENUM(name="worker_tier", create_type=False), nullable=False, server_default="newcomer"),
        sa.Column("trust_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_worker_profiles_user_id"),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"], name="fk_worker_profiles_approved_by"),
        sa.PrimaryKeyConstraint("id", name="pk_worker_profiles"),
        sa.UniqueConstraint("user_id", name="uq_worker_profiles_user_id"),
    )
    op.create_index("idx_worker_profiles_user_id", "worker_profiles", ["user_id"], unique=True)
    op.create_index("idx_worker_profiles_verification_status", "worker_profiles", ["verification_status"])
    op.create_index("idx_worker_profiles_tier", "worker_profiles", ["tier"])
    op.create_index("idx_worker_profiles_created_at", "worker_profiles", ["created_at"])

    # ── 4. worker_documents ──────────────────────────────────────────────────
    op.create_table(
        "worker_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_type", postgresql.ENUM(name="document_type", create_type=False), nullable=False),
        sa.Column("file_name", sa.String(500), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=True),
        sa.Column("file_key", sa.String(500), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("verification_status", postgresql.ENUM(name="verification_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["worker_id"], ["worker_profiles.id"], name="fk_worker_documents_worker_id"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], name="fk_worker_documents_reviewed_by"),
        sa.PrimaryKeyConstraint("id", name="pk_worker_documents"),
    )
    op.create_index("idx_worker_documents_worker_id", "worker_documents", ["worker_id"])
    op.create_index("idx_worker_documents_uploaded_at", "worker_documents", ["uploaded_at"])

    # ── 5. client_profiles ───────────────────────────────────────────────────
    op.create_table(
        "client_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_name", sa.String(180), nullable=False),
        sa.Column("contact_name", sa.String(160), nullable=False),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("country", sa.String(120), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=True),
        sa.Column("billing_currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=False, server_default="USD"),
        sa.Column("status", postgresql.ENUM(name="client_status", create_type=False), nullable=False, server_default="active"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_client_profiles_user_id"),
        sa.PrimaryKeyConstraint("id", name="pk_client_profiles"),
        sa.UniqueConstraint("user_id", name="uq_client_profiles_user_id"),
    )
    op.create_index("idx_client_profiles_user_id", "client_profiles", ["user_id"], unique=True)
    op.create_index("idx_client_profiles_created_at", "client_profiles", ["created_at"])

    # ── 6. client_jobs ───────────────────────────────────────────────────────
    op.create_table(
        "client_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", postgresql.ENUM(name="job_category", create_type=False), nullable=False),
        sa.Column("required_skills", postgresql.JSONB(), nullable=True),
        sa.Column("client_budget_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("client_budget_currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=False, server_default="USD"),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expected_team_size", sa.Integer(), nullable=True),
        sa.Column("status", postgresql.ENUM(name="client_job_status", create_type=False), nullable=False, server_default="submitted"),
        sa.Column("client_visible_status", postgresql.ENUM(name="client_visible_job_status", create_type=False), nullable=False, server_default="submitted"),
        sa.Column("confidential_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["client_profiles.id"], name="fk_client_jobs_client_id"),
        sa.PrimaryKeyConstraint("id", name="pk_client_jobs"),
    )
    op.create_index("idx_client_jobs_client_id", "client_jobs", ["client_id"])
    op.create_index("idx_client_jobs_status", "client_jobs", ["status"])
    op.create_index("idx_client_jobs_created_at", "client_jobs", ["created_at"])

    # ── 7. job_listings ──────────────────────────────────────────────────────
    op.create_table(
        "job_listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("public_description", sa.Text(), nullable=False),
        sa.Column("category", postgresql.ENUM(name="job_category", create_type=False), nullable=False),
        sa.Column("required_skills", postgresql.JSONB(), nullable=True),
        sa.Column("worker_budget_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("worker_budget_currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=False, server_default="INR"),
        sa.Column("estimated_duration", sa.String(100), nullable=True),
        sa.Column("application_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("openings", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("listing_type", postgresql.ENUM(name="job_listing_type", create_type=False), nullable=False, server_default="open_application"),
        sa.Column("status", postgresql.ENUM(name="job_listing_status", create_type=False), nullable=False, server_default="draft"),
        sa.Column("visibility", postgresql.ENUM(name="job_listing_visibility", create_type=False), nullable=False, server_default="all_verified"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["client_job_id"], ["client_jobs.id"], name="fk_job_listings_client_job_id"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_job_listings_created_by"),
        sa.PrimaryKeyConstraint("id", name="pk_job_listings"),
    )
    op.create_index("idx_job_listings_client_job_id", "job_listings", ["client_job_id"])
    op.create_index("idx_job_listings_status", "job_listings", ["status"])
    op.create_index("idx_job_listings_created_by", "job_listings", ["created_by"])
    op.create_index("idx_job_listings_created_at", "job_listings", ["created_at"])

    # ── 8. applications ──────────────────────────────────────────────────────
    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cover_letter", sa.Text(), nullable=True),
        sa.Column("proposed_rate_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("proposed_rate_currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=True),
        sa.Column("status", postgresql.ENUM(name="application_status", create_type=False), nullable=False, server_default="applied"),
        sa.Column("admin_score", sa.Integer(), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["listing_id"], ["job_listings.id"], name="fk_applications_listing_id"),
        sa.ForeignKeyConstraint(["worker_id"], ["worker_profiles.id"], name="fk_applications_worker_id"),
        sa.PrimaryKeyConstraint("id", name="pk_applications"),
        sa.UniqueConstraint("listing_id", "worker_id", name="uq_applications_listing_worker"),
    )
    op.create_index("idx_applications_listing_id", "applications", ["listing_id"])
    op.create_index("idx_applications_worker_id", "applications", ["worker_id"])
    op.create_index("idx_applications_status", "applications", ["status"])
    op.create_index("idx_applications_applied_at", "applications", ["applied_at"])

    # ── 9. interviews ────────────────────────────────────────────────────────
    op.create_table(
        "interviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("mode", postgresql.ENUM(name="interview_mode", create_type=False), nullable=False),
        sa.Column("meeting_link", sa.String(500), nullable=True),
        sa.Column("location", sa.String(500), nullable=True),
        sa.Column("status", postgresql.ENUM(name="interview_status", create_type=False), nullable=False, server_default="scheduled"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], name="fk_interviews_application_id"),
        sa.PrimaryKeyConstraint("id", name="pk_interviews"),
    )
    op.create_index("idx_interviews_application_id", "interviews", ["application_id"])
    op.create_index("idx_interviews_scheduled_at", "interviews", ["scheduled_at"])
    op.create_index("idx_interviews_created_at", "interviews", ["created_at"])

    # ── 10. projects ─────────────────────────────────────────────────────────
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_job_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("internal_description", sa.Text(), nullable=True),
        sa.Column("client_visible_summary", sa.Text(), nullable=True),
        sa.Column("status", postgresql.ENUM(name="project_status", create_type=False), nullable=False, server_default="not_started"),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["client_job_id"], ["client_jobs.id"], name="fk_projects_client_job_id"),
        sa.ForeignKeyConstraint(["listing_id"], ["job_listings.id"], name="fk_projects_listing_id"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_projects_created_by"),
        sa.PrimaryKeyConstraint("id", name="pk_projects"),
    )
    op.create_index("idx_projects_status", "projects", ["status"])
    op.create_index("idx_projects_created_at", "projects", ["created_at"])

    # ── 11. project_members ──────────────────────────────────────────────────
    op.create_table(
        "project_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", postgresql.ENUM(name="project_member_role", create_type=False), nullable=False, server_default="worker"),
        sa.Column("agreed_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("agreed_currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=False, server_default="INR"),
        sa.Column("status", postgresql.ENUM(name="project_member_status", create_type=False), nullable=False, server_default="active"),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], name="fk_project_members_project_id"),
        sa.ForeignKeyConstraint(["worker_id"], ["worker_profiles.id"], name="fk_project_members_worker_id"),
        sa.PrimaryKeyConstraint("id", name="pk_project_members"),
        sa.UniqueConstraint("project_id", "worker_id", name="uq_project_members_project_worker"),
    )
    op.create_index("idx_project_members_project_id", "project_members", ["project_id"])
    op.create_index("idx_project_members_worker_id", "project_members", ["worker_id"])

    # ── 12. project_channels ─────────────────────────────────────────────────
    op.create_table(
        "project_channels",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("channel_type", postgresql.ENUM(name="channel_type", create_type=False), nullable=False, server_default="general"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], name="fk_project_channels_project_id"),
        sa.PrimaryKeyConstraint("id", name="pk_project_channels"),
    )
    op.create_index("idx_project_channels_project_id", "project_channels", ["project_id"])
    op.create_index("idx_project_channels_created_at", "project_channels", ["created_at"])

    # ── 13. messages ─────────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("channel_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("attachment_url", sa.String(500), nullable=True),
        sa.Column("attachment_key", sa.String(500), nullable=True),
        sa.Column("message_type", postgresql.ENUM(name="message_type", create_type=False), nullable=False, server_default="text"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], name="fk_messages_project_id"),
        sa.ForeignKeyConstraint(["channel_id"], ["project_channels.id"], name="fk_messages_channel_id"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], name="fk_messages_sender_id"),
        sa.PrimaryKeyConstraint("id", name="pk_messages"),
    )
    op.create_index("idx_messages_project_id", "messages", ["project_id"])
    op.create_index("idx_messages_channel_id", "messages", ["channel_id"])
    op.create_index("idx_messages_sender_id", "messages", ["sender_id"])
    op.create_index("idx_messages_created_at", "messages", ["created_at"])

    # ── 14. tasks ────────────────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", postgresql.ENUM(name="task_status", create_type=False), nullable=False, server_default="todo"),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], name="fk_tasks_project_id"),
        sa.ForeignKeyConstraint(["assigned_to"], ["worker_profiles.id"], name="fk_tasks_assigned_to"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name="fk_tasks_created_by"),
        sa.PrimaryKeyConstraint("id", name="pk_tasks"),
    )
    op.create_index("idx_tasks_project_id", "tasks", ["project_id"])
    op.create_index("idx_tasks_created_at", "tasks", ["created_at"])

    # ── 15. milestones ───────────────────────────────────────────────────────
    op.create_table(
        "milestones",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("client_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("worker_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=False, server_default="USD"),
        sa.Column("status", postgresql.ENUM(name="milestone_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], name="fk_milestones_project_id"),
        sa.PrimaryKeyConstraint("id", name="pk_milestones"),
    )
    op.create_index("idx_milestones_project_id", "milestones", ["project_id"])
    op.create_index("idx_milestones_created_at", "milestones", ["created_at"])

    # ── 16. payments ─────────────────────────────────────────────────────────
    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("milestone_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payer_type", postgresql.ENUM(name="payer_type", create_type=False), nullable=False),
        sa.Column("payee_type", postgresql.ENUM(name="payee_type", create_type=False), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("worker_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=False),
        sa.Column("payment_direction", postgresql.ENUM(name="payment_direction", create_type=False), nullable=False),
        sa.Column("payment_method", postgresql.ENUM(name="payment_method", create_type=False), nullable=False),
        sa.Column("status", postgresql.ENUM(name="payment_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("transaction_reference", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("marked_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("marked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], name="fk_payments_project_id"),
        sa.ForeignKeyConstraint(["milestone_id"], ["milestones.id"], name="fk_payments_milestone_id"),
        sa.ForeignKeyConstraint(["client_id"], ["client_profiles.id"], name="fk_payments_client_id"),
        sa.ForeignKeyConstraint(["worker_id"], ["worker_profiles.id"], name="fk_payments_worker_id"),
        sa.ForeignKeyConstraint(["marked_by"], ["users.id"], name="fk_payments_marked_by"),
        sa.PrimaryKeyConstraint("id", name="pk_payments"),
    )
    op.create_index("idx_payments_project_id", "payments", ["project_id"])
    op.create_index("idx_payments_milestone_id", "payments", ["milestone_id"])
    op.create_index("idx_payments_client_id", "payments", ["client_id"])
    op.create_index("idx_payments_worker_id", "payments", ["worker_id"])
    op.create_index("idx_payments_status", "payments", ["status"])
    op.create_index("idx_payments_created_at", "payments", ["created_at"])

    # ── 17. audit_logs ───────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("entity_type", sa.String(120), nullable=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("ip_address", sa.String(80), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], name="fk_audit_logs_actor_user_id"),
        sa.PrimaryKeyConstraint("id", name="pk_audit_logs"),
    )
    op.create_index("idx_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("idx_audit_logs_action", "audit_logs", ["action"])
    op.create_index("idx_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("idx_audit_logs_created_at", "audit_logs", ["created_at"])

    # ── 18. notifications ────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("notification_type", postgresql.ENUM(name="notification_type", create_type=False), nullable=False, server_default="info"),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_notifications_user_id"),
        sa.PrimaryKeyConstraint("id", name="pk_notifications"),
    )
    op.create_index("idx_notifications_user_id", "notifications", ["user_id"])
    op.create_index("idx_notifications_created_at", "notifications", ["created_at"])

    # ── 19. referrals ────────────────────────────────────────────────────────
    op.create_table(
        "referrals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("referrer_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("referred_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("referral_code", sa.String(80), nullable=False),
        sa.Column("referral_type", postgresql.ENUM(name="referral_type", create_type=False), nullable=False),
        sa.Column("status", postgresql.ENUM(name="referral_status", create_type=False), nullable=False, server_default="clicked"),
        sa.Column("commission_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("commission_currency", postgresql.ENUM(name="billing_currency", create_type=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["referrer_user_id"], ["users.id"], name="fk_referrals_referrer_user_id"),
        sa.ForeignKeyConstraint(["referred_user_id"], ["users.id"], name="fk_referrals_referred_user_id"),
        sa.PrimaryKeyConstraint("id", name="pk_referrals"),
        sa.UniqueConstraint("referral_code", name="uq_referrals_code"),
    )
    op.create_index("idx_referrals_referrer_user_id", "referrals", ["referrer_user_id"])
    op.create_index("idx_referrals_referred_user_id", "referrals", ["referred_user_id"])
    op.create_index("idx_referrals_referral_code", "referrals", ["referral_code"])
    op.create_index("idx_referrals_created_at", "referrals", ["created_at"])


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("referrals")
    op.drop_table("notifications")
    op.drop_table("audit_logs")
    op.drop_table("payments")
    op.drop_table("milestones")
    op.drop_table("tasks")
    op.drop_table("messages")
    op.drop_table("project_channels")
    op.drop_table("project_members")
    op.drop_table("projects")
    op.drop_table("interviews")
    op.drop_table("applications")
    op.drop_table("job_listings")
    op.drop_table("client_jobs")
    op.drop_table("client_profiles")
    op.drop_table("worker_documents")
    op.drop_table("worker_profiles")
    op.drop_table("skills")
    op.drop_table("users")

    # Drop enum types in reverse alphabetical order
    op.execute("DROP TYPE IF EXISTS worker_tier")
    op.execute("DROP TYPE IF EXISTS verification_status")
    op.execute("DROP TYPE IF EXISTS user_status")
    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS task_status")
    op.execute("DROP TYPE IF EXISTS referral_type")
    op.execute("DROP TYPE IF EXISTS referral_status")
    op.execute("DROP TYPE IF EXISTS project_status")
    op.execute("DROP TYPE IF EXISTS project_member_status")
    op.execute("DROP TYPE IF EXISTS project_member_role")
    op.execute("DROP TYPE IF EXISTS payment_status")
    op.execute("DROP TYPE IF EXISTS payment_method")
    op.execute("DROP TYPE IF EXISTS payment_direction")
    op.execute("DROP TYPE IF EXISTS payer_type")
    op.execute("DROP TYPE IF EXISTS payee_type")
    op.execute("DROP TYPE IF EXISTS notification_type")
    op.execute("DROP TYPE IF EXISTS milestone_status")
    op.execute("DROP TYPE IF EXISTS message_type")
    op.execute("DROP TYPE IF EXISTS job_listing_visibility")
    op.execute("DROP TYPE IF EXISTS job_listing_type")
    op.execute("DROP TYPE IF EXISTS job_listing_status")
    op.execute("DROP TYPE IF EXISTS job_category")
    op.execute("DROP TYPE IF EXISTS interview_status")
    op.execute("DROP TYPE IF EXISTS interview_mode")
    op.execute("DROP TYPE IF EXISTS experience_level")
    op.execute("DROP TYPE IF EXISTS document_type")
    op.execute("DROP TYPE IF EXISTS client_visible_job_status")
    op.execute("DROP TYPE IF EXISTS client_status")
    op.execute("DROP TYPE IF EXISTS client_job_status")
    op.execute("DROP TYPE IF EXISTS channel_type")
    op.execute("DROP TYPE IF EXISTS billing_currency")
    op.execute("DROP TYPE IF EXISTS availability")
    op.execute("DROP TYPE IF EXISTS application_status")
