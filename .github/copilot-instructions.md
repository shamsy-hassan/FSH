# Copilot Instructions for FSH AgriConnect Platform

## Architecture Overview
FSH is a full-stack agricultural platform connecting farmers, suppliers, and admins through market trading, SACCO (savings & credit cooperatives), agro-climate data, storage solutions, and skill development.

**Tech Stack:** Flask/SQLAlchemy backend + React 19/Vite frontend
**Authentication:** Dual-role JWT system (user/admin) with role-based routing  
**Database:** SQLite (dev) with relationship-heavy SQLAlchemy models
**API Pattern:** RESTful with consistent `/api/{module}` prefixes
**UI Framework:** Material-UI v6, Tailwind CSS v4, Framer Motion for animations
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
- Manual testing credentials: `admin@agriconnect.com/admin123` (auto-created on first run)

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

**CONSISTENT:** All routes consistently use `json.loads(get_jwt_identity())` pattern with conditional parsing for string/dict.

### Frontend Component Patterns
- **Page Structure:** Consistent page layout with header, stats cards, tabs, and content sections
- **Animation Patterns:** Use `motion.div` with `initial/animate/exit` for page transitions and card hover effects
- **State Management:** Local state + `useEffect` for data fetching, auto-refresh patterns (30s intervals)
- **Modal Patterns:** Overlay modals with `AnimatePresence` for forms and detailed interactions
- **Card Components:** Reusable card patterns with view mode toggle (grid/list), status badges, action buttons
- **Loading States:** Consistent loading spinners with gradient backgrounds and descriptive text
- **Empty States:** Standardized empty state components with icons, titles, descriptions, and call-to-action buttons
- **Form Handling:** Multi-step forms with validation, file uploads via FormData (not JSON)
- **Toast Notifications:** `react-toastify` for success/error feedback on user actions
- **Real-time Updates:** Auto-sync with admin actions (approval status changes trigger notifications)

### Frontend API Integration
- **Centralized Service:** All API calls through `AgriConnectAPI` class in `services/api.js`
- **Token Management:** Auto-attached from localStorage in `getHeaders()`
- **Error Handling:** Use `agriConnectAPI.handleResponse()` for consistent parsing
- **State Persistence:** `agriConnectToken`, `agriConnectUser`, `agriConnectUserType` in localStorage
- **UI Components:** Material-UI components with Tailwind utility classes
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Icons:** React Icons (Fi* prefix) preferred - consistent across all components

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

### API Service Issues
❌ **Wrong:** Corrupted auth methods with embedded `\n` characters
✅ **Correct:** Ensure auth object has proper `getProfile()` method for AuthContext initialization
- **AuthContext expects:** `agriConnectAPI.auth.getProfile()` to exist
- **Service pattern:** All auth methods should be properly formatted without string escapes

### React Component Issues  
❌ **Wrong:** Using objects as React children or keys
```jsx
{regions.map(region => <option key={region}>{region}</option>)}
```
✅ **Correct:** Extract primitive values for keys and content
```jsx
{regions.map(region => <option key={region.id || region.name}>{region.name}</option>)}
```

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
- Test user credentials: `admin@agriconnect.com/admin123`
- No formal test suite - use direct API calls or model testing scripts
- Database testing: Use `with app.app_context():` pattern from test scripts

## Key Files for Understanding System
- **Backend Entry:** `backend/app.py` - blueprint registration and CORS setup
- **API Client:** `frontend/src/services/api.js` - all endpoint definitions and token handling  
- **Auth Flow:** `backend/routes/auth.py` + `frontend/src/contexts/AuthContext.jsx`
- **Model Relationships:** Start with `backend/models/user.py` to see entity connections
- **Protected Routes:** `frontend/src/components/ProtectedRoute.jsx` - role-based access control
- **Layout System:** `frontend/src/components/Layout.jsx` - conditional admin/user layouts
- **Component Examples:** `frontend/src/pages/user/MyMarket.jsx` - comprehensive CRUD patterns
- **Admin UI:** `frontend/src/pages/admin/` - role-specific interface patterns
- **Frontend Dependencies:** React 19, Material-UI v6, Tailwind v4, Framer Motion, React Router v7

## Current Issues & Notes
- **Routes Directory:** Typo in `/backend/routes/__nit__.py` - should be `__init__.py`
- **Backend Dependencies:** Flask 2.3.3, SQLAlchemy 3.0.5, JWT-Extended 4.5.3, CORS 4.0.0
- **Frontend Dependencies:** React 19, Material-UI v6, Tailwind v4, react-toastify v11
- **Development Status:** All major patterns consistently implemented across codebase
- **Fixed Issues:** API service auth corruption, React object rendering in ManageSacco regions

## Quick Debugging Checklist
1. **AuthContext errors:** Verify `agriConnectAPI.auth.getProfile()` method exists
2. **Object rendering errors:** Check if data arrays contain objects vs primitives
3. **Duplicate React keys:** Ensure unique keys using `item.id` or `item.name`
4. **API service corruption:** Look for embedded `\n` characters in method definitions
5. **Missing auth token:** Check localStorage for `agriConnectToken` and related data

## Development Workflow

### Running the Application
```bash
# Backend (Terminal 1) - requires Python 3.12
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && python app.py

# Frontend (Terminal 2) - requires Node.js
cd frontend && npm install && npm run dev
```

### Common Startup Issues
- **Auth initialization errors:** Check `agriConnectAPI.auth.getProfile` method exists and is properly formatted
- **API service corruption:** Look for embedded `\n` characters in method definitions
- **React rendering errors:** Ensure region/object data is properly extracted before rendering
- **Missing dependencies:** Frontend requires React 19, Material-UI v6, Tailwind v4

### Testing Patterns
- **Manual Integration:** Use scripts like `test_sacco_creation.py` in backend root
- **API Testing:** Direct HTTP calls to `localhost:5000/api/{endpoint}`
- **Admin Credentials:** `admin@agriconnect.com/admin123` (auto-created on first run)
- **Database Testing:** Always wrap with `with app.app_context():` for direct model operations

---
*This file should be updated as new patterns emerge. Focus on documenting what makes this codebase unique, not generic Flask/React practices.*
