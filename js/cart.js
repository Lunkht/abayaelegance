// Shopping Cart Module
class CartManager {
  constructor() {
    this.cartItems = [];
    this.cartCount = 0;
    this.cartTotal = 0;
    this.init();
  }

  async init() {
    await this.loadCart();
    this.updateCartCount();
    this.setupEventListeners();
  }

  async loadCart() {
    try {
      if (authManager.isAuthenticated) {
        // Load cart from database for authenticated users
        const cartData = await api.supabase.getCartItems(authManager.currentUser.id);
        this.cartItems = cartData || [];
      } else {
        // Load cart from localStorage for guest users
        const savedCart = localStorage.getItem('abaya_cart');
        this.cartItems = savedCart ? JSON.parse(savedCart) : [];
      }
      
      this.calculateTotals();
    } catch (error) {
      console.error('Failed to load cart:', error);
      this.cartItems = [];
    }
  }

  async saveCart() {
    try {
      if (authManager.isAuthenticated) {
        // Cart is automatically saved to database when items are added/updated
        return;
      } else {
        // Save to localStorage for guest users
        localStorage.setItem('abaya_cart', JSON.stringify(this.cartItems));
      }
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }

  async addToCart(productId, quantity = 1, size = null, color = null) {
    try {
      utils.showLoading();

      if (authManager.isAuthenticated) {
        // Add to database for authenticated users
        await api.supabase.addToCart(
          authManager.currentUser.id,
          productId,
          quantity,
          size,
          color
        );
        
        // Reload cart from database
        await this.loadCart();
      } else {
        // Add to local cart for guest users
        const existingItemIndex = this.cartItems.findIndex(item => 
          item.product_id === productId && 
          item.size === size && 
          item.color === color
        );

        if (existingItemIndex > -1) {
          this.cartItems[existingItemIndex].quantity += quantity;
        } else {
          // Get product details
          const product = await api.supabase.getProduct(productId);
          
          this.cartItems.push({
            id: utils.generateId(),
            product_id: productId,
            quantity,
            size,
            color,
            products: product
          });
        }
        
        await this.saveCart();
      }

      this.calculateTotals();
      this.updateCartCount();
      
      utils.showToast('Item added to cart!', 'success');
      
      // Update cart UI if on cart page
      if (window.location.pathname.includes('cart.html')) {
        this.renderCartItems();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to add to cart:', error);
      utils.showToast('Failed to add item to cart', 'error');
      return { success: false, error: error.message };
    } finally {
      utils.hideLoading();
    }
  }

  async updateCartItem(itemId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeFromCart(itemId);
      }

      if (authManager.isAuthenticated) {
        // Update in database
        await api.supabase.updateCartItem(itemId, quantity);
        await this.loadCart();
      } else {
        // Update local cart
        const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
          this.cartItems[itemIndex].quantity = quantity;
          await this.saveCart();
        }
      }

      this.calculateTotals();
      this.updateCartCount();
      
      // Update cart UI if on cart page
      if (window.location.pathname.includes('cart.html')) {
        this.renderCartItems();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update cart item:', error);
      utils.showToast('Failed to update cart item', 'error');
      return { success: false, error: error.message };
    }
  }

