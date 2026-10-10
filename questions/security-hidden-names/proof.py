NAME = "Jordan Lee"

OLDER = {
    "id": 1,
    "author": "Sam Park",
    "title": "Sam Park ran the spring workshop",
    "body": "Thanks to Sam Park for the slides.",
    "anonymous": {
        "title": "A member ran the spring workshop",
        "body": "Thanks to the member who made the slides.",
    },
    "published": True,
    "published_at": "2026-09-01T10:00:00Z",
}

NEWER = {
    "id": 2,
    "author": NAME,
    "title": f"Welcome, {NAME}",
    "body": f"{NAME} joins the team this week.",
    "published": True,
    "published_at": "2026-10-01T10:00:00Z",
}

DRAFT = {**OLDER, "id": 3, "published": False}


def texts(feed):
    return " ".join(str(value) for item in feed for value in item.values())


def proof_name_fallback(code):
    feed = code.public_feed([OLDER, NEWER], hide_names=True)
    assert NAME not in texts(feed), "a hidden name appears in the feed"


# a: With names shown, the author's name is in the feed.
def option_a(code):
    feed = code.public_feed([OLDER, NEWER], hide_names=False)
    assert NAME in [item["author"] for item in feed]


# b: With names hidden, every post in the feed has "A member" as author.
def option_b(code):
    feed = code.public_feed([OLDER, NEWER], hide_names=True)
    assert feed and all(item["author"] == "A member" for item in feed)


# c (correct): With names hidden, a post without an anonymous version puts
# its author's name nowhere in the feed.
def option_c(code):
    feed = code.public_feed([OLDER, NEWER], hide_names=True)
    assert NAME not in texts(feed)


# d: Unpublished posts are not in the feed.
def option_d(code):
    feed = code.public_feed([OLDER, DRAFT], hide_names=False)
    assert [item["id"] for item in feed] == [1]


PROOFS = {"name-fallback": proof_name_fallback}

OPTIONS = {"a": option_a, "b": option_b, "c": option_c, "d": option_d}
