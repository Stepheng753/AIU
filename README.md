<div align="center">
  
# 🚀 Interview.ai
**Personal Knowledge & Voice Preservation AI**

[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)](/)

*Interview.ai is a full-stack application designed to interview individuals, capturing their unique knowledge, stories, and expertise to train a personalized AI model.*

---

</div>

## 🌟 Core Identity

Our mission is to preserve human knowledge and personality. Whether it's a parent passing down their life lessons and wisdom to their children, or an expert archiving their technical knowledge, Interview.ai acts as the conversational bridge. 

By conducting high-speed, dynamic interviews via the Gemini Live API, we capture Question & Answer pairs tied directly to a specific user. Ultimately, this isolated data is used to train a custom AI model (and eventually a voice clone) that authentically imitates the interviewed individual.

### 💼 Operational Philosophy
- **Modern App Architecture:** We utilize **Node.js (Express)** for the backend and **React Native (Expo)** for the mobile frontend.
- **Data Persistence & Isolation:** We place a strong emphasis on data privacy. Every interview snippet is securely isolated using PostgreSQL user foreign keys, ensuring your personal AI model is trained strictly on your own knowledge.

---

## 🛠️ Technology Stack

<p align="center">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Gemini_Live_API-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini Live API"/>
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript"/>
</p>

### Key Focus Areas
1. **Knowledge Preservation:** Capturing life stories, advice, and expertise through an intuitive mobile interview interface.
2. **AI Identity Cloning:** Organizing isolated datasets (Q&A pairs) specifically structured to fine-tune future LLMs and TTS models.
3. **High-Speed Audio:** Utilizing WebSockets for bidirectional low-latency audio streaming with the AI interviewer.

---

## 🏗️ Repository Structure

| Directory | Description | Default Port |
| :--- | :--- | :--- |
| **`/interviewer-mobile`** | The React Native (Expo) frontend application. | `localhost:8081` |
| **`/interviewer-backend`** | The Express Node.js backend & BFF proxy. | `localhost:3000` |

---

## 🚀 Running the Development Environment (WSL to Phone)

When developing locally on WSL (Windows Subsystem for Linux) and testing on a physical phone, you must expose your local servers to the internet so your phone can reach them.

### 1. The Backend Tunnel
Because your phone cannot connect to your WSL `localhost`, you must run a public tunnel.

```bash
cd interviewer-backend
npm start
```
In a **new terminal tab**, expose port 3000 to the internet:
```bash
npx localtunnel --port 3000
```
*Note: Localtunnel assigns a random URL every time it restarts. If your tunnel URL changes, you MUST update `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` in `/interviewer-mobile/.env` and restart the mobile app to ensure it points to the new backend.*

### 2. The Mobile App Tunnel
To allow your phone's Expo Go app to reach the Metro Bundler on WSL:
```bash
cd interviewer-mobile
npx expo start --tunnel
```
Scan the QR code and your phone will securely connect to both the Expo dev server and your tunneled backend!

---

## 🌍 Production Deployment Architecture

In a production environment, the brittle tunnel architecture is completely removed:

1. **Backend & Database:** 
   - The Express server is deployed on a dedicated Linux VPS alongside the PostgreSQL database (e.g., via PM2 or Docker).
   - A reverse proxy like Nginx handles SSL certificates and assigns a permanent, public domain name (e.g., `api.interview.ai`).
2. **Mobile Frontend:** 
   - Before compiling the mobile app for the App Store/Play Store, the `/interviewer-mobile/.env` file is permanently pointed to `https://api.interview.ai`.
   - The React Native bundle is compiled into native iOS/Android binaries, meaning it no longer needs the Expo development server or Metro bundler at all.

---

<div align="center">
  <i>Developed and engineered for Interview.ai</i>
</div> 
