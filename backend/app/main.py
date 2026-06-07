from collections import defaultdict, deque
from time import perf_counter, time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import AppError

_auth_attempts: defaultdict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    if forwarded_for := request.headers.get("x-forwarded-for"):
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _init_sentry() -> None:
    if not settings.SENTRY_DSN:
        return

    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    )


def create_app() -> FastAPI:
    _init_sentry()

    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        docs_url="/docs" if settings.is_dev else None,
        redoc_url="/redoc" if settings.is_dev else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def security_limits_middleware(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > settings.MAX_REQUEST_BODY_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large", "code": "request_body_too_large"},
            )

        if request.url.path.startswith("/api/v1/auth/"):
            now = time()
            key = f"{_client_ip(request)}:{request.url.path}"
            attempts = _auth_attempts[key]
            while attempts and now - attempts[0] > settings.AUTH_RATE_LIMIT_WINDOW_SECONDS:
                attempts.popleft()
            if len(attempts) >= settings.AUTH_RATE_LIMIT_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many authentication attempts", "code": "rate_limited"},
                )
            attempts.append(now)

        return await call_next(request)

    if settings.is_dev:
        @app.middleware("http")
        async def request_logging_middleware(request: Request, call_next):
            started = perf_counter()
            response = await call_next(request)
            elapsed_ms = (perf_counter() - started) * 1000
            print(f"{request.method} {request.url.path} -> {response.status_code} ({elapsed_ms:.1f}ms)")
            return response

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_: Request, exc: Exception):
        if settings.is_dev:
            return JSONResponse(status_code=500, content={"detail": str(exc), "code": "internal_error"})
        return JSONResponse(status_code=500, content={"detail": "Internal server error", "code": "internal_error"})

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
