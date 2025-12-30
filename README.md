# 🎓 LEMS - Learning Education Management System

A comprehensive, full-stack Learning Education Management System built with modern technologies.

## 🚀 Features

* **User Management**: Multi-role authentication and authorization
* **Academic Management**: Schools, classes, subjects, students, teachers
* **Course Content**: Rich content creation and delivery
* **Examination System**: Online exams, question banks, automated grading
* **Analytics & Reporting**: Comprehensive performance tracking and insights
* **Communication Hub**: Messaging, announcements, notifications
* **Financial Management**: Fee management and payment processing
* **AI-Powered Features**: Content generation and predictive analytics
* **Mobile Responsive**: Works seamlessly on all devices

## 🛠️ Technology Stack

### Frontend

* React 18 with TypeScript
* Redux Toolkit for state management
* Tailwind CSS for styling
* React Router for navigation
* Axios for API calls

### Backend

* Node.js with Express.js
* TypeScript
* PostgreSQL (Primary Database)
* MongoDB (Analytics Database)
* Prisma ORM
* JWT Authentication
* Redis (Caching)

### DevOps

* Git for version control
* Docker for containerization
* GitHub Actions for CI/CD

## 📁 Project Structure

```
D:\LEM\
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── config/         # Configuration files
│   ├── tests/              # Backend tests
│   └── prisma/             # Database schema and migrations
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Helper functions
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
│
└── docs/                  # Documentation
    ├── api/              # API documentation
    ├── database/         # Database schemas
    └── guides/           # User guides
```

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm or yarn
* PostgreSQL (v14 or higher)
* MongoDB (v6 or higher)
* Git

### Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/ManuCoDesigns/LEMS.git
cd LEMS
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create environment file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (DB, JWT secrets, SMTP, etc.).

4. Setup database (Prisma):

```bash
npx prisma migrate dev   # For development
npx prisma migrate deploy # For production
```

5. (Optional) Seed development data:

```bash
npx prisma db seed
```

6. Run the server:

```bash
npm run dev
# or
npm start
```

## 👨‍💻 Developer

Built with ❤️ by Manu

---

**Status**: 🚧 In Active Development

**Current Phase**: Foundation & Setup

**Last Updated**: December 2025

**Setup Guide**: See [SETUP.md](docs/guides/SETUP.md) for detailed instructions, `.env.example` template, and Prisma setup.
