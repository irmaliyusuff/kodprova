"""Test option checks; the testing topic has no proofs."""


def option_a(code):
    assert code.cart_total([]) == 0


def option_b(code):
    assert code.cart_total([1, 2]) == 3


def option_c(code):
    assert code.cart_total([7]) == 7


OPTIONS = {"a": option_a, "b": option_b, "c": option_c}
