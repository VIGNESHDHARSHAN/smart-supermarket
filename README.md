# Smart Supermarket

Self-Checkout & Store Operations System built on the MERN stack (MongoDB, Express, React, Node.js) with Tailwind CSS.

---

## Project Structure

```
smart-supermarket/
├── frontend/                     # React + Vite Frontend
│   ├── public/                   # Static assets & public files
│   ├── src/                      # React source code (components, pages, context, etc.)
│   ├── index.html                # Vite HTML entry point
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   └── package.json              # Frontend dependencies
│
├── backend/                      # Node.js + Express Backend API
│   ├── config/                   # MongoDB Atlas database connection
│   ├── middleware/               # Authentication & authorization middleware
│   ├── models/                   # Mongoose schemas (Product, Order, GateLog, User)
│   ├── routes/                   # REST API routes (auth, products, orders, gate, payment)
│   ├── index.js                  # Express application entry point
│   ├── seed.js                   # MongoDB database seeder script
│   ├── .env                      # Environment configuration (MONGODB_URI, JWT_SECRET, PORT)
│   └── package.json              # Backend dependencies (Express, Mongoose, JWT, etc.)│
├── package.json                  # Root orchestrator scripts
└── README.md                     # Documentation
```

---

## Quick Start

### AI chatbot

The chatbot sends questions and the last 20 conversation messages to a real AI provider through the backend. It supports general questions, coding, writing, recipes, and supermarket help. It has no live web search. Product suggestions use the catalog supplied by the app.

Set `GEMINI_API_KEY` and `GEMINI_MODEL` in `backend/.env`, then restart the backend. Optional Groq and OpenAI settings are listed in `backend/.env.example`; provider priority is Gemini, Groq, then OpenAI. Keep API keys on the backend, never in frontend environment variables. Provider usage and quota limits apply.

`GET /api/ai/status` reports configuration, not provider health. Chat requests allow 45 seconds for the provider and display a retryable error if the provider is unavailable, misconfigured, or over quota. They no longer silently return canned shopping responses.

Run chatbot regression checks with `node --test backend/tests/ai.test.js` (no API key or network provider calls required).

### 1. Install Dependencies

You can install all dependencies from the root:
```bash
npm run install:all
```
Or install in each directory individually:
```bash
cd frontend && npm install
cd ../backend && npm install
```

---

### 2. Running the Application

#### Option A: Run Both Together (Recommended)
From the root directory:
```bash
npm run dev
```
*(Starts both Backend on port 5000 and Frontend on port 5173 concurrently in one terminal)*

---

#### Option B: Run in Separate Terminals

**Terminal 1 (Backend API):**
```bash
npm run backend
```
*(Or `cd backend && npm run dev` — runs Express + MongoDB API on `http://localhost:5000`)*

**Terminal 2 (Frontend Client):**
```bash
npm run frontend
```
*(Or `cd frontend && npm run dev` — runs Vite React UI on `http://localhost:5173`)*

#### Seed Database:
```bash
npm run seed
```

---

## Features

- **Customer Self-Checkout**: Scan barcodes, smart item detection, smart recommendations, digital bill, payment processing.
- **Automated QR Exit Gate**: QR verification, fraud check, automated gate unlock.
- **Database**: Pure MongoDB Atlas (via Mongoose) for all catalog, user, order, and gate audit data.
