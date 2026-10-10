import sqlite3

SCHEMA = """
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    sent_at TEXT NOT NULL,
    text TEXT NOT NULL
)
"""


def database(rows):
    conn = sqlite3.connect(":memory:")
    conn.execute(SCHEMA)
    conn.executemany(
        "INSERT INTO messages (id, conversation_id, sent_at, text)"
        " VALUES (?, ?, ?, ?)",
        rows,
    )
    return conn


def read_all(code, conn, conversation_id, limit):
    """Follow `next` from the first page to the last; return message ids."""
    seen = []
    after = None
    for _ in range(20):
        page = code.list_messages(conn, conversation_id, limit, after)
        seen.extend(item["id"] for item in page["items"])
        after = page["next"]
        if after is None:
            return seen
    raise AssertionError("paging did not stop")


SAME_SECOND = [
    (1, 7, "2026-10-10T09:00:00Z", "first"),
    (2, 7, "2026-10-10T09:00:00Z", "second"),
    (3, 7, "2026-10-10T09:00:00Z", "third"),
]

DIFFERENT_TIMES = [
    (1, 7, "2026-10-10T09:00:00Z", "first"),
    (2, 7, "2026-10-10T09:05:00Z", "second"),
    (3, 7, "2026-10-10T09:10:00Z", "third"),
    (4, 8, "2026-10-10T09:15:00Z", "other conversation"),
]


def proof_same_time_skipped(code):
    conn = database(SAME_SECOND)
    assert read_all(code, conn, 7, 2) == [3, 2, 1]


# a: The first page with limit 2 holds the two newest messages, newest first.
def option_a(code):
    page = code.list_messages(database(DIFFERENT_TIMES), 7, 2)
    assert [item["id"] for item in page["items"]] == [3, 2]


# b (correct): Paging with limit 2 through three messages sent in the same
# second returns all three, each once.
def option_b(code):
    assert read_all(code, database(SAME_SECOND), 7, 2) == [3, 2, 1]


# c: The last page has `next` set to None.
def option_c(code):
    conn = database(DIFFERENT_TIMES)
    first = code.list_messages(conn, 7, 2)
    last = code.list_messages(conn, 7, 2, first["next"])
    assert last["next"] is None


# d: Messages of another conversation are not returned.
def option_d(code):
    assert 4 not in read_all(code, database(DIFFERENT_TIMES), 7, 2)


PROOFS = {"same-time-skipped": proof_same_time_skipped}

OPTIONS = {"a": option_a, "b": option_b, "c": option_c, "d": option_d}
