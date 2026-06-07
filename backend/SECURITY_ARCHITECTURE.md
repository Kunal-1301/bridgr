# Authentication Security Architecture

## Overview

Bridgr uses industry-standard JWT-based authentication with role-based access control, audit logging, and security-first design.

## Token Strategy

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     LOGIN REQUEST                               │
│              (email + password + optional portal)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
         ┌─────────────────────────────────────────┐
         │   Validate Credentials                  │
         │   - Check email exists                  │
         │   - Verify bcrypt password              │
         │   - Check account active                │
         │   - Check role matches portal           │
         └─────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ↓                    ↓
         ✅ SUCCESS                ❌ FAILURE
         Generate tokens          Log attempt
         │                        Return 401
         ├─ Access Token
         │  (30 min expiry)
         │  - In JSON body
         │  - Used for API requests
         │
         ├─ Refresh Token
         │  (14 day expiry)
         │  - HttpOnly cookie
         │  - Secure flag on HTTPS
         │  - SameSite=None on cross-origin
         │
         └─ Audit Log
            - User ID + IP address
            - Timestamp
            - Success/failure

After expiry:
┌──────────────────────────────────────────────────────────┐
│ 1. Frontend gets 401 on protected route                  │
│ 2. Calls POST /auth/refresh with refresh token cookie    │
│ 3. Backend validates refresh token secret                │
│ 4. Returns new access token                              │
│ 5. Frontend retries original request                     │
│ 6. Success!                                              │
└──────────────────────────────────────────────────────────┘
```

## Token Details

### Access Token
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // user_id
  "role": "worker",
  "exp": 1717675200,  // 30 min from now
  "iat": 1717673400
}
```
- **Storage**: Memory or localStorage
- **Sent**: Authorization header (`Bearer <token>`)
- **Verified**: On every protected request
- **Secret**: JWT_SECRET
- **Expiry**: 30 minutes (short-lived)

### Refresh Token
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "role": "worker",
  "exp": 1720265400,  // 14 days from now
  "iat": 1717673400
}
```
- **Storage**: HttpOnly cookie (inaccessible to JavaScript)
- **Sent**: Automatically with credentials
- **Verified**: Only on `/auth/refresh` endpoint
- **Secret**: JWT_REFRESH_SECRET (separate from access token)
- **Expiry**: 14 days (long-lived)
- **Flags**:
  - `HttpOnly`: Cannot be accessed by JavaScript (XSS protection)
  - `Secure`: HTTPS only in production
  - `SameSite=None`: Cross-origin requests (Vercel frontend + Railway backend)

## Security Principles

### 1. Principle of Least Privilege
```python
# ✅ GOOD: Specific role check
@router.delete("/users/{user_id}")
async def delete_user(admin: RequireAdmin):
    pass

# ❌ BAD: Checking everyone
@router.delete("/users/{user_id}")
async def delete_user(user: CurrentUser):
    if user.role != "admin":  # Weak check
        pass
```

### 2. Defense in Depth
- BCrypt password hashing (✅)
- Separate JWT secrets (✅)
- Token expiry (✅)
- HttpOnly cookies (✅)
- Email verification (✅)
- Audit logging (✅)
- IP tracking (✅)

### 3. Secure by Default
```python
# Secure cookie configuration
response.set_cookie(
    key="refresh_token",
    value=token,
    httponly=True,              # Cannot be stolen via XSS
    secure=True,                # HTTPS only
    samesite="none",            # Cross-origin allowed (in prod)
    max_age=60*60*24*14,        # 14 days
    path="/"
)
```

### 4. Data Protection
```python
# ✅ SECURE: Never return passwords
return {
    "id": user.id,
    "email": user.email,
    "role": user.role,
    # password_hash is NOT included
}

# ✅ SECURE: Refresh token only in cookie
response = JSONResponse({
    "accessToken": "...",
    "user": {...}
    # refreshToken is NOT included
})

