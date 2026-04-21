# Setup and Run Guide

This guide provides step-by-step instructions to set up and run the Fines System application locally.

## Prerequisites

Before starting, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher): Download from [nodejs.org](https://nodejs.org/)
- **Python** (version 3.8 or higher): Download from [python.org](https://www.python.org/)
- **Git**: For cloning the repository
- **Supabase Account**: Sign up at [supabase.com](https://supabase.com/) for the database

## 1. Clone the Repository

```bash
git clone <repository-url>
cd Fines-System-NVSU
```

## 2. Set Up Python Virtual Environment

Create and activate a Python virtual environment:

```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate
```

## 3. Install Dependencies

### Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Root Dependencies (for development scripts)
```bash
npm install
```

## 4. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the SQL Editor in your Supabase dashboard.
3. Copy and execute the contents of `supabase/schema.sql` to set up the database schema.
4. Go to Settings > API to get your project URL and anon key.

## 5. Environment Variables

Create environment files for the frontend:

### Frontend (.env.local)
Create `frontend/.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
Create `backend/.env` with:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

*Note: Get the service role key from Supabase Settings > API > service_role key (keep this secret).*

## 6. Run the Application

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev
```
This will start both the Next.js frontend (on port 3000) and FastAPI backend (on port 8000) concurrently.

### Option 2: Run Separately

#### Frontend Only
```bash
npm run dev:frontend
```

#### Backend Only
```bash
npm run dev:backend
```

## 7. Access the Application

- **Frontend:** Open [http://localhost:3000](http://localhost:3000) in your browser
- **Backend API:** Available at [http://localhost:8000](http://localhost:8000)

## 8. Development Workflow

- The application uses hot reloading, so changes to code will automatically refresh.
- Frontend is built with Next.js and TypeScript.
- Backend is built with FastAPI and Python.

## 9. Testing

### Frontend
```bash
cd frontend
npm run lint
```

### Backend
Ensure the backend is running and test API endpoints using tools like Postman or curl.

## 10. Troubleshooting

### Common Issues

- **Port conflicts:** If ports 3000 or 8000 are in use, modify the scripts in `package.json` or `dev-runner.js`.
- **Supabase connection errors:** Double-check your environment variables and Supabase project settings.
- **Python virtual environment issues:** Ensure you're using the correct Python version and have activated the virtual environment.
- **Node.js version issues:** Use `nvm` to manage Node.js versions if needed.

### Logs
- Frontend logs appear in the terminal where `npm run dev:frontend` is running.
- Backend logs appear in the terminal where the backend is running.

## 11. Deployment

For production deployment:

- **Frontend:** Deploy to Vercel or another Next.js-compatible platform.
- **Backend:** Deploy the FastAPI app to a service like Heroku, Railway, or AWS.
- **Database:** Use the live Supabase project.

Ensure all environment variables are set in your deployment platform.

## Support

If you encounter issues not covered here, check the project documentation or create an issue in the repository.