# Agent Test: Onboarding and Authentication E2E Check

This specification defines the instructions for an AI agent to automatically test user registration, redirection, and dashboard login.

---

## E2E Test Sequence

1. **Launch Browser**: Open the browser subagent and navigate to the local Vite web app URL:
   `http://127.0.0.1:5173/`

2. **Verify Landing Page**:
   - Locate the main logo containing the text `Interview.ai`.
   - Confirm that the inputs for Email and Password are visible.

3. **Navigate to Registration**:
   - Locate and click on the anchor link containing the text `Register here`.
   - Confirm the view changes: an input field with the placeholder `John Doe` (Display Name) must become visible.

4. **Register a Test User**:
   - Type a random name (e.g. `Agent Tester`) into the name input.
   - Type a unique test email (e.g. `agent.test@test.com`) into the email input.
   - Type `password123` into the password input.
   - Click the submit button with the text `Register Account`.

5. **Authenticate and Log In**:
   - Confirm the page automatically redirects back to the login screen.
   - Type the registered email (`agent.test@test.com`) into the email input.
   - Type `password123` into the password input.
   - Click the submit button with the text `Log In`.

6. **Validate Dashboard State**:
   - Verify the dashboard layout renders the header: `AI Interview Console`.
   - Verify the sidebar lists the user profile section in the bottom-left.
