-- ADD CUSTOMERS
INSERT OR IGNORE INTO customers (name, mobile, email, company, customer_type, status) VALUES
('Amit Singh', '9876543201', 'amit@singh.com', 'Singh Traders', 'Wholesale', 'Active'),
('Neha Reddy', '9876543202', 'neha@reddy.com', 'Reddy Enterprises', 'Retail', 'Active'),
('Vikram Patel', '9876543203', 'vikram@patel.com', 'Patel Distributors', 'Distributor', 'Lead'),
('Sneha Sharma', '9876543204', 'sneha@sharma.com', 'Sharma Industries', 'Wholesale', 'Active'),
('Rahul Gupta', '9876543205', 'rahul@gupta.com', 'Gupta Sons', 'Retail', 'Inactive');

-- ADD PRODUCTS
INSERT OR IGNORE INTO products (name, sku, category, unit_price, current_stock, min_stock_alert) VALUES
('HP Spectre Laptop', 'LAP-002', 'Electronics', 89000, 7, 3),
('Lenovo ThinkPad X1', 'LAP-003', 'Electronics', 120000, 5, 2),
('Apple MacBook Pro', 'LAP-004', 'Electronics', 150000, 4, 2),
('Asus ROG Gaming Laptop', 'LAP-005', 'Electronics', 95000, 3, 2),
('Samsung 27" Curved Monitor', 'MON-002', 'Electronics', 32000, 6, 3);

-- ADD FOLLOWUPS
INSERT OR IGNORE INTO followups (customer_id, note, followup_date, created_by) VALUES
(1, 'Discussed new product line. Interested in bulk order.', '2026-08-01', 1),
(2, 'Sent catalog. Waiting for response.', '2026-08-05', 1),
(3, 'Follow up on pending invoice payment.', '2026-07-30', 1);

-- ADD SALES CHALLANS
INSERT OR IGNORE INTO sales_challans (challan_number, customer_id, total_quantity, total_amount, status, created_by) VALUES
('CH-2026-001', 1, 5, 225000, 'Confirmed', 1),
('CH-2026-002', 2, 3, 267000, 'Confirmed', 1),
('CH-2026-003', 3, 8, 96000, 'Draft', 1);

-- ADD CHALLAN ITEMS
INSERT OR IGNORE INTO sales_challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity) VALUES
(1, 1, 'Dell XPS 13', 'LAP-001', 85000, 2),
(1, 3, 'MacBook Air M2', 'LAP-003', 99000, 3),
(2, 4, 'Apple MacBook Pro', 'LAP-004', 150000, 1);