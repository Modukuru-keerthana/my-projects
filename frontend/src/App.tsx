import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';

// ============================================
// STYLES - Professional Theme
// ============================================
const theme = {
    colors: {
        primary: '#2563eb',
        primaryDark: '#1d4ed8',
        secondary: '#64748b',
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444',
        background: '#f1f5f9',
        cardBg: '#ffffff',
        text: '#0f172a',
        textLight: '#64748b',
        border: '#e2e8f0',
    },
    shadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    shadowHover: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    radius: '12px',
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', background: theme.colors.background },
    sidebar: {
        width: '260px',
        background: '#0f172a',
        color: 'white',
        padding: '20px 0',
        position: 'fixed' as 'fixed',
        height: '100vh',
        overflowY: 'auto' as 'auto',
        zIndex: 100,
    },
    sidebarHeader: {
        padding: '0 20px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '20px',
    },
    sidebarItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        color: '#94a3b8',
        textDecoration: 'none',
        transition: 'all 0.2s',
        margin: '2px 10px',
        borderRadius: '8px',
        fontSize: '14px',
    },
    sidebarItemActive: {
        background: '#2563eb',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: '30px',
        marginLeft: '260px',
        minHeight: '100vh',
    },
    card: {
        background: theme.colors.cardBg,
        borderRadius: theme.radius,
        padding: '24px',
        boxShadow: theme.shadow,
        marginBottom: '24px',
        border: '1px solid ' + theme.colors.border,
    },
    button: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid ' + theme.colors.border,
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'all 0.2s',
        outline: 'none',
        background: 'white',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as 'collapse',
        fontSize: '14px',
    },
    th: {
        padding: '12px 16px',
        textAlign: 'left' as 'left',
        borderBottom: '2px solid ' + theme.colors.border,
        fontWeight: 600,
        color: theme.colors.textLight,
        background: '#f8fafc',
    },
    td: {
        padding: '12px 16px',
        borderBottom: '1px solid ' + theme.colors.border,
    },
    badge: {
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-block',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
    },
    statCard: {
        background: theme.colors.cardBg,
        borderRadius: theme.radius,
        padding: '20px 24px',
        boxShadow: theme.shadow,
        border: '1px solid ' + theme.colors.border,
        transition: 'all 0.2s',
    },
    formGroup: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        marginBottom: '6px',
        fontSize: '14px',
        fontWeight: 500,
        color: theme.colors.text,
    },
};

// ============================================
// BADGE COMPONENT
// ============================================
const Badge = ({ status }: { status: string }) => {
    const colors: any = {
        'Active': { bg: '#dcfce7', color: '#166534' },
        'Inactive': { bg: '#fee2e2', color: '#991b1b' },
        'Lead': { bg: '#fef3c7', color: '#92400e' },
        'Draft': { bg: '#e2e8f0', color: '#475569' },
        'Confirmed': { bg: '#dcfce7', color: '#166534' },
        'Cancelled': { bg: '#fee2e2', color: '#991b1b' },
        'Pending': { bg: '#fef3c7', color: '#92400e' },
    };
    const style = colors[status] || colors['Draft'];
    return (
        <span style={{ ...styles.badge, background: style.bg, color: style.color }}>
            {status}
        </span>
    );
};

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = createContext<any>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [token]);

    const login = (token: string, user: any) => {
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// ============================================
// SIDEBAR
// ============================================
const Sidebar = () => {
    const location = useLocation();
    const menuItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/customers', label: 'Customers', icon: '👥' },
        { path: '/products', label: 'Products', icon: '📦' },
        { path: '/challans', label: 'Sales Challans', icon: '📋' },
    ];

    return (
        <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>🏢 ERP System</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Operations Portal</p>
            </div>
            {menuItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            ...styles.sidebarItem,
                            ...(isActive ? styles.sidebarItemActive : {}),
                        }}
                    >
                        <span style={{ marginRight: '12px' }}>{item.icon}</span>
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
};

