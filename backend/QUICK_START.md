# Auth Quick Start Guide

## TL;DR - Get Started in 5 Minutes

### 1. Database Setup
```bash
# Apply migrations to create auth tables
alembic upgrade head
```

### 2. Create Admin
```bash
# Set environment variables
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=SecurePass123!

# Run script
python -m app.scripts.create_admin
```

### 3. Test Login
```bash
# Login request
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'

# Response:
# {
#   "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
#   "user": {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "email": "admin@example.com",
#     "role": "admin",
#     "fullName": "Admin User",
#     "isActive": true,
#     "createdAt": "2024-06-06T12:00:00Z"
#   }
# }

# Refresh token is automatically set in cookie (via Set-Cookie header)
```

## Using Auth in Your Routes

### Require Authentication
```python
from fastapi import APIRouter
from app.api.deps import CurrentUser, DbSession

router = APIRouter()

@router.get("/profile")
async def get_profile(user: CurrentUser, db: DbSession):
    """Any authenticated user can access this."""
    return {
        "userId": str(user.id),
        "email": user.email,
        "role": user.role.value
    }
```

### Require Specific Role
```python
from app.api.deps import RequireAdmin, RequireWorker, DbSession

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: RequireAdmin, db: DbSession):
    """Only admins can access this."""
    # If non-admin tries to call this, they get 403 Forbidden
    pass

@router.get("/my-jobs")
async def get_my_jobs(worker: RequireWorker, db: DbSession):
    """Only workers can access this."""
    pass
```

### Multiple Role Check
```python
from app.api.deps import require_roles, UserRole, CurrentUser, DbSession

@router.post("/submit-application")
async def submit_app(
    user: require_roles(UserRole.worker, UserRole.client),
    db: DbSession
):
    """Workers or clients can access this."""
    pass
```

## Frontend Integration

### React Example
```javascript
// 1. Login
const login = async (email, password) => {
  const response = await fetch('http://api.localhost:8000/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include',  // Important: send cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, portal: 'worker' })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  // Store access token in memory or state
  localStorage.setItem('accessToken', data.accessToken);
  return data.user;
};

// 2. Make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',  // Send refresh token cookie
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // If 401, refresh and retry
  if (response.status === 401) {
    await refreshToken();
    return fetchWithAuth(url, options);  // Retry
  }
  
  return response;
};

// 3. Refresh token
const refreshToken = async () => {
  const response = await fetch('http://api.localhost:8000/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})  // Empty body, token in cookie
  });
  
  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
};

// 4. Logout
const logout = async () => {
  const token = localStorage.getItem('accessToken');
  await fetch('http://api.localhost:8000/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  localStorage.removeItem('accessToken');
};
```

## Available Endpoints

| Method | Endpoint | Auth Required | Notes |
|--------|----------|:-------------:|-------|
| POST | `/auth/login` | ❌ | Returns access token + user |
| POST | `/auth/refresh` | ❌ | Returns new access token |
| POST | `/auth/logout` | ✅ | Clears cookie |
| GET | `/auth/me` | ✅ | Returns current user |
| POST | `/auth/register-worker` | ❌ | Creates worker + profile |
| POST | `/auth/forgot-password` | ❌ | Sends reset email |
| POST | `/auth/reset-password` | ❌ | Requires reset token |
| POST | `/auth/verify-email/{token}` | ❌ | Marks email as verified |

## Troubleshooting

### "Invalid authentication token"
- Token expired (30 min default)
- Token format wrong (should be `Bearer <token>`)
- Wrong JWT secret

### "Invalid refresh token"
- Refresh token cookie not sent
- Refresh token expired (14 days default)
- CORS issue with credentials

### Can't access protected route
- Authorization header missing
- Access token not included
- Wrong role for route

## Common Patterns

### Check User Role in Handler
```python
@router.post("/my-route")
async def my_route(user: CurrentUser):
    if user.role == "admin":
        # Admin-only logic
        pass
    elif user.role == "worker":
        # Worker-only logic
        pass
```

### Get User from Database
```python
from app.repositories.user_repo import UserRepository

@router.get("/user/{user_id}")
async def get_user(user_id: str, current_user: CurrentUser, db: DbSession):
    repo = UserRepository(db)
    user = await repo.get(user_id)
    if not user:
        return {"error": "User not found"}
    return user
```

### Log Custom Audit Event
```python
from app.services.audit_service import AuditService

@router.post("/sensitive-action")
async def sensitive_action(user: CurrentUser, db: DbSession, request: Request):
    # Do something
    
    # Log it
    audit = AuditService(db)
    await audit.log_action(
        action="sensitive_action",
        actor_id=user.id,
        description="User performed sensitive action"
    )
    await db.commit()
```

## Environment Variables

Must set before running:
```bash
# Auth tokens (generate: python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=your-32-char-secret-key
JWT_REFRESH_SECRET=your-32-char-refresh-key

# Secure cookies (false for local dev, true for production)
SECURE_COOKIE_SECURE=false
SECURE_COOKIE_SAME_SITE=lax

# Admin user creation
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123

# Optional
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
VERCEL_FRONTEND_URL=https://app.vercel.app
```

## Running Tests

```bash
# All auth tests
pytest tests/test_auth.py -v

# Specific test
pytest tests/test_auth.py::test_login_success -v

# With coverage
pytest tests/test_auth.py --cov=app.services.auth_service
```

## Production Checklist

- [ ] Generate new JWT secrets (don't use examples)
- [ ] Set `SECURE_COOKIE_SECURE=true`
- [ ] Set `SECURE_COOKIE_SAME_SITE=none` (for Vercel + Railway)
- [ ] Enable HTTPS
- [ ] Set `VERCEL_FRONTEND_URL` to production frontend
- [ ] Test login flow end-to-end
- [ ] Test token refresh
- [ ] Monitor audit logs
- [ ] Set up rate limiting on auth endpoints
- [ ] Configure email service for verification/reset
- [ ] Test in production environment

## Need Help?

See detailed docs: [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md)

Implementation summary: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
