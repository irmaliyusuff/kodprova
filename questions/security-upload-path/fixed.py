import os

UPLOAD_ROOT = os.path.realpath("uploads")


def resolve_upload(name: str, root: str = UPLOAD_ROOT) -> str | None:
    """Return the absolute path for a requested upload.

    Returns None when the name is empty or points outside the upload root.
    """
    if not name or "\x00" in name:
        return None

    root = os.path.realpath(root)
    candidate = os.path.realpath(os.path.join(root, name))
    if not candidate.startswith(root + os.sep):
        return None

    return candidate
