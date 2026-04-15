# Financial Planning App

A robust, full-stack web application designed to help users plan and visualize their financial future. The app features comprehensive tools such as an interactive Scenario Calculator, automated Cashflow monitoring, AI-driven insights, and seamless PDF report generation.

## 🌟 Key Features

- **Scenario & Investment Calculator**: 
  - Goal-based planning: Calculate required monthly, quarterly, or yearly contributions to hit a specific net worth target by a certain age.
  - Pure-math calculator simulating investment growth, taking into account initial principal, continuous contributions, and average growth rates.
- **Data Visualization**: Rich, interactive financial charts and graphs built with `recharts`.
- **Report Generation**: Export financial summaries and scenarios directly to PDF format using `html2canvas` and `jsPDF`.
- **AI Integrations**: Powered by Google Generative AI to provide smart financial summaries and backend intelligence.
- **Automated Workflows**: Automated email sending scripts and automated cashflow updating via Python microservices.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router DOM
- **Backend / Microservices**: Python, Docker (for separated backend services)
- **Database & Auth**: Supabase
- **AI Integration**: Google Generative AI SDK (`@google/genai`)
- **Testing Engine**: Vitest, React Testing Library
- **CI/CD Pipeline**: GitHub Actions for automated testing, Vercel for continuous deployment

## 📂 Project Structure

```text
├── src/                # Front-end React code (Components, Pages, Hooks, Contexts)
├── backend/            # Backend APIs, Docker configurations, and microservices
├── supabase/           # Supabase edge functions, database migrations, and schemas
├── synthetic data/     # Mock data sets used for local development and simulations
├── public/             # Static assets served by the application
├── .github/            # GitHub Actions CI/CD workflows
└── update_cashflow.py  # Standalone Python script for cashflow data automation
```

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and `npm` installed. You will also need Python for backend script execution and Docker if you are running the backend microservices locally.

### 1. Install Dependencies
Run the following command in your terminal to install all required packages:

```bash
npm install
```

### 2. Environment Variables
You will need to set up your local environment variables. Create a `.env.local` file in the root directory (or use `.env` if preferred) and add necessary API keys:

```env
# Template - Replace with your actual credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run the Development Server
Once dependencies are installed and the environment is configured, start the app locally:

```bash
npm run dev
```

The application will typically start on `http://localhost:5173`.

### 4. Running Tests
This project uses Vitest. To run the automated test suite locally:

```bash
npm run test
```

## 🤝 Code Quality & Maintenance

- **Type Checking**: Validate TypeScript definitions statically using:
  ```bash
  npm run typecheck
  ```
- **Linting**: The project maintains strict rules using ESLint. Check code quality via:
  ```bash
  npm run lint
  ```
- **Automated Pipelines**: GitHub actions are configured to run tests and linters on pushing new code or creating Pull Requests to maintain the standard of the codebase.

---
*Developed for Final Year Project (FYP)*
