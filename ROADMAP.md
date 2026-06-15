# Pandeum - Development Roadmap

## Current Status

- **Backend**: ~70% complete
- **Frontend**: ~40% complete
- **Overall MVP**: ~55% complete

## Phase 1: Critical Fixes (1-2 weeks)
**Priority: HIGH - Blockers preventing basic functionality**

### 1.1 Create Missing Chat Components
- [ ] Create `frontend/components/chat/ChatInput.tsx`
  - Text input for user messages
  - Send button with loading state
  - Character limit indicator
  - Enter key to submit
- [ ] Create `frontend/components/chat/ChatMessage.tsx`
  - Display user messages
  - Display AI responses (structured data)
  - Handle different response types (diagnosis, solutions, providers)
  - Timestamp display
  - Markdown support for text content

### 1.2 Fix Import Errors
- [ ] Rename `frontend/contexts/uthContext.tsx` to `frontend/contexts/AuthContext.tsx`
- [ ] Update all imports referencing the old filename
- [ ] Verify Sidebar.tsx imports work correctly

### 1.3 Implement Conversation History Endpoint
- [ ] Backend: Add `GET /users/me/conversations` endpoint in `users.py`
  - Query conversations by user_id
  - Order by created_at DESC
  - Pagination support
  - Return ConversationResponse schema
- [ ] Frontend: Complete `loadHistory()` function in `page.tsx`
  - Call the new endpoint
  - Display previous conversations in sidebar
  - Allow re-opening past conversations

### 1.4 Fix Seed Data Script
- [ ] Fix syntax error in `seed_data.py` line 244
- [ ] Test seed script locally
- [ ] Verify all data is inserted correctly
- [ ] Add error handling for database connection issues

### 1.5 Remove Debug Code
- [ ] Remove all `print()` statements from `backend/app/api/providers.py`
- [ ] Search for and remove any other debug prints in production code
- [ ] Add proper logging instead if needed

---

## Phase 2: Core Pages (1-2 weeks)
**Priority: HIGH - Essential user-facing pages**

### 2.1 User Dashboard
- [ ] Create `frontend/app/dashboard/page.tsx`
  - Display user profile information
  - Edit profile form (name, city, email)
  - Change password functionality
  - Account statistics (conversations, favorites)
- [ ] Backend: Add `PUT /users/me` endpoint for profile updates
- [ ] Backend: Add `PUT /users/me/password` endpoint for password change

### 2.2 Favorites Page
- [ ] Create `frontend/app/favorites/page.tsx`
  - List all favorited providers
  - Remove from favorites functionality
  - Empty state when no favorites
  - Link to provider detail pages
- [ ] Reuse ProviderCard component for display

### 2.3 History Page
- [ ] Create `frontend/app/history/page.tsx`
  - List all past conversations
  - Show problem text and timestamp
  - Allow re-opening conversations
  - Delete conversation option
  - Filter by date or category
- [ ] Backend: Add `DELETE /users/me/conversations/{id}` endpoint

### 2.4 Provider Detail Page
- [ ] Create `frontend/app/providers/[id]/page.tsx`
  - Display complete provider information
  - Show all services offered
  - Display all reviews with pagination
  - Add to favorites button
  - Contact button (placeholder for now)
  - Show trust score breakdown
  - Display location on map (placeholder)
- [ ] Backend: Add `GET /providers/{id}/services` endpoint
- [ ] Ensure provider detail endpoint includes all necessary data

---

## Phase 3: Provider Dashboard (1 week)
**Priority: MEDIUM - Provider-facing features**

### 3.1 Provider Dashboard
- [ ] Create `frontend/app/provider-dashboard/page.tsx`
  - Provider profile overview
  - Statistics (views, contacts, reviews)
  - Quick actions (edit profile, add service)
  - Recent reviews display
  - Recent contacts/leads

### 3.2 Service Management
- [ ] Backend: Complete service CRUD operations
  - `POST /providers/me/services` - Add service
  - `PUT /providers/me/services/{id}` - Update service
  - `DELETE /providers/me/services/{id}` - Delete service
  - `GET /providers/me/services` - List services
