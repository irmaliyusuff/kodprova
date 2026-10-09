import os
import tempfile

# The folder does not need to exist: resolve_upload only works on paths.
ROOT = os.path.join(tempfile.gettempdir(), "proof-gate", "uploads")


def proof_sibling_prefix(code):
    assert code.resolve_upload("../uploads-old/a.txt", ROOT) is None


# a: A plain file name resolves to a path inside the root.
def option_a(code):
    expected = os.path.join(os.path.realpath(ROOT), "report.pdf")
    assert code.resolve_upload("report.pdf", ROOT) == expected


# b (correct): A name that reaches a sibling folder is rejected.
def option_b(code):
    assert code.resolve_upload("../uploads-old/a.txt", ROOT) is None


# c: A name that climbs to the parent folder is rejected.
def option_c(code):
    assert code.resolve_upload("../secret.txt", ROOT) is None


# d: An absolute path is rejected.
def option_d(code):
    assert code.resolve_upload("/etc/passwd", ROOT) is None


PROOFS = {"sibling-prefix": proof_sibling_prefix}

OPTIONS = {"a": option_a, "b": option_b, "c": option_c, "d": option_d}
