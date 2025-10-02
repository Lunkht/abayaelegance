// Catalog Module
class CatalogManager {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.categories = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.totalProducts = 0;
    this.currentView = 'grid';
    this.filters = {
      category: null,
      search: null,
      minPrice: null,
      maxPrice: null,
      sizes: [],
      colors: [],
      availability: []
    };
    this.sortBy = 'name_asc';
    this.init();
  }

  async init() {
    try {
      // Parse URL parameters
      this.parseUrlParams();
      
      // Load initial data
      await this.loadCategories();
      await this.loadProducts();
      
      // Setup UI
      this.setupFilters();
      this.setupEventListeners();
      this.setupMobileFilters();
      
      // Initial render
      this.renderProducts();
      this.updateResultsCount();
      
      console.log('Catalog initialized successfully');
    } catch (error) {
      console.error('Failed to initialize catalog:', error);
    }
  }

  parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set filters from URL
    if (urlParams.has('category')) {
      this.filters.category = urlParams.get('category');
    }
    
    if (urlParams.has('search')) {
      this.filters.search = urlParams.get('search');
    }
    
    if (urlParams.has('page')) {
      this.currentPage = parseInt(urlParams.get('page')) || 1;
    }
    
    if (urlParams.has('sort')) {
      this.sortBy = urlParams.get('sort');
    }
    
    if (urlParams.has('view')) {
      this.currentView = urlParams.get('view');
    }
  }

  async loadCategories() {
    try {
      this.categories = await api.supabase.getCategories();
      if (this.categories && this.categories.length > 0) {
        this.renderCategoryFilters();
        this.renderCategoriesMenu();
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      this.categories = []; // Ensure it's an empty array
    }
  }

  async loadProducts() {
    try {
      utils.showLoading();
      
      const params = {
        category: this.filters.category,
        search: this.filters.search,
        minPrice: this.filters.minPrice,
        maxPrice: this.filters.maxPrice,
        sizes: this.filters.sizes,
        colors: this.filters.colors,
        inStock: this.filters.availability.includes('in_stock'),
        onSale: this.filters.availability.includes('on_sale'),
        sortBy: this.sortBy.split('_')[0],
        sortOrder: this.sortBy.split('_')[1],
        page: this.currentPage,
        limit: this.productsPerPage
      };
      
      const result = await api.supabase.getProducts(params);
      this.products = result.products || result;
      this.totalProducts = result.total || this.products.length;
      
      this.applyClientSideFilters();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.products = [];
      this.totalProducts = 0;
    } finally {
      utils.hideLoading();
    }
  }

  applyClientSideFilters() {
    this.filteredProducts = [...this.products];
    
    // Apply additional client-side filtering if needed
    if (this.filters.sizes.length > 0) {
      this.filteredProducts = this.filteredProducts.filter(product => 
        product.sizes && product.sizes.some(size => this.filters.sizes.includes(size))
      );
    }
    
    if (this.filters.colors.length > 0) {
      this.filteredProducts = this.filteredProducts.filter(product => 
        product.colors && product.colors.some(color => this.filters.colors.includes(color))
      );
    }
  }

  renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container || !this.categories || this.categories.length === 0) return;
    
    container.innerHTML = this.categories.map(category => `
      <label class="filter-option">
        <input type="radio" name="category" value="${category.slug}" 
               ${this.filters.category === category.slug ? 'checked' : ''}>
        <span class="checkmark"></span>
        ${category.name}
      </label>
    `).join('');
  }

  renderCategoriesMenu() {
    const menu = document.getElementById('categoriesMenu');
    if (!menu || !this.categories || this.categories.length === 0) return;
    
    menu.innerHTML = this.categories.map(category => `
      <li><a href="catalog.html?category=${category.slug}">${category.name}</a></li>
    `).join('');
  }

  setupFilters() {
    // Setup size filters
    const sizeFilters = document.getElementById('sizeFilters');
    if (sizeFilters) {
      sizeFilters.innerHTML = APP_CONFIG.sizes.map(size => `
        <label class="filter-option">
          <input type="checkbox" name="size" value="${size}" 
                 ${this.filters.sizes.includes(size) ? 'checked' : ''}>
          <span class="checkmark"></span>
          ${size}
        </label>
      `).join('');
    }
    
    // Setup color filters
    const colorFilters = document.getElementById('colorFilters');
    if (colorFilters) {
      colorFilters.innerHTML = APP_CONFIG.colors.map(color => `
        <label class="color-filter" style="background-color: ${color.value}" title="${color.name}">
          <input type="checkbox" name="color" value="${color.name}" 
                 ${this.filters.colors.includes(color.name) ? 'checked' : ''}>
          <span class="color-checkmark"></span>
        </label>
      `).join('');
    }
    
    // Set initial values
    if (this.filters.search) {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = this.filters.search;
    }
    
    // Set sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = this.sortBy;
    
    // Set view toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.currentView);
    });
  }

  setupEventListeners() {
    // Category filter
    document.addEventListener('change', (e) => {
      if (e.target.name === 'category') {
        this.filters.category = e.target.value;
        this.currentPage = 1;
        this.applyFilters();
      }
    });
    
    // Size filters
    document.addEventListener('change', (e) => {
      if (e.target.name === 'size') {
        if (e.target.checked) {
          this.filters.sizes.push(e.target.value);
        } else {
          this.filters.sizes = this.filters.sizes.filter(size => size !== e.target.value);
        }
        this.currentPage = 1;
        this.applyFilters();
      }
    });
    
    // Color filters
    document.addEventListener('change', (e) => {
      if (e.target.name === 'color') {
        if (e.target.checked) {
          this.filters.colors.push(e.target.value);
        } else {
          this.filters.colors = this.filters.colors.filter(color => color !== e.target.value);
        }
        this.currentPage = 1;
        this.applyFilters();
      }
    });
    
    // Availability filters
    document.addEventListener('change', (e) => {
      if (e.target.name === 'availability') {
        if (e.target.checked) {
          this.filters.availability.push(e.target.value);
        } else {
          this.filters.availability = this.filters.availability.filter(avail => avail !== e.target.value);
        }
        this.currentPage = 1;
        this.applyFilters();
      }
    });
    
    // Price filter
    const applyPriceBtn = document.getElementById('applyPrice');
    if (applyPriceBtn) {
      applyPriceBtn.addEventListener('click', () => {
        const minPrice = document.getElementById('minPrice').value;
        const maxPrice = document.getElementById('maxPrice').value;
        
        this.filters.minPrice = minPrice ? parseFloat(minPrice) : null;
        this.filters.maxPrice = maxPrice ? parseFloat(maxPrice) : null;
        this.currentPage = 1;
        this.applyFilters();
      });
    }
    
    // Clear filters
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
    
    const clearAllFiltersBtn = document.getElementById('clearAllFilters');
    if (clearAllFiltersBtn) {
      clearAllFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
    
    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.currentPage = 1;
        this.applyFilters();
      });
    }
    
    // View toggle
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('view-btn')) {
        const view = e.target.dataset.view;
        this.currentView = view;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
          productsGrid.className = `products-${view}`;
        }
        
        this.updateUrl();
      }
    });
    
    // Pagination
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('page-btn')) {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.applyFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }

  setupMobileFilters() {
    const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');
    const mobileFiltersOverlay = document.getElementById('mobileFiltersOverlay');
    const mobileFiltersClose = document.getElementById('mobileFiltersClose');
    const mobileFiltersApply = document.getElementById('mobileFiltersApply');
    const mobileFiltersClear = document.getElementById('mobileFiltersClear');
    
    if (!mobileFiltersToggle || !mobileFiltersOverlay) return;
    
    // Show mobile filters
    mobileFiltersToggle.addEventListener('click', () => {
      // Clone filters content to mobile overlay
      const filtersContent = document.querySelector('.filters');
      const mobileFiltersBody = document.querySelector('.mobile-filters-body');
      
      if (filtersContent && mobileFiltersBody) {
        mobileFiltersBody.innerHTML = filtersContent.innerHTML;
      }
      
      mobileFiltersOverlay.classList.add('active');
      document.body.classList.add('filters-open');
    });
    
    // Close mobile filters
    if (mobileFiltersClose) {
      mobileFiltersClose.addEventListener('click', () => {
        mobileFiltersOverlay.classList.remove('active');
        document.body.classList.remove('filters-open');
      });
    }
    
    // Apply mobile filters
    if (mobileFiltersApply) {
      mobileFiltersApply.addEventListener('click', () => {
        mobileFiltersOverlay.classList.remove('active');
        document.body.classList.remove('filters-open');
        this.applyFilters();
      });
    }
    
    // Clear mobile filters
    if (mobileFiltersClear) {
      mobileFiltersClear.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  async applyFilters() {
    await this.loadProducts();
    this.renderProducts();
    this.renderPagination();
    this.updateResultsCount();
    this.renderActiveFilters();
    this.updateUrl();
  }

  clearAllFilters() {
    this.filters = {
      category: null,
      search: null,
      minPrice: null,
      maxPrice: null,
      sizes: [],
      colors: [],
      availability: []
    };
    this.currentPage = 1;
    
    // Clear form inputs
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
      input.checked = false;
    });
    
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    
    this.applyFilters();
  }

  renderProducts() {
    const container = document.getElementById('productsGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    // Hide loading and empty states
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    
    // Set grid class based on current view
    container.className = `products-${this.currentView}`;
    
    if (this.filteredProducts.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    
    container.innerHTML = this.filteredProducts.map(product => {
      const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';
      const hasDiscount = product.sale_price && product.sale_price < product.price;
      const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
      
      return `
        <a href="product-details.html?id=${product.id}" class="product-card" data-product-id="${product.id}">
          <div class="product-image">
            <img src="${imageUrl}" alt="${product.name}" loading="lazy">
            ${hasDiscount ? `<span class="discount-badge">${discountPercent}% ${window.i18n.t('off')}</span>` : ''}
            ${!product.in_stock ? `<span class="out-of-stock-badge">${window.i18n.t('outOfStock')}</span>` : ''}
            <div class="product-actions">
              <button class="btn-icon wishlist-btn" data-product-id="${product.id}">
                <i class="far fa-heart"></i>
              </button>
              <button class="btn-icon quick-view-btn" data-product-id="${product.id}">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          
          <div class="product-info">
            <div class="product-category">${product.categories?.name || ''}</div>
            
            <h3 class="product-name">
              ${product.name}
            </h3>
            
            ${this.currentView === 'list' ? `<p class="product-description">${product.description || ''}</p>` : ''}
            
            <div class="product-price">
              ${hasDiscount ? `
                <span class="current-price">${utils.formatCurrency(product.sale_price)}</span>
                <span class="original-price">${utils.formatCurrency(product.price)}</span>
              ` : `
                <span class="current-price">${utils.formatCurrency(product.price)}</span>
              `}
            </div>
            
            <div class="product-rating">
              ${this.renderStars(product.average_rating || 0)}
              <span class="rating-count">(${product.review_count || 0})</span>
            </div>
            
            ${this.currentView === 'list' ? `
              <div class="product-options">
                ${product.sizes ? `<div class="sizes">${window.i18n.t('sizes')}: ${product.sizes.join(', ')}</div>` : ''}
                ${product.colors ? `<div class="colors">${window.i18n.t('colors')}: ${product.colors.join(', ')}</div>` : ''}
              </div>
            ` : ''}
            
            <div class="product-buttons">
              <button class="btn-primary add-to-cart" 
                      data-product-id="${product.id}" 
                      ${!product.in_stock ? 'disabled' : ''}>
                ${window.i18n.t(product.in_stock ? 'addToCart' : 'outOfStock')}
              </button>
              
              ${this.currentView === 'list' ? `
                <span class="btn-secondary">${window.i18n.t('viewDetails')}</span>
              ` : ''}
            </div>
          </div>
        </a>
      `;
    }).join('');
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(this.totalProducts / this.productsPerPage);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    
    let paginationHtml = '';
    
    // Previous button
    if (this.currentPage > 1) {
      paginationHtml += `
        <button class="page-btn prev" data-page="${this.currentPage - 1}">
          <i class="fas fa-chevron-left"></i> Previous
        </button>
      `;
    }
    
    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);
    
    if (startPage > 1) {
      paginationHtml += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        paginationHtml += `<span class="page-ellipsis">...</span>`;
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHtml += `<span class="page-ellipsis">...</span>`;
      }
      paginationHtml += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Next button
    if (this.currentPage < totalPages) {
      paginationHtml += `
        <button class="page-btn next" data-page="${this.currentPage + 1}">
          Next <i class="fas fa-chevron-right"></i>
        </button>
      `;
    }
    
    container.innerHTML = paginationHtml;
  }

  updateResultsCount() {
    const container = document.getElementById('resultsCount');
    if (!container) return;
    
    const start = (this.currentPage - 1) * this.productsPerPage + 1;
    const end = Math.min(this.currentPage * this.productsPerPage, this.totalProducts);
    
    container.textContent = `Showing ${start}-${end} of ${this.totalProducts} products`;
  }

  renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
    
    const activeFilters = [];
    
    if (this.filters.category) {
      const category = this.categories.find(cat => cat.slug === this.filters.category);
      if (category) {
        activeFilters.push({ type: 'category', value: this.filters.category, label: category.name });
      }
    }
    
    if (this.filters.search) {
      activeFilters.push({ type: 'search', value: this.filters.search, label: `"${this.filters.search}"` });
    }
    
    if (this.filters.minPrice || this.filters.maxPrice) {
      const priceLabel = `${this.filters.minPrice || 0} - ${this.filters.maxPrice || '∞'}`;
      activeFilters.push({ type: 'price', value: 'price', label: priceLabel });
    }
    
    this.filters.sizes.forEach(size => {
      activeFilters.push({ type: 'size', value: size, label: size });
    });
    
    this.filters.colors.forEach(color => {
      activeFilters.push({ type: 'color', value: color, label: color });
    });
    
    this.filters.availability.forEach(avail => {
      const label = avail === 'in_stock' ? window.i18n.t('inStock') : window.i18n.t('onSale');
      activeFilters.push({ type: 'availability', value: avail, label });
    });
    
    if (activeFilters.length === 0) {
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'block';
    container.innerHTML = `
      <div class="active-filters-list">
        ${activeFilters.map(filter => `
          <span class="active-filter" data-type="${filter.type}" data-value="${filter.value}">
            ${filter.label}
            <button class="remove-filter">
              <i class="fas fa-times"></i>
            </button>
          </span>
        `).join('')}
      </div>
    `;
    
    // Add event listeners for removing filters
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-filter') || e.target.closest('.remove-filter')) {
        const filterElement = e.target.closest('.active-filter');
        const type = filterElement.dataset.type;
        const value = filterElement.dataset.value;
        
        this.removeFilter(type, value);
      }
    });
  }

  removeFilter(type, value) {
    switch (type) {
      case 'category':
        this.filters.category = null;
        break;
      case 'search':
        this.filters.search = null;
        break;
      case 'price':
        this.filters.minPrice = null;
        this.filters.maxPrice = null;
        break;
      case 'size':
        this.filters.sizes = this.filters.sizes.filter(size => size !== value);
        break;
      case 'color':
        this.filters.colors = this.filters.colors.filter(color => color !== value);
        break;
      case 'availability':
        this.filters.availability = this.filters.availability.filter(avail => avail !== value);
        break;
    }
    
    this.currentPage = 1;
    this.applyFilters();
  }

  updateUrl() {
    const params = new URLSearchParams();
    
    if (this.filters.category) params.set('category', this.filters.category);
    if (this.filters.search) params.set('search', this.filters.search);
    if (this.currentPage > 1) params.set('page', this.currentPage);
    if (this.sortBy !== 'name_asc') params.set('sort', this.sortBy);
    if (this.currentView !== 'grid') params.set('view', this.currentView);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }
}

// Initialize catalog manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('catalog.html')) {
    window.catalogManager = new CatalogManager();
  }
});

// Export for global use
window.CatalogManager = CatalogManager;