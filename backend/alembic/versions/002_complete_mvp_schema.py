"""Complete Bridgr MVP schema.

Revision ID: 0002_complete_mvp_schema
Revises: 0001_initial_schema
Create Date: 2026-06-07

"""

from alembic import op

revision = "0002_complete_mvp_schema"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def _exec(sql: str) -> None:
    op.execute(sql)


def _create_enum(name: str, values: tuple[str, ...]) -> None:
    quoted_values = ", ".join(f"'{value}'" for value in values)
    _exec(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{name}') THEN
                CREATE TYPE {name} AS ENUM ({quoted_values});
            END IF;
        END $$;
        """
    )


def upgrade() -> None:
    _exec('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    _create_enum("skill_test_status", ("draft", "active", "archived"))
    _create_enum("test_attempt_status", ("started", "submitted", "passed", "failed"))
    _create_enum("certification_status", ("active", "expired", "revoked"))
    _create_enum("referral_payout_status", ("pending", "approved", "paid", "cancelled"))
    _create_enum("automation_rule_status", ("active", "paused", "archived"))
    _create_enum("automation_run_status", ("success", "failed", "skipped"))

    for table in (
        "skills",
        "worker_profiles",
        "worker_documents",
        "client_profiles",
        "client_jobs",
        "job_listings",
        "applications",
        "interviews",
        "projects",
        "project_members",
        "project_channels",
        "tasks",
        "milestones",
        "payments",
        "notifications",
        "referrals",
    ):
        _exec(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS worker_skills (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            worker_id UUID NOT NULL REFERENCES worker_profiles(id),
            skill_id UUID NOT NULL REFERENCES skills(id),
            years_experience INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ,
            CONSTRAINT uq_worker_skills_worker_skill UNIQUE (worker_id, skill_id)
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_worker_skills_worker_id ON worker_skills(worker_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_worker_skills_skill_id ON worker_skills(skill_id)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS listing_skills (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            listing_id UUID NOT NULL REFERENCES job_listings(id),
            skill_id UUID NOT NULL REFERENCES skills(id),
            required BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ,
            CONSTRAINT uq_listing_skills_listing_skill UNIQUE (listing_id, skill_id)
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_listing_skills_listing_id ON listing_skills(listing_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_listing_skills_skill_id ON listing_skills(skill_id)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS skill_tests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            skill_id UUID REFERENCES skills(id),
            pass_percentage INTEGER NOT NULL DEFAULT 70,
            duration_minutes INTEGER NOT NULL DEFAULT 30,
            status skill_test_status NOT NULL DEFAULT 'draft',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_skill_tests_skill_id ON skill_tests(skill_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_skill_tests_status ON skill_tests(status)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS test_questions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            test_id UUID NOT NULL REFERENCES skill_tests(id),
            prompt TEXT NOT NULL,
            choices JSONB,
            correct_answer VARCHAR(255),
            points INTEGER NOT NULL DEFAULT 1,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS test_attempts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            test_id UUID NOT NULL REFERENCES skill_tests(id),
            worker_id UUID NOT NULL REFERENCES worker_profiles(id),
            status test_attempt_status NOT NULL DEFAULT 'started',
            score INTEGER,
            answers JSONB,
            started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            submitted_at TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_test_attempts_worker_id ON test_attempts(worker_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON test_attempts(status)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS certifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            worker_id UUID NOT NULL REFERENCES worker_profiles(id),
            skill_id UUID REFERENCES skills(id),
            test_attempt_id UUID REFERENCES test_attempts(id),
            title VARCHAR(255) NOT NULL,
            status certification_status NOT NULL DEFAULT 'active',
            score INTEGER,
            issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at TIMESTAMPTZ,
            revoked_at TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_certifications_worker_id ON certifications(worker_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_certifications_skill_id ON certifications(skill_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS referral_codes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            owner_user_id UUID NOT NULL REFERENCES users(id),
            code VARCHAR(64) NOT NULL UNIQUE,
            referral_type referral_type NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_referral_codes_owner_user_id ON referral_codes(owner_user_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS referral_payouts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            referral_id UUID NOT NULL REFERENCES referrals(id),
            amount NUMERIC(12, 2) NOT NULL,
            currency billing_currency NOT NULL DEFAULT 'INR',
            status referral_payout_status NOT NULL DEFAULT 'pending',
            approved_by_user_id UUID REFERENCES users(id),
            paid_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_referral_payouts_referral_id ON referral_payouts(referral_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON referral_payouts(status)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS automation_rules (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            trigger_key VARCHAR(120) NOT NULL,
            conditions JSONB,
            actions JSONB,
            status automation_rule_status NOT NULL DEFAULT 'active',
            created_by_user_id UUID REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON automation_rules(status)")
    _exec("CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_key ON automation_rules(trigger_key)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS automation_runs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            rule_id UUID NOT NULL REFERENCES automation_rules(id),
            status automation_run_status NOT NULL,
            context JSONB,
            result JSONB,
            error TEXT,
            started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_automation_runs_rule_id ON automation_runs(rule_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status)")
    _exec("CREATE INDEX IF NOT EXISTS idx_automation_runs_created_at ON automation_runs(created_at)")

    _exec(
        """
        CREATE TABLE IF NOT EXISTS analytics_snapshots (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            snapshot_type VARCHAR(120) NOT NULL,
            period_start TIMESTAMPTZ NOT NULL,
            period_end TIMESTAMPTZ NOT NULL,
            metrics JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            deleted_at TIMESTAMPTZ
        )
        """
    )
    _exec(
        """
        CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_type_period
        ON analytics_snapshots(snapshot_type, period_start, period_end)
        """
    )
    _exec("CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_created_at ON analytics_snapshots(created_at)")

    _exec("CREATE INDEX IF NOT EXISTS idx_job_listings_visibility ON job_listings(visibility)")
    _exec("CREATE INDEX IF NOT EXISTS idx_applications_worker_id ON applications(worker_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_applications_listing_id ON applications(listing_id)")
    _exec("CREATE INDEX IF NOT EXISTS idx_messages_channel_created_at ON messages(channel_id, created_at)")
    _exec("CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at ON notifications(user_id, read_at)")
    _exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created_at ON audit_logs(actor_user_id, created_at)")


def downgrade() -> None:
    for table in (
        "analytics_snapshots",
        "automation_runs",
        "automation_rules",
        "referral_payouts",
        "referral_codes",
        "certifications",
        "test_attempts",
        "test_questions",
        "skill_tests",
        "listing_skills",
        "worker_skills",
    ):
        _exec(f"DROP TABLE IF EXISTS {table} CASCADE")

    for enum_name in (
        "automation_run_status",
        "automation_rule_status",
        "referral_payout_status",
        "certification_status",
        "test_attempt_status",
        "skill_test_status",
    ):
        _exec(f"DROP TYPE IF EXISTS {enum_name}")
