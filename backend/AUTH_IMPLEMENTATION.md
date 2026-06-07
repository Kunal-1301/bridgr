# Authentication Implementation Guide

## Overview

Bridgr backend now has production-ready authentication supporting 4 user roles:
- **admin**: Full system access
- **worker**: Can take on projects/jobs
- **client**: Can post projects/jobs
- **affiliate**: Referral partners

## Key Features

### 1. Password Security
- BCrypt hashing with automatic salting
- Passwords never stored in plaintext
- Passwords never returned in API responses

### 2. JWT Tokens

#### Access Token
- Short expiry (default: 30 minutes)
- Used for API authentication
- Returned in response body as `accessToken`
- Sent in `Authorization: Bearer <token>` header

#### Refresh Token
- Long expiry (default: 14 days)
- Used to get new access tokens
- **Secure httpOnly cookie** (cannot be accessed by JavaScript)
- Set with `SameSite=None` in production (Vercel frontend + Railway backend)
- Set with `SameSite=Lax` in development (localhost frontend + localhost backend)
- `Secure=True` in production (HTTPS only)
- `Secure=False` in local development (HTTP allowed)

### 3. Security Features

- Email normalized to lowercase (prevents duplicate emails with different cases)
- User account deactivation support
- Email verification system
- Password reset via tokens
- Rate limiting ready (implement in nginx/load balancer)
- IP address logging for audit trail
- Audit logging for all auth events

## Environment Configuration

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/bridgr

# JWT Secrets (generate strong random values for production)
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production

# Token Expiry
ACCESS_TOKEN_EXPIRE_MINUTES=30          # Access token lifetime
REFRESH_TOKEN_EXPIRE_DAYS=14            # Refresh token lifetime
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS=24
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=1

# Frontend URLs
FRONTEND_URL=http://localhost:5173      # Local development
VERCEL_FRONTEND_URL=https://yourapp.vercel.app

# Secure Cookie Settings
SECURE_COOKIE_SECURE=false              # Set to true in production
SECURE_COOKIE_SAME_SITE=lax             # Set to "none" in production

# Admin Creation
ADMIN_EMAIL=admin@bridgr.app
ADMIN_PASSWORD=SecurePassword123
ADMIN_NAME=Admin User
```

## API Endpoints

### Authentication Endpoints

All endpoints use JSON request/response bodies.

#### POST /api/v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "YourPassword123",
  "portal": "worker"  // Optional: worker, client, admin
}
```

**Response (200):**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "worker",
    "fullName": "John Doe",
    "isActive": true,
    "createdAt": "2024-06-06T12:00:00Z"
  }
}
```

**Refresh token:** Automatically set as httpOnly cookie in response headers

**Errors:**
- `401 invalid_credentials`: Wrong email/password
- `403 wrong_role`: User role doesn't match requested portal
- `403 inactive_account`: User account is deactivated

#### POST /api/v1/auth/refresh
Refresh the access token using the refresh token cookie.

**Request:**
```json
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Errors:**
- `401 invalid_refresh_token`: Invalid or expired refresh token

#### POST /api/v1/auth/logout
Logout the current user. Requires valid access token.

**Request:** (Empty body)

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Browser behavior:** Refresh token cookie is automatically deleted

#### GET /api/v1/auth/me
Get current authenticated user info. Requires valid access token.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "worker",
  "fullName": "John Doe",
  "isActive": true,
  "createdAt": "2024-06-06T12:00:00Z"
}
```

#### POST /api/v1/auth/register-worker
Register a new worker account.

**Request:**
```json
{
  "fullName": "Jane Worker",
  "email": "jane@example.com",
  "password": "SecurePassword123",
  "phone": "+1-555-123-4567",
  "city": "San Francisco",
  "dateOfBirth": "1990-01-15",
  "bio": "Experienced Python developer with 5 years of expertise",
  "skills": ["Python", "JavaScript", "React"],
  "experienceLevel": "Senior",
  "rateMin": 75.00,
  "rateMax": 150.00
}
```

**Response (200):**
```json
{
  "message": "Worker registered successfully. Please verify your email.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**
- `409 email_exists`: Email already registered
- `422 validation_error`: Missing required fields

#### POST /api/v1/auth/forgot-password
Request password reset. Returns generic message for security.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If email exists, password reset link has been sent. Check your email for instructions."
}
```

#### POST /api/v1/auth/reset-password
Reset password using token from email.

**Request:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "password": "NewSecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Errors:**
- `401 invalid_token`: Invalid or expired token

#### POST /api/v1/auth/verify-email/{token}
Verify user email using token sent in registration email.

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Errors:**
- `401 invalid_token`: Invalid or expired token

## Role-Based Access Control

### Usage in Protected Routes

```python
from fastapi import APIRouter
from app.api.deps import RequireWorker, RequireAdmin, CurrentUser, DbSession
from app.schemas.worker import WorkerProfileOut

