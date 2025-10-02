// Admin Panel Manager
class AdminManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.charts = {};
        this.currentUser = null;
        this.filters = {
            products: {},
            orders: {},
            customers: {},
            reviews: {}
        };
        this.pagination = {
            products: { page: 1, limit: 10, total: 0 },
            orders: { page: 1, limit: 10, total: 0 },
            customers: { page: 1, limit: 10, total: 0 }
        };
    }

    async init() {
        try {
            // Check authentication
            await this.checkAuth();
            
            // Initialize UI
            this.initializeUI();
            
            // Load initial data
            await this.loadDashboardData();
            
            console.log('Admin panel initialized successfully');
        } catch (error) {
            console.error('Failed to initialize admin panel:', error);
            this.redirectToLogin();
        }
    }

    async checkAuth() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            throw new Error('Not authenticated');
        }

        // Check if user is admin
        const { data: profile } = await supabaseClient
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            throw new Error('Not authorized');
        }

        this.currentUser = user;
        document.getElementById('adminUserName').textContent = user.email;
    }

    initializeUI() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Quick action buttons
        document.querySelectorAll('[data-tab-link]').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tabLink;
                const action = e.currentTarget.dataset.action;
                this.switchTab(tab);
                if (action) {
                    this.handleQuickAction(action);
                }
            });
        });

        // User menu
        const userBtn = document.getElementById('adminUserBtn');
        const userDropdown = document.getElementById('adminUserDropdown');
        
        userBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('show');
        });

        // Sign out
        document.getElementById('adminSignOutBtn').addEventListener('click', () => {
            this.signOut();
        });

        // Form submissions
        this.initializeForms();
        
        // Filters and search
        this.initializeFilters();
        
        // Analytics
        this.initializeAnalytics();
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        utils.showLoading();
        
        try {
            switch (tabName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'analytics':
                    await this.loadAnalyticsData();
                    break;
                case 'products':
                    await this.loadProducts();
                    break;
                case 'orders':
                    await this.loadOrders();
                    break;
                case 'customers':
                    await this.loadCustomers();
                    break;
                case 'categories':
                    await this.loadCategories();
                    break;
                case 'inventory':
                    await this.loadInventory();
                    break;
                case 'reviews':
                    await this.loadReviews();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${tabName} data:`, error);
            utils.showToast('Failed to load data', 'error');
        } finally {
            utils.hideLoading();
        }
    }

    async loadDashboardData() {
        try {
            // Load stats
            const stats = await this.getStats();
            this.updateStatsCards(stats);

            // Load recent orders
            const recentOrders = await this.getRecentOrders();
            this.renderRecentOrders(recentOrders);

            // Load low stock items
            const lowStockItems = await this.getLowStockItems();
            this.renderLowStockItems(lowStockItems);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async getStats() {
        const [ordersResult, customersResult, productsResult] = await Promise.all([
            supabaseClient.from('orders').select('total, created_at'),
            supabaseClient.from('user_profiles').select('id, created_at'),
            supabaseClient.from('products').select('id')
        ]);

        const orders = ordersResult.data || [];
        const customers = customersResult.data || [];
        const products = productsResult.data || [];

        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        const totalProducts = products.length;

        // Calculate changes (mock data for demo)
        return {
            revenue: { total: totalRevenue, change: 12.5 },
            orders: { total: totalOrders, change: 8.3 },
            customers: { total: totalCustomers, change: 15.2 },
            products: { total: totalProducts, change: 0 }
        };
    }

    updateStatsCards(stats) {
        document.getElementById('totalRevenue').textContent = formatCurrency(stats.revenue.total);
        document.getElementById('revenueChange').textContent = `+${stats.revenue.change}%`;
        
        document.getElementById('totalOrders').textContent = stats.orders.total;
        document.getElementById('ordersChange').textContent = `+${stats.orders.change}%`;
        
        document.getElementById('totalCustomers').textContent = stats.customers.total;
        document.getElementById('customersChange').textContent = `+${stats.customers.change}%`;
        
        document.getElementById('totalProducts').textContent = stats.products.total;
        document.getElementById('productsChange').textContent = stats.products.change;
    }

    async getRecentOrders() {
        const { data, error } = await supabaseClient
            .from('orders')
            .select(`
                id,
                total,
                status,
                created_at,
                user_profiles(full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;
        return data || [];
    }

    renderRecentOrders(orders) {
        const container = document.getElementById('recentOrdersList');
        
        if (orders.length === 0) {
            container.innerHTML = '<p class="empty-state">No recent orders</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="recent-order-item">
                <div class="order-info">
                    <h4>#${order.id.slice(0, 8)}</h4>
                    <p>${order.user_profiles?.full_name || 'Guest'}</p>
                </div>
                <div class="order-details">
                    <span class="order-total">${formatCurrency(order.total)}</span>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
            </div>
        `).join('');
    }

    async getLowStockItems() {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id, name, stock_quantity')
            .lt('stock_quantity', 10)
            .order('stock_quantity', { ascending: true })
            .limit(5);

        if (error) throw error;
        return data || [];
    }

    renderLowStockItems(items) {
        const container = document.getElementById('lowStockList');
        
        if (items.length === 0) {
            container.innerHTML = '<p class="empty-state">All items are well stocked</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="low-stock-item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>Stock: ${item.stock_quantity}</p>
                </div>
                <div class="stock-status">
                    <span class="stock-level ${item.stock_quantity === 0 ? 'out-of-stock' : 'low-stock'}">
                        ${item.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    async loadProducts() {
        try {
            const { page, limit } = this.pagination.products;
            const offset = (page - 1) * limit;

            let query = supabaseClient
                .from('products')
                .select(`
                    *,
                    categories(name)
                `, { count: 'exact' })
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            // Apply filters
            const filters = this.filters.products;
            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }
            if (filters.category) {
                query = query.eq('category_id', filters.category);
            }
            if (filters.status) {
                if (filters.status === 'out_of_stock') {
                    query = query.eq('stock_quantity', 0);
                } else {
                    query = query.eq('status', filters.status);
                }
            }

            const { data, error, count } = await query;
            if (error) throw error;

            this.pagination.products.total = count;
            this.renderProducts(data || []);
            this.renderPagination('products');
        } catch (error) {
            console.error('Failed to load products:', error);
            utils.showToast('Failed to load products', 'error');
        }
    }

    renderProducts(products) {
        const tbody = document.getElementById('productsTableBody');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => {
            const status = product.stock_quantity === 0 ? 'out_of_stock' : product.status;
            return `
                <tr>
                    <td>
                        <div class="product-cell">
                            <img src="${product.image_url || '/images/placeholder.jpg'}" alt="${product.name}" class="product-thumb">
                            <div>
                                <h4>${product.name}</h4>
                                <p>SKU: ${product.sku || 'N/A'}</p>
                            </div>
                        </div>
                    </td>
                    <td>${product.categories?.name || 'Uncategorized'}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${product.stock_quantity}</td>
                    <td><span class="status-badge status-${status}">${status.replace('_', ' ')}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="adminManager.editProduct('${product.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="adminManager.deleteProduct('${product.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async loadOrders() {
        try {
            const { page, limit } = this.pagination.orders;
            const offset = (page - 1) * limit;

            let query = supabaseClient
                .from('orders')
                .select(`
                    *,
                    user_profiles(full_name, email),
                    order_items(quantity, products(name))
                `, { count: 'exact' })
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            // Apply filters
            const filters = this.filters.orders;
            if (filters.search) {
                query = query.or(`id.ilike.%${filters.search}%,user_profiles.email.ilike.%${filters.search}%`);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            this.pagination.orders.total = count;
            this.renderOrders(data || []);
            this.renderPagination('orders');
        } catch (error) {
            console.error('Failed to load orders:', error);
            utils.showToast('Failed to load orders', 'error');
        }
    }

    renderOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        
        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${window.i18n.t('noOrdersFound')}</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const itemCount = order.order_items?.length || 0;
            const customerName = order.user_profiles?.full_name || 'Guest';
            
            return `
                <tr>
                    <td>
                        <a href="#" onclick="adminManager.viewOrder('${order.id}')" class="order-link">
                            #${order.id.slice(0, 8)}
                        </a>
                    </td>
                    <td>
                        <div>
                            <h4>${customerName}</h4>
                            <p>${order.user_profiles?.email || 'N/A'}</p>
                        </div>
                    </td>
                    <td>${formatDate(order.created_at)}</td>
                    <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                    <td>${formatCurrency(order.total)}</td>
                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="adminManager.viewOrder('${order.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="adminManager.updateOrderStatus('${order.id}')" title="Update Status">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async loadCustomers() {
        try {
            const { page, limit } = this.pagination.customers;
            const offset = (page - 1) * limit;

            let query = supabaseClient
                .from('user_profiles')
                .select(`
                    *,
                    orders(total)
                `, { count: 'exact' })
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            // Apply filters
            const filters = this.filters.customers;
            if (filters.search) {
                query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            this.pagination.customers.total = count;
            this.renderCustomers(data || []);
            this.renderPagination('customers');
        } catch (error) {
            console.error('Failed to load customers:', error);
            utils.showToast('Failed to load customers', 'error');
        }
    }

    renderCustomers(customers) {
        const tbody = document.getElementById('customersTableBody');
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No customers found</td></tr>';
            return;
        }

        tbody.innerHTML = customers.map(customer => {
            const orderCount = customer.orders?.length || 0;
            const totalSpent = customer.orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            
            return `
                <tr>
                    <td>
                        <div class="customer-cell">
                            <div class="customer-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <h4>${customer.full_name || 'N/A'}</h4>
                                <p>ID: ${customer.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </td>
                    <td>${customer.email}</td>
                    <td>${orderCount}</td>
                    <td>${formatCurrency(totalSpent)}</td>
                    <td>${formatDate(customer.created_at)}</td>
                    <td><span class="status-badge status-active">Active</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="adminManager.viewCustomer('${customer.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="adminManager.editCustomer('${customer.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPagination(type) {
        const container = document.getElementById(`${type}Pagination`);
        const { page, limit, total } = this.pagination[type];
        const totalPages = Math.ceil(total / limit);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-info">';
        paginationHTML += `<span>Showing ${((page - 1) * limit) + 1}-${Math.min(page * limit, total)} of ${total}</span>`;
        paginationHTML += '</div><div class="pagination-controls">';

        // Previous button
        paginationHTML += `<button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="adminManager.changePage('${type}', ${page - 1})">`;
        paginationHTML += '<i class="fas fa-chevron-left"></i></button>';

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="adminManager.changePage('${type}', ${i})">${i}</button>`;
        }

        // Next button
        paginationHTML += `<button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} onclick="adminManager.changePage('${type}', ${page + 1})">`;
        paginationHTML += '<i class="fas fa-chevron-right"></i></button></div>';

        container.innerHTML = paginationHTML;
    }

    changePage(type, newPage) {
        this.pagination[type].page = newPage;
        this.loadTabData(type);
    }

    initializeForms() {
        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }

    initializeFilters() {
        // Product filters
        const productSearch = document.getElementById('productSearch');
        const productCategoryFilter = document.getElementById('productCategoryFilter');
        const productStatusFilter = document.getElementById('productStatusFilter');
        const filterProductsBtn = document.getElementById('filterProducts');
        const clearProductFiltersBtn = document.getElementById('clearProductFilters');

        if (filterProductsBtn) {
            filterProductsBtn.addEventListener('click', () => {
                this.filters.products = {
                    search: productSearch?.value || '',
                    category: productCategoryFilter?.value || '',
                    status: productStatusFilter?.value || ''
                };
                this.pagination.products.page = 1;
                this.loadProducts();
            });
        }

        if (clearProductFiltersBtn) {
            clearProductFiltersBtn.addEventListener('click', () => {
                this.filters.products = {};
                this.pagination.products.page = 1;
                if (productSearch) productSearch.value = '';
                if (productCategoryFilter) productCategoryFilter.value = '';
                if (productStatusFilter) productStatusFilter.value = '';
                this.loadProducts();
            });
        }

        // Similar setup for other filters...
    }

    initializeAnalytics() {
        const refreshBtn = document.getElementById('refreshAnalytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalyticsData();
            });
        }
    }

    async loadAnalyticsData() {
        try {
            // Load chart data
            await this.loadRevenueChart();
            await this.loadOrdersChart();
            await this.loadProductsChart();
            await this.loadCustomersChart();
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        }
    }

    async loadRevenueChart() {
        // Mock data for demo
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [1200, 1900, 3000, 5000, 2000, 3000],
                    borderColor: '#2D5A27',
                    backgroundColor: 'rgba(45, 90, 39, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    async loadOrdersChart() {
        const ctx = document.getElementById('ordersChart');
        if (!ctx) return;

        if (this.charts.orders) {
            this.charts.orders.destroy();
        }

        this.charts.orders = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Processing', 'Shipped', 'Delivered'],
                datasets: [{
                    data: [12, 8, 15, 25],
                    backgroundColor: [
                        '#FFA500',
                        '#2D5A27',
                        '#D4AF37',
                        '#228B22'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async loadProductsChart() {
        const ctx = document.getElementById('productsChart');
        if (!ctx) return;

        if (this.charts.products) {
            this.charts.products.destroy();
        }

        this.charts.products = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Abayas', 'Hijabs', 'Accessories', 'Prayer Wear'],
                datasets: [{
                    label: 'Sales',
                    data: [45, 32, 18, 12],
                    backgroundColor: '#2D5A27'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async loadCustomersChart() {
        const ctx = document.getElementById('customersChart');
        if (!ctx) return;

        if (this.charts.customers) {
            this.charts.customers.destroy();
        }

        this.charts.customers = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Customers',
                    data: [5, 12, 8, 15, 20, 18],
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async loadCategories() {
        try {
            const { data, error } = await supabaseClient
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            this.renderCategories(data || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
            utils.showToast('Failed to load categories', 'error');
        }
    }

    renderCategories(categories) {
        const container = document.getElementById('categoriesGrid');
        
        if (categories.length === 0) {
            container.innerHTML = '<p class="empty-state">No categories found</p>';
            return;
        }

        container.innerHTML = categories.map(category => `
            <div class="category-card">
                <div class="category-image">
                    <img src="${category.image_url || '/images/placeholder.jpg'}" alt="${category.name}">
                </div>
                <div class="category-content">
                    <h3>${category.name}</h3>
                    <p>${category.description || 'No description'}</p>
                    <div class="category-actions">
                        <button class="btn btn-outline" onclick="adminManager.editCategory('${category.id}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="btn btn-danger" onclick="adminManager.deleteCategory('${category.id}')">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadInventory() {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id, name, sku, stock_quantity')
                .order('stock_quantity', { ascending: true });

            if (error) throw error;
            this.renderInventory(data || []);
            this.updateInventoryAlerts(data || []);
        } catch (error) {
            console.error('Failed to load inventory:', error);
            utils.showToast('Failed to load inventory', 'error');
        }
    }

    renderInventory(products) {
        const tbody = document.getElementById('inventoryTableBody');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => {
            const status = product.stock_quantity === 0 ? 'out-of-stock' : 
                          product.stock_quantity < 10 ? 'low-stock' : 'in-stock';
            
            return `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.sku || 'N/A'}</td>
                    <td>${product.stock_quantity}</td>
                    <td>0</td>
                    <td>${product.stock_quantity}</td>
                    <td><span class="status-badge status-${status}">${status.replace('-', ' ')}</span></td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="adminManager.updateStock('${product.id}')">
                            Update Stock
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateInventoryAlerts(products) {
        const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;
        const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

        document.getElementById('lowStockCount').textContent = `${lowStockCount} items need restocking`;
        document.getElementById('outOfStockCount').textContent = `${outOfStockCount} items out of stock`;
    }

    async loadReviews() {
        try {
            const { data, error } = await supabaseClient
                .from('reviews')
                .select(`
                    *,
                    products(name),
                    user_profiles(full_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.renderReviews(data || []);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            utils.showToast('Failed to load reviews', 'error');
        }
    }

    renderReviews(reviews) {
        const container = document.getElementById('reviewsList');
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="empty-state">No reviews found</p>';
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-info">
                        <h4>${review.user_profiles?.full_name || 'Anonymous'}</h4>
                        <p>${review.products?.name || 'Unknown Product'}</p>
                        <div class="review-rating">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="fas fa-star ${i < review.rating ? 'active' : ''}"></i>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="review-actions">
                        <span class="review-status status-${review.status || 'pending'}">
                            ${review.status || 'pending'}
                        </span>
                        <button class="btn btn-outline btn-sm" onclick="adminManager.moderateReview('${review.id}', 'approved')">
                            Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminManager.moderateReview('${review.id}', 'rejected')">
                            Reject
                        </button>
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.comment}</p>
                    <small>Posted on ${formatDate(review.created_at)}</small>
                </div>
            </div>
        `).join('');
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add-product':
                this.showAddProductModal();
                break;
        }
    }

    showAddProductModal() {
        // Implementation for add product modal
        utils.showToast('Add product feature coming soon', 'info');
    }

    async saveSettings() {
        try {
            utils.showLoading();
            
            // Get form data
            const formData = new FormData(document.getElementById('settingsForm'));
            const settings = Object.fromEntries(formData);
            
            // Save to local storage or database
            localStorage.setItem('storeSettings', JSON.stringify(settings));
            
            utils.showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            utils.showToast('Failed to save settings', 'error');
        } finally {
            utils.hideLoading();
        }
    }

    async signOut() {
        try {
            await supabaseClient.auth.signOut();
            this.redirectToLogin();
        } catch (error) {
            console.error('Failed to sign out:', error);
            utils.showToast('Failed to sign out', 'error');
        }
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    // Placeholder methods for future implementation
    editProduct(id) { utils.showToast('Edit product feature coming soon', 'info'); }
    deleteProduct(id) { utils.showToast('Delete product feature coming soon', 'info'); }
    viewOrder(id) { utils.showToast('View order feature coming soon', 'info'); }
    updateOrderStatus(id) { utils.showToast('Update order status feature coming soon', 'info'); }
    viewCustomer(id) { utils.showToast('View customer feature coming soon', 'info'); }
    editCustomer(id) { utils.showToast('Edit customer feature coming soon', 'info'); }
    editCategory(id) { utils.showToast('Edit category feature coming soon', 'info'); }
    deleteCategory(id) { utils.showToast('Delete category feature coming soon', 'info'); }
    updateStock(id) { utils.showToast('Update stock feature coming soon', 'info'); }
     moderateReview(id, status) { utils.showToast(`Review ${status} feature coming soon`, 'info'); }
}

// Initialize admin manager
const adminManager = new AdminManager();

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => adminManager.init());
} else {
    adminManager.init();
}