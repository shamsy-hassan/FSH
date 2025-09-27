# Copilot Instructions for FSH AgriConnect Platform

## Architecture Overview
FSH is a full-stack agricultural platform with Flask/SQLAlchemy backend and React/Vite frontend. The system serves farmers, suppliers, and admins with features for market trading, SACCO (savings & credit cooperatives), agro-climate data, storage solutions, and skill development.

**Key Domain Models:** User, Profile, Sacco, MarketPost, Order, Region, WeatherData, StorageRequest, Message, Skill
**API Pattern:** RESTful with JWT authentication, all routes prefixed `/api/{module}`
**Database:** SQLite (dev) with SQLAlchemy ORM, relationship-heavy models

## Development Workflow

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py  # Runs on :5000
```

### Frontend Setup  
```bash
cd frontend
npm install
npm run dev  # Runs on :5173 with Vite
```

### Database Management
- Models in `backend/models/` with relationships via `db.relationship()`
- Extensions initialized in `extensions.py` (db, jwt, mail)
- Database context required: `with app.app_context():`
- Manual testing scripts: `test_sacco_creation.py`, `direct_sacco_test.py`

## Code Conventions

### Backend Patterns
- **Route Structure:** Each module has blueprint in `routes/{module}.py` with `{module}_bp`
- **Model Methods:** Always include `to_dict()` for JSON serialization
- **Authentication:** Use `@jwt_required()` and `get_jwt_identity()` from flask-jwt-extended
- **Error Handling:** Return `jsonify({'error': message}), status_code`
- **File Uploads:** Use `extensions.allowed_file()` and `UPLOAD_FOLDER` config

### Frontend Patterns
- **API Integration:** Single `services/api.js` class with token management
- **Routing:** User routes `/user/*`, admin routes `/admin/*`, public routes at root
- **State:** AuthContext for user state, localStorage for token persistence
- **Components:** Layout wrapper with Navbar/Sidebar, ProtectedRoute for auth
- **Dashboard Data:** Use `api.user.getDashboard()` and `api.admin.getDashboard()` for real-time stats
- **Loading States:** Always implement loading, error, and retry patterns for API calls

### Key Relationships
- User → Profile (1:1), User → Orders (1:many), User → SaccoMemberships (many:many)
- Region → WeatherData (1:many), Region → CropRecommendations (1:many)
- Sacco → Members → Loans (nested relationships)

## Critical Integration Points

### Authentication Flow
1. Login via `/api/auth/login` returns JWT token
2. Frontend stores in localStorage as `agriConnectToken`
3. API class auto-includes `Authorization: Bearer {token}` header
4. User verification disabled in dev (`is_verified=True` in auth.py)

### Weather API Integration
- External WeatherAPI.com integration in agroclimate routes
- Config: `WEATHER_API_KEY` environment variable required (get free key at weatherapi.com)
- Caching pattern: Store weather data in WeatherData model (daily cache)
- Fallback: Returns proper error codes (503/502/504) when API unavailable
- Rate limiting: Uses daily cache to avoid excessive API calls

### File Upload Pattern
- Static uploads go to `backend/static/uploads/`
- Use `werkzeug.utils.secure_filename()` for security
- Max 16MB limit in config (`MAX_CONTENT_LENGTH`)

## Common Issues & Solutions

### Registration/Authentication Errors
- **NoneType encode error**: Missing required fields validation - always validate `username`, `email`, `password` before processing
- **Nested data structure**: Frontend sends `{user: {...}, profile: {...}}` format - handle both nested and flat structures
- **Username/field required errors**: Check data structure mismatch between form components and AuthContext expectations

### Database Context Errors
Always wrap direct model operations in app context:
```python
with app.app_context():
    # Database operations here
```

### CORS Issues
CORS enabled via `flask_cors`, frontend assumes backend on `localhost:5000`

### Token Management
Frontend API class handles token refresh automatically, stores userType for role-based routing

## Testing Approach
- Manual integration tests via scripts in backend root
- Test user credentials: admin@famar.com/admin123
- No formal test suite - use direct API calls or model testing scripts

## Project Overview
FSH (AgriConnect Platform) - Agricultural platform with dual-role system (farmers/admins) featuring e-commerce, weather data, SACCO management, and marketplace functionality.

- **Backend:** Flask (Python 3.12), SQLAlchemy ORM, JWT authentication, OpenWeatherMap integration
- **Frontend:** React + Vite, TailwindCSS + Material-UI, custom API service layer
- **Key Domains:** Auth, E-commerce, AgriClimate, Market, SACCO, Storage, Skills, Orders, Messaging

## Architecture & Data Flow

### Backend Structure (`backend/`)
- **Application Factory:** `app.py` - registers 12 domain blueprints with `/api/<domain>` prefixes
- **Extensions:** `extensions.py` - shared Flask extensions (db, jwt, mail)
- **Config:** Environment-based config with OpenWeatherMap API key, JWT settings, file uploads
- **Models:** Domain-separated SQLAlchemy models (`models/<domain>.py`)
- **Routes:** Blueprint-based routes (`routes/<domain>.py`) - each handles one feature area

### Frontend Architecture (`frontend/src/`)
- **API Layer:** `services/api.js` - centralized AgriConnectAPI class with domain-specific methods
- **Auth Context:** `contexts/AuthContext.jsx` - manages user/admin state, token persistence
- **Page Structure:** `/pages/admin/` vs `/pages/user/` - role-based UI segregation
- **Shared Components:** Layout, Navbar, Sidebar, ProtectedRoute for access control

## Critical Patterns & Conventions

### JWT Authentication Flow
```python
# Backend: Always encode identity as JSON string
identity = json.dumps({'id': user.id, 'type': 'user'|'admin'})
token = create_access_token(identity=identity)

# Protected routes: Always parse identity back to dict
identity = json.loads(get_jwt_identity())
user_id = identity['id']
is_admin = identity['type'] == 'admin'
```

### Frontend API Integration
```javascript
// All API calls through centralized service
const agriConnectAPI = new AgriConnectAPI()
// Token automatically attached from localStorage in getHeaders()
// Endpoints: /api/auth/*, /api/admin/*, /api/ecommerce/*, etc.
```

### Error Handling Patterns
- **Backend:** Always return `{ "error": "message" }` JSON, never HTML responses
- **Frontend:** Use `agriConnectAPI.handleResponse()` for consistent error parsing
- **Graceful Degradation:** Empty data (regions, categories) should show friendly messages, not crash UI

## Development Workflows

### Running the Application
```bash
# Backend (Flask development server)
cd backend && python app.py

# Frontend (Vite dev server) 
cd frontend && npm run dev

# Database operations via Flask shell in backend/
```

### Adding New Features
1. **Backend:** Create model in `models/<domain>.py`, routes in `routes/<domain>.py`
2. **Frontend:** Add API methods to `services/api.js`, create components/pages
3. **Auth:** Use `@jwt_required()` + `json.loads(get_jwt_identity())` pattern
4. **Admin Features:** Check `identity['type'] == 'admin'` backend + context frontend

### Domain Models Overview
- **User System:** User, UserProfile, Admin - dual authentication with role-based access
- **E-commerce:** Product, Category, Cart, CartItem - shopping cart functionality  
- **AgriClimate:** Region, WeatherData, CropRecommendation - weather/agricultural data
- **Market:** MarketPost - farmer-to-farmer marketplace
- **SACCO:** SaccoMember, financial cooperative features
- **Storage:** StorageRequest, Warehouse - agricultural storage services
- **Orders:** Order, OrderItem - transaction management
- **Messaging:** Message - internal communication system

## Common Pitfalls & Solutions

### Authentication Issues
❌ **Wrong:** `user_id = get_jwt_identity()` (returns string, not ID)
✅ **Correct:** 
```python
identity = json.loads(get_jwt_identity())
user_id = identity['id']
```

### API Endpoint Mismatches  
❌ **Wrong:** Frontend calls `/api/user/profile`
✅ **Correct:** Match backend blueprint: `/api/auth/profile`

### Role Access Control
❌ **Wrong:** No admin validation in protected routes
✅ **Correct:**
```python
if identity['type'] != 'admin':
    return jsonify({'error': 'Admin access required'}), 403
```

### Empty Data Handling
❌ **Wrong:** Return 500 when regions list is empty
✅ **Correct:** Return `{'regions': []}` with friendly frontend message

## Key Files for Understanding System
- **Backend Entry:** `backend/app.py` - blueprint registration and CORS setup
- **API Client:** `frontend/src/services/api.js` - all endpoint definitions and token handling  
- **Auth Flow:** `backend/routes/auth.py` + `frontend/src/contexts/AuthContext.jsx`
- **Model Relationships:** Start with `backend/models/user.py` to see entity connections
- **Admin UI:** `frontend/src/pages/admin/` - role-specific interface patterns

---
*This file should be updated as new patterns emerge. Focus on documenting what makes this codebase unique, not generic Flask/React practices.*