- [ ] Frontend: Service management UI
  - Add/edit service form
  - Service list with actions
  - Price estimate field
  - Service description

### 3.3 Availability Management
- [ ] Backend: Add availability update endpoint
  - `PUT /providers/me/availability` - Update availability_json
- [ ] Frontend: Availability calendar UI
  - Weekly schedule editor
  - Set available/unavailable hours
  - Emergency availability toggle

---

## Phase 4: Security & Validation (1 week)
**Priority: HIGH - Security improvements**

### 4.1 Password Requirements
- [ ] Backend: Add password complexity validation in schemas
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- [ ] Frontend: Real-time password validation in register form
  - Visual strength indicator
  - Show requirements checklist
  - Prevent submission if invalid

### 4.2 Email Verification
- [ ] Backend: Implement email verification system
  - Add verification_token field to users table
  - Add is_verified field to users table
  - Create email sending service
  - Add `POST /auth/verify-email` endpoint
  - Add `POST /auth/resend-verification` endpoint
- [ ] Frontend: Email verification flow
  - Show verification required message after registration
  - Verification page with token input
  - Resend verification email button
  - Block access until verified (optional)

### 4.3 Rate Limiting Improvements
- [ ] Implement stricter rate limits for AI endpoints
  - `/ai/solve`: 10 requests per minute per user
  - `/ai/explore`: 20 requests per minute per user
  - Auth endpoints: 5 requests per minute per IP
- [ ] Add rate limit headers to responses
- [ ] Document rate limits in API docs

### 4.4 Input Sanitization
- [ ] Add input sanitization middleware
  - Strip HTML tags from text inputs
  - Sanitize markdown content
  - Validate and clean AI prompts
- [ ] Add XSS protection headers
- [ ] Implement Content Security Policy

---

## Phase 5: AI Improvements (1 week)
**Priority: MEDIUM - Enhance AI capabilities**

### 5.1 Trust Score Calculation
- [ ] Implement trust score algorithm
  - Base score from verification status
  - Boost from review count and rating
  - Boost from response time
  - Boost from account age
  - Penalty from flags
- [ ] Create background job to recalculate scores
- [ ] Add trust_factors breakdown display

### 5.2 Review Fraud Detection
- [ ] Implement basic fraud detection
  - Check reviewer IP (hash for privacy)
  - Check user-agent
  - Detect multiple reviews from same IP
  - Detect unusually fast consecutive reviews
  - Flag suspicious patterns
- [ ] Add admin review queue for flagged reviews
- [ ] Implement auto-rejection for obvious fraud

### 5.3 Provider Matching Improvements
- [ ] Implement real geolocation
  - Use user's location from browser
  - Calculate actual distance using Haversine formula
  - Add location permission request
- [ ] Improve category detection
  - Better keyword mapping
  - Add subcategory detection
  - Handle multi-category problems
- [ ] Implement provider ranking algorithm
  - Combine distance, trust score, availability
  - Weight by urgency
  - Consider user preferences from memory

---

## Phase 6: Scalability (1-2 weeks)
**Priority: MEDIUM - Performance improvements**

### 6.1 Query Optimization
- [ ] Fix N+1 query problem in provider listing
  - Use SQLAlchemy eager loading
  - Join queries instead of separate queries
  - Optimize rating calculation
- [ ] Add database query logging
- [ ] Analyze slow queries with EXPLAIN

### 6.2 Caching Layer
- [ ] Implement Redis caching
  - Cache provider listings (5 minute TTL)
  - Cache individual provider data (10 minute TTL)
  - Cache user memory (30 minute TTL)
  - Cache AI responses for similar queries (1 hour TTL)
- [ ] Add cache invalidation on updates
- [ ] Monitor cache hit rates

### 6.3 Background Jobs
- [ ] Implement Celery or similar task queue
  - Move email sending to background
  - Move trust score calculation to background
  - Move notification sending to background
  - Move fraud detection to background
- [ ] Set up Celery Beat for scheduled tasks
- [ ] Add task monitoring dashboard

