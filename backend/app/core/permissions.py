from app.db.models.user import User, UserRole


def require_role(user: User, *roles: UserRole) -> None:
    if user.role not in roles:
        from app.core.errors import AppError

        raise AppError("You do not have permission to access this resource", status_code=403, code="forbidden")
