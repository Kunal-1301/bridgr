from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import AppError


def create_app() -> FastAPI:
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