# ✅ SECURE: Email normalized for consistency
email = email.lower()  # Prevents user@Example.com vs user@example.com
```

## Attack Mitigation

### 1. XSS (Cross-Site Scripting)
**Attack**: Malicious script steals tokens from localStorage
```javascript
// Attacker code
const token = localStorage.getItem('accessToken');
// Sends to attacker's server
```

**Defense**:
- Access token in memory (not localStorage)
- Refresh token in HttpOnly cookie (inaccessible to JavaScript)
- Content Security Policy headers (implement in main app)

### 2. CSRF (Cross-Site Request Forgery)
**Attack**: Attacker tricks user into making unwanted request
```html
<!-- Attacker page -->
<img src="https://api.example.com/api/v1/auth/logout">
```

**Defense**:
- SameSite cookie flag prevents cross-site cookie sending
- Double-submit cookie pattern (implement in main app)
- Origin/Referer header validation

### 3. Token Theft
**Attack**: Attacker steals token from network

**Defense**:
- HTTPS/TLS encryption (implement at infrastructure level)
- Short token expiry (30 min)
- Token refresh mechanism
- IP address logging (detect anomalies)

### 4. Brute Force
**Attack**: Attacker tries many password combinations
```bash
for i in {1..10000}; do
  curl -X POST /auth/login -d "{\"email\":\"user@example.com\",\"password\":\"attempt$i\"}"
done
```

**Defense**:
- Audit logging of failed attempts
- Rate limiting (implement in nginx/load balancer)
- Account lockout after N failures (implement in service)
- CAPTCHA (optional enhancement)

### 5. SQL Injection
**Attack**: Malicious SQL in input

**Defense**:
- SQLAlchemy ORM (parameterized queries)
- No string concatenation in SQL
- Input validation (Pydantic schemas)

### 6. Email Enumeration
**Attack**: Attacker checks which emails are registered
```bash
curl -X POST /auth/forgot-password -d '{"email":"user@example.com"}'
# Returns different response if user exists
```

**Defense**:
- Generic response: "If email exists, reset link sent"
- Same response time for existing/non-existing users
- Log attempts for audit trail

## Password Security

### Hashing Algorithm: BCrypt
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("UserPassword123")
# Result: $2b$12$R9h7cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ee1l4KLf0RWI1G4K

# Verify password
is_valid = pwd_context.verify("UserPassword123", hashed)  # True
is_valid = pwd_context.verify("WrongPassword", hashed)    # False
```

**Why BCrypt?**
- Automatically salted
- Deliberately slow (expensive computationally)
- Adaptive: Can adjust cost factor as computers get faster
- Industry standard

### Password Requirements
- Minimum 8 characters
- No maximum (allow passphrases)
- No complexity rules (force numbers/symbols) - UX nightmare
- No regular resets (unless compromised) - encourages weak passwords

## Role-Based Access Control (RBAC)

### Four Roles
```python
class UserRole(StrEnum):
    admin = "admin"        # Full system access
    worker = "worker"      # Can take jobs
    client = "client"      # Can post jobs
    affiliate = "affiliate" # Referral partner
```

### Usage in Routes
```python
# Admin only
@router.delete("/users/{user_id}")
async def delete_user(admin: RequireAdmin):
    pass

# Worker only
@router.get("/my-jobs")
async def get_my_jobs(worker: RequireWorker):
    pass

# Client only
@router.post("/projects")
async def create_project(client: RequireClient):
    pass

# Multiple roles
@router.post("/submit")
async def submit(user: require_roles(UserRole.worker, UserRole.client)):
    pass

# Any authenticated user
@router.get("/profile")
async def get_profile(user: CurrentUser):
    pass
```

## Audit Logging

