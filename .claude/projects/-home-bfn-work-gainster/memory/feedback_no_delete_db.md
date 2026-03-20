---
name: Do not delete gainster-db
description: Never delete the gainster-db database file — it contains persistent user data
type: feedback
---

Do not delete the `gainster-db` file (or whatever `GAINSTER_DB_PATH` points to). It is the persistent SQLite database.

**Why:** It holds real user data (watchlist, candles, etc.). Deleting it means data loss.

**How to apply:** During cleanup tasks, leave `gainster-db` alone. It's gitignored, so it won't interfere with commits. Only the temporary test script and build artifacts should be cleaned up.
