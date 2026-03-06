Develop a functional Android Proof of Concept (PoC) application that:

Allows elderly users to trigger SOS alerts

Sends emergency notifications to registered volunteers

Uses Aadhaar OTP-based verification for volunteers

Deploys backend on cloud

Delivers production-ready APK

No admin panel in Phase 1.

2️⃣ APP STRUCTURE
Single Android application with role selection:

“Elder User”

“Volunteer”

Shared backend.

3️⃣ ELDER USER MODULE
3.1 Registration & Profile
Fields:

Full Name

Phone Number (OTP verification required)

One Emergency Contact Name

One Emergency Contact Number

Features:

Profile creation

Basic edit/update functionality

3.2 SOS Emergency Button
Single large SOS button.

On click:

Trigger phone call to emergency contact

Send SMS with:

Elder name

Google Maps live location link

Send push notification to all verified volunteers

Location:

Real-time GPS capture at time of trigger

If GPS disabled → prompt user to enable

4️⃣ VOLUNTEER MODULE
4.1 Registration
Fields:

Full Name

Phone Number (OTP verification required)

Aadhaar Number

4.2 Aadhaar Verification
OTP-based Aadhaar verification

No biometric authentication

Aadhaar stored masked (only last 4 digits visible)

Aadhaar encrypted in database

Auto-activation after successful OTP verification

No manual approval process

4.3 SOS Notification (Volunteer Side)
When SOS is triggered:

Push notification containing:

Elder Name

Phone number

Location link

Volunteer screen should display:

Elder name

Call button

“Open in Maps” button

No chat system.
No response tracking.
No rating system.

5️⃣ BACKEND REQUIREMENTS
Backend must support:

User registration (Elder & Volunteer)

Phone OTP verification

Aadhaar OTP verification

SOS trigger endpoint

Push notification dispatch

Secure database storage

6️⃣ DATABASE STRUCTURE (MINIMUM)
Tables required:

Elders
id

name

phone

emergency_contact_name

emergency_contact_number

created_at

Volunteers
id

name

phone

aadhaar_masked

is_verified

created_at

SOS Logs
id

elder_id

latitude

longitude

timestamp

No analytics system required.

7️⃣ PUSH NOTIFICATION SYSTEM
Use Firebase Cloud Messaging (FCM)

Store volunteer device tokens

Broadcast SOS to all verified volunteers

8️⃣ SECURITY REQUIREMENTS
Aadhaar encrypted at rest

HTTPS enabled

API keys stored securely

Input validation on all forms

No full Aadhaar visible anywhere in app

9️⃣ UI REQUIREMENTS
Max screens: 5–6 total

Required screens:

Role Selection

Elder Registration/Profile

Elder SOS Screen

Volunteer Registration

Volunteer Home

SOS Alert Display Screen

Design requirements:

Large buttons

High contrast layout

Minimal text

Senior-friendly usability

🔟 DEPLOYMENT REQUIREMENTS
Developer must deliver:

Signed production APK

Backend deployed on live cloud server

SSL configured

Push notifications working

Database configured

Basic documentation for setup

