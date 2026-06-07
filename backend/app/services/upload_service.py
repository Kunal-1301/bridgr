"""File upload service backed by Cloudflare R2 (S3-compatible)."""

import asyncio
from functools import lru_cache
from uuid import uuid4

from app.core.config import settings
from app.core.errors import AppError

ALLOWED_MIME_TYPES: frozenset[str] = frozenset(
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
    }
)

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@lru_cache(maxsize=1)
def _s3_client():
    """Return a lazily-created boto3 S3 client or None when R2 is not configured."""
    if not settings.R2_ENDPOINT_URL or not settings.R2_ACCESS_KEY_ID:
        return None
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


class UploadService:
    # ── Key generation ──────────────────────────────────────────

    @staticmethod
    def worker_document_key(worker_id: str, filename: str) -> str:
        safe = filename.replace(" ", "_")
        return f"workers/{worker_id}/documents/{uuid4()}-{safe}"

    @staticmethod
    def project_file_key(project_id: str, filename: str) -> str:
        safe = filename.replace(" ", "_")
        return f"projects/{project_id}/files/{uuid4()}-{safe}"

    # ── Validation ──────────────────────────────────────────────

    @staticmethod
    def validate(content_type: str, size: int) -> None:
        if content_type not in ALLOWED_MIME_TYPES:
            raise AppError(
                f"Unsupported file type '{content_type}'. Allowed: PDF, DOCX, PNG, JPG.",
                422,
                "unsupported_file_type",
            )
        if size > _MAX_BYTES:
            raise AppError(
                f"File too large ({size / 1_048_576:.1f} MB). Maximum is 10 MB.",
                413,
                "file_too_large",
            )

    # ── Upload ──────────────────────────────────────────────────

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        """Upload bytes to R2 and return an accessible URL."""
        client = _s3_client()
        if not client:
            # Dev / test fallback — no R2 configured
            return f"https://storage.bridgr.dev/{key}"

        def _put() -> None:
            client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=key,
                Body=data,
                ContentType=content_type,
            )

        await asyncio.to_thread(_put)

        if settings.R2_PUBLIC_BASE_URL:
            return f"{settings.R2_PUBLIC_BASE_URL.rstrip('/')}/{key}"

        return await self.signed_url(key, expires_in=86_400)

    # ── Signed URL ──────────────────────────────────────────────

    async def signed_url(self, key: str, expires_in: int = 3600) -> str:
        client = _s3_client()
        if not client:
            return f"https://storage.bridgr.dev/{key}"

        def _sign() -> str:
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
                ExpiresIn=expires_in,
            )

        return await asyncio.to_thread(_sign)
