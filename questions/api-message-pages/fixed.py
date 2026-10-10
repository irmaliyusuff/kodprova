import sqlite3

SELECT = "SELECT id, sent_at, text FROM messages WHERE conversation_id = ?"


def list_messages(
    conn: sqlite3.Connection,
    conversation_id: int,
    limit: int,
    after: tuple[str, int] | None = None,
) -> dict:
    """GET /conversations/<id>/messages: newest first, one page at a time.

    `after` is the `next` value of the previous page (None on the first
    page). `next` is None when there are no older messages.
    """
    sql = SELECT
    params: list = [conversation_id]
    if after is not None:
        sql += " AND (sent_at < ? OR (sent_at = ? AND id < ?))"
        params.extend([after[0], after[0], after[1]])
    sql += " ORDER BY sent_at DESC, id DESC LIMIT ?"
    params.append(limit + 1)
    rows = conn.execute(sql, params).fetchall()

    page = rows[:limit]
    items = [{"id": r[0], "sent_at": r[1], "text": r[2]} for r in page]
    has_more = len(rows) > limit
    next_value = (page[-1][1], page[-1][0]) if has_more else None
    return {"items": items, "next": next_value}
