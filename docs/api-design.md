# RideSaathi REST API Design

Base URL: `/api/v1`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `GET /auth/me`

## Profile

- `PUT /profile`
- `GET /profile/me`
- `POST /profile/aadhaar`
- `GET /profile/verification-status`

## Driver

- `POST /driver/vehicles`
- `PUT /driver/vehicles/{vehicle_id}`
- `GET /driver/vehicles`
- `POST /driver/rides`
- `PUT /driver/rides/{ride_id}`
- `POST /driver/rides/{ride_id}/cancel`
- `GET /driver/rides`
- `GET /driver/rides/{ride_id}/bookings`
- `POST /driver/bookings/{booking_id}/accept`
- `POST /driver/bookings/{booking_id}/reject`

## Passenger

- `GET /passenger/rides/search`
- `GET /passenger/rides/{ride_id}`
- `POST /passenger/rides/{ride_id}/book`
- `POST /passenger/bookings/{booking_id}/cancel`
- `GET /passenger/bookings`
- `POST /passenger/bookings/{booking_id}/review`

## Admin

- `POST /admin/login`
- `GET /admin/users`
- `POST /admin/users/{user_id}/verify`
- `POST /admin/users/{user_id}/reject`
- `POST /admin/users/{user_id}/block`
- `GET /admin/rides`
- `GET /admin/bookings`
- `GET /admin/reports`

## Key Status Values

Verification:

- `pending`
- `verified`
- `rejected`

Ride:

- `draft`
- `active`
- `cancelled`
- `completed`

Booking:

- `pending`
- `confirmed`
- `rejected`
- `cancelled`
- `completed`

Notification:

- `sent`
- `failed`
- `mocked`

## Sample Search

`GET /passenger/rides/search?source=Ahmedabad&destination=Rajkot&journey_date=2026-06-15&min_price=300&max_price=350&seats=1&ac_available=true`

## Sample Booking Request

```json
{
  "seats_booked": 2,
  "pickup_point": "Iscon Cross Road",
  "drop_point": "Gondal Road"
}
```
