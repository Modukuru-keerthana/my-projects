-- ============================================
-- USERS WITH ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'sales' CHECK(role IN ('admin', 'sales', 'warehouse', 'accounts')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    company TEXT,
    gst_number TEXT,
    customer_type TEXT CHECK(customer_type IN ('Retail', 'Wholesale', 'Distributor')),
    address TEXT,
    status TEXT DEFAULT 'Lead' CHECK(status IN ('Lead', 'Active', 'Inactive')),
    followup_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FOLLOWUP NOTES (CRM)
-- ============================================
CREATE TABLE IF NOT EXISTS followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    followup_date DATE,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT,
    unit_price REAL NOT NULL,
    current_stock INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STOCK MOVEMENT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity_changed INTEGER NOT NULL,
    movement_type TEXT CHECK(movement_type IN ('IN', 'OUT')),
    reason TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- SALES CHALLANS
-- ============================================
CREATE TABLE IF NOT EXISTS sales_challans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challan_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    total_quantity INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft', 'Confirmed', 'Cancelled')),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- SALES CHALLAN ITEMS (SNAPSHOT)
-- ============================================
CREATE TABLE IF NOT EXISTS sales_challan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challan_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    total_price REAL GENERATED ALWAYS AS (unit_price * quantity) STORED,
    FOREIGN KEY (challan_id) REFERENCES sales_challans(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================
-- SAMPLE DATA
-- ============================================
INSERT OR IGNORE INTO users (email, password, full_name, role) VALUES 
('admin@erp.com', 'admin123', 'Admin User', 'admin'),
('sales@erp.com', 'sales123', 'Sales User', 'sales'),
('warehouse@erp.com', 'warehouse123', 'Warehouse User', 'warehouse'),
('accounts@erp.com', 'accounts123', 'Accounts User', 'accounts');

INSERT OR IGNORE INTO customers (name, mobile, email, company, customer_type, status) VALUES 
('Rajesh Sharma', '9876543210', 'rajesh@abc.com', 'ABC Traders', 'Wholesale', 'Active'),
('Priya Patel', '9876543211', 'priya@xyz.com', 'XYZ Enterprises', 'Retail', 'Lead'),
('Amit Kumar', '9876543212', 'amit@pqr.com', 'PQR Solutions', 'Distributor', 'Active');

INSERT OR IGNORE INTO products (name, sku, category, unit_price, current_stock, min_stock_alert) VALUES 
('Dell Laptop 13"', 'LAP-001', 'Electronics', 45000, 10, 3),
('Logitech Wireless Mouse', 'MOUSE-001', 'Accessories', 500, 50, 10),
('Mechanical Keyboard', 'KEY-001', 'Accessories', 1200, 30, 5),
('Samsung Monitor 27"', 'MON-001', 'Electronics', 25000, 8, 3);