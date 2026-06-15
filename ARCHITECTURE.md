# Pandeum - Architecture Documentation

## System Architecture Overview

Pandeum follows a **monolithic backend** architecture with a **modern frontend** using Next.js App Router. The system consists of:

- **Backend**: FastAPI REST API with PostgreSQL database
- **Frontend**: Next.js 14 with TypeScript and TailwindCSS
- **AI Integration**: Google Gemini 1.5 Flash for problem solving
- **Authentication**: JWT-based with access/refresh tokens
- **Infrastructure**: Docker Compose for local development

## Backend Architecture

### Directory Structure
```
backend/
├── app/
│   ├── main.py              # Application entry point, router registration
│   ├── config.py            # Pydantic Settings for configuration
│   ├── database.py          # SQLAlchemy engine and session management
│   ├── models.py            # SQLAlchemy ORM models (13 tables)
│   ├── schemas.py           # Pydantic schemas for request/response validation
│   ├── auth.py              # JWT utilities, password hashing, dependencies
│   ├── crud.py              # Basic CRUD operations
│   ├── ai_engine.py         # AI engine with Gemini integration
│   ├── dependencies.py      # Custom FastAPI dependencies
│   ├── api/                 # API routers organized by domain
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User endpoints
│   │   ├── providers.py     # Provider endpoints
│   │   ├── ai.py            # AI endpoints
│   │   ├── admin.py         # Admin endpoints
│   │   └── memory.py        # User memory endpoints
│   └── utils/
│       └── rate_limit.py    # SlowAPI rate limiting configuration
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### Core Components

#### 1. Application Entry Point (`main.py`)
- FastAPI application initialization
- CORS middleware configuration
- Rate limiting setup with SlowAPI
- Router registration:
  - `/auth` - Authentication
  - `/users` - User management
  - `/providers` - Provider operations
  - `/ai` - AI problem solving
  - `/admin` - Admin operations
  - `/memory` - User context memory

#### 2. Configuration (`config.py`)
Uses Pydantic Settings for environment-based configuration:
- Database URL
- JWT settings (secret, algorithm, expiration)
- Google OAuth credentials
- Gemini API key
- CORS frontend URL
- Rate limiting parameters

#### 3. Database Layer (`database.py`)
- SQLAlchemy engine creation
- Session factory with `autocommit=False`, `autoflush=False`
- Dependency injection for database sessions

#### 4. ORM Models (`models.py`)
13 SQLAlchemy models with relationships:
- **User**: Base user with roles (user/provider/admin)
- **Provider**: Provider profile extending User
- **Service**: Services offered by providers
- **Review**: User reviews with fraud detection fields
- **Conversation**: AI conversation history
- **CaseHistory**: Resolution tracking
- **ResolutionMetric**: Time to solution metrics
- **Favorite**: User favorite providers
- **RecommendationFeedback**: AI recommendation tracking
- **WaitingList**: Waitlist for unavailable providers
- **UserMemory**: Contextual user memory (JSONB)
- **ExternalResource**: External guides and resources

#### 5. Pydantic Schemas (`schemas.py`)
Request/response validation schemas:
- Auth: UserRegister, UserLogin, GoogleAuth, Token
- Provider: ProviderCreate, ProviderUpdate, ProviderResponse
- AI: ProblemRequest, AISolveResponse
- Reviews: ReviewCreate, ReviewResponse
- Admin: ProviderVerification, UserRoleUpdate
- Memory: MemoryUpdate, MemoryResponse

#### 6. Authentication (`auth.py`)
- Password hashing with bcrypt
- JWT token creation (access + refresh)
- Token decoding and validation
- FastAPI dependencies:
  - `get_current_user` - Require authenticated user
  - `get_current_active_user` - Active user check
  - `get_current_admin_user` - Admin role check

#### 7. AI Engine (`ai_engine.py`)
- Integration with Google Gemini 1.5 Flash
- Problem solving workflow:
  1. Build prompt with user context from memory
  2. Call Gemini API
  3. Parse JSON response
  4. Enrich with database provider data
  5. Apply ranking by urgency and trust score
  6. Return structured response with diagnosis, solutions, providers
- Exploration mode for gift/experience ideas
- Restricted category detection (health, legal, finance)

#### 8. CRUD Operations (`crud.py`)
- User creation and retrieval
- Provider creation with user role update
- Provider rating calculation (average of reviews)
- User memory CRUD
- Waiting list management
- External resource retrieval
- Conversation saving

### API Router Details

#### Auth Router (`/auth`)
- `POST /register` - User registration
- `POST /login` - User login with JWT tokens
- `POST /refresh` - Refresh access token
- `POST /google` - Google OAuth authentication

#### Users Router (`/users`)
- `GET /me` - Get current user info

#### Providers Router (`/providers`)
- `POST /register` - Register as provider (requires auth)
- `GET /` - List providers with filters (category, subcategory, verified_only, limit)
- `GET /{id}` - Get provider details with rating
- `PUT /me` - Update provider profile (requires provider role)
- `POST /{id}/reviews` - Create review
- `GET /{id}/reviews` - Get provider reviews
- `POST /{id}/favorite` - Add to favorites
- `DELETE /{id}/favorite` - Remove from favorites
- `GET /me/favorites` - Get user favorites

#### AI Router (`/ai`)
- `POST /solve` - Solve problem with AI (auth optional)
  - Uses user memory if authenticated
  - Saves conversation if authenticated
  - Adds to waiting list if no providers found
- `POST /explore` - Exploration mode for ideas/gifts

#### Admin Router (`/admin`)
- `GET /providers/pending` - Get pending provider verifications
- `PUT /providers/{id}/verify` - Verify or reject provider
- `GET /users` - List all users
- `PUT /users/{id}/role` - Update user admin role

#### Memory Router (`/memory`)
- `GET /` - Get user memory context
- `POST /` - Update user memory context

## Frontend Architecture

### Directory Structure
```
frontend/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main chat page
│   ├── globals.css          # Global styles
│   ├── (auth)/              # Auth route group
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
├── components/
│   ├── chat/
│   │   └── SolutionJourney.tsx
│   ├── layout/
│   │   └── Sidebar.tsx
│   └── providers/
│       ├── AuthProvider.tsx
│       ├── ProviderCard.tsx
│       └── ThemeProvider.tsx
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── hooks/
│   └── useDarkMode.ts
├── lib/
│   └── api.ts               # Axios instance with interceptors
├── types/
│   └── index.ts             # TypeScript interfaces
└── middleware.ts            # Next.js middleware
```

### Core Components

#### 1. Root Layout (`app/layout.tsx`)
- Wraps application with providers:
  - ThemeProvider (dark/light mode)
  - AuthProvider (authentication state)
  - Toaster (notifications)
- Sets metadata and font

#### 2. Main Chat Page (`app/page.tsx`)
- Chat interface with AI
- Message state management
- AI API integration
- Example prompts for new users
- Loading states with animation
- **INCOMPLETE**: References missing ChatInput and ChatMessage components

#### 3. Authentication Context (`contexts/AuthContext.tsx`)
- Manages authentication state
- Provides login, register, logout functions
- Google OAuth support
- Token storage in localStorage
- Auto-logout on token expiration
- **ISSUE**: File named `uthContext.tsx` but imported as `AuthContext.tsx`

#### 4. API Client (`lib/api.ts`)
- Axios instance with base URL
- Request interceptor: Adds Bearer token from localStorage
- Response interceptor: Handles 401 errors, auto-refresh tokens
- Redirects to login on refresh failure

#### 5. Middleware (`middleware.ts`)
- Route protection based on access_token cookie
- Public routes: `/login`, `/register`
- Redirects authenticated users from login/register to home
- Redirects unauthenticated users to login
- **ISSUE**: Uses cookies but frontend uses localStorage for tokens

#### 6. Sidebar (`components/layout/Sidebar.tsx`)
- Navigation menu
- Conditional provider dashboard link
- Dark mode toggle
- Logout button
- Active route highlighting

#### 7. Provider Card (`components/providers/ProviderCard.tsx`)
- Displays provider recommendation
- Shows rating, trust score, availability
- Displays distance, response time, estimated cost
- Shows AI-generated reason bullets
- Links to provider detail page (not implemented)

#### 8. Solution Journey (`components/chat/SolutionJourney.tsx`)
- Visualizes solution steps
- Shows diagnosis, instant solutions, provider recommendation
- Displays confidence score warning if low

### TypeScript Types (`types/index.ts`)
- User, Provider, AISolveResponse, ProviderRecommendation, Conversation interfaces

## Database Schema

### Table Relationships

```
users (1) ----< (1) providers
users (1) ----< (*) reviews
users (1) ----< (*) conversations
users (1) ----< (*) favorites
users (1) ----< (1) user_memory

