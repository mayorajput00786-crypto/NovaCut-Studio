# AI Video Studio — Production Licensing & Deployment Guide

## 1. Overview
The **NovaCut AI Video Studio Licensing System** provides enterprise-grade, hardware-bound access control, permanent owner entitlement via Google OAuth 2.0 OpenID verification, and cryptographically signed offline leases.

---

## 2. Environment Variables (.env)
Configure the following in your `.env` file or hosting environment:

```bash
# --- PRIMARY APPLICATION SETTINGS ---
APP_URL="https://your-studio-domain.com"
PORT=3000

# --- GEMINI AI INTEGRATION ---
GEMINI_API_KEY="your-gemini-api-key"

# --- OWNER AUTHENTICATION (3 AUTHORIZED GMAIL ACCOUNTS) ---
# Only these 3 explicitly configured Google accounts receive permanent lifetime owner privileges.
OWNER_EMAIL_1="josnking01@gmail.com"
OWNER_EMAIL_2="owner2.finance@gmail.com"
OWNER_EMAIL_3="owner3.operations@gmail.com"

# --- CRYPTOGRAPHIC KEYS & OAUTH ---
# Secret key used for signing HMAC-SHA256 owner session JWTs and customer offline lease proofs
JWT_SECRET="novacut_master_jwt_secret_token_2026_production"

# Optional Google OAuth Client ID for OpenID Connect validation
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
```

---

## 3. Database Architecture & Persistence
- **Storage Location**: `/data/licensing_store.json`
- **ACID & Concurrency Safety**: The database uses atomic temporary file writes (`.tmp.${timestamp}`) and atomic rename operations (`fs.renameSync`) to eliminate corruption risks during system reboots or power loss.
- **Key Hashing**: All customer license keys are stored as **SHA-256 hashes**. The raw plaintext key is never retained in the database after initial generation, preventing license database leaks.
- **Auto-Sync on Startup**: On every server boot, the owner allowlist is synchronized with `OWNER_EMAIL_1`, `OWNER_EMAIL_2`, and `OWNER_EMAIL_3`.

---

## 4. Running the Application
```bash
# Development server (Express + Vite with hot reload on port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run the 18-point automated security test suite
npm test
```

---

## 5. Security & Isolation Architecture
1. **Zero Client Trust**: All authorization checks, device limit calculations, and role assignments are computed on the backend server.
2. **Strict Email Normalization**: Dots, casing, and `+tag` aliases are normalized (`Josn.King01+test@gmail.com` -> `josnking01@gmail.com`) to prevent allowlist bypasses.
3. **No Embedded Secrets**: Google Client Secrets and JWT signing keys are kept strictly on the server and are never bundled into desktop application packages.
