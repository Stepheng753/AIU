# Documentation Updates Rule

Always update the corresponding documentation files whenever modifying code structures, adding new modules, changing API/Socket schemas, database designs, or setting up new execution routines.

## Guidelines for Code Agents:
- **Keep System Guides Sync'd**: When modifying routes, databases, or communication parameters, update their corresponding guides in the `documentation/system/` directory (e.g. `setup.md`, `database_schema.md`, `bff_websocket.md`) alongside the code change.
- **Index Reference Links**: Verify that the root `README.md` index links match the current directory locations and file names of all documentation guides and skills.
- **Document Changes in Walkthrough**: Maintain a current trace of implemented code blocks, dependencies, and verification runs inside the walkthrough artifact at the end of each task.
