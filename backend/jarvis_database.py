"""
JARVIS Database Handler — Sovereign Node 04
Evergreen Stretford Digital Storefront & Logistics Node

Manages SQLite (default) or PostgreSQL connections for:
  - Menu items (100+ items seeded on first run)
  - Inventory tracking
  - Order history

UK R&D Tax Relief — Experimental Development Evidence
"""

import os
import sqlite3
import logging
from contextlib import contextmanager
from typing import Optional

logging.basicConfig(level=logging.INFO, format="[JARVIS] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL", "")
DB_PATH = os.environ.get("SQLITE_PATH", os.path.join(os.path.dirname(__file__), "jarvis.db"))

USE_POSTGRES = DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres")


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------

def _get_sqlite_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    """Context manager that yields a database connection and cursor."""
    if USE_POSTGRES:
        try:
            import psycopg2
            import psycopg2.extras
            conn = psycopg2.connect(DATABASE_URL)
            conn.autocommit = False
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            try:
                yield conn, cur
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cur.close()
                conn.close()
        except ImportError:
            logger.warning("psycopg2 not installed — falling back to SQLite")
            conn = _get_sqlite_connection()
            cur = conn.cursor()
            try:
                yield conn, cur
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()
    else:
        conn = _get_sqlite_connection()
        cur = conn.cursor()
        try:
            yield conn, cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


