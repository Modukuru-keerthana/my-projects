import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

let db: any;

// ============================================
// DATABASE INIT
// ============================================
async function initDB() {
    db = await open({
        filename: process.env.DB_PATH || './erp.db',
        driver: sqlite3.Database
    });

    // ✅ FIX: Use process.cwd() to find the schema file
    // This works both locally and on Render
    let schemaPath: string;

    // Check if we're in production (Render) or local
    if (process.env.NODE_ENV === 'production') {
        // On Render, the src folder is at the root level
        schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    } else {
        // Locally, it's in the src folder relative to __dirname
        schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
    }

    // If the first path doesn't work, try the other one
    if (!fs.existsSync(schemaPath)) {
        // Fallback: try the other location
        const fallbackPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
        if (fs.existsSync(fallbackPath)) {
            schemaPath = fallbackPath;
        } else {
            // Final fallback: try to read from the dist folder
            schemaPath = path.join(__dirname, 'db', 'schema.sql');
        }
    }

    console.log(`📂 Reading schema from: ${schemaPath}`);
    
    try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await db.exec(schema);
        console.log('✅ Database ready');
    } catch (error) {
        console.error('❌ Error reading schema file:', error);
        // If schema file isn't found, try to create the database without it
        // This is a fallback for production
        console.log('⚠️ Creating database with minimal schema...');
        await createMinimalSchema();
    }
}

// ============================================
// FALLBACK: Create schema directly in code
// ============================================
async function createMinimalSchema() {
    try {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT DEFAULT 'sales',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mobile TEXT,
                email TEXT,
                company TEXT,
                gst_number TEXT,
                customer_type TEXT,
                address TEXT,
                status TEXT DEFAULT 'Lead',
                followup_date DATE,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

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

            CREATE TABLE IF NOT EXISTS sales_challans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challan_number TEXT UNIQUE NOT NULL,
                customer_id INTEGER NOT NULL,
                total_quantity INTEGER DEFAULT 0,
                total_amount REAL DEFAULT 0,
                status TEXT DEFAULT 'Draft',
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            );

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

            INSERT OR IGNORE INTO users (email, password, full_name, role) VALUES 
            ('admin@erp.com', 'admin123', 'Admin User', 'admin'),
            ('sales@erp.com', 'sales123', 'Sales User', 'sales'),
            ('warehouse@erp.com', 'warehouse123', 'Warehouse User', 'warehouse'),
            ('accounts@erp.com', 'accounts123', 'Accounts User', 'accounts');

            INSERT OR IGNORE INTO customers (name, mobile, email, company, customer_type, status) VALUES 
            ('ABC Traders', '9876543210', 'rajesh@abc.com', 'ABC Traders', 'Wholesale', 'Active'),
            ('XYZ Enterprises', '9876543211', 'priya@xyz.com', 'XYZ Enterprises', 'Retail', 'Lead'),
            ('PQR Solutions', '9876543212', 'amit@pqr.com', 'PQR Solutions', 'Distributor', 'Active');

            INSERT OR IGNORE INTO products (name, sku, category, unit_price, current_stock, min_stock_alert) VALUES 
            ('Dell Laptop 13"', 'LAP-001', 'Electronics', 45000, 10, 3),
            ('Logitech Wireless Mouse', 'MOUSE-001', 'Accessories', 500, 50, 10),
            ('Mechanical Keyboard', 'KEY-001', 'Accessories', 1200, 30, 5),
            ('Samsung Monitor 27"', 'MON-001', 'Electronics', 25000, 8, 3);
        `);
        console.log('✅ Minimal schema created successfully');
    } catch (error) {
        console.error('❌ Failed to create minimal schema:', error);
    }
}

// ============================================
// AUTH MIDDLEWARE
// ============================================
function auth(req: any, res: any, next: any) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function authorize(...roles: string[]) {
    return (req: any, res: any, next: any) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

// ============================================
// AUTH - LOGIN
// ============================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        }
    });
});

// ============================================
// CUSTOMERS - CRUD + SEARCH
// ============================================
app.get('/api/customers', auth, async (req, res) => {
    const { search, status, type } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (search) {
        query += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ? OR mobile LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (type) {
        query += ' AND customer_type = ?';
        params.push(type);
    }

    query += ' ORDER BY id DESC';
    const customers = await db.all(query, params);
    res.json(customers);
});

app.get('/api/customers/:id', auth, async (req, res) => {
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', req.params.id);
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }

    const followups = await db.all(
        'SELECT f.*, u.full_name as created_by_name FROM followups f LEFT JOIN users u ON f.created_by = u.id WHERE f.customer_id = ? ORDER BY f.created_at DESC',
        req.params.id
    );

    res.json({ ...customer, followups });
});

app.post('/api/customers', auth, async (req, res) => {
    const { name, mobile, email, company, gst_number, customer_type, address, status, followup_date, notes } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Customer name is required' });
    }

    const result = await db.run(
        `INSERT INTO customers (name, mobile, email, company, gst_number, customer_type, address, status, followup_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, mobile, email, company, gst_number, customer_type, address, status || 'Lead', followup_date, notes]
    );

    const customer = await db.get('SELECT * FROM customers WHERE id = ?', result.lastID);
    res.status(201).json(customer);
});

