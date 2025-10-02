// Checkout Manager
class CheckoutManager {
    constructor() {
        this.cart = null;
        this.shippingRates = {
            standard: 0,
            express: 9.99,
            overnight: 24.99
        };
        this.taxRate = 0.08; // 8% tax rate
        this.promoCode = null;
        this.discount = 0;
        this.user = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Check if user is authenticated
            this.user = await AuthManager.getCurrentUser();
            
            // Initialize cart
            this.cart = new CartManager();
            await this.cart.loadCart();
            
            // Check if cart is empty
            if (this.cart.items.length === 0) {
                window.location.href = 'cart.html';
                return;
            }
            
            // Setup UI
            this.setupEventListeners();
            this.populateUserInfo();
            this.renderOrderItems();
            this.updateOrderSummary();
            
        } catch (error) {
            console.error('Error initializing checkout:', error);
            utils.showToast('Error loading checkout page', 'error');
        }
    }
    
    setupEventListeners() {
        // Form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        // Shipping method change
        const shippingOptions = document.querySelectorAll('input[name="shipping"]');
        shippingOptions.forEach(option => {
            option.addEventListener('change', () => this.updateOrderSummary());
        });
        
        // Payment method change
        const paymentMethods = document.querySelectorAll('input[name="payment"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', (e) => this.handlePaymentMethodChange(e));
        });
        
        // Billing address toggle
        const sameAsShipping = document.getElementById('sameAsShipping');
        if (sameAsShipping) {
            sameAsShipping.addEventListener('change', (e) => this.toggleBillingForm(e));
        }
        
        // Promo code
        const promoToggle = document.getElementById('promoToggle');
        if (promoToggle) {
            promoToggle.addEventListener('click', () => this.togglePromoForm());
        }
        
        const applyPromoBtn = document.getElementById('applyPromoBtn');
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', () => this.applyPromoCode());
        }
        
        // Card number formatting
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => this.formatCardNumber(e));
        }
        
        // Expiry date formatting
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate) {
            expiryDate.addEventListener('input', (e) => this.formatExpiryDate(e));
        }
        
        // CVV formatting
        const cvv = document.getElementById('cvv');
        if (cvv) {
            cvv.addEventListener('input', (e) => this.formatCVV(e));
        }
    }
    
    populateUserInfo() {
        if (this.user && this.user.user_metadata) {
            const { first_name, last_name, phone } = this.user.user_metadata;
            
            // Populate form fields
            const emailField = document.getElementById('email');
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            const phoneField = document.getElementById('phone');
            
            if (emailField) emailField.value = this.user.email || '';
            if (firstNameField) firstNameField.value = first_name || '';
            if (lastNameField) lastNameField.value = last_name || '';
            if (phoneField) phoneField.value = phone || '';
            
            // Hide auth prompt if user is logged in
            const authPrompt = document.getElementById('authPrompt');
            if (authPrompt) {
                authPrompt.style.display = 'none';
            }
        }
    }
    
    renderOrderItems() {
        const orderItemsContainer = document.getElementById('orderItems');
        if (!orderItemsContainer || !this.cart.items.length) return;
        
        orderItemsContainer.innerHTML = this.cart.items.map(item => `
            <div class="order-item">
                <div class="item-image">
                    <img src="${item.image_url}" alt="${item.name}" loading="lazy">
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <div class="item-options">
                        <span>Size: ${item.size}</span>
                        <span>Color: ${item.color}</span>
                    </div>
                    <div class="item-quantity">Qty: ${item.quantity}</div>
                </div>
                <div class="item-price">
                    ${formatCurrency(item.price * item.quantity)}
                </div>
            </div>
        `).join('');
    }
    
    updateOrderSummary() {
        const subtotal = this.cart.getSubtotal();
        const shippingCost = this.getShippingCost();
        const discountAmount = this.getDiscountAmount(subtotal);
        const taxAmount = this.getTaxAmount(subtotal - discountAmount);
        const total = subtotal + shippingCost - discountAmount + taxAmount;
        
        // Update UI
        const subtotalEl = document.getElementById('subtotal');
        const shippingCostEl = document.getElementById('shippingCost');
        const discountEl = document.getElementById('discount');
        const discountRow = document.getElementById('discountRow');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');
        
        if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
        if (shippingCostEl) {
            shippingCostEl.textContent = shippingCost === 0 ? 'Free' : formatCurrency(shippingCost);
        }
        if (discountEl) discountEl.textContent = `-${formatCurrency(discountAmount)}`;
        if (discountRow) {
            discountRow.style.display = discountAmount > 0 ? 'flex' : 'none';
        }
        if (taxEl) taxEl.textContent = formatCurrency(taxAmount);
        if (totalEl) totalEl.textContent = formatCurrency(total);
    }
    
    getShippingCost() {
        const selectedShipping = document.querySelector('input[name="shipping"]:checked');
        if (!selectedShipping) return 0;
        
        return this.shippingRates[selectedShipping.value] || 0;
    }
    
    getDiscountAmount(subtotal) {
        if (!this.promoCode) return 0;
        
        // Apply discount based on promo code
        switch (this.promoCode.type) {
            case 'percentage':
                return subtotal * (this.promoCode.value / 100);
            case 'fixed':
                return Math.min(this.promoCode.value, subtotal);
            default:
                return 0;
        }
    }
    
    getTaxAmount(taxableAmount) {
        return taxableAmount * this.taxRate;
    }
    
    handlePaymentMethodChange(e) {
        const cardForm = document.getElementById('cardForm');
        const paypalForm = document.getElementById('paypalForm');
        
        if (e.target.value === 'card') {
            if (cardForm) cardForm.style.display = 'block';
            if (paypalForm) paypalForm.style.display = 'none';
        } else if (e.target.value === 'paypal') {
            if (cardForm) cardForm.style.display = 'none';
            if (paypalForm) paypalForm.style.display = 'block';
        }
    }
    
    toggleBillingForm(e) {
        const billingForm = document.getElementById('billingForm');
        if (billingForm) {
            billingForm.style.display = e.target.checked ? 'none' : 'block';
        }
    }
    
    togglePromoForm() {
        const promoForm = document.getElementById('promoForm');
        const promoToggle = document.getElementById('promoToggle');
        const chevron = promoToggle.querySelector('.fa-chevron-down');
        
        if (promoForm.style.display === 'none' || !promoForm.style.display) {
            promoForm.style.display = 'block';
            chevron.style.transform = 'rotate(180deg)';
        } else {
            promoForm.style.display = 'none';
            chevron.style.transform = 'rotate(0deg)';
        }
    }
    
    async applyPromoCode() {
        const promoCodeInput = document.getElementById('promoCode');
        const promoMessage = document.getElementById('promoMessage');
        const applyBtn = document.getElementById('applyPromoBtn');
        
        if (!promoCodeInput.value.trim()) {
            this.showPromoMessage('Please enter a promo code', 'error');
            return;
        }
        
        applyBtn.disabled = true;
        applyBtn.textContent = 'Applying...';
        
        try {
            // Simulate promo code validation
            const promoCode = promoCodeInput.value.trim().toUpperCase();
            
            // Mock promo codes for demo
            const validPromoCodes = {
                'WELCOME10': { type: 'percentage', value: 10, description: '10% off your order' },
                'SAVE20': { type: 'fixed', value: 20, description: '$20 off your order' },
                'NEWCUSTOMER': { type: 'percentage', value: 15, description: '15% off for new customers' }
            };
            
            if (validPromoCodes[promoCode]) {
                this.promoCode = validPromoCodes[promoCode];
                this.showPromoMessage(`Promo code applied! ${this.promoCode.description}`, 'success');
                this.updateOrderSummary();
                promoCodeInput.disabled = true;
                applyBtn.textContent = 'Applied';
            } else {
                this.showPromoMessage('Invalid promo code', 'error');
                applyBtn.disabled = false;
                applyBtn.textContent = 'Apply';
            }
            
        } catch (error) {
            console.error('Error applying promo code:', error);
            this.showPromoMessage('Error applying promo code', 'error');
            applyBtn.disabled = false;
            applyBtn.textContent = 'Apply';
        }
    }
    
    showPromoMessage(message, type) {
        const promoMessage = document.getElementById('promoMessage');
        if (promoMessage) {
            promoMessage.textContent = message;
            promoMessage.className = `promo-message ${type}`;
            promoMessage.style.display = 'block';
        }
    }
    
    formatCardNumber(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
        e.target.value = formattedValue;
    }
    
    formatExpiryDate(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }
    
    formatCVV(e) {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value.substring(0, 4);
    }
    
    validateForm() {
        const form = document.getElementById('checkoutForm');
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        // Validate email
        const email = document.getElementById('email');
        if (email && !isValidEmail(email.value)) {
            email.classList.add('error');
            isValid = false;
        }
        
        // Validate phone
        const phone = document.getElementById('phone');
        if (phone && !isValidPhone(phone.value)) {
            phone.classList.add('error');
            isValid = false;
        }
        
        // Validate payment method
        const paymentMethod = document.querySelector('input[name="payment"]:checked');
        if (paymentMethod && paymentMethod.value === 'card') {
            const cardNumber = document.getElementById('cardNumber');
            const expiryDate = document.getElementById('expiryDate');
            const cvv = document.getElementById('cvv');
            const cardName = document.getElementById('cardName');
            
            if (!this.isValidCardNumber(cardNumber.value)) {
                cardNumber.classList.add('error');
                isValid = false;
            }
            
            if (!this.isValidExpiryDate(expiryDate.value)) {
                expiryDate.classList.add('error');
                isValid = false;
            }
            
            if (!this.isValidCVV(cvv.value)) {
                cvv.classList.add('error');
                isValid = false;
            }
            
            if (!cardName.value.trim()) {
                cardName.classList.add('error');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    isValidCardNumber(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');
        return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
    }
    
    isValidExpiryDate(expiryDate) {
        const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;
        
        const month = parseInt(match[1], 10);
        const year = parseInt(match[2], 10) + 2000;
        const now = new Date();
        const expiry = new Date(year, month - 1);
        
        return month >= 1 && month <= 12 && expiry > now;
    }
    
    isValidCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            utils.showToast('Please fill in all required fields correctly', 'error');
            return;
        }
        
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        try {
            // Show loading
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            loadingOverlay.style.display = 'flex';
            
            // Collect form data
            const formData = this.collectFormData();
            
            // Create order
            const order = await this.createOrder(formData);
            
            // Clear cart
            await this.cart.clearCart();
            
            // Redirect to success page
            window.location.href = `order-success.html?order=${order.id}`;
            
        } catch (error) {
            console.error('Error placing order:', error);
            utils.showToast('Error placing order. Please try again.', 'error');
            
            // Reset button
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order';
            loadingOverlay.style.display = 'none';
        }
    }
    
    collectFormData() {
        const form = document.getElementById('checkoutForm');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Add calculated values
        data.subtotal = this.cart.getSubtotal();
        data.shipping_cost = this.getShippingCost();
        data.discount_amount = this.getDiscountAmount(data.subtotal);
        data.tax_amount = this.getTaxAmount(data.subtotal - data.discount_amount);
        data.total = data.subtotal + data.shipping_cost - data.discount_amount + data.tax_amount;
        data.promo_code = this.promoCode ? this.promoCode : null;
        data.items = this.cart.items;
        
        return data;
    }
    
    async createOrder(orderData) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert({
                    user_id: this.user?.id || null,
                    email: orderData.email,
                    first_name: orderData.firstName,
                    last_name: orderData.lastName,
                    phone: orderData.phone,
                    shipping_address: {
                        address: orderData.address,
                        apartment: orderData.apartment,
                        city: orderData.city,
                        state: orderData.state,
                        zip_code: orderData.zipCode,
                        country: 'US'
                    },
                    billing_address: orderData.sameAsShipping ? null : {
                        first_name: orderData.billingFirstName,
                        last_name: orderData.billingLastName,
                        address: orderData.billingAddress,
                        city: orderData.billingCity,
                        state: orderData.billingState,
                        zip_code: orderData.billingZipCode,
                        country: 'US'
                    },
                    subtotal: orderData.subtotal,
                    shipping_cost: orderData.shipping_cost,
                    tax_amount: orderData.tax_amount,
                    discount_amount: orderData.discount_amount,
                    total: orderData.total,
                    payment_method: orderData.payment,
                    shipping_method: orderData.shipping,
                    promo_code: orderData.promo_code?.code || null,
                    status: 'pending'
                })
                .select()
                .single();
            
            if (error) throw error;
            
            // Create order items
            const orderItems = orderData.items.map(item => ({
                order_id: data.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                color: item.color
            }));
            
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);
            
            if (itemsError) throw itemsError;
            
            return data;
            
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }
}

// Initialize checkout when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.checkoutManager = new CheckoutManager();
    });
} else {
    window.checkoutManager = new CheckoutManager();
}