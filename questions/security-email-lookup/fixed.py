import sqlite3

MAX_EMAIL_LENGTH = 254


def find_account(conn: sqlite3.Connection, email: str) -> dict | None:
    """Look up an account for the "forgot password" endpoint.

    Returns the account's id and email, or None if no account matches.
    """
    email = email.strip().lower()
    if not email or len(email) > MAX_EMAIL_LENGTH:
        return None
    row = conn.execute(
        "SELECT id, email FROM accounts WHERE email = ?", (email,)
    ).fetchone()
    if row is None:
        return None
    return {"id": row[0], "email": row[1]}
