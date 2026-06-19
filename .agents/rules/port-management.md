# Port Management Rule

Always close open ports and terminate active listeners when they are no longer needed (such as when development or testing tasks conclude).

## Guidelines for Code Agents:
- **Clean Shutdowns**: Ensure background dev servers (e.g. backend Express instances, frontend Vite servers) are terminated using clean exit hooks or signal traps when a task completes.
- **Release Sockets**: Do not leave processes hanging on network ports (e.g. `3000`, `3001`, `5173`) when finishing work.
- **Port Conflicts**: Before attempting to launch a server on a port, check if that port is already bound, and terminate any leftover orphaned processes using standard clean command options (e.g. `fuser -k <port>/tcp`).
