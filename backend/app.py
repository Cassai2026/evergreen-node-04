"""
Evergreen Node 04 — Flask REST API
Sovereign Digital Storefront & Logistics Node

Designed to run on a local AMD Threadripper edge node (LILIETH Kernel).
Provides REST endpoints for the frontend storefront and junior-dev module.

UK R&D Tax Relief — Experimental Development Evidence
"""

import logging
from flask import Flask, jsonify, request, abort
from flask_cors import CORS

import jarvis_database as db

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO, format="[NODE04] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow the local frontend to call the API

# Initialise schema and seed data on startup
db.initialise_schema()
db.seed_menu()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "node": "SOVEREIGN_NODE_04",
        "signal": "ACTIVE_SIGNAL",
        "message": "Evergreen Node 04 — LILIETH Kernel — Online"
    })


# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

@app.route("/api/menu", methods=["GET"])
def list_menu():
    category = request.args.get("category")
    available_only = request.args.get("available_only", "false").lower() == "true"
    items = db.get_all_menu_items(category=category, available_only=available_only)
    return jsonify({"items": items, "total": len(items)})


@app.route("/api/menu/<int:item_id>", methods=["GET"])
def get_menu_item(item_id):
    item = db.get_menu_item(item_id)
    if not item:
        abort(404, description="Menu item not found")
    return jsonify(item)


@app.route("/api/menu", methods=["POST"])
def create_menu_item():
    data = request.get_json(force=True)
    required = ("name", "category", "price")
    for field in required:
        if field not in data:
            abort(400, description=f"Missing required field: {field}")

    try:
        price = float(data["price"])
    except (ValueError, TypeError):
        abort(400, description="price must be a number")

    item_id = db.create_menu_item(
        name=data["name"],
        description=data.get("description", ""),
        category=data["category"],
        price=price,
        image_url=data.get("image_url"),
    )
    item = db.get_menu_item(item_id)
    return jsonify(item), 201


@app.route("/api/menu/<int:item_id>", methods=["PUT"])
def update_menu_item(item_id):
    if not db.get_menu_item(item_id):
        abort(404, description="Menu item not found")
    data = request.get_json(force=True)
    updated = db.update_menu_item(item_id, **data)
    if not updated:
        abort(400, description="No valid fields provided for update")
    return jsonify(db.get_menu_item(item_id))


@app.route("/api/menu/<int:item_id>", methods=["DELETE"])
def delete_menu_item(item_id):
    if not db.get_menu_item(item_id):
        abort(404, description="Menu item not found")
    db.delete_menu_item(item_id)
    return jsonify({"message": "Item deleted", "id": item_id})


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

@app.route("/api/inventory", methods=["GET"])
def list_inventory():
    inventory = db.get_inventory()
    return jsonify({"inventory": inventory, "total": len(inventory)})


@app.route("/api/inventory/<int:menu_item_id>", methods=["PUT"])
def update_inventory(menu_item_id):
    data = request.get_json(force=True)
    if "quantity" not in data:
        abort(400, description="Missing required field: quantity")
    try:
        quantity = int(data["quantity"])
    except (ValueError, TypeError):
        abort(400, description="quantity must be an integer")
    if quantity < 0:
        abort(400, description="quantity cannot be negative")
    updated = db.update_inventory(menu_item_id, quantity)
    if not updated:
        abort(404, description="Inventory record not found")
    return jsonify({"message": "Inventory updated", "menu_item_id": menu_item_id, "quantity": quantity})


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

@app.route("/api/orders", methods=["GET"])
def list_orders():
    orders = db.get_orders()
    return jsonify({"orders": orders, "total": len(orders)})


@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.get_json(force=True)
    items = data.get("items", [])
    if not items:
        abort(400, description="Order must contain at least one item")

    for item in items:
        if "menu_item_id" not in item or "quantity" not in item:
            abort(400, description="Each item must have menu_item_id and quantity")
        try:
            item["quantity"] = int(item["quantity"])
            item["menu_item_id"] = int(item["menu_item_id"])
        except (ValueError, TypeError):
            abort(400, description="menu_item_id and quantity must be integers")
        if item["quantity"] < 1:
            abort(400, description="Item quantity must be at least 1")

    try:
        order_id = db.create_order(
            customer_name=data.get("customer_name", "Guest"),
            customer_note=data.get("customer_note", ""),
            items=items,
        )
    except ValueError as exc:
        abort(400, description=str(exc))

    return jsonify({"message": "Order placed", "order_id": order_id}), 201


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad Request", "message": str(e.description)}), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not Found", "message": str(e.description)}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal Server Error", "message": "Something went wrong on the edge node"}), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os
    flask_env = os.environ.get("FLASK_ENV", "production")
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1" and flask_env != "production"
    if debug_mode:
        logger.warning("DEBUG mode is ON — do not use in production")
    logger.info("Starting Evergreen Node 04 API — SOVEREIGN_NODE_04 [ACTIVE_SIGNAL]")
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
