# RideSaathi Implementation Roadmap

## Frontend Component Structure

- `src/components/Layout.tsx`: responsive navigation and shell
- `src/components/RideCard.tsx`: ride listing card
- `src/components/VerifiedBadge.tsx`: trust indicator
- `src/components/MetricCard.tsx`: admin metrics
- `src/pages/LandingPage.tsx`: product landing and route highlights
- `src/pages/AuthPage.tsx`: login/register
- `src/pages/VerificationPage.tsx`: Aadhaar mock submission
- `src/pages/DriverOnboarding.tsx`: driver readiness checklist
- `src/pages/AddVehicle.tsx`: vehicle management
- `src/pages/CreateRide.tsx`: ride creation
- `src/pages/SearchRides.tsx`: passenger search and filters
- `src/pages/RideDetail.tsx`: ride detail and booking
- `src/pages/BookingConfirmation.tsx`: WhatsApp confirmation state
- `src/pages/MyBookings.tsx`: passenger history
- `src/pages/MyRides.tsx`: driver ride list
- `src/pages/ProfilePage.tsx`: profile and verification status
- `src/pages/AdminDashboard.tsx`: admin verification and monitoring

## Backend Folder Structure

- `app/main.py`: FastAPI app, CORS, router registration, local seed startup
- `app/models.py`: SQLAlchemy entities for users, verification, vehicles, rides, bookings, payments, reviews, notifications, reports, cancellations
- `app/schemas.py`: Pydantic request/response contracts
- `app/routers/`: REST API modules for auth, profile, driver, passenger, admin
- `app/services/whatsapp.py`: mock WhatsApp notification logging
- `app/core/security.py`: JWT, password hashing, Aadhaar masking/encryption/tokenization
- `app/database.py`: database engine and session dependency
- `app/seed.py`: demo users, vehicles, and route listings
- `alembic/`: production migration scaffold

## Admin Dashboard Plan

MVP:

- View users and status
- Verify/reject Aadhaar profiles
- View ride listings and bookings
- Block suspicious users
- View reports

Next:

- Document preview with signed URLs
- Risk scoring for repeated cancellations and duplicate identity tokens
- City and route management
- Audit timeline for every admin decision

## Security Plan

- Require verified profiles before booking or listing rides
- Mask Aadhaar and phone numbers where details are not confirmed
- Store Aadhaar as encrypted value plus one-way token
- Use JWT auth with bcrypt password hashing
- Keep secrets outside the repository and never commit `.env`
- Store uploaded document and vehicle-photo paths through the app database when those uploads are added
- Add rate limits to auth, booking, verification, report, and OTP endpoints
- Add immutable audit logs for admin verification and user blocking

## MVP Delivery Phases

1. Foundation: auth, profiles, verification, route seed data
2. Driver supply: vehicle management, ride listing, cancellations
3. Passenger demand: search, filters, detail, booking
4. Trust and safety: ratings, reports, masked contact details, admin moderation
5. Notifications: mock WhatsApp logs, then Twilio or WhatsApp Business API
6. Production hardening: Alembic migrations, transaction-safe bookings, app logs, and manual release checks

## Sample Seed Data

Ahmedabad to Rajkot:

- Distance: 220-250 km
- Price: Rs. 300-350 per seat
- Pickup: Iscon Cross Road, SG Highway, Satellite, Bopal
- Drop-off: Gondal Road, Kalawad Road, Rajkot Bus Stand

Rajkot to Jamnagar:

- Distance: 90-100 km
- Price: Rs. 150-250 per seat
- Pickup: Rajkot Bus Stand, Kalawad Road, Gondal Road
- Drop-off: Jamnagar Bus Stand, Patel Colony, Reliance Circle

## Local Run Commands

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
