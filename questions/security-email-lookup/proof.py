import sqlite3


def database():
    conn = sqlite3.connect(":memory:")
    conn.execute(
        "CREATE TABLE accounts (id INTEGER PRIMARY KEY, email TEXT UNIQUE)"
    )
    conn.executemany(
        "INSERT INTO accounts (id, email) VALUES (?, ?)",
        [(1, "alice@example.com"), (2, "bob@example.com")],
    )
    return conn


QUOTED = "nobody@example.com' OR '1'='1"


def proof_query_built_from_input(code):
    assert code.find_account(database(), QUOTED) is None


# a: An existing email returns that account.
def option_a(code):
    account = code.find_account(database(), "bob@example.com")
    assert account == {"id": 2, "email": "bob@example.com"}


# b: An email with no account returns None.
def option_b(code):
    assert code.find_account(database(), "carol@example.com") is None


# c (correct): An email containing quotes and OR returns None.
def option_c(code):
    assert code.find_account(database(), QUOTED) is None


# d: Spaces and capital letters are ignored.
def option_d(code):
    account = code.find_account(database(), "  Alice@Example.com ")
    assert account is not None and account["id"] == 1


PROOFS = {"query-built-from-input": proof_query_built_from_input}

OPTIONS = {"a": option_a, "b": option_b, "c": option_c, "d": option_d}
