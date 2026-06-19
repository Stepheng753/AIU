# Agent Test: Voice Handshake E2E Check

This specification defines the instructions for an AI agent to verify the live WebSocket proxy connection to the backend.

---

## E2E Test Sequence

1. **Prerequisite**: Log in to the application and navigate to the dashboard `http://127.0.0.1:5173/`.

2. **Handshake Verification**:
   - Locate the status container in the header. Confirm it reads `disconnected` by default.
   - Click the Microphone Toggle button (the large round button at the bottom of the page).

3. **Status Check**:
   - Verify that the status container text changes to `connecting` or `connected`.
   - Verify that the toggle button gains the `active` CSS class (representing the unmuted microphone state).

4. **Session Termination**:
   - Click the Microphone Toggle button again.
   - Verify that the status indicator returns to `disconnected`.
