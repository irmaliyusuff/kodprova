"""Tests for cart_total(prices): the sum of the prices, in cents."""


def make_prices():
    return [500, 250, 125]


def test_empty_cart(code):
    assert code.cart_total([]) == 0


def test_several_items(code):
    assert code.cart_total(make_prices()) == 875


def test_leaves_prices_unchanged(code):
    prices = make_prices()
    code.cart_total(prices)
    assert prices == make_prices()