# ---------------------------------------------------------------------------
# Schema creation
# ---------------------------------------------------------------------------

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT NOT NULL,
    price       REAL NOT NULL,
    image_url   TEXT,
    available   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id  INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity      INTEGER NOT NULL DEFAULT 0,
    unit          TEXT NOT NULL DEFAULT 'units',
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_note TEXT,
    status       TEXT NOT NULL DEFAULT 'pending',
    total        REAL NOT NULL DEFAULT 0.0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    quantity     INTEGER NOT NULL DEFAULT 1,
    unit_price   REAL NOT NULL
);
"""


def initialise_schema():
    """Create all tables if they do not already exist."""
    with get_db() as (conn, cur):
        for statement in SCHEMA_SQL.strip().split(";"):
            stmt = statement.strip()
            if stmt:
                cur.execute(stmt)
    logger.info("Schema initialised.")


# ---------------------------------------------------------------------------
# Seed data — 100+ menu items across multiple categories
# ---------------------------------------------------------------------------

SEED_MENU_ITEMS = [
    # ---- Hot Drinks ----
    ("Americano", "Bold espresso with hot water", "Hot Drinks", 2.50),
    ("Flat White", "Double ristretto with steamed milk", "Hot Drinks", 3.00),
    ("Latte", "Espresso with velvety steamed milk", "Hot Drinks", 2.90),
    ("Cappuccino", "Equal parts espresso, steamed milk, foam", "Hot Drinks", 2.90),
    ("Espresso", "Single shot, intensely rich", "Hot Drinks", 1.80),
    ("Double Espresso", "Two shots, double intensity", "Hot Drinks", 2.20),
    ("Macchiato", "Espresso stained with a dash of milk foam", "Hot Drinks", 2.20),
    ("Mocha", "Espresso, chocolate sauce, steamed milk", "Hot Drinks", 3.20),
    ("Hot Chocolate", "Rich Belgian chocolate blend", "Hot Drinks", 2.80),
    ("English Breakfast Tea", "Classic black tea, builders strength", "Hot Drinks", 1.80),
    ("Earl Grey Tea", "Bergamot-infused black tea", "Hot Drinks", 1.80),
    ("Green Tea", "Delicate Japanese sencha", "Hot Drinks", 1.80),
    ("Peppermint Tea", "Cool and refreshing herbal infusion", "Hot Drinks", 1.80),
    ("Chai Latte", "Spiced masala tea with steamed milk", "Hot Drinks", 3.00),
    ("Turmeric Latte", "Golden milk with ginger and cinnamon", "Hot Drinks", 3.00),
    # ---- Cold Drinks ----
    ("Iced Latte", "Espresso over ice with cold milk", "Cold Drinks", 3.20),
    ("Iced Americano", "Espresso over ice with cold water", "Cold Drinks", 2.70),
    ("Cold Brew", "12-hour cold-steeped smooth coffee", "Cold Drinks", 3.50),
    ("Iced Matcha Latte", "Ceremonial matcha with cold oat milk", "Cold Drinks", 3.80),
    ("Lemonade", "Freshly squeezed with sugar syrup", "Cold Drinks", 2.50),
    ("Mango Lassi", "Yoghurt-based mango smoothie", "Cold Drinks", 3.00),
    ("Strawberry Milkshake", "Thick and creamy strawberry blend", "Cold Drinks", 3.50),
    ("Vanilla Milkshake", "Classic vanilla soft-serve shake", "Cold Drinks", 3.50),
    ("Chocolate Milkshake", "Rich chocolate ice cream shake", "Cold Drinks", 3.50),
    ("Still Water (500ml)", "Chilled still mineral water", "Cold Drinks", 1.20),
    ("Sparkling Water (500ml)", "Chilled sparkling mineral water", "Cold Drinks", 1.20),
    ("Orange Juice (fresh)", "Freshly pressed Valencia oranges", "Cold Drinks", 2.80),
    ("Apple Juice (carton)", "100% pressed apple juice", "Cold Drinks", 1.80),
    ("Coke (330ml)", "Ice cold Coca-Cola", "Cold Drinks", 1.80),
    ("Diet Coke (330ml)", "Ice cold Diet Coca-Cola", "Cold Drinks", 1.80),
    # ---- Breakfast ----
    ("Full English Breakfast", "Bacon, eggs, sausage, beans, toast, mushrooms", "Breakfast", 7.50),
    ("Veggie Breakfast", "Eggs, halloumi, beans, tomatoes, mushrooms, toast", "Breakfast", 6.50),
    ("Eggs on Toast", "Two poached eggs on sourdough", "Breakfast", 4.50),
    ("Avocado on Toast", "Smashed avo on sourdough, chilli flakes", "Breakfast", 5.50),
    ("Bacon Butty", "Back bacon in a soft white bap", "Breakfast", 3.50),
    ("Sausage Butty", "Two pork sausages in a soft bap", "Breakfast", 3.50),
    ("Egg Butty", "Fried egg in a soft white bap", "Breakfast", 3.00),
    ("Porridge", "Thick rolled oats with honey and berries", "Breakfast", 3.50),
    ("Granola Bowl", "Oat granola, yoghurt, seasonal fruit", "Breakfast", 4.50),
    ("Pancakes (stack of 3)", "American-style with maple syrup and butter", "Breakfast", 5.50),
    ("French Toast", "Brioche dipped in custard, pan-fried, served with fruit", "Breakfast", 5.50),
    ("Croissant (plain)", "Buttery, flaky French-style croissant", "Breakfast", 2.50),
    ("Croissant (almond)", "Filled with frangipane and flaked almonds", "Breakfast", 3.00),
    ("Pain au Chocolat", "Buttery pastry with dark chocolate centre", "Breakfast", 2.80),
    # ---- Lunch Mains ----
    ("Chicken Wrap", "Grilled chicken, lettuce, tomato, mayo in a flour tortilla", "Lunch", 5.50),
    ("Falafel Wrap", "Falafel, hummus, salad, harissa in flatbread", "Lunch", 5.50),
    ("BLT Sandwich", "Bacon, lettuce, tomato on malted brown bread", "Lunch", 4.50),
    ("Club Sandwich", "Triple-decker chicken, bacon, egg, salad", "Lunch", 6.00),
    ("Tuna Melt Panini", "Tuna mayo, cheddar, toasted panini", "Lunch", 5.00),
    ("Cheese & Pickle Sandwich", "Mature cheddar and Branston on granary", "Lunch", 3.80),
    ("Smoked Salmon Bagel", "Cream cheese, smoked salmon, capers", "Lunch", 6.50),
    ("Soup of the Day", "Freshly made, served with crusty bread", "Lunch", 4.00),
    ("Caesar Salad", "Cos lettuce, croutons, parmesan, Caesar dressing", "Lunch", 6.00),
    ("Greek Salad", "Feta, olives, cucumber, tomato, red onion", "Lunch", 5.50),
    ("Quinoa Power Bowl", "Quinoa, roasted veg, tahini dressing, seeds", "Lunch", 7.00),
    ("Mac & Cheese", "Creamy three-cheese sauce, baked breadcrumb top", "Lunch", 6.50),
    ("Loaded Fries", "Skin-on fries, pulled pork, cheese sauce, jalapeños", "Lunch", 6.50),
    ("Veggie Burger", "Beyond Meat patty, brioche bun, all the trimmings", "Lunch", 8.00),
    ("Chicken Burger", "Crispy fried chicken, slaw, sriracha mayo, brioche bun", "Lunch", 8.50),
    # ---- Kids Menu ----
    ("Mini Cheese Pizza", "Personal-size pizza with tomato and mozzarella", "Kids", 4.00),
    ("Chicken Nuggets & Chips", "5 crispy chicken nuggets with skinny fries", "Kids", 4.50),
    ("Fish Fingers & Chips", "3 fish fingers, chunky chips, ketchup", "Kids", 4.00),
    ("Kids Pasta Bolognese", "Spaghetti with rich beef ragu", "Kids", 4.50),
    ("Kids Mac & Cheese", "Mini portion of creamy macaroni cheese", "Kids", 3.50),
    ("Kids Sausage & Mash", "Two pork sausages, creamy mashed potato, gravy", "Kids", 4.50),
    ("Mini Pancakes", "Stack of 3 mini pancakes with berry compote", "Kids", 3.50),
    ("Kids Apple Juice", "100% fruit juice carton", "Kids", 1.20),
    ("Kids Still Water", "Small still water bottle", "Kids", 0.80),
    # ---- Cakes & Pastries ----
    ("Victoria Sponge Slice", "Light sponge, strawberry jam, vanilla buttercream", "Cakes", 3.50),
    ("Chocolate Fudge Cake", "Dense chocolate cake with ganache", "Cakes", 3.80),
    ("Carrot Cake Slice", "Spiced carrot cake, cream cheese frosting", "Cakes", 3.50),
    ("Lemon Drizzle Slice", "Moist lemon cake with sugar glaze", "Cakes", 3.00),
    ("Blueberry Muffin", "Fat, bakery-style blueberry muffin", "Cakes", 2.50),
    ("Chocolate Chip Muffin", "Loaded with dark chocolate chips", "Cakes", 2.50),
    ("Banana Bread Slice", "Moist banana loaf with walnuts", "Cakes", 2.80),
    ("Millionaire's Shortbread", "Caramel, shortbread, milk chocolate", "Cakes", 2.80),
    ("Brownie", "Fudgy dark chocolate brownie square", "Cakes", 2.50),
    ("Flapjack", "Oat, golden syrup, and butter flapjack", "Cakes", 2.20),
    ("Scone", "Plain scone with clotted cream and jam", "Cakes", 3.00),
    ("Cinnamon Roll", "Soft yeasted roll with icing glaze", "Cakes", 3.50),
    ("Danish Pastry", "Seasonal fruit and custard Danish", "Cakes", 3.00),
    ("Eclair", "Choux pastry filled with cream, topped with chocolate", "Cakes", 3.50),
    ("Macaroon", "French almond meringue with ganache filling (each)", "Cakes", 2.50),
    # ---- Snacks ----
    ("Crisps (standard pack)", "Walkers, assorted flavours", "Snacks", 1.00),
    ("Crisps (sharing bag)", "Large sharing bag, assorted flavours", "Snacks", 1.80),
    ("Mixed Nuts", "Roasted and salted mixed nut bag", "Snacks", 2.00),
    ("Trail Mix", "Nuts, seeds, and dried fruit mix", "Snacks", 2.20),
    ("Fridge Raider (chicken)", "Snack-size cooked chicken bites", "Snacks", 1.50),
    ("Nakd Bar", "Natural fruit and nut bar", "Snacks", 1.50),
    ("Protein Bar", "High-protein snack bar, assorted flavours", "Snacks", 2.50),
    ("Banana", "Fresh banana", "Snacks", 0.60),
    ("Apple", "Fresh apple", "Snacks", 0.70),
    ("Yoghurt Pot", "Greek yoghurt with honey", "Snacks", 2.00),
    # ---- Sides ----
    ("Side of Chips", "Skin-on fries, sea salt", "Sides", 2.50),
    ("Side Salad", "Mixed leaves, cherry tomatoes, cucumber, dressing", "Sides", 2.50),
    ("Coleslaw", "Creamy homemade coleslaw", "Sides", 1.50),
    ("Baked Beans", "Heinz baked beans, small pot", "Sides", 1.20),
    ("Garlic Bread", "Two slices toasted garlic baguette", "Sides", 2.00),
    ("Onion Rings", "Beer-battered onion rings (6)", "Sides", 2.80),
    ("Halloumi Fries", "Fried halloumi strips with sweet chilli dip", "Sides", 3.50),
    # ---- Retail ----
    ("Evergreen Tote Bag", "100% organic cotton branded tote", "Retail", 8.00),
    ("Evergreen Keep Cup (S)", "Reusable coffee cup, 8oz", "Retail", 12.00),
    ("Evergreen Keep Cup (M)", "Reusable coffee cup, 12oz", "Retail", 14.00),
    ("Coffee Beans (250g)", "House blend whole bean coffee", "Retail", 9.00),
    ("Ground Coffee (250g)", "House blend filter grind coffee", "Retail", 9.00),
    ("Evergreen Loyalty Card", "Stamp card — buy 9, get 1 free", "Retail", 0.00),
    ("Gift Voucher (£10)", "Evergreen digital gift voucher", "Retail", 10.00),
    ("Gift Voucher (£25)", "Evergreen digital gift voucher", "Retail", 25.00),
]


def seed_menu():
    """Insert default menu items if the menu table is empty."""
    with get_db() as (conn, cur):
        cur.execute("SELECT COUNT(*) as cnt FROM menu_items")
        row = cur.fetchone()
        count = row["cnt"] if hasattr(row, "__getitem__") else row[0]
        if count > 0:
            logger.info(f"Menu already seeded ({count} items). Skipping.")
            return

        for name, description, category, price in SEED_MENU_ITEMS:
            cur.execute(
                """
                INSERT INTO menu_items (name, description, category, price)
                VALUES (?, ?, ?, ?)
                """,
                (name, description, category, price),
            )

        # Seed inventory for every item with a default quantity
        cur.execute("SELECT id FROM menu_items")
        rows = cur.fetchall()
        for row in rows:
            item_id = row["id"] if hasattr(row, "__getitem__") else row[0]
            cur.execute(
                """
                INSERT INTO inventory (menu_item_id, quantity, unit)
                VALUES (?, ?, ?)
                """,
                (item_id, 50, "units"),
            )

    logger.info(f"Seeded {len(SEED_MENU_ITEMS)} menu items and inventory records.")


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------

def get_all_menu_items(category: Optional[str] = None, available_only: bool = False):
    with get_db() as (conn, cur):
        query = "SELECT * FROM menu_items"
        params = []
        clauses = []
        if category:
            clauses.append("category = ?")
            params.append(category)
        if available_only:
            clauses.append("available = 1")
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY category, name"
        cur.execute(query, params)
        return [dict(row) for row in cur.fetchall()]


def get_menu_item(item_id: int):
    with get_db() as (conn, cur):
        cur.execute("SELECT * FROM menu_items WHERE id = ?", (item_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def create_menu_item(name: str, description: str, category: str, price: float,
                     image_url: str = None):
    with get_db() as (conn, cur):
        cur.execute(
            """
            INSERT INTO menu_items (name, description, category, price, image_url)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, description, category, price, image_url),
        )
        item_id = cur.lastrowid
        cur.execute(
            "INSERT INTO inventory (menu_item_id, quantity) VALUES (?, ?)",
            (item_id, 0),
        )
        return item_id


