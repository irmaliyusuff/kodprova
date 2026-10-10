HIDDEN_AUTHOR = "A member"


def public_post(post: dict, hide_names: bool) -> dict:
    """Shape one post for the public feed."""
    if not hide_names:
        return {
            "id": post["id"],
            "author": post["author"],
            "title": post["title"],
            "body": post["body"],
        }
    anonymous = post.get("anonymous") or {}
    return {
        "id": post["id"],
        "author": HIDDEN_AUTHOR,
        "title": anonymous.get("title", post["title"]),
        "body": anonymous.get("body", post["body"]),
    }


def public_feed(posts: list, hide_names: bool, limit: int = 20) -> list:
    """GET /feed: the newest published posts, newest first."""
    published = [post for post in posts if post["published"]]
    published.sort(key=lambda post: post["published_at"], reverse=True)
    return [public_post(post, hide_names) for post in published[:limit]]
