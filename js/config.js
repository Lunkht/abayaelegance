// Supabase Configuration
const SUPABASE_URL = 'https://ruagxhxkewvwhbgpdwpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YWd4aHhrZXd2d2hiZ3Bkd3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTAyNzcsImV4cCI6MjA3MDkyNjI3N30.pza_WJwFbAOO39qQG5FOxw1TBu5iyda2fQZkYFrtCYQ';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API Configuration
const API_CONFIG = {
  baseURL: '/api',
  timeout: 10000,
  retries: 3
};

// App Configuration
const APP_CONFIG = {
  name: 'Abaya Elegance',
  version: '1.0.0',
  currency: 'USD',
  currencySymbol: '$',
  itemsPerPage: 12,
  maxCartItems: 50,
  shippingCost: 15.00,
  freeShippingThreshold: 200.00,
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  colors: [
    { name: 'Black', value: '#000000' },
    { name: 'Navy Blue', value: '#1e3a8a' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Brown', value: '#92400e' },
    { name: 'Dark Green', value: '#065f46' },
    { name: 'Burgundy', value: '#7c2d12' }
  ]
};

// Product Categories
const CATEGORIES = {
  TRADITIONAL: 'Traditional Abayas',
  MODERN: 'Modern Abayas',
  OCCASION: 'Occasion Wear',
  CASUAL: 'Casual Abayas'
};

// Order Status
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Available Sizes
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Available Colors
const COLORS = {
  BLACK: 'Black',
  NAVY: 'Navy Blue',
  GRAY: 'Gray',
  BROWN: 'Brown',
  GREEN: 'Dark Green',
  BURGUNDY: 'Burgundy'
};

// Utility Functions
const utils = {
  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: APP_CONFIG.currency
    }).format(amount);
  },

  // Format date
  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  },

  // Generate unique ID
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Show loading spinner
  showLoading: () => {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('active');
  },

  // Hide loading spinner
  hideLoading: () => {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('active');
  },

  // Show toast notification
  showToast: (message, type = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 5000);

    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    });
  },

  // Validate email
  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate phone
  validatePhone: (phone) => {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\s/g, ''));
  },

  // Get query parameter
  getQueryParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  // Set query parameter
  setQueryParam: (param, value) => {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },

  // Remove query parameter
  removeQueryParam: (param) => {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
  }
};

// API Helper Functions
const api = {
  // Generic API call
  call: async (endpoint, options = {}) => {
    try {
      utils.showLoading();
      
      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      utils.showToast('Something went wrong. Please try again.', 'error');
      throw error;
    } finally {
      utils.hideLoading();
    }
  },

  // Supabase helper functions
  supabase: {
    // Get categories
    getCategories: async () => {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },

    // Get products
    getProducts: async (filters = {}) => {
      let query = supabaseClient
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('is_active', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters.featured) {
        query = query.eq('is_featured', true);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      // Apply sorting
      if (filters.sortBy) {
        const [field, direction] = filters.sortBy.split(':');
        query = query.order(field, { ascending: direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 12) - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },

    // Get single product
    getProduct: async (id) => {
      const { data, error } = await supabaseClient
        .from('products')
        .select(`
          *,
          categories(name),
          reviews(
            id,
            rating,
            comment,
            created_at,
            user_profiles(first_name, last_name)
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },

    // Get cart items
    getCartItems: async (userId) => {
      const { data, error } = await supabaseClient
        .from('cart_items')
        .select(`
          *,
          products(
            id,
            name,
            price,
            sale_price,
            images,
            stock_quantity
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    },

    // Add to cart
    addToCart: async (userId, productId, quantity, size, color) => {
      const { data, error } = await supabaseClient
        .from('cart_items')
        .upsert({
          user_id: userId,
          product_id: productId,
          quantity,
          size,
          color
        }, {
          onConflict: 'user_id,product_id,size,color'
        });
      
      if (error) throw error;
      return data;
    },

    // Update cart item
    updateCartItem: async (id, quantity) => {
      const { data, error } = await supabaseClient
        .from('cart_items')
        .update({ quantity })
        .eq('id', id);
      
      if (error) throw error;
      return data;
    },

    // Remove from cart
    removeFromCart: async (id) => {
      const { data, error } = await supabaseClient
        .from('cart_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return data;
    },

    // Create order
    createOrder: async (orderData) => {
      const { data, error } = await supabaseClient
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Get user orders
    getUserOrders: async (userId) => {
      const { data, error } = await supabaseClient
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name, images)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  }
};

// Export for use in other files
window.supabaseClient = supabaseClient;
window.utils = utils;
window.api = api;
window.APP_CONFIG = APP_CONFIG;
window.CATEGORIES = CATEGORIES;
window.ORDER_STATUS = ORDER_STATUS;
window.PAYMENT_STATUS = PAYMENT_STATUS;
window.SIZES = SIZES;
window.COLORS = COLORS;