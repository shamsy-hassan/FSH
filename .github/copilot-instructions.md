# Copilot Instructions for FSH AgriConnect Platform

## Architecture Overview
FSH is a full-stack agricultural platform connecting farmers, suppliers, and admins through market trading, SACCO (savings & credit cooperatives), agro-climate data, storage solutions, and skill development.

**Tech Stack:** Flask/SQLAlchemy backend + React 19/Vite frontend
**Authentication:** Dual-role JWT system (user/admin) with role-based routing
**Database:** SQLite (dev) with relationship-heavy SQLAlchemy models
**API Pattern:** RESTful with consistent `/api/{module}` prefixes
**UI Framework:** Material-UI v7 + Tailwind CSS v4 + Framer Motion for animations
**Python Version:** 3.12+ required for backend development

## Quick Start

### Backend (Flask on :5000)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py
```

### Frontend (Vite on :5173)  
```bash
cd frontend
npm install
npm run dev
```

### Database Operations
- Always wrap direct model operations: `with app.app_context():`
- Test scripts available: `test_sacco_creation.py`, `direct_sacco_test.py`
- Manual testing credentials: `admin@famar.com/admin123` (auto-created on first run)

## Critical Architecture Patterns

### JWT Identity Encoding (MANDATORY) ✅ CONSISTENTLY IMPLEMENTED
```python
# Backend: Always encode identity as JSON string with type
identity = json.dumps({'id': user.id, 'type': 'user'|'admin'})
token = create_access_token(identity=identity)

# Protected routes: Parse identity back to dict
identity = json.loads(get_jwt_identity())
user_id = identity['id']
is_admin = identity['type'] == 'admin'
```

**CONSISTENT:** All routes now use `json.loads(get_jwt_identity())` pattern correctly.

### Frontend API Integration
- **Centralized Service:** All API calls through `AgriConnectAPI` class in `services/api.js`
- **Token Management:** Auto-attached from localStorage in `getHeaders()`
- **Error Handling:** Use `agriConnectAPI.handleResponse()` for consistent parsing
- **State Persistence:** `agriConnectToken`, `agriConnectUser`, `agriConnectUserType` in localStorage
- **UI Components:** Material-UI components with Tailwind utility classes
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Icons:** Mix of React Icons (Fi* prefix) and Heroicons - prefer React Icons for consistency

### Route Structure
- **Backend Blueprints:** Each domain has `routes/{module}.py` with `{module}_bp`
- **Frontend Pages:** Role-based structure: `/pages/admin/` vs `/pages/user/`
- **Protection:** `ProtectedRoute` component with `adminOnly` prop for role gates

### Model Conventions
- **All models must include `to_dict()` method** for JSON serialization
- **Relationships:** Extensive use of `db.relationship()` with proper foreign keys
- **Domain separation:** Models split by domain (`models/{domain}.py`)

## Domain Models & Relationships
- **User System:** `User` ↔ `UserProfile` (1:1), `User` → `Orders` (1:many)
- **Market:** `User` → `MarketPost` (1:many), supports both products and needs
- **SACCO:** `User` ↔ `SaccoMember` (many:many) with nested financial relationships
- **Storage:** `User` → `StorageRequest` (1:many) → `Warehouse` relationships
- **Weather:** `Region` → `WeatherData` (1:many) with daily caching pattern

## External Integrations & Config

### Tomorrow.io Integration
- **Config:** `WEATHER_API_KEY` environment variable (get free key at tomorrow.io)
- **Caching:** Daily cache in `WeatherData` model to avoid rate limits
- **Error Handling:** Returns 503/502/504 when external API unavailable
- **Usage:** AgriClimate routes consume and cache weather data

### File Upload Pattern
- **Storage:** `backend/static/uploads/` directory
- **Security:** Use `werkzeug.utils.secure_filename()` + `extensions.allowed_file()`
- **Limits:** 100MB max (`MAX_CONTENT_LENGTH` in config) - designed for video uploads
- **Frontend:** Form data uploads, not JSON for file endpoints
- **Extensions:** `.txt`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.mp4`, `.avi`, `.mov` allowed

### Development Config
- **Database:** SQLite at `backend/app.db` (also `instance/app.db`)
- **CORS:** Enabled via `flask_cors` for localhost:5173 → localhost:5000
- **Auth:** User verification disabled (`is_verified=True` in dev)
- **JWT:** 24-hour token expiry, stored in localStorage
- **Frontend Dev Server:** Vite HMR on port 5173 with React 19 + fast refresh
- **Static Files:** Uploads stored in `backend/static/uploads/`

## Common Issues & Solutions

### Authentication Issues
❌ **Wrong:** `user_id = get_jwt_identity()` (returns JSON string, not ID)
✅ **Correct:** 
```python
identity = json.loads(get_jwt_identity())
user_id = identity['id']
is_admin = identity['type'] == 'admin'
```

**Note:** The codebase consistently uses the JSON pattern - inconsistent usage has been resolved.

### Registration Data Structure
- **Frontend sends:** `{user: {...}, profile: {...}}` nested format
- **Backend handles:** Both nested and flat structures for backward compatibility
- **Required fields:** Always validate `username`, `email`, `password` before processing

### Database Context Errors
- **Direct model operations:** Always wrap in `with app.app_context():`
- **Testing scripts:** Use pattern from `direct_sacco_test.py` for model testing
- **Blueprint routes:** Context automatically available in request handlers

### Role-Based Access Control  
❌ **Wrong:** No admin validation in protected routes
✅ **Correct:**
```python
if identity['type'] != 'admin':
    return jsonify({'error': 'Admin access required'}), 403
```

### Frontend Route Mismatches
- **ProtectedRoute:** Use `adminOnly` prop to gate admin pages
- **API endpoints:** Match backend blueprint prefixes (`/api/auth/`, not `/api/user/`)
- **Empty data:** Return `{'regions': []}` not 500 errors for empty lists

## Testing Approach
- Manual integration tests via scripts in backend root
- Test user credentials: `admin@famar.com/admin123`
- No formal test suite - use direct API calls or model testing scripts
- Database testing: Use `with app.app_context():` pattern from test scripts

## Key Files for Understanding System
- **Backend Entry:** `backend/app.py` - blueprint registration and CORS setup
- **API Client:** `frontend/src/services/api.js` - all endpoint definitions and token handling  
- **Auth Flow:** `backend/routes/auth.py` + `frontend/src/contexts/AuthContext.jsx`
- **Model Relationships:** Start with `backend/models/user.py` to see entity connections
- **Admin UI:** `frontend/src/pages/admin/` - role-specific interface patterns
- **Frontend Dependencies:** React 19, Material-UI v7, Tailwind v4, Framer Motion, React Router v7

## Development Workflow

### Running the Application
```bash
# Backend (Terminal 1) - requires Python 3.12
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python app.py

# Frontend (Terminal 2) - requires Node.js
cd frontend && npm install && npm run dev
```

### Testing Patterns
- **Manual Integration:** Use scripts like `test_sacco_creation.py` in backend root
- **API Testing:** Direct HTTP calls to `localhost:5000/api/{endpoint}`
- **Admin Credentials:** `admin@famar.com/admin123` (auto-created on first run)
- **Database Testing:** Always wrap with `with app.app_context():` for direct model operations

---
*This file should be updated as new patterns emerge. Focus on documenting what makes this codebase unique, not generic Flask/React practices.*
