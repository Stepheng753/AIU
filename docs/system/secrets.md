# Secrets Management Guide

To protect API credentials and authentication tokens, all configurations must remain isolated within environment files.

---

## 1. Secrets Reference

| Secret Identifier | Location | Purpose | Required For |
| :--- | :--- | :--- | :--- |
| **`GEMINI_API_KEY`** | `/aiu-backend/.env` | Auths the WebSocket proxy with Gemini Live API AND serves as the cryptographic secret for signing/verifying client JWT tokens. | Voice features, audio transcription, and backend API authentication. |

---

## 2. Rule: `.env` and `.env.template` Consistency

Every environment directory in the repository must maintain a matching pair of environment configuration files:
1. **`.env`**: Contains actual private credentials. **This must never be committed to source control.**
2. **`.env.template`**: Contains structural placeholders (empty values) demonstrating the exact keys needed. **This must be committed to source control.**

### Developer Guidelines:
- If a new environment variable is added to a `.env` file during development, the developer **MUST** immediately append it to the corresponding `.env.template` file with empty or mock values.
- Verify that both `.env` configurations are added to the root/package `.gitignore` files.
- Example structure of `aiu-backend/.env.template`:
  ```env
  PORT=3000
  DATABASE_PATH="./aiu.db"
  GEMINI_API_KEY=
  ```

---

## 3. Git Security Safeguards

A `.gitignore` file must be active in the root and in directories containing `.env` files to prevent leakages:
```gitignore
# Exclude environment configuration files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```
Never commit real API keys to repository history. If a key is accidentally committed:
1. Revoke the key immediately via the Google AI Studio console.
2. Clean the Git history using `git-filter-repo` or standard Git filters.
3. Update the key in `.env`.

---

## 4. Deep Dive: JWT Signing and Verification

We use JSON Web Tokens (JWTs) instead of passing usernames and passwords on every API request for the following reasons:

### 1. Performance and Hashing Load
- Hashing passwords via bcrypt is intentionally CPU-intensive (~80-100ms per check) to prevent brute-force attacks.
- If the client sent the raw username and password with every request, the server would have to query the database and hash the password on every API call.
- By issuing a signed JWT upon login, the server can verify subsequent requests mathematically using a signing secret in **less than 1ms** without querying the database or performing heavy hashes.

### 2. Cryptographic Secret (`GEMINI_API_KEY`)
- To simplify environment management, the backend uses **`GEMINI_API_KEY`** (or a fallback string during tests/local fallback) as the cryptographic key to sign and verify client tokens.
- Using a private, server-only secret like the `GEMINI_API_KEY` ensures tokens cannot be forged or tampered with by clients.
- Storing a consistent `GEMINI_API_KEY` in the local `.env` file also prevents developer logout loops during server hot-reloads/restarts.
