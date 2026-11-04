# Google OAuth 2.0 & Owner Authentication Setup Guide

## 1. Overview
The owner access system enforces authentication through three authorized Google accounts. When an owner signs in with Google, the backend verifies the OpenID Connect token before granting owner privileges.

---

## 2. Setting Up Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select your existing project (e.g. `NovaCut AI Video Studio`).
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. Select **Web application** (or **Desktop app** if distributing standalone Windows binaries).
6. Set **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-studio-domain.com`
7. Set **Authorized redirect URIs**:
   - `http://localhost:3000/auth/google/callback`
   - `https://your-studio-domain.com/auth/google/callback`
8. Copy the generated **Client ID** and set it in your `.env` as:
   ```bash
   GOOGLE_CLIENT_ID="1234567890-abcdefgh.apps.googleusercontent.com"
   ```

---

## 3. Server-Side Token Validation Policy
When a token is received by `/api/auth/google/verify`, the server verifies:
1. **Issuer (`iss`)**: Must originate from `accounts.google.com` or `https://accounts.google.com`.
2. **Audience (`aud`)**: Matches your configured `GOOGLE_CLIENT_ID`.
3. **Expiration (`exp`)**: Token must not be expired.
4. **Email Verified (`email_verified`)**: Must be `true`.
5. **Allowlist Match**: The verified email is normalized and checked against the database owner table (`OWNER_EMAIL_1, 2, 3`).

---

## 4. Normalization Rules
To ensure strict security and prevent spoofing:
- Local parts are lowercased and trimmed.
- Periods (`.`) in Gmail addresses are removed (`josn.king01@gmail.com` -> `josnking01@gmail.com`).
- Plus aliases (`+tag`) are stripped before comparison.
- Domain aliases (`googlemail.com`) are converted to `gmail.com`.
