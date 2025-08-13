CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    status TEXT DEFAULT 'active',
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    from_phone TEXT NOT NULL,
    to_phone TEXT,
    content TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'incoming' ou 'outgoing'
    status TEXT DEFAULT 'sent',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_phone TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'string',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, description, price, category, stock) VALUES
('Ingresso VIP', 'Acesso completo ao evento com área VIP', 60.00, 'Ingressos', 100),
('Ingresso Standard', 'Acesso básico ao evento', 30.00, 'Ingressos', 200),
('Combo Família', '4 ingressos standard + 2 bebidas', 100.00, 'Combos', 50);

INSERT INTO settings (key, value, type) VALUES
('company_name', 'Royal Club', 'string'),
('welcome_message', '🎭 Bem-vindo ao Royal Club! Como posso ajudá-lo hoje?', 'string'),
('business_hours', '{"monday": {"open": "08:00", "close": "18:00"}}', 'json'),
('auto_response_enabled', 'true', 'boolean');
