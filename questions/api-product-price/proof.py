def memory_save():
    saved = []

    def save(name, price_cents):
        saved.append((name, price_cents))
        return len(saved)

    return save, saved


def proof_cents_truncated(code):
    save, saved = memory_save()
    status, _ = code.create_product({"name": "Mug", "price": "19.99"}, save)
    assert status == 201
    assert saved == [("Mug", 1999)], f"stored {saved}"


# a: "12.50" becomes 1250 cents.
def option_a(code):
    assert code.parse_price("12.50") == 1250


# b (correct): "19.99" becomes 1999 cents.
def option_b(code):
    assert code.parse_price("19.99") == 1999


# c: A price with three decimals is rejected.
def option_c(code):
    assert code.parse_price("1.999") is None


# d: A name made only of spaces answers 400.
def option_d(code):
    save, saved = memory_save()
    status, _ = code.create_product({"name": "   ", "price": "5"}, save)
    assert status == 400
    assert saved == []


PROOFS = {"cents-truncated": proof_cents_truncated}

OPTIONS = {"a": option_a, "b": option_b, "c": option_c, "d": option_d}