### Events Logged
| Event | Fields |
|-------|--------|
| `login_success` | user_id, ip_address, timestamp |
| `login_failure` | email, ip_address, timestamp |
| `logout` | user_id, ip_address, timestamp |
| `worker_registration` | user_id, email, ip_address |
| `token_refresh_failure` | ip_address, timestamp |
| `password_reset_request` | user_id, ip_address |
| `password_reset_success` | user_id, ip_address |
| `email_verified` | user_id, ip_address |

### Query Audit Logs
```python
from sqlalchemy import select
from app.db.models.audit_log import AuditLog

# Failed login attempts from IP
result = await db.execute(
    select(AuditLog)
    .where(AuditLog.action == "login_failure")
    .where(AuditLog.ip_address == "192.168.1.100")
    .order_by(AuditLog.created_at.desc())
)
failed_attempts = result.scalars().all()

# Admin actions
result = await db.execute(
    select(AuditLog)
    .where(AuditLog.action.like("admin_%"))
    .order_by(AuditLog.created_at.desc())
)
admin_actions = result.scalars().all()
```

## Environment Configuration

### Development
```bash
SECURE_COOKIE_SECURE=false      # HTTP allowed
SECURE_COOKIE_SAME_SITE=lax     # Same-site requests only
JWT_SECRET=dev-secret-123       # Non-production
ENVIRONMENT=development
```

### Production
```bash
SECURE_COOKIE_SECURE=true       # HTTPS only
SECURE_COOKIE_SAME_SITE=none    # Cross-origin allowed
JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
ENVIRONMENT=production
```

## Deployment Checklist

### Before Deployment
- [ ] Generate new JWT secrets (never use development secrets)
- [ ] Use environment-specific configuration
- [ ] Enable HTTPS/TLS everywhere
- [ ] Set SECURE_COOKIE_SECURE=true
- [ ] Configure CORS properly
- [ ] Test login/refresh/logout flow
- [ ] Test role-based access
- [ ] Load test auth endpoints
- [ ] Set up monitoring for audit logs
- [ ] Plan incident response for token compromise

### After Deployment
- [ ] Monitor 401/403 error rates
- [ ] Check audit logs for suspicious patterns
- [ ] Test from production domain
- [ ] Verify cookies are httponly/secure
- [ ] Monitor token refresh rates
- [ ] Set up alerts for unusual activity
- [ ] Document incident response procedures

## Monitoring & Alerting

### Metrics to Track
```python
# Successful logins per hour
# Failed login attempts per IP
# Token refresh rate
# Invalid token errors
# Unusual time-of-day access
# Access from unusual locations
# Password reset requests
```

### Alert Conditions
- More than 10 failed logins from single IP in 1 hour
- Successful login after 5+ failures
- Unusual geographic patterns
- Mass token refresh failures
- Elevated 403 Forbidden errors

## Security Incident Response

### If JWT Secret Compromised
1. Generate new secrets immediately
2. Deploy new secrets to all servers
3. Invalidate all existing tokens (optional: immediate logout)
4. Force password reset
5. Review audit logs for unauthorized access
6. Notify affected users

### If Refresh Token Cookie Theft
1. User cannot do much without access token
2. Access token expires in 30 minutes
3. New refresh tokens can be issued
4. Audit log will show refresh from new IP
5. May revoke tokens by storing in denylist (future enhancement)

## Future Enhancements

1. **Token Denylist**
   - Store revoked tokens in Redis
   - Check on every request
   - Clear after expiry

2. **Device Fingerprinting**
   - Store device/browser info with token
   - Alert on new device login
   - Require verification for new devices

3. **Multi-Factor Authentication**
   - SMS or authenticator app
   - Recovery codes
   - Remember device option

4. **Risk-Based Authentication**
   - Score login attempts
   - Require additional verification if risky
   - Impossible travel detection

5. **API Key Authentication**
   - Long-lived keys for server-to-server
   - Scoped permissions
   - Rotation policies

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [BCrypt Documentation](https://en.wikipedia.org/wiki/Bcrypt)
- [SameSite Cookie](https://web.dev/samesite-cookies-explained/)
