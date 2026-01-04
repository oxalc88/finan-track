# Security Policy

## Development vs Production Credentials

### Docker Compose Development Defaults

The `docker-compose.yml` file contains **well-known, publicly documented default credentials** for local development containers. These are **NOT secrets** - they are the official default values provided by the respective Docker images:

| Service | Username | Password | Source |
|---------|----------|----------|--------|
| PostgreSQL | `postgres` | `postgres` | [Official PostgreSQL Docker Image](https://hub.docker.com/_/postgres) |
| MinIO | `minioadmin` | `minioadmin` | [Official MinIO Documentation](https://min.io/docs/minio/container/index.html) |
| RabbitMQ | `guest` | `guest` | [Official RabbitMQ Docker Image](https://hub.docker.com/_/rabbitmq) |

**Why these are safe in development:**
- They are **publicly documented defaults** used by millions of developers
- They only work on `localhost` and are not exposed to the internet
- They are overridden via environment variables in production

**Production Safety:**
- `docker-compose.prod.yml` requires explicit environment variables
- No default values are provided for production deployments
- Deployment fails if secure credentials are not provided

### Environment Variable Override

All credentials can be overridden using a `.env` file:

```bash
# .env (NOT committed to git)
POSTGRES_PASSWORD=your_secure_production_password_here
MINIO_ROOT_PASSWORD=your_secure_minio_password_here
RABBITMQ_DEFAULT_PASS=your_secure_rabbitmq_password_here
```

## Reporting a Vulnerability

If you discover a **real security vulnerability** (not development defaults), please report it by:

1. **DO NOT** open a public GitHub issue
2. Email the maintainer directly with details
3. Allow 48 hours for an initial response
4. Coordinated disclosure after a fix is available

## Security Best Practices for Deployers

When deploying this application:

1. ✅ **NEVER** use default credentials in production
2. ✅ Generate strong, random passwords for all services
3. ✅ Use environment variables or secret management systems
4. ✅ Enable TLS/SSL for all network communications
5. ✅ Restrict network access to database and queue services
6. ✅ Regularly update all Docker images and dependencies
7. ✅ Monitor logs for suspicious activity

## GitGuardian Alerts

This repository uses GitGuardian for secret scanning. If you see alerts about `docker-compose.yml`:

- **Alert Type:** Generic Password
- **Status:** False Positive - Development Defaults
- **Action Required:** Mark as ignored in GitGuardian dashboard
- **Justification:** Publicly documented Docker image defaults for local development only

These are not secrets that need rotation - they are intentional, documented defaults meant for development environments where localhost security is acceptable.
