# SQLite Database Schema

For local development, AIU utilizes an **SQLite** database file (`aiu.db`) managed by the Node.js backend.

---

## 1. Tables Definition

### `users`
Stores user profile information and credentials.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique user identifier. |
| `name` | `TEXT` | `NOT NULL` | The user's display name. |
| `email` | `TEXT` | `UNIQUE NOT NULL` | The user's email address (normalized to lowercase). |
| `password_hash` | `TEXT` | `NOT NULL` | Bcrypt-hashed password. |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Registration timestamp. |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Last profile update timestamp. |

#### DDL Statement:
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### `qa_pairs`
Stores individual question-and-answer interaction blocks capturing user knowledge.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique QA pair identifier. |
| `user_id` | `INTEGER` | `REFERENCES users(id) ON DELETE CASCADE` | Associated user. |
| `question` | `TEXT` | `NOT NULL` | The question asked by the AI. |
| `answer` | `TEXT` | `NOT NULL` | The answer spoken by the user. |
| `category` | `TEXT` | | Category track of the interview (`career`, `life_advice`, `family`, `health`). |
| `timestamp` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Save timestamp. |

#### DDL Statement:
```sql
CREATE TABLE IF NOT EXISTS qa_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Integrity & Cascades

- **On Delete Cascade**: Removing a user from the `users` table automatically deletes all associated QA pairs in `qa_pairs`, ensuring privacy and strict user isolation.
- **SQLite Configuration**: Foreign keys must be enabled on every SQLite database connection by executing:
  ```sql
  PRAGMA foreign_keys = ON;
  ```
- **Automatic Migration**: The backend dynamically checks the schema on boot and applies a schema patch via `ALTER TABLE` to add the `category` column to existing database files if it is missing.

---

## 3. Inspecting the Database via CLI

To inspect the SQLite database file (`aiu.db`) directly from your server's terminal:

1. **SSH into the server and run `sqlite3`**:
   ```bash
   sqlite3 ~/Development/AIU/aiu-backend/aiu.db
   ```
   *(If not installed, run: `sudo apt update && sudo apt install sqlite3`)*

2. **Configure clean column/box formatting**:
   ```sql
   .headers on
   .mode box
   ```

3. **Useful Shell Commands**:
   * **List tables**: `.tables`
   * **Show schema of a table**: `.schema <table_name>`
   * **Query rows (always end with a semicolon `;`)**:
     ```sql
     SELECT * FROM users LIMIT 5;
     SELECT * FROM qa_pairs ORDER BY timestamp DESC LIMIT 5;
     ```
   * **Exit SQLite shell**: `.exit`

