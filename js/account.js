// Account Management Module
class AccountManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.user = null;
        this.orders = [];
        this.addresses = [];
        this.wishlist = [];
        this.stats = {
            totalOrders: 0,
            totalSpent: 0,
            wishlistCount: 0,
            loyaltyPoints: 0
        };
    }

    async init() {
        try {
            // Check if user is authenticated
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            this.user = user;
            await this.loadUserProfile();
            await this.loadUserData();
            this.setupEventListeners();
            this.updateUI();
        } catch (error) {
            console.error('Error initializing account:', error);
            utils.showToast('Error loading account data', 'error');
        }
    }

    async loadUserProfile() {
        try {
            const { data: profile, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', this.user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (profile) {
                this.userProfile = profile;
                this.populateProfileForm(profile);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async loadUserData() {
        await Promise.all([
            this.loadOrders(),
            this.loadAddresses(),
            this.loadWishlist(),
            this.calculateStats()
        ]);
    }

    async loadOrders() {
        try {
            const { data: orders, error } = await supabaseClient
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (*)
                    )
                `)
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.orders = orders || [];
            this.renderOrders();
            this.renderRecentOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    async loadAddresses() {
        try {
            // For now, we'll use local storage for addresses
            // In a real app, you'd have an addresses table
            const savedAddresses = localStorage.getItem(`addresses_${this.user.id}`);
            this.addresses = savedAddresses ? JSON.parse(savedAddresses) : [];
            this.renderAddresses();
        } catch (error) {
            console.error('Error loading addresses:', error);
        }
    }

    async loadWishlist() {
        try {
            // For now, we'll use local storage for wishlist
            // In a real app, you'd have a wishlist table
            const savedWishlist = localStorage.getItem(`wishlist_${this.user.id}`);
            this.wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
            this.renderWishlist();
        } catch (error) {
            console.error('Error loading wishlist:', error);
        }
    }

    async calculateStats() {
        try {
            this.stats.totalOrders = this.orders.length;
            this.stats.totalSpent = this.orders.reduce((total, order) => total + parseFloat(order.total_amount), 0);
            this.stats.wishlistCount = this.wishlist.length;
            this.stats.loyaltyPoints = Math.floor(this.stats.totalSpent / 10); // 1 point per $10 spent

            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error calculating stats:', error);
        }
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.classList.contains('sign-out')) {
                    this.handleSignOut();
                    return;
                }

                const tab = item.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Quick action links
        document.querySelectorAll('[data-tab-link]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.dataset.tabLink;
                this.switchTab(tab);
            });
        });

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Change password form
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const input = toggle.parentElement.querySelector('input');
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // Add address button
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', () => this.showAddressForm());
        }

        // Order filters
        const filterOrdersBtn = document.getElementById('filterOrders');
        const clearFiltersBtn = document.getElementById('clearFilters');
        
        if (filterOrdersBtn) {
            filterOrdersBtn.addEventListener('click', () => this.filterOrders());
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearOrderFilters());
        }

        // Delete account
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.handleDeleteAccount());
        }
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`${tabName}Tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        this.currentTab = tabName;
    }

    updateUI() {
        // Update user name in header
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.userProfile) {
            const displayName = this.userProfile.first_name || this.user.email.split('@')[0];
            userNameElement.textContent = displayName;
        }
    }

    updateStatsDisplay() {
        const elements = {
            totalOrders: document.getElementById('totalOrders'),
            totalSpent: document.getElementById('totalSpent'),
            wishlistCount: document.getElementById('wishlistCount'),
            loyaltyPoints: document.getElementById('loyaltyPoints')
        };

        if (elements.totalOrders) {
            elements.totalOrders.textContent = this.stats.totalOrders;
        }
        
        if (elements.totalSpent) {
            elements.totalSpent.textContent = formatCurrency(this.stats.totalSpent);
        }
        
        if (elements.wishlistCount) {
            elements.wishlistCount.textContent = this.stats.wishlistCount;
        }
        
        if (elements.loyaltyPoints) {
            elements.loyaltyPoints.textContent = this.stats.loyaltyPoints;
        }
    }

    renderRecentOrders() {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        const recentOrders = this.orders.slice(0, 3);
        
        if (recentOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h4>No orders yet</h4>
                    <p>Start shopping to see your orders here</p>
                    <a href="catalog.html" class="btn btn-primary">${window.i18n.t('startShopping')}</a>
                </div>
            `;
            return;
        }

        container.innerHTML = recentOrders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id.slice(-8)}</h4>
                        <p class="order-date">${formatDate(order.created_at)}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.order_items.slice(0, 2).map(item => `
                        <div class="order-item">
                            <img src="${item.products.image_url}" alt="${item.products.name}">
                            <div class="item-details">
                                <h5>${item.products.name}</h5>
                                <p>Qty: ${item.quantity}</p>
                            </div>
                        </div>
                    `).join('')}
                    ${order.order_items.length > 2 ? `<p class="more-items">+${order.order_items.length - 2} more items</p>` : ''}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        <strong>${formatCurrency(order.total_amount)}</strong>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="accountManager.viewOrderDetails('${order.id}')">
                        ${window.i18n.t('viewDetails')}
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderOrders() {
        const container = document.getElementById('ordersContainer');
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h4>${window.i18n.t('noOrdersFound')}</h4>
                    <p>${window.i18n.t('youHaventPlacedOrdersYet')}</p>
                    <a href="catalog.html" class="btn btn-primary">${window.i18n.t('startShopping')}</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.orders.map(order => `
            <div class="order-card detailed">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id.slice(-8)}</h4>
                        <p class="order-date">Placed on ${formatDate(order.created_at)}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                </div>
                
                <div class="order-summary">
                    <div class="summary-item">
                        <span>${window.i18n.t('items')}</span>
                        <span>${order.order_items.length}</span>
                    </div>
                    <div class="summary-item">
                        <span>${window.i18n.t('total')}</span>
                        <span><strong>${formatCurrency(order.total_amount)}</strong></span>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="accountManager.viewOrderDetails('${order.id}')">
                        ${window.i18n.t('viewDetails')}
                    </button>
                    ${order.status === 'delivered' ? `
                        <button class="btn btn-primary btn-sm" onclick="accountManager.reorderItems('${order.id}')">
                            ${window.i18n.t('reorder')}
                        </button>
                    ` : ''}
                    ${order.status === 'pending' ? `
                        <button class="btn btn-danger btn-sm" onclick="accountManager.cancelOrder('${order.id}')">
                            ${window.i18n.t('cancel')}
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderAddresses() {
        const container = document.getElementById('addressesContainer');
        if (!container) return;

        if (this.addresses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h4>No saved addresses</h4>
                    <p>Add an address to make checkout faster</p>
                    <button class="btn btn-primary" onclick="accountManager.showAddressForm()">${window.i18n.t('addAddress')}</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.addresses.map((address, index) => `
            <div class="address-card">
                <div class="address-header">
                    <h4>${address.label}</h4>
                    ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
                
                <div class="address-content">
                    <p><strong>${address.firstName} ${address.lastName}</strong></p>
                    <p>${address.address}</p>
                    <p>${address.city}, ${address.state} ${address.zipCode}</p>
                    <p>${address.country}</p>
                    ${address.phone ? `<p>Phone: ${address.phone}</p>` : ''}
                </div>
                
                <div class="address-actions">
                    <button class="btn btn-outline btn-sm" onclick="accountManager.editAddress(${index})">
                        Edit
                    </button>
                    ${!address.isDefault ? `
                        <button class="btn btn-text btn-sm" onclick="accountManager.setDefaultAddress(${index})">
                            Set Default
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="accountManager.deleteAddress(${index})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderWishlist() {
        const container = document.getElementById('wishlistGrid');
        if (!container) return;

        if (this.wishlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h4>Your wishlist is empty</h4>
                    <p>Save items you love to your wishlist</p>
                    <a href="catalog.html" class="btn btn-primary">${window.i18n.t('browseProducts')}</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.wishlist.map(item => `
            <div class="wishlist-item">
                <div class="item-image">
                    <img src="${item.image_url}" alt="${item.name}">
                    <button class="remove-wishlist" onclick="accountManager.removeFromWishlist('${item.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="item-content">
                    <h4>${item.name}</h4>
                    <p class="item-price">${formatCurrency(item.price)}</p>
                    
                    <div class="item-actions">
                        <a href="product-details.html?id=${item.id}" class="btn btn-outline btn-sm">${window.i18n.t('viewProduct')}</a>
                        <button class="btn btn-primary btn-sm" onclick="accountManager.addToCartFromWishlist('${item.id}')">
                            ${window.i18n.t('addToCart')}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateProfileForm(profile) {
        const fields = {
            profileFirstName: profile.first_name || '',
            profileLastName: profile.last_name || '',
            profileEmail: this.user.email || '',
            profilePhone: profile.phone || '',
            profileDateOfBirth: profile.date_of_birth || '',
            emailNotifications: profile.email_notifications || false,
            smsNotifications: profile.sms_notifications || false,
            newsletter: profile.newsletter || false
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const element = document.getElementById(fieldId);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        try {
            utils.showLoading();
            
            const formData = new FormData(e.target);
            const profileData = {
                first_name: formData.get('firstName'),
                last_name: formData.get('lastName'),
                phone: formData.get('phone'),
                date_of_birth: formData.get('dateOfBirth') || null,
                email_notifications: formData.has('emailNotifications'),
                sms_notifications: formData.has('smsNotifications'),
                newsletter: formData.has('newsletter'),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabaseClient
                .from('user_profiles')
                .upsert({
                    id: this.user.id,
                    ...profileData
                });

            if (error) throw error;

            this.userProfile = { ...this.userProfile, ...profileData };
            this.updateUI();
            
            utils.showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            utils.showToast('Error updating profile', 'error');
        } finally {
            utils.hideLoading();
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmNewPassword');

            if (newPassword !== confirmPassword) {
                utils.showToast('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                utils.showToast('Password must be at least 6 characters long', 'error');
                return;
            }

            utils.showLoading();

            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            utils.showToast('Password updated successfully', 'success');
            e.target.reset();
        } catch (error) {
            console.error('Error updating password:', error);
            utils.showToast('Error updating password', 'error');
        } finally {
            utils.hideLoading();
        }
    }

    async handleSignOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
            utils.showToast('Error signing out', 'error');
        }
    }

    filterOrders() {
        const status = document.getElementById('orderStatusFilter').value;
        const dateFrom = document.getElementById('orderDateFrom').value;
        const dateTo = document.getElementById('orderDateTo').value;

        let filteredOrders = [...this.orders];

        if (status) {
            filteredOrders = filteredOrders.filter(order => order.status === status);
        }

        if (dateFrom) {
            filteredOrders = filteredOrders.filter(order => 
                new Date(order.created_at) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            filteredOrders = filteredOrders.filter(order => 
                new Date(order.created_at) <= new Date(dateTo)
            );
        }

        // Temporarily replace orders for rendering
        const originalOrders = this.orders;
        this.orders = filteredOrders;
        this.renderOrders();
        this.orders = originalOrders;
    }

    clearOrderFilters() {
        document.getElementById('orderStatusFilter').value = '';
        document.getElementById('orderDateFrom').value = '';
        document.getElementById('orderDateTo').value = '';
        this.renderOrders();
    }

    viewOrderDetails(orderId) {
        // In a real app, you'd navigate to an order details page
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            alert(`Order Details:\n\nOrder ID: ${order.id}\nStatus: ${order.status}\nTotal: ${formatCurrency(order.total_amount)}\nItems: ${order.order_items.length}`);
        }
    }

    async reorderItems(orderId) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) return;

            utils.showLoading();

            // Add all items from the order to cart
            for (const item of order.order_items) {
                await cartManager.addToCart(item.products, item.quantity, item.size, item.color);
            }

            utils.showToast('Items added to cart', 'success');
            
            // Redirect to cart
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1000);
        } catch (error) {
            console.error('Error reordering items:', error);
            utils.showToast('Error adding items to cart', 'error');
        } finally {
            utils.hideLoading();
        }
    }

    async cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            utils.showLoading();

            const { error } = await supabaseClient
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);

            if (error) throw error;

            await this.loadOrders();
            utils.showToast('Order cancelled successfully', 'success');
        } catch (error) {
            console.error('Error cancelling order:', error);
            utils.showToast('Error cancelling order', 'error');
        } finally {
            utils.hideLoading();
        }
    }

    showAddressForm(address = null, index = null) {
        // In a real app, you'd show a modal or navigate to an address form page
        const isEdit = address !== null;
        const title = isEdit ? 'Edit Address' : 'Add New Address';
        
        // For demo purposes, we'll use a simple prompt
        const addressData = {
            label: prompt(`${title} - Label (e.g., Home, Work):`, address?.label || ''),
            firstName: prompt('First Name:', address?.firstName || ''),
            lastName: prompt('Last Name:', address?.lastName || ''),
            address: prompt('Address:', address?.address || ''),
            city: prompt('City:', address?.city || ''),
            state: prompt('State:', address?.state || ''),
            zipCode: prompt('ZIP Code:', address?.zipCode || ''),
            country: prompt('Country:', address?.country || 'United States'),
            phone: prompt('Phone (optional):', address?.phone || '')
        };

        if (addressData.label && addressData.firstName && addressData.lastName && 
            addressData.address && addressData.city && addressData.state && addressData.zipCode) {
            
            if (isEdit) {
                this.addresses[index] = { ...addressData, isDefault: address.isDefault };
            } else {
                addressData.isDefault = this.addresses.length === 0;
                this.addresses.push(addressData);
            }

            this.saveAddresses();
            this.renderAddresses();
            utils.showToast(`Address ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        }
    }

    editAddress(index) {
        this.showAddressForm(this.addresses[index], index);
    }

    setDefaultAddress(index) {
        this.addresses.forEach((addr, i) => {
            addr.isDefault = i === index;
        });
        
        this.saveAddresses();
        this.renderAddresses();
        utils.showToast('Default address updated', 'success');
    }

    deleteAddress(index) {
        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }

        const wasDefault = this.addresses[index].isDefault;
        this.addresses.splice(index, 1);
        
        // If deleted address was default, make first address default
        if (wasDefault && this.addresses.length > 0) {
            this.addresses[0].isDefault = true;
        }
        
        this.saveAddresses();
        this.renderAddresses();
        utils.showToast('Address deleted successfully', 'success');
    }

    saveAddresses() {
        localStorage.setItem(`addresses_${this.user.id}`, JSON.stringify(this.addresses));
    }

    removeFromWishlist(productId) {
        this.wishlist = this.wishlist.filter(item => item.id !== productId);
        localStorage.setItem(`wishlist_${this.user.id}`, JSON.stringify(this.wishlist));
        this.renderWishlist();
        this.calculateStats();
        utils.showToast('Item removed from wishlist', 'success');
    }

    async addToCartFromWishlist(productId) {
        try {
            const item = this.wishlist.find(item => item.id === productId);
            if (!item) return;

            await cartManager.addToCart(item, 1);
            utils.showToast('Item added to cart', 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            utils.showToast('Error adding item to cart', 'error');
        }
    }

    async handleDeleteAccount() {
        const confirmation = prompt('Type "DELETE" to confirm account deletion:');
        if (confirmation !== 'DELETE') {
            return;
        }

        if (!confirm('This action cannot be undone. Are you absolutely sure?')) {
            return;
        }

        try {
            utils.showLoading();

            // In a real app, you'd call an API endpoint to handle account deletion
            // This would involve deleting user data, orders, etc.
            alert('Account deletion is not implemented in this demo.');
            
        } catch (error) {
            console.error('Error deleting account:', error);
            utils.showToast('Error deleting account', 'error');
        } finally {
            utils.hideLoading();
        }
    }
}

// Initialize account manager
let accountManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccountManager };
} else {
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        accountManager = new AccountManager();
        accountManager.init();
    });
}