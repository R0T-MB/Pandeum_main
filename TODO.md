# Pandeum - TODO List

## Critical Blockers (Must Fix First)

### Frontend
- [ ] Create `frontend/components/chat/ChatInput.tsx` - Currently imported but doesn't exist
- [ ] Create `frontend/components/chat/ChatMessage.tsx` - Currently imported but doesn't exist
- [ ] Rename `frontend/contexts/uthContext.tsx` to `frontend/contexts/AuthContext.tsx`
- [ ] Update all imports referencing the old AuthContext filename
- [ ] Fix `frontend/components/layout/Sidebar.tsx` import path for AuthContext

### Backend
- [ ] Implement `GET /users/me/conversations` endpoint in `backend/app/api/users.py`
- [ ] Fix syntax error in `seed_data.py` line 244
- [ ] Remove debug `print()` statements from `backend/app/api/providers.py` (lines 52-59, 68-79)
- [ ] Implement `get_optional_user` function in `backend/app/dependencies.py` (currently empty)

---

## High Priority

### Frontend Pages
- [ ] Create `frontend/app/dashboard/page.tsx` - User profile dashboard
- [ ] Create `frontend/app/favorites/page.tsx` - User favorites list
- [ ] Create `frontend/app/history/page.tsx` - Conversation history
- [ ] Create `frontend/app/providers/[id]/page.tsx` - Provider detail page
- [ ] Complete `loadHistory()` function in `frontend/app/page.tsx`

### Backend Endpoints
- [ ] Add `PUT /users/me` endpoint for profile updates
- [ ] Add `PUT /users/me/password` endpoint for password changes
- [ ] Add `DELETE /users/me/conversations/{id}` endpoint
- [ ] Add `GET /providers/{id}/services` endpoint
- [ ] Complete service CRUD operations for providers

### Authentication
- [ ] Add Google OAuth button to login/register pages
- [ ] Fix auth storage inconsistency (localStorage vs cookies)
- [ ] Replace `window.location.href` with Next.js router
- [ ] Add loading states to login/register forms
- [ ] Improve error handling beyond `alert()`

---

## Medium Priority

### Security
- [ ] Add password complexity validation (8+ chars, mixed case, numbers, symbols)
- [ ] Implement email verification system
- [ ] Implement stricter rate limits for AI endpoints
- [ ] Add input sanitization middleware
- [ ] Validate OAuth token audience
- [ ] Add CSRF protection
- [ ] Generate secure JWT secret for production

### Provider Features
- [ ] Create `frontend/app/provider-dashboard/page.tsx`
- [ ] Implement service management UI
- [ ] Implement availability calendar UI
- [ ] Add service CRUD endpoints
- [ ] Add availability update endpoint

### AI Improvements
- [ ] Implement trust score calculation algorithm
- [ ] Implement review fraud detection
- [ ] Implement real geolocation with distance calculation
- [ ] Improve provider category detection
- [ ] Implement provider ranking algorithm

---

## Low Priority

### Scalability
- [ ] Fix N+1 query problem in provider listing
- [ ] Implement Redis caching
- [ ] Implement Celery for background jobs
- [ ] Implement cursor-based pagination
- [ ] Optimize database connection pooling
- [ ] Add database read replicas

### Advanced Features
- [ ] Implement real-time messaging system
- [ ] Implement appointment scheduling
- [ ] Implement payment system
- [ ] Implement composite solutions
- [ ] Add notification system

### Code Quality
- [ ] Remove unused Redis import from requirements.txt
- [ ] Remove unused `trust_factors` JSONB field or implement it
- [ ] Add comprehensive error logging
- [ ] Implement Alembic for database migrations
- [ ] Add API documentation (Swagger/OpenAPI)

---

## Testing
- [ ] Set up pytest for backend testing
- [ ] Write unit tests for CRUD operations
- [ ] Write unit tests for authentication
- [ ] Write integration tests for API endpoints
- [ ] Set up Jest/React Testing Library for frontend
- [ ] Write component tests for AuthProvider
- [ ] Write E2E tests with Playwright
- [ ] Aim for 80% backend code coverage
- [ ] Aim for 70% frontend component coverage

---

## Deployment
- [ ] Configure production environment variables
- [ ] Set up production database
- [ ] Configure production CORS
- [ ] Set up SSL certificate
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Set up analytics (Google Analytics)
- [ ] Configure CDN for static assets
- [ ] Set up database backups
- [ ] Create deployment documentation

---

## Documentation
- [ ] Add inline code comments where unclear
- [ ] Document API endpoints with examples
- [ ] Document database schema
- [ ] Document environment variables
- [ ] Create developer onboarding guide
- [ ] Document deployment process

---

## Known Issues to Monitor

### Performance
- Monitor AI response times (currently synchronous)
- Monitor database query performance
- Monitor cache hit rates once implemented
- Monitor bundle size

### Security
- Monitor for SQL injection attempts
- Monitor for XSS attempts
- Monitor authentication failures
- Monitor rate limit violations
- Monitor suspicious review patterns

### User Experience
- Monitor chat completion rates
- Monitor provider contact rates
- Monitor user engagement metrics
- Monitor error rates in production