  async removeFromCart(itemId) {
    try {
      if (authManager.isAuthenticated) {
        // Remove from database
        await api.supabase.removeFromCart(itemId);
        await this.loadCart();
      } else {
        // Remove from local cart
        this.cartItems = this.cartItems.filter(item => item.id !== itemId);
        await this.saveCart();
      }

      this.calculateTotals();
      this.updateCartCount();
      
      utils.showToast('Item removed from cart', 'success');
      
      // Update cart UI if on cart page
      if (window.location.pathname.includes('cart.html')) {
        this.renderCartItems();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      utils.showToast('Failed to remove item from cart', 'error');
      return { success: false, error: error.message };
    }
  }

  async clearCart() {
    try {
      if (authManager.isAuthenticated) {
        // Clear database cart
        const { error } = await supabaseClient
          .from('cart_items')
          .delete()
          .eq('user_id', authManager.currentUser.id);
        
        if (error) throw error;
      } else {
        // Clear local cart
        localStorage.removeItem('abaya_cart');
      }

      this.cartItems = [];
      this.calculateTotals();
      this.updateCartCount();
      
      // Update cart UI if on cart page
      if (window.location.pathname.includes('cart.html')) {
        this.renderCartItems();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return { success: false, error: error.message };
    }
  }

  calculateTotals() {
    this.cartCount = this.cartItems.reduce((total, item) => total + item.quantity, 0);
    
    this.cartTotal = this.cartItems.reduce((total, item) => {
      const price = item.products.sale_price || item.products.price;
      return total + (price * item.quantity);
    }, 0);
  }

  updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count, #cartCount');
    cartCountElements.forEach(element => {
      element.textContent = this.cartCount;
      element.style.display = this.cartCount > 0 ? 'flex' : 'none';
    });
  }

  getShippingCost() {
    return this.cartTotal >= APP_CONFIG.freeShippingThreshold ? 0 : APP_CONFIG.shippingCost;
  }

  getTotalWithShipping() {
    return this.cartTotal + this.getShippingCost();
  }

  renderCartItems() {
    const cartContainer = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartContainer) return;

    if (this.cartItems.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-bag"></i>
          <h3>Your cart is empty</h3>
          <p>Add some beautiful abayas to get started!</p>
          <a href="catalog.html" class="btn-primary">Shop Now</a>
        </div>
      `;
      
      if (cartSummary) {
        cartSummary.style.display = 'none';
      }
      
      return;
    }

    cartContainer.innerHTML = this.cartItems.map(item => {
      const product = item.products;
      const price = product.sale_price || product.price;
      const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';
      
      return `
        <div class="cart-item" data-item-id="${item.id}">
          <div class="cart-item-image">
            <img src="${imageUrl}" alt="${product.name}" loading="lazy">
          </div>
          
          <div class="cart-item-details">
            <h3 class="cart-item-name">${product.name}</h3>
            <div class="cart-item-options">
              ${item.size ? `<span class="option">Size: ${item.size}</span>` : ''}
              ${item.color ? `<span class="option">Color: ${item.color}</span>` : ''}
            </div>
            <div class="cart-item-price">
              ${product.sale_price ? `
                <span class="current-price">${utils.formatCurrency(product.sale_price)}</span>
                <span class="original-price">${utils.formatCurrency(product.price)}</span>
              ` : `
                <span class="current-price">${utils.formatCurrency(product.price)}</span>
              `}
            </div>
          </div>
          
          <div class="cart-item-quantity">
            <button class="quantity-btn decrease" data-action="decrease" data-item-id="${item.id}">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" value="${item.quantity}" min="1" max="10" class="quantity-input" data-item-id="${item.id}">
            <button class="quantity-btn increase" data-action="increase" data-item-id="${item.id}">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          
          <div class="cart-item-total">
            ${utils.formatCurrency(price * item.quantity)}
          </div>
          
          <button class="remove-item" data-item-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    // Render cart summary
    if (cartSummary) {
      const shippingCost = this.getShippingCost();
      const totalWithShipping = this.getTotalWithShipping();
      
      cartSummary.style.display = 'block';
      cartSummary.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal (${this.cartCount} items)</span>
          <span>${utils.formatCurrency(this.cartTotal)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>${shippingCost === 0 ? 'Free' : utils.formatCurrency(shippingCost)}</span>
        </div>
        ${this.cartTotal >= APP_CONFIG.freeShippingThreshold ? '' : `
          <div class="free-shipping-notice">
            <i class="fas fa-info-circle"></i>
            Add ${utils.formatCurrency(APP_CONFIG.freeShippingThreshold - this.cartTotal)} more for free shipping!
          </div>
        `}
        <div class="summary-row total">
          <span>Total</span>
          <span>${utils.formatCurrency(totalWithShipping)}</span>
        </div>
        <button class="btn-primary checkout-btn" ${!authManager.isAuthenticated ? 'data-requires-auth="true"' : ''}>
          Proceed to Checkout
        </button>
      `;
    }
  }

  setupEventListeners() {
    // Handle add to cart buttons
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
        e.preventDefault();
        
        const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
        const productId = button.dataset.productId;
        const size = button.dataset.size || document.querySelector('.size-selector.selected')?.dataset.size;
        const color = button.dataset.color || document.querySelector('.color-selector.selected')?.dataset.color;
        
        if (!productId) {
          utils.showToast('Product not found', 'error');
          return;
        }
        
        await this.addToCart(productId, 1, size, color);
      }
    });

    // Handle cart item quantity changes
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('quantity-btn') || e.target.closest('.quantity-btn')) {
        e.preventDefault();
        
        const button = e.target.classList.contains('quantity-btn') ? e.target : e.target.closest('.quantity-btn');
        const action = button.dataset.action;
        const itemId = button.dataset.itemId;
        const quantityInput = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
        
        if (!quantityInput) return;
        
        let newQuantity = parseInt(quantityInput.value);
        
        if (action === 'increase') {
          newQuantity += 1;
        } else if (action === 'decrease') {
          newQuantity -= 1;
        }
        
        if (newQuantity < 1) newQuantity = 1;
        if (newQuantity > 10) newQuantity = 10;
        
        quantityInput.value = newQuantity;
        await this.updateCartItem(itemId, newQuantity);
      }
    });

    // Handle quantity input changes
    document.addEventListener('change', async (e) => {
      if (e.target.classList.contains('quantity-input')) {
        const itemId = e.target.dataset.itemId;
        const newQuantity = parseInt(e.target.value);
        
        if (newQuantity < 1 || newQuantity > 10) {
          e.target.value = Math.max(1, Math.min(10, newQuantity));
          return;
        }
        
        await this.updateCartItem(itemId, newQuantity);
      }
    });

    // Handle remove item buttons
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
        e.preventDefault();
        
        const button = e.target.classList.contains('remove-item') ? e.target : e.target.closest('.remove-item');
        const itemId = button.dataset.itemId;
        
        if (confirm('Are you sure you want to remove this item from your cart?')) {
          await this.removeFromCart(itemId);
        }
      }
    });

    // Handle checkout button
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('checkout-btn')) {
        e.preventDefault();
        
        if (!authManager.isAuthenticated) {
          utils.showToast('Please sign in to proceed with checkout', 'info');
          window.location.href = 'login.html?return=checkout.html';
          return;
        }
        
        if (this.cartItems.length === 0) {
          utils.showToast('Your cart is empty', 'error');
          return;
        }
        
        window.location.href = 'checkout.html';
      }
    });
  }

  // Get cart data for checkout
  getCartData() {
    return {
      items: this.cartItems,
      count: this.cartCount,
      subtotal: this.cartTotal,
      shipping: this.getShippingCost(),
      total: this.getTotalWithShipping()
    };
  }
}

// Initialize cart manager
const cartManager = new CartManager();

// Export for global use
window.cartManager = cartManager;