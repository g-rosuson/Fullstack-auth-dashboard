# Security

Security posture overview for the production deployment. Divided into what is already in place, what should be hardened, and what to add before going fully public.

---

## What is already in place

### Application

| Area | Implementation |
|---|---|
| Password hashing | `bcrypt` with 10 rounds — plain-text passwords are never stored or logged |
| JWT access tokens | Short-lived, sent in `Authorization: Bearer` header only |
| JWT refresh tokens | `httpOnly`, `secure`, `sameSite: strict` cookie — never exposed in response body |
| JWT secrets | Loaded from environment variables, never hardcoded |
| JWT payload validation | Decoded payload validated with `jwtPayloadSchema` (Zod) after `verify()` |
| Auth middleware | All protected routes use `authenticateContextMiddleware` |
| DB query scoping | Controllers scope queries by `req.context.user.id` — no cross-user data access |
| Rate limiting | Per-route limiters on `/login`, `/register`, `/refresh` |
| Error responses | Stack traces gated behind `config.isDeveloping` — not exposed in production |
| Config validation | All environment variables validated at startup via Zod schemas |
| MongoDB access | Not exposed outside the Docker network — only reachable via `mongo` hostname |

### Infrastructure

| Area | Implementation |
|---|---|
| Firewall | UFW — only ports 22, 80, 443 open; backend port 1000 not public |
| Reverse proxy | Caddy — only container with public ports; terminates TLS |
| TLS | Let's Encrypt certificates auto-provisioned and renewed by Caddy |
| Non-root user | App runs as `deploy` user, not root |
| Secrets | `.env` files never committed; injected at runtime on the server |

---

## Recommended hardening (do now)

### 1. Disable SSH password authentication

Automated bots scan port 22 constantly. Key-only auth eliminates brute-force password attacks entirely.

```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```
PasswordAuthentication no
PermitRootLogin no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

> Verify SSH still works as `deploy` before closing your session.

### 2. Install fail2ban

Automatically bans IPs that repeatedly fail SSH authentication.

```bash
sudo apt install fail2ban -y
```

Default config protects SSH with no further configuration needed. To verify it's running:

```bash
sudo systemctl status fail2ban
```

---

## Before going public

### Add Cloudflare (free tier)

Point DNS through Cloudflare's proxy rather than directly to the server IP. This provides:

- DDoS mitigation — volumetric attacks are absorbed before reaching the server
- IP masking — the server's real IP is hidden from attackers; bypassing Caddy to hit the server directly becomes much harder
- Bot filtering — basic bot protection with no configuration
- CDN — static frontend assets cached at the edge

**Configuration:** Set Cloudflare SSL/TLS mode to **Full (strict)**. Caddy continues handling the certificate between Cloudflare and the server.

**DNS change required:** Replace the current A records pointing directly to the server IP with Cloudflare-proxied records (orange cloud icon in Cloudflare DNS panel).

### Rate limiting review

The current per-route rate limiters (`loginLimiter`, `registerLimiter`, `refreshLimiter`) are set for development-friendly thresholds. Review and tighten limits before public launch.

### HTTP security headers

Caddy can add security headers globally with minimal config. Add to `Caddyfile`:

```
dashboard.<domain> {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    reverse_proxy frontend:80
}
```

---

## Out of scope for current scale

| Threat | Notes |
|---|---|
| WAF (Web Application Firewall) | Cloudflare free tier covers basic protection; dedicated WAF unnecessary until significant traffic |
| Intrusion detection (OSSEC/Wazuh) | High operational overhead; revisit if compliance becomes a requirement |
| Secrets management (Vault/AWS SSM) | `.env` files on the server are sufficient at current scale; migrate if the team grows |
| Container image scanning | Worth adding to CI (e.g. `docker scout`) before the team scales |
