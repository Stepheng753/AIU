# Manual Test: Existing User Account Flow

This test validates logging in with an existing user, loading saved QA history, starting a new interview, and checking database persistence.

---

## Prerequisites
This test assumes that the database already contains a user profile (e.g. `alice@test.com` with password `password123` created in **[Manual Test: Fresh User Onboarding](file:///home/stepheng753/Development/Interviewer/documentation/testing/manual/fresh-user-onboarding.md)**).

---

## Action Steps

### Step 1: Authentication
1. Open the browser and go to `http://localhost:5173`.
2. Enter the existing user credentials:
   - **Email**: `alice@test.com`
   - **Password**: `password123`
3. Click **Log In**.
4. Verify you are redirected to the dashboard and that the left-hand sidebar lists the QA history entries recorded in past sessions.

### Step 2: Context Resumption
1. Click the **Microphone Toggle button**.
2. Speak a response clearly to verify the AI interviewer picks up the conversation and responds contextually.
3. Click the **Microphone Toggle button** to stop the session.
4. Verify the new dialogue turns are appended to the sidebar list in real-time.
