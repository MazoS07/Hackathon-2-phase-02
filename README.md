# Todo Full-Stack Web Application

This is a todo application built with Next.js (frontend), FastAPI (backend), SQLModel, and Neon PostgreSQL as part of the Spec-Driven Development Hackathon Phase II.

## Project Structure

This is a full-stack application with:

- **Frontend**: Next.js 16.1.1 application in the `/frontend` directory
  - Task management dashboard
  - Authentication pages (sign in/up)
  - Responsive UI with Tailwind CSS
  - API client for backend communication

- **Backend**: FastAPI application in the `/backend` directory
  - RESTful API endpoints
  - JWT-based authentication
  - SQLModel for database operations
  - Neon PostgreSQL database integration

## Deployment Instructions

This project is structured as a full-stack application with separate frontend and backend:

### Frontend Deployment (Vercel)
1. Go to [Vercel](https://vercel.com/)
2. Create a new project and import this GitHub repository
3. **Critical**: In the configuration step, set the "Root Directory" to `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Set this to your deployed backend URL (e.g., `https://your-backend.onrender.com` or your backend deployment URL)
5. Deploy the project

### Backend Deployment (Separate Platform)
Deploy the backend separately using a Python-compatible platform:
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [PythonAnywhere](https://www.pythonanywhere.com/)
- [AWS](https://aws.amazon.com/), [GCP](https://cloud.google.com/), or [Azure](https://azure.microsoft.com/)

The backend is located in the `/backend` directory and contains:
- FastAPI application
- Database configuration
- Authentication system

## Backend Foundation & Persistence

This feature implements the backend foundation for the Todo application with CRUD operations for tasks.

### Features

- Create, read, update, and delete todo tasks
- Data persistence using SQLModel and PostgreSQL
- RESTful API endpoints
- Proper error handling and validation

### Tech Stack

- Python 3.11
- FastAPI
- SQLModel
- Pydantic
- Neon PostgreSQL (with SQLite for development)

### API Endpoints

- `POST /api/v1/tasks` - Create a new task
- `GET /api/v1/tasks` - Get all tasks
- `GET /api/v1/tasks/{id}` - Get a specific task
- `PUT /api/v1/tasks/{id}` - Update a specific task
- `DELETE /api/v1/tasks/{id}` - Delete a specific task
- `GET /` - Root endpoint
- `GET /health` - Health check

### Setup

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables (optional, defaults to SQLite):
   ```
   DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
   ```
4. Run the application: `uvicorn backend.src.api.main:app --reload`

### Running Tests

```bash
pytest
```

### Environment Variables

- `DATABASE_URL`: Database connection string (defaults to SQLite)
- `NEON_DATABASE_URL`: Neon PostgreSQL connection string (optional)

## Authentication & API Security

This feature implements authentication and API security using JWT tokens for user identification and access control.

### Features

- JWT-based authentication for all API endpoints
- User-specific data access (users can only access their own tasks)
- Cross-user access prevention
- Token validation and expiration checking
- Proper error handling for authentication failures

### JWT Configuration

- Algorithm: HS256 (configurable)
- Default expiration: 7 days (configurable)
- Secret key stored in environment variables

### API Security

- All task endpoints require valid JWT authentication
- Users can only access, modify, or delete their own tasks
- Invalid/expired tokens return 401 Unauthorized
- Cross-user access attempts return 403 Forbidden

### Environment Variables

- `JWT_SECRET`: Secret key for signing JWT tokens (defaults to development key)
- `JWT_ALGORITHM`: Algorithm for JWT signing (defaults to HS256)
- `JWT_EXPIRATION_DELTA`: Token expiration time in seconds (defaults to 604800 = 7 days)

### API Endpoints (Authentication Required)

All existing task endpoints now require authentication:

- `POST /api/v1/tasks` - Create a new task (requires valid JWT)
- `GET /api/v1/tasks` - Get all tasks for authenticated user
- `GET /api/v1/tasks/{id}` - Get a specific task (must belong to authenticated user)
- `PUT /api/v1/tasks/{id}` - Update a specific task (must belong to authenticated user)
- `DELETE /api/v1/tasks/{id}` - Delete a specific task (must belong to authenticated user)

### Authentication Setup

1. The application automatically validates JWT tokens on all protected endpoints
2. Include the JWT token in the Authorization header as: `Authorization: Bearer <token>`
3. The application will extract the user ID from the token's `sub` claim
4. Requests are validated against the user ID to ensure data access is limited to the authenticated user's own data

### Testing Authentication

Authentication can be tested using the comprehensive test suite:

```bash
cd backend
python -m pytest tests/test_auth_utils.py  # Test JWT utilities
```

## Running the Application Locally

To run this full-stack application locally:

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt` (or use poetry if configured)
3. Set up environment variables if needed (or use defaults)
4. Start the backend: `uvicorn src.api.main:app --reload`
5. The backend will run on `http://127.0.0.1:8000`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env.local` file with required environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```
4. Start the frontend: `npm run dev`
5. The frontend will run on `http://localhost:3000`

### Full Application
Both servers need to run simultaneously. The frontend will communicate with the backend API at the specified URL.

## Deployment Updates

Recent changes have been made to prepare the application for deployment:

- Added proper API client implementation in `frontend/lib/api-client.ts`
- Fixed environment variable compatibility for Vercel deployment
- Added Node.js version specification for consistent builds
- Updated Vercel configuration for proper deployment
- Added proper server-side safety checks to prevent build errors
- Fixed import path issues for case-sensitive file systems