app.put('/api/customers/:id', auth, async (req, res) => {
    const { name, mobile, email, company, gst_number, customer_type, address, status, followup_date, notes } = req.body;

    await db.run(
        `UPDATE customers SET 
            name = ?, mobile = ?, email = ?, company = ?, gst_number = ?,
            customer_type = ?, address = ?, status = ?, followup_date = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, mobile, email, company, gst_number, customer_type, address, status, followup_date, notes, req.params.id]
    );

    const customer = await db.get('SELECT * FROM customers WHERE id = ?', req.params.id);
    res.json(customer);
});

app.delete('/api/customers/:id', auth, authorize('admin'), async (req, res) => {
    await db.run('DELETE FROM customers WHERE id = ?', req.params.id);
    res.json({ success: true });
});

// ============================================
// FOLLOWUPS (CRM)
// ============================================
app.post('/api/customers/:id/followups', auth, async (req, res) => {
    const { note, followup_date } = req.body;
    const customer_id = req.params.id;

    if (!note) {
        return res.status(400).json({ error: 'Note is required' });
    }

    const result = await db.run(
        'INSERT INTO followups (customer_id, note, followup_date, created_by) VALUES (?, ?, ?, ?)',
        [customer_id, note, followup_date, (req as any).user.id]
    );

    const followup = await db.get(
        'SELECT f.*, u.full_name as created_by_name FROM followups f LEFT JOIN users u ON f.created_by = u.id WHERE f.id = ?',
        result.lastID
    );

    res.status(201).json(followup);
});

// ============================================
// PRODUCTS - CRUD + STOCK
// ============================================
app.get('/api/products', auth, async (req, res) => {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (search) {
        query += ' AND (name LIKE ? OR sku LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s);
    }
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    query += ' ORDER BY id DESC';
    const products = await db.all(query, params);
    res.json(products);
});

app.get('/api/products/low-stock', auth, async (req, res) => {
    const products = await db.all(
        'SELECT * FROM products WHERE current_stock <= min_stock_alert ORDER BY current_stock ASC'
    );
    res.json(products);
});

app.get('/api/products/:id', auth, async (req, res) => {
    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const movements = await db.all(
        'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 50',
        req.params.id
    );

    res.json({ ...product, movements });
});

app.post('/api/products', auth, async (req, res) => {
    const { name, sku, category, unit_price, current_stock, min_stock_alert, location } = req.body;

    if (!name || !sku || !unit_price) {
        return res.status(400).json({ error: 'Name, SKU and unit price are required' });
    }

    const existing = await db.get('SELECT id FROM products WHERE sku = ?', sku);
    if (existing) {
        return res.status(400).json({ error: 'SKU already exists' });
    }

    const result = await db.run(
        `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, sku, category, unit_price, current_stock || 0, min_stock_alert || 5, location]
    );

    if (current_stock > 0) {
        await db.run(
            'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES (?, ?, ?, ?, ?)',
            [result.lastID, current_stock, 'IN', 'Initial stock', (req as any).user.id]
        );
    }

    const product = await db.get('SELECT * FROM products WHERE id = ?', result.lastID);
    res.status(201).json(product);
});

