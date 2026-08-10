# Auth — Client

Realizes [fr/auth](../../../requirements/fr/auth/index.md). Writing rules: [client acceptance](../README.md).  
API scenarios: [http/auth](../../http/auth/index.md).

## Surface

- Routes: `/login`, `/register` (when registration is enabled), `/` (home), protected areas (e.g. `/jobs`)
- Login and register share the authentication surface
- Session restore and redirects apply across the app shell

## Files

- [login.md](./login.md) — `CLIENT-AUTH-LOG-*`
- [logout.md](./logout.md) — `CLIENT-AUTH-OUT-*`
- [registration.md](./registration.md) — `CLIENT-AUTH-REG-*`
- [session.md](./session.md) — `CLIENT-AUTH-SES-*`
- [access-control.md](./access-control.md) — `CLIENT-AUTH-ACL-*`
