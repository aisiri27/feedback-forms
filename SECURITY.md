# Security Operations

## Secrets Policy

- Keep real credentials only in local `.env` files.
- Never commit secrets to:
  - `*.env.example`
  - source files
  - docs
- `.gitignore` includes `.env`, `backend/.env`, and `*.env.txt`.

## Local Secret Scan

Use this from repo root:

```powershell
git grep -nE "client_secret|JWT_SECRET=|mongodb\+srv|AIza|PRIVATE KEY|apps\.googleusercontent\.com"
```

Expected result: only placeholders.

## If a Secret Is Leaked

1. Rotate/revoke the secret immediately (DB password, JWT secret, OAuth credentials).
2. Sanitize tracked files (`.env.example`, docs, source).
3. Rewrite git history to remove leaked material.
4. Force-push cleaned history.

## History Cleanup Commands (PowerShell)

Remove a leaked file from all history:

```powershell
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env.txt" --prune-empty --tag-name-filter cat -- --all
git push --force --all origin
git push --force --tags origin
```

After cleanup:

```powershell
git gc --prune=now
```

## CI Guardrail

GitHub Action `.github/workflows/secret-scan.yml` runs `gitleaks` on push/PR to reduce secret leakage risk.
