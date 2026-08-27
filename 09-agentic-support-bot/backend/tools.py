import sqlite3
import os

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "support.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_name TEXT,
            item_name TEXT,
            amount REAL,
            status TEXT,
            tracking_number TEXT,
            estimated_delivery TEXT
        )
    """)
    
    # Insert sample orders if empty
    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        sample_orders = [
            ("ORD-1001", "Sarah Jenkins", "Wireless Noise-Canceling Headphones", 199.99, "Delivered", "TRK-982144", "2025-08-20"),
            ("ORD-1002", "Michael Chen", "Ergonomic Mechanical Keyboard", 149.50, "In Transit", "TRK-442190", "2025-08-28"),
            ("ORD-1003", "Elena Rostova", "UltraWide 4K Gaming Monitor", 499.00, "Processing", "TRK-112004", "2025-08-30"),
            ("ORD-1004", "David Miller", "USB-C Multi-Port Hub", 45.00, "Delivered", "TRK-882190", "2025-08-18")
        ]
        cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)", sample_orders)
    
    conn.commit()
    conn.close()

init_db()

def lookup_order(order_id: str):
    """Fetch real-time order details from SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id.strip().upper(),))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return {"error": f"Order ID '{order_id}' not found in system database."}

def process_refund(order_id: str, reason: str):
    """Process automated refund for an eligible delivered order."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT status, amount, customer_name FROM orders WHERE order_id = ?", (order_id.strip().upper(),))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return {"error": f"Order '{order_id}' not found."}

    status, amount, name = row
    if status == "Refunded":
        conn.close()
        return {"error": f"Order '{order_id}' has already been refunded previously."}

    cursor.execute("UPDATE orders SET status = 'Refunded' WHERE order_id = ?", (order_id.strip().upper(),))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "order_id": order_id,
        "customer": name,
        "refund_amount": f"${amount}",
        "reason": reason,
        "status": "Refunded Successfully"
    }

def escalate_to_human(order_id: str, note: str):
    """Escalate support ticket to Tier 2 human customer success manager."""
    return {
        "escalated": True,
        "ticket_id": f"TKT-{os.urandom(2).hex().upper()}",
        "order_id": order_id,
        "note": note,
        "assigned_tier": "Tier 2 Human Support Manager",
        "estimated_response": "Within 2 hours"
    }

# Tool JSON schemas for OpenAI Function Calling
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "lookup_order",
            "description": "Lookup order status, tracking number, and delivery date using Order ID (e.g. ORD-1001).",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The unique Order ID string."}
                },
                "required": ["order_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "process_refund",
            "description": "Process an automated refund for a customer order given the order ID and reason.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The unique Order ID to refund."},
                    "reason": {"type": "string", "description": "Customer's reason for requesting refund."}
                },
                "required": ["order_id", "reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human",
            "description": "Escalate support ticket to a human manager if order issue cannot be resolved automatically.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "Order ID involved."},
                    "note": {"type": "string", "description": "Summary note explaining why human escalation is needed."}
                },
                "required": ["order_id", "note"]
            }
        }
    }
]
