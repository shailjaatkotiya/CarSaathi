# RideSaathi

RideSaathi is a scalable intercity carpooling MVP for Gujarat routes. It connects verified personal-car drivers with verified passengers for affordable city-to-city rides.

Tagline: **Skip the lonely bus. Choose a homely car ride, friendly company, and flexible halts with RideSaathi.**

## What Is Included

- Product requirement document in `docs/product-requirements.md`
- System architecture and deployment plan in `docs/architecture.md`
- REST API design in `docs/api-design.md`
- FastAPI backend with SQLAlchemy models, JWT auth, mock Aadhaar verification, ride search, booking, reviews, admin verification, and WhatsApp notification logging
- React + TypeScript + Tailwind frontend with mobile-first screens for passenger, driver, profile, verification, and admin flows
- Seed data for Ahmedabad to Rajkot and Rajkot to Jamnagar
- Simple local run flow for backend and frontend

## Local Backend Setup

PowerShell on Windows may block `npm.ps1`, so use `npm.cmd` for frontend commands.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

The backend defaults to local SQLite for quick MVP runs. For PostgreSQL, set `DATABASE_URL` in `backend/.env`.

API docs:

- http://localhost:8000/docs
- http://localhost:8000/health

Seeded demo users:

- Admin: `admin@ridesaathi.in` / `Admin@123`
- Driver: `driver@ridesaathi.in` / `Driver@123`
- Passenger: `passenger@ridesaathi.in` / `Passenger@123`

## Local Frontend Setup

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend URL:

- http://localhost:5173

Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` if your backend runs elsewhere.

## MVP Scope

The MVP supports:

- Registration/login
- Mock Aadhaar submission with encrypted/tokenized storage and masked display
- Admin manual verification
- Driver vehicle and ride listing
- Passenger ride search and booking
- Manual booking approval/rejection
- Mock WhatsApp notification log
- Reviews and safety reporting

## Production Notes

- Replace mock Aadhaar flow with a compliant verification provider before production.
- Store production secrets outside the repository and never commit `.env`.
- Keep booking seat updates inside database transactions.
- Use Twilio or WhatsApp Business API for live WhatsApp delivery when ready.