router = APIRouter()

@router.get("/me/profile", response_model=WorkerProfileOut)
async def get_my_profile(user: RequireWorker, db: DbSession):
    """Get worker profile - workers only."""
    # user is guaranteed to be a worker
    pass

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: RequireAdmin, db: DbSession):
    """Delete user - admins only."""
    pass

@router.post("/audit")
async def create_audit_entry(current_user: CurrentUser, db: DbSession):
    """Any authenticated user can create audit entry."""
    pass
```

### Available Dependencies

```python
from app.api.deps import (
    CurrentUser,        # Any authenticated user
    RequireAdmin,       # Must be admin
    RequireWorker,      # Must be worker
    RequireClient,      # Must be client
    RequireAffiliate,   # Must be affiliate
)
```

## Creating Admin User

### Via CLI Script

```bash
# Development
ADMIN_EMAIL=admin@bridgr.app \
ADMIN_PASSWORD=SecurePassword123 \
ADMIN_NAME="Admin User" \
python -m app.scripts.create_admin

# Or set in .env file
python -m app.scripts.create_admin
```

### Via API (Admin Only)

```python
# POST /api/v1/auth/admin/create
# Requires valid admin access token
{
  "email": "newadmin@bridgr.app",
  "password": "SecurePassword123",
  "fullName": "New Admin"
}
```

## Audit Logging

All authentication events are logged to the `audit_logs` table:

- `login_success`: Successful login with user ID and IP
- `login_failure`: Failed login attempt with email and IP
- `logout`: User logout with user ID
- `worker_registration`: New worker registration
- `token_refresh_failure`: Failed token refresh attempt
- `password_reset_request`: Password reset requested
- `password_reset_success`: Password successfully reset
- `email_verified`: Email verified

Access audit logs:
```python
from app.services.audit_service import AuditService

audit_service = AuditService(db)
# All logging methods are automatically called during auth operations
```

## Database Migrations

Run migrations to create/update tables:

```bash
# Create all tables
alembic upgrade head

# Create new migration after model changes
alembic revision --autogenerate -m "your migration message"

# Rollback migration
alembic downgrade -1
```

## Security Best Practices

### Frontend (React/Vue/Angular)

```javascript
// 1. Store access token in memory (not localStorage)
let accessToken = null;

// 2. Login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include', // Send cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
accessToken = data.accessToken; // Store in memory

// 3. Make authenticated requests
const apiResponse = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// 4. Token refresh (automatic)
// When access token expires, refresh token cookie is used automatically
// Create an API interceptor to refresh on 401
const refreshToken = async () => {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: /* from cookie */ })
  });
  const data = await response.json();
  accessToken = data.accessToken;
  return accessToken;
};

// 5. Logout
await fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include', // Clear cookie
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
accessToken = null;
```

### Backend (Deployment)

1. **Generate strong secrets:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Set production environment variables** in your deployment platform

3. **Use HTTPS** (nginx reverse proxy with SSL)

4. **Configure CORS** properly for your frontend domain

5. **Set secure cookie flags:**
   - Production: `SECURE_COOKIE_SECURE=true`, `SECURE_COOKIE_SAME_SITE=none`
   - Local: `SECURE_COOKIE_SECURE=false`, `SECURE_COOKIE_SAME_SITE=lax`

## Testing

```bash
# Run auth tests
pytest tests/test_auth.py -v

# Run with coverage
pytest tests/test_auth.py --cov=app.services.auth_service --cov-report=html
```

## Troubleshooting

### "Invalid authentication token" error

- Token may be expired (30 min default)
- Token format incorrect (should be `Bearer <token>`)
- Wrong JWT secret in production

### "Invalid refresh token" error

- Refresh token cookie not sent (check browser cookies)
- Refresh token expired (14 days default)
- Cross-origin issue (check CORS and credentials settings)

### Worker can't access worker portal

- Check that `portal: "worker"` matches actual user role
- User may have been created as "client" instead
- Check audit logs for login attempts

### Email verification token invalid

- Token may have expired (24 hours default)
- User token may have been cleared during another action
- Check `email_verification_token` field in database
