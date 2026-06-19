# Manual Test: Fresh User Onboarding

This test validates registering a new user, logging in, starting an interview, interacting via voice, and verifying SQLite database persistence.

---

## Prerequisites
Ensure both the backend server and frontend Vite server are running. 
See the **[Setup Guide](file:///home/stepheng753/Development/Interviewer/documentation/system/setup.md)** for details.

---

## Action Steps

### Step 1: User Registration
1. Open your browser and navigate to `http://localhost:5173`.
2. Locate the "Register here" link on the login card and click it.
3. Fill out the form fields:
   - **Display Name**: `Alice Test`
   - **Email**: `alice@test.com`
   - **Password**: `password123`
4. Click **Register Account**. Verify that the web app successfully redirects you to the login screen.

### Step 2: First-Time Authentication
1. On the login screen, enter:
   - **Email**: `alice@test.com`
   - **Password**: `password123`
2. Click **Log In**.
3. Verify that you are redirected to the main **AI Interview Console** and that the history panel in the sidebar is empty.

### Step 3: Active Voice Session
1. Click the **Microphone Toggle button** (represented by the mic-off icon).
2. Approve browser microphone access when prompted.
3. Observe the header:
   - The status indicator must change from `Disconnected` to `Connecting` and then to `Connected` (green glow).
   - The AI interviewer greeting should play through your speaker.
   - The greeting transcript must appear as a chat bubble on the screen.
4. Speak a response clearly (e.g., "Hi! I am Alice. I want to save my wisdom on development.").
5. Verify that:
   - The mic recording status updates and shows wave bars animating.
   - The AI responds with a logical follow-up question.
   - The dialogue transcripts continue to scroll and append.
6. Click the **Microphone Toggle button** to end the session. The status must return to `Disconnected`.

### Step 4: Verify DB Storage
1. Refresh the web page.
2. Confirm you remain logged in and that the question-and-answer exchanges from the session are successfully listed in the sidebar history log.
3. (Optional) Run the sqlite3 console tool to inspect the records:
   ```bash
   sqlite3 interviewer-backend/interviewer.db "SELECT * FROM qa_pairs;"
   ```
   Verify that the questions and responses match Alice's session.