app.put('/api/products/:id', auth, async (req, res) => {
    const { name, sku, category, unit_price, min_stock_alert, location } = req.body;

    await db.run(
        `UPDATE products SET 
            name = ?, sku = ?, category = ?, unit_price = ?, min_stock_alert = ?, location = ?,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, sku, category, unit_price, min_stock_alert, location, req.params.id]
    );

    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    res.json(product);
});

app.delete('/api/products/:id', auth, authorize('admin', 'warehouse'), async (req, res) => {
    await db.run('DELETE FROM products WHERE id = ?', req.params.id);
    res.json({ success: true });
});

// ============================================
// STOCK MOVEMENT
// ============================================
app.post('/api/products/:id/stock', auth, async (req, res) => {
    const { quantity, movement_type, reason } = req.body;
    const product_id = req.params.id;

    if (!quantity || !movement_type) {
        return res.status(400).json({ error: 'Quantity and movement type are required' });
    }

    if (!['IN', 'OUT'].includes(movement_type)) {
        return res.status(400).json({ error: 'Movement type must be IN or OUT' });
    }

    const product = await db.get('SELECT * FROM products WHERE id = ?', product_id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (movement_type === 'OUT' && product.current_stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
    }

    const newStock = movement_type === 'IN'
        ? product.current_stock + quantity
        : product.current_stock - quantity;

    await db.run(
        'UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStock, product_id]
    );

    await db.run(
        'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES (?, ?, ?, ?, ?)',
        [product_id, quantity, movement_type, reason || null, (req as any).user.id]
    );

    const updated = await db.get('SELECT * FROM products WHERE id = ?', product_id);
    res.json(updated);
});

// ============================================
// SALES CHALLANS
// ============================================
app.post('/api/sales-challans', auth, async (req, res) => {
    const { customer_id, items, status } = req.body;

    if (!customer_id) {
        return res.status(400).json({ error: 'Customer is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one product is required' });
    }

    for (const item of items) {
        const product = await db.get('SELECT * FROM products WHERE id = ?', item.product_id);
        if (!product) {
            return res.status(404).json({ error: `Product ${item.product_id} not found` });
        }
        if (status === 'Confirmed' && product.current_stock < item.quantity) {
            return res.status(400).json({
                error: `Insufficient stock for ${product.name}. Available: ${product.current_stock}`
            });
        }
    }

    const challan_number = `CH-${Date.now()}`;
    let total_quantity = 0;
    let total_amount = 0;

    for (const item of items) {
        const product = await db.get('SELECT * FROM products WHERE id = ?', item.product_id);
        total_quantity += item.quantity;
        total_amount += product.unit_price * item.quantity;
    }

    const result = await db.run(
        `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [challan_number, customer_id, total_quantity, total_amount, status || 'Draft', (req as any).user.id]
    );

    const challan_id = result.lastID;

    for (const item of items) {
        const product = await db.get('SELECT * FROM products WHERE id = ?', item.product_id);
        await db.run(
            `INSERT INTO sales_challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [challan_id, item.product_id, product.name, product.sku, product.unit_price, item.quantity]
        );

        if (status === 'Confirmed') {
            await db.run(
                'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
            await db.run(
                'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES (?, ?, ?, ?, ?)',
                [item.product_id, item.quantity, 'OUT', `Challan ${challan_number}`, (req as any).user.id]
            );
        }
    }

    const challan = await db.get('SELECT * FROM sales_challans WHERE id = ?', challan_id);
    const challanItems = await db.all('SELECT * FROM sales_challan_items WHERE challan_id = ?', challan_id);
    res.status(201).json({ ...challan, items: challanItems });
});

app.get('/api/sales-challans', auth, async (req, res) => {
    const { status } = req.query;
    let query = `SELECT sc.*, c.name as customer_name 
                 FROM sales_challans sc 
                 LEFT JOIN customers c ON sc.customer_id = c.id`;
    const params: any[] = [];

    if (status) {
        query += ' WHERE sc.status = ?';
        params.push(status);
    }

    query += ' ORDER BY sc.id DESC';
    const challans = await db.all(query, params);
    res.json(challans);
});

app.get('/api/sales-challans/:id', auth, async (req, res) => {
    const challan = await db.get(
        `SELECT sc.*, c.name as customer_name 
         FROM sales_challans sc 
         LEFT JOIN customers c ON sc.customer_id = c.id 
         WHERE sc.id = ?`,
        req.params.id
    );

    if (!challan) {
        return res.status(404).json({ error: 'Challan not found' });
    }

    const items = await db.all('SELECT * FROM sales_challan_items WHERE challan_id = ?', req.params.id);
    res.json({ ...challan, items });
});

app.put('/api/sales-challans/:id/confirm', auth, authorize('sales', 'admin'), async (req, res) => {
    const challan = await db.get('SELECT * FROM sales_challans WHERE id = ?', req.params.id);

    if (!challan) {
        return res.status(404).json({ error: 'Challan not found' });
    }
    if (challan.status !== 'Draft') {
        return res.status(400).json({ error: 'Only draft challans can be confirmed' });
    }

    const items = await db.all('SELECT * FROM sales_challan_items WHERE challan_id = ?', req.params.id);

    for (const item of items) {
        const product = await db.get('SELECT * FROM products WHERE id = ?', item.product_id);
        if (product.current_stock < item.quantity) {
            return res.status(400).json({
                error: `Insufficient stock for ${product.name}. Available: ${product.current_stock}`
            });
        }
    }

    for (const item of items) {
        await db.run(
            'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
            [item.quantity, item.product_id]
        );
        await db.run(
            'INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by) VALUES (?, ?, ?, ?, ?)',
            [item.product_id, item.quantity, 'OUT', `Challan ${challan.challan_number} confirmed`, (req as any).user.id]
        );
    }

    await db.run(
        'UPDATE sales_challans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['Confirmed', req.params.id]
    );

    const updated = await db.get('SELECT * FROM sales_challans WHERE id = ?', req.params.id);
    res.json(updated);
});

app.put('/api/sales-challans/:id/cancel', auth, authorize('sales', 'admin'), async (req, res) => {
    const challan = await db.get('SELECT * FROM sales_challans WHERE id = ?', req.params.id);

    if (!challan) {
        return res.status(404).json({ error: 'Challan not found' });
    }
    if (challan.status === 'Cancelled') {
        return res.status(400).json({ error: 'Challan already cancelled' });
    }

    await db.run(
        'UPDATE sales_challans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['Cancelled', req.params.id]
    );

    res.json({ success: true });
});

// ============================================
// DASHBOARD
// ============================================
app.get('/api/dashboard', auth, async (req, res) => {
    const customers = await db.get('SELECT COUNT(*) as count FROM customers');
    const products = await db.get('SELECT COUNT(*) as count FROM products');
    const lowStock = await db.get('SELECT COUNT(*) as count FROM products WHERE current_stock <= min_stock_alert');
    const draftChallans = await db.get("SELECT COUNT(*) as count FROM sales_challans WHERE status = 'Draft'");
    const totalRevenue = await db.get('SELECT SUM(total_amount) as total FROM sales_challans WHERE status = "Confirmed"');

    res.json({
        totalCustomers: customers.count,
        totalProducts: products.count,
        lowStockItems: lowStock.count,
        draftChallans: draftChallans.count,
        totalRevenue: totalRevenue.total || 0
    });
});

// ============================================
// START SERVER
// ============================================
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`📊 API at http://localhost:${PORT}/api`);
        console.log(`👤 Default logins:`);
        console.log(`   admin@erp.com / admin123`);
        console.log(`   sales@erp.com / sales123`);
        console.log(`   warehouse@erp.com / warehouse123`);
        console.log(`   accounts@erp.com / accounts123`);
    });
});