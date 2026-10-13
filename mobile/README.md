# ResQCommunity Mobile Application

React Native + Expo mobile client for the **Community Emergency Response Platform**.
Communicates directly with the same Django REST Framework backend and PostgreSQL database as the web application.

## Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/client) app installed on your physical Android or iOS device, OR an Android/iOS emulator.

## Running the Mobile App

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Open on device:
   - **Android physical device:** Scan the QR code using the Expo Go app.
   - **Android Emulator:** Press `a` in the terminal (communicates with Django backend on `http://10.0.2.2:8000`).
   - **iOS Simulator:** Press `i` in the terminal.
   - **Web preview:** Press `w` in the terminal.

## Key Features

- **One-Tap Instant SOS:** Emergency broadcast with idempotency key, device GPS coordinates, and zero-form activation.
- **Non-Emergency Neighbor Assistance:** Blue-styled requests for minor falls, wellness checks, or mobility assistance without triggering sirens.
- **Multi-Tier Guardian Alerts:** Real-time push notification handling when ward triggers SOS.
- **Security & Volunteer Routing:** Direct access for security staff and nearby medical volunteers.