### 6.4 Pagination
- [ ] Implement cursor-based pagination
  - Replace limit-only pagination
  - Add cursor support to all list endpoints
  - Implement infinite scroll in frontend
- [ ] Add page size limits
- [ ] Optimize pagination queries

---

## Phase 7: Advanced Features (2-3 weeks)
**Priority: LOW - Nice-to-have features**

### 7.1 Messaging System
- [ ] Backend: Implement real-time messaging
  - Add messages table
  - WebSocket integration
  - Message read status
  - Typing indicators
- [ ] Frontend: Chat interface
  - Message thread view
  - Real-time updates
  - File attachment support
  - Message search

### 7.2 Appointment Scheduling
- [ ] Backend: Implement booking system
  - Add appointments table
  - Availability checking
  - Conflict detection
  - Confirmation workflow
  - Cancellation policy
- [ ] Frontend: Booking UI
  - Calendar view
  - Time slot selection
  - Booking confirmation
  - Appointment management

### 7.3 Payment System
- [ ] Backend: Payment integration
  - Stripe or similar integration
  - Escrow system
  - Refund handling
  - Transaction history
- [ ] Frontend: Payment UI
  - Payment method management
  - Checkout flow
  - Transaction history
  - Refund requests

### 7.4 Composite Solutions
- [ ] Implement complex problem handling
  - Multi-step solutions
  - Multiple provider coordination
  - Progress tracking
  - Milestone-based payments
- [ ] Frontend: Composite solution UI
  - Step-by-step progress
  - Provider coordination view
  - Timeline visualization

---

## Phase 8: Testing & Deployment (1 week)
**Priority: HIGH - Quality assurance**

### 8.1 Backend Testing
- [ ] Add pytest configuration
- [ ] Write unit tests for:
  - CRUD operations
  - Authentication flows
  - AI engine (mocked)
  - Rate limiting
- [ ] Write integration tests for:
  - API endpoints
  - Database operations
  - Authentication flows
- [ ] Set up test database
- [ ] Aim for 80% code coverage

### 8.2 Frontend Testing
- [ ] Add Jest/React Testing Library
- [ ] Write component tests for:
  - AuthProvider
  - Chat components
  - Provider cards
  - Forms
- [ ] Write E2E tests with Playwright:
  - Registration flow
  - Login flow
  - Chat interaction
  - Provider search
- [ ] Aim for 70% component coverage

### 8.3 Production Preparation
- [ ] Generate secure JWT secrets
- [ ] Configure production CORS
- [ ] Set up domain and SSL
- [ ] Configure environment variables
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Set up analytics (Google Analytics)
- [ ] Configure CDN for static assets
- [ ] Set up database backups
- [ ] Create deployment documentation

### 8.4 Deployment
- [ ] Deploy backend to production server
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Configure production database
- [ ] Run database migrations
- [ ] Seed production data if needed
- [ ] Smoke test all critical flows
- [ ] Monitor initial performance

---

## Future Considerations

### Post-MVP Features
- Mobile app (React Native)
- Provider mobile app
- Advanced analytics dashboard
- AI model fine-tuning
- Multi-language support
- Provider onboarding automation
- Marketing automation
- Affiliate program
- Premium subscriptions

### Technical Debt
- Implement Alembic for database migrations
- Add comprehensive error logging
- Implement proper error handling in frontend
- Add API documentation (Swagger/OpenAPI)
- Implement feature flags
- Add A/B testing framework
- Optimize bundle size
- Implement service worker for offline support

---

## Timeline Estimate

- **Phase 1**: 1-2 weeks
- **Phase 2**: 1-2 weeks
- **Phase 3**: 1 week
- **Phase 4**: 1 week
- **Phase 5**: 1 week
- **Phase 6**: 1-2 weeks
- **Phase 7**: 2-3 weeks
- **Phase 8**: 1 week

**Total Estimated Time**: 9-13 weeks for complete MVP

**Minimum Viable Product (Phases 1-2)**: 2-4 weeks

**Functional MVP (Phases 1-4)**: 5-6 weeks
