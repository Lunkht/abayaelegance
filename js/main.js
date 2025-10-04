// Main JavaScript Module
class App {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page.replace('.html', '');
  }

  async init() {
    // Show loader at the very beginning
    const pageLoader = document.getElementById('pageLoader');
    document.body.classList.add('loading');

    try {
      // Initialize core modules
      await this.initializeModules();
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Initialize page-specific functionality
      await this.initializePage();
      
      // Setup navigation
      this.setupNavigation();
      
      // Setup search functionality
      this.setupSearch();
      
      // Setup mobile menu
      this.setupMobileMenu();
      
      // Setup user menu
      this.setupUserMenu();
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  async initializeModules() {
    // Wait for auth manager to initialize
    if (typeof authManager !== 'undefined') {
      await authManager.init();
    }
    
    // Wait for cart manager to initialize
    if (typeof cartManager !== 'undefined') {
      await cartManager.init();
    }
  }

  async initializePage() {
    switch (this.currentPage) {
      case 'index':
      case '':
        await this.initHomePage();
        break;
      case 'catalog':
        await this.initCatalogPage();
        break;
      case 'product':
        await this.initProductPage();
        break;
      case 'cart':
        await this.initCartPage();
        break;
      case 'checkout':
        await this.initCheckoutPage();
        break;
      case 'login':
        await this.initLoginPage();
        break;
      case 'register':
        await this.initRegisterPage();
        break;
      case 'account':
        await this.initAccountPage();
        break;
      case 'admin':
        await this.initAdminPage();
        break;
      case 'about':
      case 'contact':
        await this.initStaticPage();
        break;
      default:
        console.log('No specific initialization for page:', this.currentPage);
    }
  }

  async initHomePage() {
    try {
      // Load featured collections
      await this.loadFeaturedCollections();
      
      // Load new arrivals
      await this.loadNewArrivals();
      
      // Setup hero carousel if exists
      this.setupHeroCarousel();
      
      // Setup newsletter form
      this.setupNewsletterForm();
    } catch (error) {
      console.error('Failed to initialize home page:', error);
    }
  }

  async loadFeaturedCollections() {
    try {
      const collectionsContainer = document.getElementById('featuredCollections');
      if (!collectionsContainer) return;

      utils.showLoading();
      
      // Get featured categories
      const categories = await api.supabase.getCategories();
      const featuredCategories = categories.slice(0, 3); // Show first 3 categories
      
      collectionsContainer.innerHTML = featuredCategories.map(category => `
        <div class="collection-card" data-category="${category.slug}">
          <div class="collection-image">
            <img src="${category.image_url || '/images/placeholder.jpg'}" alt="${category.name}" loading="lazy">
            <div class="collection-overlay">
              <h3>${category.name}</h3>
              <p>${category.description || ''}</p>
              <a href="catalog.html?category=${category.slug}" class="btn-secondary">Shop Collection</a>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load featured collections:', error);
    } finally {
      utils.hideLoading();
    }
  }

  async loadNewArrivals() {
    try {
      const arrivalsContainer = document.getElementById('newArrivals');
      if (!arrivalsContainer) return;

      utils.showLoading();
      
      // Get latest products
      const products = await api.supabase.getProducts({
        limit: 8,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      arrivalsContainer.innerHTML = products.map(product => {
        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';
        const hasDiscount = product.sale_price && product.sale_price < product.price;
        
        return `
          <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
              <img src="${imageUrl}" alt="${product.name}" loading="lazy">
              ${hasDiscount ? `<span class="discount-badge">${window.i18n.t('sale')}</span>` : ''}
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
              <h3 class="product-name">
                <a href="product-details.html?id=${product.id}">${product.name}</a>
              </h3>
              
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
              
              <button class="btn-primary add-to-cart" 
                      data-product-id="${product.id}" 
                      ${!product.in_stock ? 'disabled' : ''}>
                ${window.i18n.t(product.in_stock ? 'addToCart' : 'outOfStock')}
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Failed to load new arrivals:', error);
    } finally {
      utils.hideLoading();
    }
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
  }

  setupHeroCarousel() {
    const carousel = document.querySelector('.hero-carousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.hero-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    if (totalSlides <= 1) return;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
      
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
      });
      
      currentSlide = index;
    }

    function nextSlide() {
      const next = (currentSlide + 1) % totalSlides;
      showSlide(next);
    }

    function prevSlide() {
      const prev = (currentSlide - 1 + totalSlides) % totalSlides;
      showSlide(prev);
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => showSlide(index));
    });

    // Auto-play
    setInterval(nextSlide, 5000);
  }

  setupNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (!utils.validateEmail(email)) {
        utils.showToast('Please enter a valid email address', 'error');
        return;
      }
      
      try {
        utils.showLoading();
        
        // Here you would typically send to your newsletter service
        // For now, we'll just show a success message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        utils.showToast('Thank you for subscribing to our newsletter!', 'success');
        emailInput.value = '';
      } catch (error) {
        console.error('Newsletter subscription failed:', error);
        utils.showToast('Failed to subscribe. Please try again.', 'error');
      } finally {
        utils.hideLoading();
      }
    });
  }

  async initCatalogPage() {
    // This will be implemented when we create the catalog page
    console.log('Catalog page initialization');
  }

  async initProductPage() {
    // This will be implemented when we create the product page
    console.log('Product page initialization');
  }

  async initCartPage() {
    if (typeof cartManager !== 'undefined') {
      cartManager.renderCartItems();
    }
  }

  async initCheckoutPage() {
    // This will be implemented when we create the checkout page
    console.log('Checkout page initialization');
  }

  async initLoginPage() {
    // Auth manager handles login page initialization
    console.log('Login page initialization');
  }

  async initRegisterPage() {
    // Auth manager handles register page initialization
    console.log('Register page initialization');
  }

  async initAccountPage() {
    // This will be implemented when we create the account page
    console.log('Account page initialization');
  }

  async initAdminPage() {
    // This will be implemented when we create the admin page
    console.log('Admin page initialization');
  }

  async initStaticPage() {
    console.log('Initializing static page...');
    // Static page initialization (about, contact, etc.)
  }

  setupNavigation() {
    // Handle navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
      const linkPage = link.getAttribute('href').split('/').pop();
      if (linkPage === currentPage) {
        link.classList.add('active');
      }
    });
  }

  setupSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchToggle || !searchOverlay) return;

    // Toggle search overlay
    searchToggle.addEventListener('click', (e) => {
      e.preventDefault();
      searchOverlay.classList.add('active');
      searchInput?.focus();
    });

    // Close search overlay
    if (searchClose) {
      searchClose.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
      });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
      }
    });

    // Handle search form
    if (searchForm && searchInput) {
      let searchTimeout;
      
      // Live search as user types
      searchInput.addEventListener('input', utils.debounce(async (e) => {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
          if (searchResults) searchResults.innerHTML = '';
          return;
        }
        
        await this.performSearch(query);
      }, 300));
      
      // Handle form submission
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        
        if (query) {
          window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
        }
      });
    }
  }

  async performSearch(query) {
    try {
      const searchResults = document.getElementById('searchResults');
      if (!searchResults) return;
      
      // Show loading
      searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
      
      // Search products
      const products = await api.supabase.getProducts({
        search: query,
        limit: 5
      });
      
      if (products.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No products found</div>';
        return;
      }
      
      // Render search results
      searchResults.innerHTML = products.map(product => {
        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';
        const price = product.sale_price || product.price;
        
        return `
          <div class="search-result-item">
            <img src="${imageUrl}" alt="${product.name}" loading="lazy">
            <div class="search-result-info">
              <h4><a href="product-details.html?id=${product.id}">${product.name}</a></h4>
              <p class="search-result-price">${utils.formatCurrency(price)}</p>
            </div>
          </div>
        `;
      }).join('');
      
      // Add "View all results" link
      searchResults.innerHTML += `
        <div class="search-view-all">
          <a href="catalog.html?search=${encodeURIComponent(query)}">View all results for "${query}"</a>
        </div>
      `;
    } catch (error) {
      console.error('Search failed:', error);
      const searchResults = document.getElementById('searchResults');
      if (searchResults) {
        searchResults.innerHTML = '<div class="search-error">Search failed. Please try again.</div>';
      }
    }
  }

  setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    
    if (!mobileMenuToggle || !mobileMenu) return;

    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      mobileMenu.classList.add('active');
      document.body.classList.add('menu-open');
    });

    // Close mobile menu
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    }

    // Close menu when clicking overlay
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) {
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    });
  }

  setupUserMenu() {
    const userToggle = document.getElementById('userToggle');
    const userDropdown = document.getElementById('userDropdown');
    
    if (!userToggle || !userDropdown) return;

    // Toggle user dropdown
    userToggle.addEventListener('click', (e) => {
      e.preventDefault();
      userDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!userToggle.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  setupGlobalEventListeners() {
    // Handle authentication required actions
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-requires-auth') || e.target.closest('[data-requires-auth]')) {
        if (!authManager.isAuthenticated) {
          e.preventDefault();
          const returnUrl = window.location.pathname + window.location.search;
          window.location.href = `login.html?return=${encodeURIComponent(returnUrl)}`;
        }
      }
    });

    // Handle wishlist buttons
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('wishlist-btn') || e.target.closest('.wishlist-btn')) {
        e.preventDefault();
        
        if (!authManager.isAuthenticated) {
          utils.showToast('Please sign in to add items to your wishlist', 'info');
          return;
        }
        
        const button = e.target.classList.contains('wishlist-btn') ? e.target : e.target.closest('.wishlist-btn');
        const productId = button.dataset.productId;
        
        // Toggle wishlist (implementation would depend on your wishlist system)
        button.classList.toggle('active');
        const icon = button.querySelector('i');
        if (icon) {
          icon.classList.toggle('far');
          icon.classList.toggle('fas');
        }
        
        utils.showToast(
          button.classList.contains('active') ? 'Added to wishlist' : 'Removed from wishlist',
          'success'
        );
      }
    });

    // Handle quick view buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-view-btn') || e.target.closest('.quick-view-btn')) {
        e.preventDefault();
        
        const button = e.target.classList.contains('quick-view-btn') ? e.target : e.target.closest('.quick-view-btn');
        const productId = button.dataset.productId;
        
        // Open quick view modal (implementation would depend on your modal system)
        console.log('Quick view for product:', productId);
        utils.showToast('Quick view feature coming soon!', 'info');
      }
    });

    // Handle scroll to top
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (scrollToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          scrollToTopBtn.style.display = 'block';
        } else {
          scrollToTopBtn.style.display = 'none';
        }
      });
      
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Handle scroll to top button
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (scrollToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          scrollToTopBtn.classList.add('show');
        } else {
          scrollToTopBtn.classList.remove('show');
        }
      });
      
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Export for global use
window.App = App;