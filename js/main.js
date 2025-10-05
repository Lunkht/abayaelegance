// Main JavaScript Module
// --- Fonctions pour le Spinner de Chargement ---
const loadingSpinner = document.getElementById('loadingSpinner');

/**
 * Affiche l'overlay de chargement.
 */
window.showSpinner = function() {
  if (loadingSpinner) loadingSpinner.style.display = 'flex';
}

/**
 * Masque l'overlay de chargement.
 */
window.hideSpinner = function() {
  if (loadingSpinner) loadingSpinner.style.display = 'none';
}

class App {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    if (filename === '' || filename === 'index.html') {
      return 'index';
    }
    return filename.replace('.html', '');
  }

  async init() {
    await this.setupGlobalUI();

    switch (this.currentPage) {
      case 'index':
        await this.initHomePage();
        break;
      case 'catalog':
        // Géré par catalog.js
        break;
      default:
        console.log('No specific initialization for page:', this.currentPage);
    }
  }

  async setupGlobalUI() {
    this.setupNavigation();
    await this.loadNavigationCategories();
    this.setupSearch();
    this.setupMobileMenu();
    this.setupUserMenu();
    this.setupGlobalEventListeners();
  }

  async loadNavigationCategories() {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('name, slug')
        .order('name', { ascending: true });

      if (error) throw error;

      const desktopMenu = document.getElementById('categoriesMenu');
      const mobileMenu = document.getElementById('mobileCategoriesMenu');

      const generateHtml = (category) => `<li><a href="catalog.html?category=${category.slug}">${category.name}</a></li>`;

      if (desktopMenu) {
        desktopMenu.innerHTML = categories.map(generateHtml).join('');
      }

      if (mobileMenu) {
        mobileMenu.innerHTML = categories.map(generateHtml).join('');
      }

    } catch (error) {
      console.error('Failed to load navigation categories:', error);
      // Les catégories statiques serviront de fallback en cas d'erreur.
    }
  }

  async loadFeaturedCollections() {
    try {
      const collectionsContainer = document.getElementById('collectionsGrid');
      if (!collectionsContainer) return;

      showSpinner();
      
      // Get featured categories
      const { data: categories, error } = await supabase.from('categories').select('*').limit(2);

      if (error) throw error;
      
      collectionsContainer.innerHTML = categories.map(category => `
        <div class="collection-card">
            <a href="catalog.html?category=${category.slug}">
                <div class="collection-image">
                    <img src="${category.image_url || 'https://placehold.co/600x400?text=Collection'}" alt="${category.name}">
                </div>
                <div class="collection-info">
                    <h3>${category.name}</h3>
                    <p>${category.description || 'Découvrez notre collection.'}</p>
                </div>
            </a>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load featured collections:', error);
      const collectionsContainer = document.getElementById('collectionsGrid');
      if(collectionsContainer) collectionsContainer.innerHTML = `<p class="error-state">Impossible de charger les collections.</p>`;
    } finally {
      hideSpinner();
    }
  }

  async loadNewArrivals() {
    try {
      const arrivalsContainer = document.getElementById('newArrivalsGrid');
      if (!arrivalsContainer) return;

      showSpinner();
      
      // Get latest products
      const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(8);
      
      if (error) throw error;

      const formatCurrency = (amount) => {
        // Simple currency formatter, you can make this more robust
        return `$${Number(amount).toFixed(2)}`;
      };
      
      arrivalsContainer.innerHTML = products.map(product => {
        const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : 'https://placehold.co/400x500?text=Abaya';
        const hasDiscount = product.sale_price && product.sale_price < product.price;
        
        return `
          <div class="product-card" data-product-id="${product.id}">
            <a href="product.html?id=${product.id}">
              <div class="product-image">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                ${hasDiscount ? `<span class="product-badge" data-i18n="sale">Sale</span>` : ''}
                ${new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? `<span class="product-badge" data-i18n="new">New</span>` : ''}
              </div>
              <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                  ${hasDiscount ? `
                    <span class="current-price">${formatCurrency(product.sale_price)}</span>
                    <span class="original-price" style="text-decoration: line-through;">${formatCurrency(product.price)}</span>
                  ` : `
                    <span class="current-price">${formatCurrency(product.price)}</span>
                  `}
                </div>
              </div>
            </a>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Failed to load new arrivals:', error);
      const arrivalsContainer = document.getElementById('newArrivalsGrid');
      if(arrivalsContainer) arrivalsContainer.innerHTML = `<p class="error-state">Impossible de charger les nouveaux produits. Veuillez réessayer plus tard.</p>`;
    } finally {
      hideSpinner();
    }
  }

  async initHomePage() {
    try {
      // Load featured collections and new arrivals in parallel
      await Promise.all([
        this.loadFeaturedCollections(),
        this.loadNewArrivals()
      ]);
    } catch (error) {
      console.error('Failed to initialize home page:', error);
    }
  }

  setupNavigation() {
    // Handle navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPageFile = window.location.pathname.split('/').pop() || 'index.html';

    navLinks.forEach(link => {
      const linkFile = link.getAttribute('href').split('/').pop();
      if (linkFile === currentPageFile) {
        link.classList.add('active');
      }
    });
  }

  setupSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchForm = document.getElementById('searchBox'); // Assuming form is the box
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
          alert('Please sign in to add items to your wishlist');
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
        
        alert(
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
        alert('Quick view feature coming soon!');
      }
    });

    // Handle scroll to top
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