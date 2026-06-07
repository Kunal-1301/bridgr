"""Transactional email templates for Resend delivery."""

from dataclasses import dataclass


@dataclass(frozen=True)
class EmailTemplate:
    subject: str
    text: str
    html: str


def verify_email_template(verify_url: str) -> EmailTemplate:
    return EmailTemplate(
        subject="Verify your Bridgr email",
        text=f"Verify your Bridgr account: {verify_url}",
        html=f"<p>Verify your Bridgr account:</p><p><a href=\"{verify_url}\">Verify email</a></p>",
    )


def worker_approved_template(worker_name: str) -> EmailTemplate:
    return EmailTemplate(
        subject="Your Bridgr worker profile is approved",
        text=f"Hi {worker_name}, your Bridgr worker profile has been approved. You can now browse eligible listings.",
        html=f"<p>Hi {worker_name},</p><p>Your Bridgr worker profile has been approved. You can now browse eligible listings.</p>",
    )


def worker_rejected_template(worker_name: str, reason: str) -> EmailTemplate:
    return EmailTemplate(
        subject="Your Bridgr worker profile needs updates",
        text=f"Hi {worker_name}, your Bridgr worker profile needs updates before approval. Reason: {reason}",
        html=f"<p>Hi {worker_name},</p><p>Your Bridgr worker profile needs updates before approval.</p><p>Reason: {reason}</p>",
    )


def reset_password_template(reset_url: str) -> EmailTemplate:
    return EmailTemplate(
        subject="Reset your Bridgr password",
        text=f"Reset your Bridgr password: {reset_url}",
        html=f"<p>Reset your Bridgr password:</p><p><a href=\"{reset_url}\">Reset password</a></p>",
    )


def client_invite_template(invite_url: str) -> EmailTemplate:
    return EmailTemplate(
        subject="You have been invited to Bridgr",
        text=f"Accept your Bridgr client invite: {invite_url}",
        html=f"<p>You have been invited to Bridgr.</p><p><a href=\"{invite_url}\">Accept invite</a></p>",
    )


def payment_reminder_template(project_title: str, amount_due: str, payment_url: str) -> EmailTemplate:
    return EmailTemplate(
        subject=f"Payment reminder for {project_title}",
        text=f"Payment due for {project_title}: {amount_due}. Pay here: {payment_url}",
        html=f"<p>Payment due for {project_title}: <strong>{amount_due}</strong>.</p><p><a href=\"{payment_url}\">Pay now</a></p>",
    )
