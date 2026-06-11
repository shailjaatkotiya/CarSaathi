# Carthi Product Requirement Document

## Product Vision

Carthi helps people travel between cities within the same state by connecting verified car drivers with verified passengers. Drivers already travelling by personal car can list seats and recover fuel costs. Passengers can compare and book affordable, safer, more flexible car rides instead of buses or private taxis.

Tagline: **Skip the lonely bus. Choose a homely car ride, friendly company, and flexible halts with Carthi.**

## Initial Market

- State: Gujarat
- Initial routes:
  - Ahmedabad to Rajkot, around 220-250 km, price per seat Rs. 300-350
  - Rajkot to Jamnagar, around 90-100 km, price per seat Rs. 150-250

## User Personas

Driver:

- Travels intercity by personal car.
- Wants to recover fuel cost without running a taxi service.
- Needs control over passenger approval, pickup/drop points, luggage, and ride rules.

Passenger:

- Wants affordable intercity travel with comfort and flexibility.
- Needs trust, verification, driver details after confirmation, and cancellation clarity.

Admin:

- Verifies profiles, monitors suspicious activity, handles reports, and manages route/city data.

## MVP Features

- Authentication with JWT
- User profile and Aadhaar mock verification
- Driver onboarding and vehicle management
- Ride listing with pickup/drop options and preferences
- Passenger ride search and filters
- Seat booking with available-seat reduction
- Driver accept/reject workflow
- Mock WhatsApp notification logging
- Cancellation with reason tracking
- Ratings and reviews
- Admin verification and moderation panel

## Functional Requirements

Authentication:

- Register, login, refresh token, logout
- OTP endpoints are scaffolded for future SMS provider integration

Verification:

- Aadhaar number is never stored in plain text
- Store masked Aadhaar and encrypted/tokenized Aadhaar value
- Status: pending, verified, rejected
- Ride listing and booking require verified user status

Driver:

- Add profile, license, mobile, WhatsApp, emergency contact
- Add vehicle details and photos
- Create, update, cancel rides
- View bookings and accept/reject requests
- View completed trips and earnings

Passenger:

- Search rides by source, destination, date, time, price, seats, pickup, drop, rating, car type, AC
- View ride details with masked driver contact before confirmation
- Book seats and receive confirmation details
- Cancel booking
- Rate and review driver

Admin:

- View users, rides, bookings, reports, cancellations
- Verify/reject Aadhaar profiles
- Block suspicious users
- Manage city and route data

## Safety Requirements

- Verified badge across driver and passenger cards
- Masked phone numbers until booking confirmation
- Women-only preference support
- Emergency contact field
- Report user option
- Admin moderation
- Cancellation tracking
- Notification log for auditability

## Success Metrics

- Search to booking conversion
- Booking confirmation rate
- Driver acceptance time
- Cancellation rate by route
- Verified users percentage
- Repeat passengers and repeat drivers
- Average ride rating

## Future Features

- Online payments and wallet
- Split fuel cost calculator
- AI route recommendation
- Live location sharing
- In-app chat
- Female-only rides
- Subscriptions
- Referral system
- Dynamic pricing
- Government ID verification API integration