def update_menu_item(item_id: int, **kwargs):
    # Strict allowlist — column names are validated before being interpolated into SQL
    ALLOWED_COLUMNS = {"name", "description", "category", "price", "image_url", "available"}
    fields = {k: v for k, v in kwargs.items() if k in ALLOWED_COLUMNS}
    if not fields:
        return False
    # Build SET clause using only pre-validated column names from ALLOWED_COLUMNS
    set_parts = [f"{col} = ?" for col in fields]
    set_parts.append("updated_at = datetime('now')")
    set_clause = ", ".join(set_parts)
    values = list(fields.values())
    values.append(item_id)
    with get_db() as (conn, cur):
        cur.execute(
            f"UPDATE menu_items SET {set_clause} WHERE id = ?",
            values,
        )
        return cur.rowcount > 0


def delete_menu_item(item_id: int):
    with get_db() as (conn, cur):
        cur.execute("DELETE FROM menu_items WHERE id = ?", (item_id,))
        return cur.rowcount > 0


def get_inventory():
    with get_db() as (conn, cur):
        cur.execute(
            """
            SELECT i.*, m.name, m.category
            FROM inventory i
            JOIN menu_items m ON m.id = i.menu_item_id
            ORDER BY m.category, m.name
            """
        )
        return [dict(row) for row in cur.fetchall()]


