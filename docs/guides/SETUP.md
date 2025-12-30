# LEMS Backend – Detailed Setup Guide

This guide explains how to run the LEMS backend on a **new machine** safely and correctly. Follow these steps to ensure the environment, database, and dependencies are fully aligned.

---

## 1. Prerequisites

Ensure the following are installed on your system:

- **Node.js** (v18 or higher) – LTS recommended
- **npm** or **yarn** (use the one corresponding to your lock file)
- **Git**
- **PostgreSQL** (v14 or higher) – primary database
- **MongoDB** (v6 or higher) – analytics database
- Optional: **Redis** if caching is used

> Tip: Use Node Version Manager (`nvm`) to manage Node.js versions across machines.

---

## 2. Clone the Repository

```bash
git clone https://github.com/ManuCoDesigns/LEMS.git
cd LEMS
```

This will pull the entire codebase, including committed migrations, services, and configuration files.

---

## 3. Install Dependencies

Install backend dependencies with your chosen package manager.

### Using npm

```bash
npm install
```

### Using yarn

```bash
yarn install
```

Ensure all dependencies install without errors before continuing.

---

## 4. Environment Variables

### 4.1 Create `.env`

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` and provide your local configuration.

### 4.2 `.env.example` (Template)

```env
# =========================
# Application
# =========================
NODE_ENV=development
PORT=4000

# =========================
# Database
# =========================
# SQLite for development
DATABASE_URL="file:./dev.db"

# PostgreSQL example for production
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/lems"

# =========================
# Security
# =========================
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# =========================
# Notifications / Email
# =========================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=no-reply@example.com

# =========================
# Optional Integrations
# =========================
# ANALYTICS_KEY=
# PAYMENT_PROVIDER_KEY=
```

> **Important:** Never commit `.env` with actual secrets to the repository.

---

## 5. Database Setup (Prisma)

Prisma migrations are committed and must be applied to create the database schema.

### Development

```bash
npx prisma migrate dev
```

This will:

- Create your database (if it doesn’t exist)
- Apply all migrations
- Generate Prisma Client

### Production / CI/CD

```bash
npx prisma migrate deploy
```

Use this command in production environments to safely apply schema changes.

---

## 6. Optional: Seed Development Data

If you have seed scripts, run them **only in development**:

```bash
npx prisma db seed
```

> Do not run seed scripts in production environments.

---

## 7. Running the Server

Start the backend server:

```bash
npm run dev
# or
npm start
```

The server should now be running at `http://localhost:4000` (or the port defined in your `.env`).

---

## 8. Additional Tools / Recommendations

- **Redis**: If caching is used, start Redis before running the server.
- **Node Version Management**: Use `.nvmrc` to ensure the correct Node version.
- **Docker (Optional)**: Can be used for consistent environment setup across machines.

---

## 9. Common Issues

### Port already in use

- Change the `PORT` in `.env`

### Database connection errors

- Verify `DATABASE_URL` is correct
- Ensure migrations are applied (`npx prisma migrate dev`)

### Missing environment variables

- Cross-check `.env` against `.env.example`

---

## 10. Production Notes

- Never run `prisma migrate reset` in production
- Never run seed scripts in production
- Rotate secrets immediately if they are compromised
- Always commit migrations to maintain schema integrity

---

## 11. Summary

- `.env.example` → Template only, safe to commit
- `.env` → Local/private, not committed
- Migrations → Always committed, applied via `migrate dev` or `migrate deploy`
- Seeds → Only run in dev
- Server → `npm run dev` or `npm start`

Following this guide ensures that **LEMS backend runs reliably and safely on any machine**.
