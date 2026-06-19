# Agent Skill: Automated Browser E2E Testing

This guide instructs AI agents on how to execute automated browser E2E tests for registration, login, and voice socket connection verification using browser preview tools.

---

## 1. Automated Execution Instructions

When tasked with verifying E2E system flows:

1. **Locate Test Specs**: Scan the directory `documentation/testing/agent/` for test files (e.g. `test1.md`, `test2.md`).
2. **Launch Dev Servers**:
   - Ensure the backend server is listening on port `3001`.
   - Ensure the Vite dev server is running on port `5173`.
3. **Execute via Subagent**: Call the `browser_subagent` tool. In the `Task` description, copy and paste the E2E verification steps described in `documentation/testing/agent/test1.md` or `test2.md`.
4. **Analyze Results**: Read the DOM content and examine the subagent report.
5. **Report Status**: Return a detailed success or error log summarizing the state of the interface elements and network handshakes.

---

## 2. Browser Interactive Controls Cheat Sheet

Use these selectors and labels when instructing the browser subagent:

| Element | Identification / Selector | Expected Action / Result |
| :--- | :--- | :--- |
| **Email Input** | `placeholder="you@domain.com"` | Type test email |
| **Password Input** | `placeholder="••••••••"` | Type test password |
| **Display Name Input** | `placeholder="John Doe"` | Type display name |
| **Submit Button** | button text `Log In` / `Register Account` | Click to submit |
| **Mic Toggle Button** | Class `.mic-toggle-btn` / title `Unmute Session` | Click to trigger socket handshake |
| **Status Dot** | Class `.status-dot` (gains class `connected`) | Confirms live connection |