def update_inventory(menu_item_id: int, quantity: int):
    with get_db() as (conn, cur):
        cur.execute(
            """
            UPDATE inventory
            SET quantity = ?, updated_at = datetime('now')
            WHERE menu_item_id = ?
            """,
            (quantity, menu_item_id),
        )
        return cur.rowcount > 0


def create_order(customer_name: str, customer_note: str, items: list):
    """
    items: list of {"menu_item_id": int, "quantity": int}
    Returns the new order ID.
    """
    with get_db() as (conn, cur):
        total = 0.0
        enriched = []
        for item in items:
            cur.execute("SELECT price FROM menu_items WHERE id = ?", (item["menu_item_id"],))
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Menu item {item['menu_item_id']} not found")
            price = row["price"] if hasattr(row, "__getitem__") else row[0]
            qty = item["quantity"]
            total += price * qty
            enriched.append((item["menu_item_id"], qty, price))

        cur.execute(
            """
            INSERT INTO orders (customer_name, customer_note, total)
            VALUES (?, ?, ?)
            """,
            (customer_name, customer_note, total),
        )
        order_id = cur.lastrowid

        for menu_item_id, qty, price in enriched:
            cur.execute(
                """
                INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
                VALUES (?, ?, ?, ?)
                """,
                (order_id, menu_item_id, qty, price),
            )

        return order_id


def get_orders():
    with get_db() as (conn, cur):
        cur.execute("SELECT * FROM orders ORDER BY created_at DESC")
        orders = [dict(row) for row in cur.fetchall()]
        for order in orders:
            cur.execute(
                """
                SELECT oi.*, m.name
                FROM order_items oi
                JOIN menu_items m ON m.id = oi.menu_item_id
                WHERE oi.order_id = ?
                """,
                (order["id"],),
            )
            order["items"] = [dict(r) for r in cur.fetchall()]
        return orders


# ---------------------------------------------------------------------------
# Entry point — run directly to initialise and seed the database
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Initialising JARVIS database…")
    initialise_schema()
    seed_menu()
    items = get_all_menu_items()
    logger.info(f"JARVIS database ready — {len(items)} menu items loaded.")
    logger.info("Node: SOVEREIGN_NODE_04 [ACTIVE_SIGNAL]")
