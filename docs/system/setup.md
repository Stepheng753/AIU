# Setup Guide

This guide provides instructions to set up the development environment for **AIU** using a React + TypeScript web app and a Node.js + SQLite backend.

---

## Prerequisites

- **Node.js**: Version 18.x or higher is recommended.
- **npm**: Installed automatically with Node.js.
- **SQLite3**: The backend utilizes the native `sqlite3` driver which creates a local file database. No separate database server installation is required.

---

## 1. Environment Configurations

Both frontend and backend packages require local environment configurations. Templates are provided as `.env.template` files in their respective folders.

### Backend Configurations
Create a file at `/aiu-backend/.env` matching the template:
```env
PORT=3000
DATABASE_PATH="./aiu.db"
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend Configurations
Create a file at `/aiu-web/.env` matching the template:
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

---

## 2. Backend Setup & Run

1. Navigate to the backend directory:
   ```bash
   cd aiu-backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Note: On first boot, the server will automatically initialize an SQLite database file named `aiu.db` in the backend root directory.*

---

## 3. Frontend Web Setup & Run

1. Navigate to the frontend directory:
   ```bash
   cd aiu-web
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at `http://localhost:5173`.

---

## 3.5 Quick Run (Both Servers Concurrently)

Alternatively, you can boot both servers concurrently from the root directory using the helper script:
```bash
./scripts/start_dev_web.sh
```
Press `Ctrl+C` inside the terminal to terminate both servers cleanly.

---

## 4. Run Tests

### Run All Tests Concurrently
You can execute both test suites together from the root directory using the helper script:
```bash
./scripts/run_tests.sh
```

### Backend Tests (Jest)
From `aiu-backend/`:
```bash
npm run test
```

### Frontend Tests (Vitest)
From `aiu-web/`:
```bash
npm run test
```

---

## 5. Mobile App Setup (React Native + Expo)

The mobile client is built using React Native and Expo. Because of network virtualization sandbox boundaries (like WSL Mirrored Mode) and local Wi-Fi router AP isolation, we utilize **Tailscale** for peer-to-peer connection routing.

### Prerequisites

1. **Expo Go**: Download the "Expo Go" application from the Apple App Store or Google Play Store on your testing mobile device.
2. **Tailscale VPN**: Install Tailscale on your host computer (and ensure WSL is authenticated) and your mobile device. Join both to the same Tailnet.
   - Host Computer Alias: `stephen-windows` (IP: `100.67.12.101`)

### 1. Environment Configurations

Create a local configuration file at `/aiu-mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://stephen-windows:3000/api
EXPO_PUBLIC_WS_URL=ws://stephen-windows:3000
```
*Note: If Tailscale MagicDNS fails to resolve the alias on your mobile device, fall back to using the raw IP: `http://100.67.12.101:3000/api`.*

### 2. Backend binding config

When booting your backend development server, ensure it is configured to bind to `0.0.0.0` (all interfaces) rather than `127.0.0.1` so that it listens on your Tailscale interface.

### 3. Installation & Boot

1. Navigate to the mobile directory:
   ```bash
   cd aiu-mobile
   ```
2. Install npm dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Boot the Metro Bundler:
   You can run the launcher script directly from the root directory:
   ```bash
   ./scripts/start_dev_mobile.sh
   ```
   *(Or navigate into `aiu-mobile/` and run `npm run start`)*
4. Scan the QR code displayed in your terminal using the camera app (iOS) or the Expo Go app (Android) to load the application. Both your phone and computer must be signed into your Tailscale network.


