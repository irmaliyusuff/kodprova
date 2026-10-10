import re

PRICE = re.compile(r"[0-9]{1,6}(\.[0-9]{1,2})?")
MAX_NAME_LENGTH = 100


def parse_price(value: object) -> int | None:
    """Turn a price string such as "19.99" into integer cents."""
    if not isinstance(value, str) or not PRICE.fullmatch(value.strip()):
        return None
    return round(float(value) * 100)


def create_product(body: dict, save) -> tuple[int, dict]:
    """POST /products: check the body, store the product and answer."""
    name = body.get("name")
    if not isinstance(name, str) or not name.strip():
        return 400, {"error": "invalid_name"}
    name = name.strip()
    if len(name) > MAX_NAME_LENGTH:
        return 400, {"error": "invalid_name"}
    price = parse_price(body.get("price"))
    if price is None:
        return 400, {"error": "invalid_price"}
    product_id = save(name, price)
    return 201, {"id": product_id, "name": name, "price_cents": price}
