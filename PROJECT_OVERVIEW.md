# Pandeum - Project Overview

## Purpose

Pandeum is a visibility platform for companies with integrated AI that connects users with service providers through an intelligent assistant. The system allows users to describe their problems in natural language and receives:

- Problem diagnosis via AI (Google Gemini)
- Immediate solutions that users can implement themselves
- Recommendations for verified providers (Technology, Education, Home Services)
- Trust score and review system to validate providers

**Value Proposition**: Focus on "solutions" rather than "products/services", with AI that understands context and prioritizes DIY solutions before recommending professionals.

## Technology Stack

### Backend
- **Framework**: FastAPI 0.115.5
- **ORM**: SQLAlchemy 2.0.36
- **Database**: PostgreSQL 15
- **Authentication**: JWT (python-jose), Passlib with bcrypt
- **OAuth**: Google OAuth integration
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **Rate Limiting**: SlowAPI
- **Other**: python-dotenv, httpx, email-validator, redis (optional)

### Frontend
- **Framework**: Next.js 14.0.4 (App Router)
- **UI**: React 18.2.0, TypeScript 5.3.3
- **Styling**: TailwindCSS 3.3.6, Framer Motion 10.18.0
- **Forms**: React Hook Form 7.48.2, Zod 3.22.4
- **HTTP**: Axios 1.17.0
- **Icons**: Lucide React 0.294.0
- **Notifications**: React Hot Toast 2.4.1
- **Theming**: Next Themes 0.2.1
- **Cookies**: js-cookie 3.0.8

### Infrastructure
- **Containers**: Docker, Docker Compose
- **Middleware**: Next.js middleware for authentication

## Current Status

**Backend**: ~70% complete
- Authentication system implemented
- Provider CRUD operations
- AI engine with Gemini integration
- Review and favorites system
- Admin panel for provider verification
- Rate limiting configured
- Seed data script available

**Frontend**: ~40% complete
- Authentication UI (login/register)
- Main chat interface (incomplete - missing components)
- Sidebar navigation
- Dark mode support
- API client with token refresh
- Middleware for route protection

## Known Issues

### Critical Blockers
1. **Missing Chat Components**: `ChatInput.tsx` and `ChatMessage.tsx` are imported but don't exist
2. **Import Error**: `Sidebar.tsx` imports from `@/contexts/AuthContext` but file is named `uthContext.tsx`
3. **Missing Pages**: Dashboard, favorites, history, provider detail pages referenced but not implemented
4. **Missing Endpoint**: `/users/me/conversations` referenced in frontend but not implemented in backend

### Backend Issues
- Debug print statements in production code (`providers.py`)
- Syntax error in `seed_data.py` line 244
- Empty function `get_optional_user` in `dependencies.py`
- Trust score calculation not implemented (defaults to 0.0)
- Review fraud detection fields prepared but not implemented

### Frontend Issues
- Hard redirects using `window.location.href` instead of Next.js router
- No loading states in login/register forms
- Basic error handling with only `alert()`
- History loading function is empty
- Inconsistent auth storage (localStorage vs cookies)

## Database Schema

The project uses PostgreSQL with 13 tables:

- **users**: User accounts (clients, providers, admins)
- **providers**: Provider profiles extending users
- **services**: Specific services offered by providers
- **reviews**: User reviews with fraud detection fields
- **conversations**: AI conversation history
- **case_history**: Resolution tracking
- **resolution_metrics**: Time to solution metrics
- **favorites**: User favorite providers
- **recommendation_feedback**: AI recommendation tracking
- **waiting_list**: Waitlist when no providers available
- **user_memory**: Contextual user memory
- **external_resources**: External guides and resources

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/google` - Google OAuth

### Users
- `GET /users/me` - Current user info

### Providers
- `POST /providers/register` - Register as provider
- `GET /providers/` - List providers (with filters)
- `GET /providers/{id}` - Get provider details
- `PUT /providers/me` - Update provider profile
- `POST /providers/{id}/reviews` - Create review
- `GET /providers/{id}/reviews` - Get provider reviews
- `POST /providers/{id}/favorite` - Add to favorites
- `DELETE /providers/{id}/favorite` - Remove from favorites
- `GET /providers/me/favorites` - Get user favorites

### AI
- `POST /ai/solve` - Solve problem with AI
- `POST /ai/explore` - Exploration mode

### Admin
- `GET /admin/providers/pending` - Get pending providers
- `PUT /admin/providers/{id}/verify` - Verify/reject provider
- `GET /admin/users` - List all users
- `PUT /admin/users/{id}/role` - Update user role

### Memory
- `GET /memory/` - Get user memory
- `POST /memory/` - Update user memory

## Environment Variables

Required environment variables (see `backend/.env.example`):

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/pandeum
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60
```

## Running the Project

### Backend
```bash
cd backend
# Create .env from .env.example
docker-compose up -d
# Or run directly:
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Seed Database
```bash
python seed_data.py
```

## Development Notes

- The project uses a monolithic backend architecture with FastAPI
- Frontend uses Next.js App Router with TypeScript
- Authentication uses JWT with access and refresh tokens
- AI integration uses Google Gemini 1.5 Flash model
- Provider categories are limited to: Technology, Education, Home Services
- Trust score is currently not calculated (defaults to 0.0)
- Geographic location fields exist but distance calculation is not implemented