providers (1) ----< (*) services
providers (1) ----< (*) reviews
providers (1) ----< (*) favorites
providers (1) ----< (*) case_history

conversations (1) ----< (*) recommendation_feedback
case_history (1) ----< (1) resolution_metrics
```

### Key Design Decisions

1. **UUID Primary Keys**: All tables use UUID for distributed system compatibility
2. **JSONB Fields**: Flexible data storage for trust_factors, context_data, ai_response
3. **Cascade Deletes**: Appropriate CASCADE/SET NULL for data integrity
4. **Timestamps**: created_at and updated_at on most tables
5. **Indexes**: Strategic indexes on frequently queried columns (category, location, trust_score, user_id, created_at)
6. **Triggers**: Auto-update of updated_at timestamp

## Authentication Flow

### Registration/Login Flow
1. User submits credentials to `/auth/register` or `/auth/login`
2. Backend validates and creates/retrieves user
3. Backend generates access_token (30min) and refresh_token (7days)
4. Frontend stores tokens in localStorage
5. Frontend calls `/users/me` to get user data
6. AuthContext updates user state

### Token Refresh Flow
1. API call returns 401
2. Axios interceptor catches error
3. Calls `/auth/refresh` with refresh_token
4. Gets new access_token and refresh_token
5. Updates localStorage
6. Retries original request
7. On failure, clears localStorage and redirects to login

### Google OAuth Flow
1. Frontend gets Google ID token
2. Sends to `/auth/google`
3. Backend validates token with Google
4. Creates or retrieves user
5. Returns JWT tokens
6. Same as regular login flow

## AI Integration Flow

### Problem Solving Flow
1. User submits problem to `/ai/solve`
2. Backend retrieves user memory if authenticated
3. AIEngine builds prompt with context
4. Calls Gemini API
5. Parses JSON response
6. Searches database for matching providers
7. Enriches with provider data (rating, trust score, distance)
8. Applies ranking by urgency and trust score
9. Saves conversation if authenticated
10. Returns structured response

### Provider Matching
- First tries exact name match from AI response
- Falls back to category-based matching with keyword detection
- Filters by verification status
- Orders by trust_score
- For high urgency: orders by availability and response time

## Security Considerations

### Current Implementation
- Password hashing with bcrypt
- JWT tokens with expiration
- Rate limiting with SlowAPI
- CORS configuration
- SQL injection protection via SQLAlchemy

### Known Security Gaps
- JWT secret in .env.example (should be generated)
- No password complexity requirements
- No email verification
- Review fraud detection not implemented
- No CSRF protection
- No input sanitization beyond Pydantic validation
- OAuth token audience not validated

## Scalability Considerations

### Current Limitations
- N+1 query problem in provider listing
- No caching layer (Redis included but not used)
- Synchronous AI calls (blocking)
- No background job queue
- Single database instance
- No connection pooling optimization
- No pagination cursor (only limit)

### Recommended Improvements
- Implement Redis caching for frequent queries
- Use Celery for background tasks (notifications, trust score calculation)
- Add database read replicas
- Implement proper pagination with cursors
- Optimize connection pooling
- Add CDN for static assets
- Consider microservices for AI component

## Development Workflow

### Local Development
1. Start PostgreSQL with Docker Compose
2. Configure environment variables
3. Run backend: `uvicorn app.main:app --reload`
4. Run frontend: `npm run dev`
5. Seed database: `python seed_data.py`

### Database Migrations
- Currently using raw SQL schema.sql
- No migration system (Alembic not implemented)
- Manual schema updates required

### Testing
- No test suite currently implemented
- Manual testing only
