# Copilot Instructions for AI Coding Agents

## Project Overview
- **Backend:** Flask (Python 3.12), SQLAlchemy ORM, JWT authentication (flask_jwt_extended)
- **Frontend:** React (Vite), custom API service (`api.js`), context-based authentication
- **Key Features:** Admin/user roles, real-time weather via OpenWeatherMap API, region/category/product management, robust error handling

## Architecture & Conventions

### Backend (Flask)
- **Routes:** Located in `backend/routes/`. Each module (e.g., `auth.py`, `ecommerce.py`, `agroclimate.py`) handles a domain area.
- **Models:** Located in `backend/models/`. Each file defines SQLAlchemy models for a domain.
- **JWT Auth:**
  - Always encode JWT identity as a JSON stringified dict: `{ "id": ..., "type": "user"|"admin" }`
  - All protected routes must parse JWT identity with `json.loads(get_jwt_identity())` before use.
  - Role checks: Use `identity['type'] == 'admin'` for admin-only routes.
- **Error Handling:**
  - Return errors as JSON: `{ "error": "message" }` with appropriate HTTP status.
  - Never block unrelated features due to missing/empty data (e.g., empty regions/categories should not cause 500/422).
- **Weather Data:**
  - Use OpenWeatherMap API for real data. API key is required in config.
  - Region endpoints must tolerate empty/missing data gracefully.

### Frontend (React)
- **API Calls:**
  - All API requests go through `src/services/api.js`.
  - Always use the correct endpoint paths (e.g., `/api/auth/profile`, not `/api/user/profile`).
  - Attach JWT token from localStorage to `Authorization: Bearer ...` header for protected endpoints.
- **Auth State:**
  - Managed in `src/contexts/AuthContext.jsx`.
  - Always update token in localStorage after login/register.
  - Use context to check user/admin role and protect routes/components.
- **Error Handling:**
  - Display backend error messages in UI.
  - For admin-only actions, show clear feedback if user is not admin.
  - For empty data (regions/categories), show a friendly message, not a blank/error state.

## Workflow for AI Agents
- **When adding new protected routes:**
  - Always parse JWT identity as a dict.
  - Enforce role checks as needed.
- **When updating frontend API calls:**
  - Double-check endpoint paths match backend.
  - Ensure token is attached and up-to-date.
- **When handling errors:**
  - Backend: Return JSON errors, never HTML.
  - Frontend: Display errors, do not block unrelated UI.
- **When integrating new features:**
  - Follow existing file/module structure.
  - Add new models/routes/components in the appropriate domain folder.

## Common Pitfalls
- **JWT identity not parsed as dict:** Always use `json.loads(get_jwt_identity())` in protected routes.
- **Frontend using wrong endpoint:** Always check backend route path before calling from frontend.
- **Admin-only actions not enforced:** Always check `identity['type'] == 'admin'` in backend and context in frontend.
- **Error handling blocks UI:** Always handle empty/missing data gracefully.

## References
- Backend: `backend/routes/`, `backend/models/`
- Frontend: `frontend/src/services/api.js`, `frontend/src/contexts/AuthContext.jsx`, `frontend/src/pages/admin/`, `frontend/src/pages/user/`

---
For further conventions, see code comments and README files. Update this file as project patterns evolve.
