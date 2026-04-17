# Security Policy

## Reporting a vulnerability

If you discover a security issue in finan-track, please report it
privately:

1. **Do not** open a public GitHub issue.
2. Email the maintainer with details and, if possible, a minimal
   reproduction.
3. Expect an initial response within 48 hours.
4. We'll coordinate a fix before any public disclosure.

## Deployment notes

finan-track is designed for a single self-hosted user behind a private
network (e.g. Tailscale). If you expose it to the public internet:

- Set all optional integration credentials (`R2_*`,
  `GOOGLE_SERVICE_ACCOUNT_KEY`, `LLM_API_KEY`) via secrets management,
  never in images or committed files.
- Put the nginx `web` service behind HTTPS (terminate TLS at a
  reverse proxy such as Caddy or Cloudflare Tunnel).
- Back up the SQLite file (`/data/finanzas.db`) regularly.
- Keep `better-sqlite3`, `hono`, and the AI SDK packages up to date.