// ============================================
// LOGIN PAGE
// ============================================
// ============================================
// LOGIN PAGE WITH DEMO CREDENTIALS DISPLAYED
// ============================================
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('https://erp-backend-ztwu.onrender.com/api/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const demoCredentials = [
        { role: '👑 Admin', email: 'admin@erp.com', password: 'admin123' },
        { role: '📊 Sales', email: 'sales@erp.com', password: 'sales123' },
        { role: '📦 Warehouse', email: 'warehouse@erp.com', password: 'warehouse123' },
        { role: '💰 Accounts', email: 'accounts@erp.com', password: 'accounts123' },
    ];

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
            <div style={{ background: 'white', padding: '48px', borderRadius: '16px', width: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', margin: 0, color: '#0f172a' }}>🏢 ERP System</h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Sign in to your account</p>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="admin@erp.com"
                            required
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            background: theme.colors.primary,
                            color: 'white',
                            width: '100%',
                            justifyContent: 'center',
                            padding: '12px',
                            fontSize: '16px',
                            opacity: loading ? 0.7 : 1,
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* ========== DEMO CREDENTIALS SECTION ========== */}
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', textAlign: 'center' }}>
                        📋 Demo Credentials (Copy & Paste)
                    </p>
                    {demoCredentials.map((cred, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 12px',
                                marginBottom: '4px',
                                background: '#f8fafc',
                                borderRadius: '6px',
                                fontSize: '13px',
                            }}
                        >
                            <span style={{ fontWeight: 600, minWidth: '80px' }}>{cred.role}</span>
                            <span style={{ color: '#2563eb', fontFamily: 'monospace' }}>{cred.email}</span>
                            <span style={{
                                background: '#e2e8f0',
                                padding: '0 10px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                            }}>
                                {cred.password}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
// ============================================
// DASHBOARD WITH CUSTOMIZABLE GRAPHS
// ============================================
const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [challans, setChallans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedGraph, setSelectedGraph] = useState('bar');
    const [selectedXAxis, setSelectedXAxis] = useState('name');
    const [selectedYAxis, setSelectedYAxis] = useState('current_stock');
    const [dataSource, setDataSource] = useState('products');
    const [graphData, setGraphData] = useState<any[]>([]);

    const graphTypes = [
        { value: 'bar', label: '📊 Bar Chart' },
        { value: 'pie', label: '🥧 Pie Chart' },
        { value: 'line', label: '📈 Line Chart' },
        { value: 'area', label: '📉 Area Chart' },
    ];

    const dataSources = [
        { value: 'products', label: '📦 Products' },
        { value: 'customers', label: '👥 Customers' },
        { value: 'challans', label: '📋 Sales Challans' },
    ];

    const getAttributes = (source: string) => {
        if (source === 'products') {
            return [
                { value: 'name', label: 'Product Name' },
                { value: 'sku', label: 'SKU' },
                { value: 'category', label: 'Category' },
                { value: 'current_stock', label: 'Current Stock' },
                { value: 'unit_price', label: 'Unit Price' },
                { value: 'min_stock_alert', label: 'Min Stock Alert' },
            ];
        } else if (source === 'customers') {
            return [
                { value: 'name', label: 'Customer Name' },
                { value: 'company', label: 'Company' },
                { value: 'customer_type', label: 'Customer Type' },
                { value: 'status', label: 'Status' },
            ];
        } else if (source === 'challans') {
            return [
                { value: 'challan_number', label: 'Challan Number' },
                { value: 'customer_name', label: 'Customer' },
                { value: 'total_quantity', label: 'Total Quantity' },
                { value: 'total_amount', label: 'Total Amount' },
                { value: 'status', label: 'Status' },
            ];
        }
        return [];
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        prepareGraphData();
    }, [products, customers, challans, dataSource, selectedXAxis, selectedYAxis]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, productsRes, customersRes, challansRes] = await Promise.all([
                axios.get('https://erp-backend-ztwu.onrender.com/api/dashboard'),
                axios.get('https://erp-backend-ztwu.onrender.com/api/products'),
                axios.get('https://erp-backend-ztwu.onrender.com/api/customers'),
                axios.get('https://erp-backend-ztwu.onrender.com/api/sales-challans')
            ]);
            setStats(statsRes.data);
            setProducts(productsRes.data);
            setCustomers(customersRes.data);
            setChallans(challansRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const prepareGraphData = () => {
        let data: any[] = [];
        let sourceData: any[] = [];

        if (dataSource === 'products') {
            sourceData = products;
        } else if (dataSource === 'customers') {
            sourceData = customers;
        } else if (dataSource === 'challans') {
            sourceData = challans;
        }

        const grouped: any = {};
        sourceData.forEach((item: any) => {
            const xValue = String(item[selectedXAxis] || 'Unknown');
            const yValue = parseFloat(item[selectedYAxis]) || 0;
            
            if (!grouped[xValue]) {
                grouped[xValue] = 0;
            }
            grouped[xValue] += yValue;
        });

        data = Object.keys(grouped).map(key => ({
            name: key.length > 15 ? key.substring(0, 15) + '...' : key,
            value: grouped[key],
        }));

        setGraphData(data);
    };

    const renderChart = () => {
        if (graphData.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    📊 No data available for this selection
                </div>
            );
        }

        const COLORS = ['#2563eb', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

        switch (selectedGraph) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ 
                                    background: 'white', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="value" name={selectedYAxis.replace('_', ' ').toUpperCase()} fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={graphData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {graphData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    background: 'white', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ 
                                    background: 'white', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="value" name={selectedYAxis.replace('_', ' ').toUpperCase()} stroke="#2563eb" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData}>
                            <defs>
                                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ 
                                    background: 'white', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="value" name={selectedYAxis.replace('_', ' ').toUpperCase()} stroke="#2563eb" fillOpacity={1} fill="url(#colorArea)" />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            default:
                return <div>Select a chart type</div>;
        }
    };

    if (loading) {
        return <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>📊 Loading dashboard...</div>;
    }

    const statItems = [
        { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: '👥', color: '#2563eb' },
        { label: 'Total Products', value: stats?.totalProducts || 0, icon: '📦', color: '#22c55e' },
        { label: 'Low Stock Items', value: stats?.lowStockItems || 0, icon: '⚠️', color: '#ef4444' },
        { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#eab308' },
    ];

    const attributes = getAttributes(dataSource);

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, color: '#0f172a' }}>📊 Dashboard</h1>
                <p style={{ color: '#64748b', marginTop: '4px' }}>Select a graph and customize it with different attributes!</p>
            </div>

            <div style={styles.grid}>
                {statItems.map((item, index) => (
                    <div key={index} style={styles.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '28px' }}>{item.icon}</span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold', color: item.color }}>{item.value}</span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{item.label}</div>
                    </div>
                ))}
            </div>

            <div style={styles.card}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>🎛️ Customize Your Graph</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                        <label style={styles.label}>📊 Graph Type</label>
                        <select
                            value={selectedGraph}
                            onChange={(e) => setSelectedGraph(e.target.value)}
                            style={styles.input}
                        >
                            {graphTypes.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>📂 Data Source</label>
                        <select
                            value={dataSource}
                            onChange={(e) => setDataSource(e.target.value)}
                            style={styles.input}
                        >
                            {dataSources.map(ds => (
                                <option key={ds.value} value={ds.value}>{ds.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>📌 X-Axis (Category)</label>
                        <select
                            value={selectedXAxis}
                            onChange={(e) => setSelectedXAxis(e.target.value)}
                            style={styles.input}
                        >
                            {attributes.map(attr => (
                                <option key={attr.value} value={attr.value}>{attr.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>📈 Y-Axis (Value)</label>
                        <select
                            value={selectedYAxis}
                            onChange={(e) => setSelectedYAxis(e.target.value)}
                            style={styles.input}
                        >
                            {attributes.map(attr => (
                                <option key={attr.value} value={attr.value}>{attr.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                    💡 Showing: {dataSource} | X: {selectedXAxis} | Y: {selectedYAxis} | Chart: {selectedGraph}
                </div>
            </div>

            <div style={styles.card}>
                <div style={{ height: '400px' }}>
                    {renderChart()}
                </div>
            </div>
        </div>
    );
};

// ============================================
// GENERIC CRUD TABLE
// ============================================
const CrudTable = ({ title, endpoint, fields }: any) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const url = search ? `https://erp-backend-ztwu.onrender.com/api/${endpoint}?search=${search}` : `https://erp-backend-ztwu.onrender.com/api/${endpoint}`;
            const res = await axios.get(url);
            setItems(res.data);
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await axios.put(`https://erp-backend-ztwu.onrender.com/api/${endpoint}/${editing.id}`, formData);
            } else {
                await axios.post(`https://erp-backend-ztwu.onrender.com/api/${endpoint}`, formData);
            }
            setShowForm(false);
            setEditing(null);
            setFormData({});
            fetchItems();
        } catch (error) {
            alert('Failed to save. Check console.');
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`https://erp-backend-ztwu.onrender.com/api/${endpoint}/${id}`);
            fetchItems();
        } catch (error) {
            alert('Failed to delete.');
        }
    };

    const handleEdit = (item: any) => {
        setEditing(item);
        setFormData(item);
        setShowForm(true);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchItems();
    };

    if (loading) return <div style={styles.card}>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', margin: 0 }}>{title}</h1>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ ...styles.input, width: '200px' }}
                            placeholder="Search..."
                        />
                        <button type="submit" style={{ ...styles.button, background: '#e2e8f0', color: '#0f172a' }}>🔍</button>
                    </form>
                    <button onClick={() => { setShowForm(!showForm); setEditing(null); setFormData({}); }} style={{ ...styles.button, background: theme.colors.primary, color: 'white' }}>
                        + Add New
                    </button>
                </div>
            </div>

            {showForm && (
                <div style={styles.card}>
                    <h3 style={{ marginTop: 0 }}>{editing ? 'Edit' : 'Add New'} {title.slice(0, -1)}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {fields.map((field: string) => (
                                <div key={field} style={styles.formGroup}>
                                    <label style={styles.label}>{field.replace('_', ' ').toUpperCase()}</label>
                                    <input
                                        value={formData[field] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                        style={styles.input}
                                        placeholder={field}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button type="submit" style={{ ...styles.button, background: theme.colors.success, color: 'white' }}>
                                {editing ? 'Update' : 'Create'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={{ ...styles.button, background: '#e2e8f0', color: '#0f172a' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>#</th>
                            {fields.map((field: string) => <th key={field} style={styles.th}>{field.replace('_', ' ').toUpperCase()}</th>)}
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={fields.length + 2} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>
                                    No {title.toLowerCase()} found
                                </td>
                            </tr>
                        ) : (
                            items.map((item: any) => (
                                <tr key={item.id} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={styles.td}>{item.id}</td>
                                    {fields.map((field: string) => (
                                        <td key={field} style={styles.td}>
                                            {field === 'status' ? <Badge status={item[field]} /> : item[field] || '-'}
                                        </td>
                                    ))}
                                    <td style={styles.td}>
                                        <button onClick={() => handleEdit(item)} style={{ ...styles.button, background: '#e2e8f0', color: '#0f172a', padding: '6px 12px', fontSize: '12px' }}>✏️</button>
                                        <button onClick={() => handleDelete(item.id)} style={{ ...styles.button, background: '#fee2e2', color: '#991b1b', padding: '6px 12px', fontSize: '12px', marginLeft: '4px' }}>🗑️</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================================
// SALES CHALLANS
// ============================================
const SalesChallans = () => {
    const [challans, setChallans] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ customer_id: '', items: [{ product_id: '', quantity: 1 }], status: 'Draft' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [challansRes, customersRes, productsRes] = await Promise.all([
                axios.get('https://erp-backend-ztwu.onrender.com/api/sales-challans'),
                axios.get('https://erp-backend-ztwu.onrender.com/api/customers'),
                axios.get('https://erp-backend-ztwu.onrender.com/api/products')
            ]);
            setChallans(challansRes.data);
            setCustomers(customersRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('https://erp-backend-ztwu.onrender.com/api/sales-challans', formData);
            setShowForm(false);
            setFormData({ customer_id: '', items: [{ product_id: '', quantity: 1 }], status: 'Draft' });
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create challan');
            console.error(error);
        }
    };

    const handleConfirm = async (id: number) => {
        if (!window.confirm('Confirm this challan? Stock will be reduced.')) return;
        try {
            await axios.put(`https://erp-backend-ztwu.onrender.com/api/sales-challans/${id}/confirm`);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to confirm');
        }
    };

    const handleCancel = async (id: number) => {
        if (!window.confirm('Cancel this challan?')) return;
        try {
            await axios.put(`https://erp-backend-ztwu.onrender.com/api/sales-challans/${id}/cancel`);
            fetchData();
        } catch (error) {
            alert('Failed to cancel');
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product_id: '', quantity: 1 }]
        });
    };

    const removeItem = (index: number) => {
        const items = formData.items.filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, items });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const items = formData.items.map((item: any, i: number) =>
            i === index ? { ...item, [field]: value } : item
        );
        setFormData({ ...formData, items });
    };

    if (loading) return <div style={styles.card}>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', margin: 0 }}>Sales Challans</h1>
                <button onClick={() => setShowForm(!showForm)} style={{ ...styles.button, background: theme.colors.primary, color: 'white' }}>
                    + New Challan
                </button>
            </div>

            {showForm && (
                <div style={styles.card}>
                    <h3 style={{ marginTop: 0 }}>Create New Challan</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Customer *</label>
                            <select
                                value={formData.customer_id}
                                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                style={styles.input}
                                required
                            >
                                <option value="">Select Customer</option>
                                {customers.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                style={styles.input}
                            >
                                <option value="Draft">Draft (Stock not reduced)</option>
                                <option value="Confirmed">Confirmed (Stock reduced)</option>
                            </select>
                        </div>

                        <h4 style={{ margin: '16px 0 8px 0' }}>Products</h4>
                        {formData.items.map((item: any, index: number) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                <select
                                    value={item.product_id}
                                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                    style={{ flex: 2, ...styles.input }}
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    style={{ flex: 1, ...styles.input }}
                                    min="1"
                                    required
                                />
                                <button type="button" onClick={() => removeItem(index)} style={{ ...styles.button, background: '#fee2e2', color: '#991b1b' }}>
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addItem} style={{ ...styles.button, background: '#e2e8f0', color: '#0f172a' }}>
                            + Add Product
                        </button>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button type="submit" style={{ ...styles.button, background: theme.colors.success, color: 'white' }}>
                                Create Challan
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={{ ...styles.button, background: '#e2e8f0', color: '#0f172a' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Challan #</th>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Items</th>
                            <th style={styles.th}>Total</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {challans.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>
                                    No challans found
                                </td>
                            </tr>
                        ) : (
                            challans.map((c: any) => (
                                <tr key={c.id}>
                                    <td style={styles.td}><strong>{c.challan_number}</strong></td>
                                    <td style={styles.td}>{c.customer_name}</td>
                                    <td style={styles.td}>{c.total_quantity}</td>
                                    <td style={styles.td}>₹{c.total_amount}</td>
                                    <td style={styles.td}><Badge status={c.status} /></td>
                                    <td style={styles.td}>
                                        {c.status === 'Draft' && (
                                            <>
                                                <button onClick={() => handleConfirm(c.id)} style={{ ...styles.button, background: '#dcfce7', color: '#166534', padding: '6px 12px', fontSize: '12px' }}>✅ Confirm</button>
                                                <button onClick={() => handleCancel(c.id)} style={{ ...styles.button, background: '#fee2e2', color: '#991b1b', padding: '6px 12px', fontSize: '12px', marginLeft: '4px' }}>❌ Cancel</button>
                                            </>
                                        )}
                                        {c.status === 'Confirmed' && <span style={{ color: '#22c55e', fontSize: '14px' }}>✓ Completed</span>}
                                        {c.status === 'Cancelled' && <span style={{ color: '#ef4444', fontSize: '14px' }}>✗ Cancelled</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================================
// PROTECTED ROUTE
// ============================================
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    return token ? <>{children}</> : <Navigate to="/login" />;
};

// ============================================
// LAYOUT
// ============================================
const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.content}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white', padding: '16px 24px', borderRadius: theme.radius, boxShadow: theme.shadow }}>
                    <div>
                        <span style={{ fontWeight: 600 }}>👋 Welcome, {user?.full_name || 'User'}</span>
                        <span style={{ marginLeft: '12px', fontSize: '12px', background: '#e2e8f0', padding: '2px 12px', borderRadius: '12px', color: '#475569' }}>
                            {user?.role || 'sales'}
                        </span>
                    </div>
                    <button onClick={handleLogout} style={{ ...styles.button, background: '#fee2e2', color: '#991b1b' }}>
                        🚪 Logout
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// ============================================
// APP
// ============================================
const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                    <Route path="/customers" element={<ProtectedRoute><Layout><CrudTable title="Customers" endpoint="customers" fields={['name', 'mobile', 'email', 'company', 'status']} /></Layout></ProtectedRoute>} />
                    <Route path="/products" element={<ProtectedRoute><Layout><CrudTable title="Products" endpoint="products" fields={['name', 'sku', 'unit_price', 'current_stock']} /></Layout></ProtectedRoute>} />
                    <Route path="/challans" element={<ProtectedRoute><Layout><SalesChallans /></Layout></ProtectedRoute>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;