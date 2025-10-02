// Product Details Module
class ProductManager {
  constructor() {
    this.product = null;
    this.currentImageIndex = 0;
    this.selectedSize = null;
    this.selectedColor = null;
    this.quantity = 1;
    this.reviews = [];
    this.relatedProducts = [];
    this.isZoomed = false;
    this.init();
  }

  async init() {
    try {
      // Get product ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      
      if (!productId) {
        this.showError('Product ID not found');
        return;
      }
      
      // Load product data
      await this.loadProduct(productId);
      
      if (!this.product) {
        this.showError('Product not found');
        return;
      }
      
      // Setup UI
      this.renderProduct();
      this.setupEventListeners();
      this.setupImageGallery();
      this.setupTabs();
      
      // Load additional data
      await this.loadReviews();
      await this.loadRelatedProducts();
      
      console.log('Product page initialized successfully');
    } catch (error) {
      console.error('Failed to initialize product page:', error);
      this.showError('Failed to load product details');
    }
  }

  async loadProduct(productId) {
    try {
      utils.showLoading();
      this.product = await api.supabase.getProduct(productId);
      
      if (this.product) {
        // Update page title and meta
        document.title = `${this.product.name} - Abaya Elegance`;
        
        // Update structured data
        this.updateStructuredData();
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      throw error;
    } finally {
      utils.hideLoading();
    }
  }

  updateStructuredData() {
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": this.product.name,
      "image": this.product.images || [],
      "description": this.product.description,
      "brand": {
        "@type": "Brand",
        "name": "Abaya Elegance"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "USD",
        "price": this.product.sale_price || this.product.price,
        "availability": this.product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    };
    
    if (this.product.average_rating) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": this.product.average_rating,
        "reviewCount": this.product.review_count || 0
      };
    }
    
    // Update existing script tag
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.textContent = JSON.stringify(structuredData);
    }
  }

  renderProduct() {
    // Hide loading and error states
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    
    // Show product content
    const productContent = document.getElementById('productContent');
    productContent.style.display = 'block';
    
    // Update breadcrumb
    this.updateBreadcrumb();
    
    // Render product images
    this.renderImages();
    
    // Render product info
    this.renderProductInfo();
    
    // Render product options
    this.renderProductOptions();
    
    // Render stock status
    this.renderStockStatus();
    
    // Show tabs and other sections
    document.getElementById('productTabs').style.display = 'block';
    document.getElementById('reviewsSection').style.display = 'block';
    document.getElementById('relatedProducts').style.display = 'block';
    
    // Render detailed description
    this.renderDetailedDescription();
    
    // Render specifications
    this.renderSpecifications();
  }

  updateBreadcrumb() {
    const categoryElement = document.getElementById('breadcrumbCategory');
    const productElement = document.getElementById('breadcrumbProduct');
    
    if (this.product.categories) {
      categoryElement.innerHTML = `<a href="catalog.html?category=${this.product.categories.slug}">${this.product.categories.name}</a>`;
    }
    
    productElement.textContent = this.product.name;
  }

  renderImages() {
    const images = this.product.images || ['/images/placeholder.jpg'];
    
    // Main image
    const mainImage = document.getElementById('mainImage');
    mainImage.src = images[0];
    mainImage.alt = this.product.name;
    
    // Thumbnails
    const thumbnailContainer = document.getElementById('thumbnailImages');
    thumbnailContainer.innerHTML = images.map((image, index) => `
      <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
        <img src="${image}" alt="${this.product.name} - Image ${index + 1}" loading="lazy">
      </div>
    `).join('');
    
    // Show/hide navigation arrows
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    
    if (images.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'block';
      nextBtn.style.display = 'block';
    }
  }

  renderProductInfo() {
    // Category
    const categoryElement = document.getElementById('productCategory');
    if (this.product.categories) {
      categoryElement.textContent = this.product.categories.name;
    }
    
    // Title
    document.getElementById('productTitle').textContent = this.product.name;
    
    // Rating
    this.renderRating();
    
    // Price
    this.renderPrice();
    
    // Description
    document.getElementById('productDescription').textContent = this.product.description || '';
  }

  renderRating() {
    const starsElement = document.getElementById('productStars');
    const ratingTextElement = document.getElementById('ratingText');
    const reviewsLinkElement = document.getElementById('reviewsLink');
    
    const rating = this.product.average_rating || 0;
    const reviewCount = this.product.review_count || 0;
    
    starsElement.innerHTML = this.renderStars(rating);
    ratingTextElement.textContent = `${rating.toFixed(1)} out of 5`;
    reviewsLinkElement.textContent = `(${reviewCount} reviews)`;
  }

  renderPrice() {
    const currentPriceElement = document.getElementById('currentPrice');
    const originalPriceElement = document.getElementById('originalPrice');
    const discountBadgeElement = document.getElementById('discountBadge');
    
    const hasDiscount = this.product.sale_price && this.product.sale_price < this.product.price;
    
    if (hasDiscount) {
      currentPriceElement.textContent = utils.formatCurrency(this.product.sale_price);
      originalPriceElement.textContent = utils.formatCurrency(this.product.price);
      originalPriceElement.style.display = 'inline';
      
      const discountPercent = Math.round(((this.product.price - this.product.sale_price) / this.product.price) * 100);
      discountBadgeElement.textContent = `${discountPercent}% ${window.i18n.t('off')}`;
      discountBadgeElement.style.display = 'inline';
    } else {
      currentPriceElement.textContent = utils.formatCurrency(this.product.price);
      originalPriceElement.style.display = 'none';
      discountBadgeElement.style.display = 'none';
    }
  }

  renderProductOptions() {
    // Size options
    if (this.product.sizes && this.product.sizes.length > 0) {
      const sizeGroup = document.getElementById('sizeGroup');
      const sizeOptions = document.getElementById('sizeOptions');
      
      sizeGroup.style.display = 'block';
      sizeOptions.innerHTML = this.product.sizes.map(size => `
        <button class="size-option" data-size="${size}">${size}</button>
      `).join('');
    }
    
    // Color options
    if (this.product.colors && this.product.colors.length > 0) {
      const colorGroup = document.getElementById('colorGroup');
      const colorOptions = document.getElementById('colorOptions');
      
      colorGroup.style.display = 'block';
      colorOptions.innerHTML = this.product.colors.map(color => {
        const colorConfig = APP_CONFIG.colors.find(c => c.name === color);
        const colorValue = colorConfig ? colorConfig.value : '#000000';
        
        return `
          <button class="color-option" data-color="${color}" 
                  style="background-color: ${colorValue}" 
                  title="${color}">
            <span class="color-name">${color}</span>
          </button>
        `;
      }).join('');
    }
  }

  renderStockStatus() {
    const stockStatusElement = document.getElementById('stockStatus');
    
    if (this.product.in_stock) {
      if (this.product.stock_quantity && this.product.stock_quantity <= 5) {
        stockStatusElement.innerHTML = `
          <div class="stock-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Only ${this.product.stock_quantity} left in stock!
          </div>
        `;
      } else {
        stockStatusElement.innerHTML = `
          <div class="stock-available">
            <i class="fas fa-check-circle"></i>
            ${window.i18n.t('inStock')}
          </div>
        `;
      }
    } else {
      stockStatusElement.innerHTML = `
        <div class="stock-unavailable">
          <i class="fas fa-times-circle"></i>
          ${window.i18n.t('outOfStock')}
        </div>
      `;
      
      // Disable add to cart button
      const addToCartBtn = document.getElementById('addToCartBtn');
      addToCartBtn.disabled = true;
      addToCartBtn.innerHTML = `<i class="fas fa-ban"></i> ${window.i18n.t('outOfStock')}`;
    }
  }

  renderDetailedDescription() {
    const detailedDescriptionElement = document.getElementById('detailedDescription');
    
    // Use detailed_description if available, otherwise use regular description
    const description = this.product.detailed_description || this.product.description || '';
    
    detailedDescriptionElement.innerHTML = `
      <div class="description-content">
        <p>${description}</p>
        
        <h4>Features:</h4>
        <ul>
          <li>Premium quality fabric</li>
          <li>Elegant and modest design</li>
          <li>Comfortable fit for all-day wear</li>
          <li>Easy care and maintenance</li>
          <li>Available in multiple sizes</li>
        </ul>
      </div>
    `;
  }

  renderSpecifications() {
    const specificationsTable = document.getElementById('specificationsTable');
    
    const specifications = [
      { label: 'Material', value: this.product.material || 'Premium Fabric' },
      { label: 'Care Instructions', value: 'Hand wash cold, air dry' },
      { label: 'Origin', value: this.product.origin || 'Made with care' },
      { label: 'Fit', value: this.product.fit || 'Regular' },
      { label: 'Length', value: this.product.length || 'Full length' }
    ];
    
    if (this.product.sizes && this.product.sizes.length > 0) {
      specifications.push({ label: 'Available Sizes', value: this.product.sizes.join(', ') });
    }
    
    if (this.product.colors && this.product.colors.length > 0) {
      specifications.push({ label: 'Available Colors', value: this.product.colors.join(', ') });
    }
    
    specificationsTable.innerHTML = specifications.map(spec => `
      <tr>
        <td><strong>${spec.label}</strong></td>
        <td>${spec.value}</td>
      </tr>
    `).join('');
  }

  setupEventListeners() {
    // Image gallery
    this.setupImageGalleryEvents();
    
    // Product options
    this.setupProductOptionsEvents();
    
    // Quantity selector
    this.setupQuantityEvents();
    
    // Product actions
    this.setupProductActionsEvents();
    
    // Tabs
    this.setupTabsEvents();
    
    // Reviews
    this.setupReviewsEvents();
    
    // Modals
    this.setupModalEvents();
  }

  setupImageGalleryEvents() {
    // Thumbnail clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.thumbnail')) {
        const thumbnail = e.target.closest('.thumbnail');
        const index = parseInt(thumbnail.dataset.index);
        this.changeImage(index);
      }
    });
    
    // Navigation arrows
    document.getElementById('prevImage').addEventListener('click', () => {
      this.previousImage();
    });
    
    document.getElementById('nextImage').addEventListener('click', () => {
      this.nextImage();
    });
    
    // Zoom toggle
    document.getElementById('zoomToggle').addEventListener('click', () => {
      this.toggleZoom();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.previousImage();
      } else if (e.key === 'ArrowRight') {
        this.nextImage();
      } else if (e.key === 'Escape' && this.isZoomed) {
        this.toggleZoom();
      }
    });
  }

  setupProductOptionsEvents() {
    // Size selection
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('size-option')) {
        document.querySelectorAll('.size-option').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        this.selectedSize = e.target.dataset.size;
      }
    });
    
    // Color selection
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-option')) {
        document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        this.selectedColor = e.target.dataset.color;
      }
    });
  }

  setupQuantityEvents() {
    const quantityInput = document.getElementById('quantity');
    const minusBtn = document.getElementById('quantityMinus');
    const plusBtn = document.getElementById('quantityPlus');
    
    minusBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
        this.quantity = currentValue - 1;
      }
    });
    
    plusBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      const maxQuantity = this.product.stock_quantity || 10;
      if (currentValue < maxQuantity) {
        quantityInput.value = currentValue + 1;
        this.quantity = currentValue + 1;
      }
    });
    
    quantityInput.addEventListener('change', (e) => {
      const value = parseInt(e.target.value);
      const maxQuantity = this.product.stock_quantity || 10;
      
      if (value < 1) {
        e.target.value = 1;
        this.quantity = 1;
      } else if (value > maxQuantity) {
        e.target.value = maxQuantity;
        this.quantity = maxQuantity;
      } else {
        this.quantity = value;
      }
    });
  }

  setupProductActionsEvents() {
    // Add to cart
    document.getElementById('addToCartBtn').addEventListener('click', () => {
      this.addToCart();
    });
    
    // Wishlist
    document.getElementById('wishlistBtn').addEventListener('click', () => {
      this.toggleWishlist();
    });
    
    // Share
    document.getElementById('shareBtn').addEventListener('click', () => {
      this.showShareModal();
    });
  }

  setupTabsEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      }
    });
  }

  setupReviewsEvents() {
    // Write review button
    document.getElementById('writeReviewBtn').addEventListener('click', () => {
      this.showReviewModal();
    });
    
    // Reviews sorting
    document.getElementById('reviewsSort').addEventListener('change', (e) => {
      this.sortReviews(e.target.value);
    });
    
    // Rating filter
    document.getElementById('ratingFilter').addEventListener('change', (e) => {
      this.filterReviews(e.target.value);
    });
  }

  setupModalEvents() {
    // Review modal
    this.setupReviewModalEvents();
    
    // Share modal
    this.setupShareModalEvents();
  }

  setupReviewModalEvents() {
    const modal = document.getElementById('reviewModal');
    const closeBtn = document.getElementById('reviewModalClose');
    const cancelBtn = document.getElementById('cancelReview');
    const form = document.getElementById('reviewForm');
    
    closeBtn.addEventListener('click', () => {
      this.hideReviewModal();
    });
    
    cancelBtn.addEventListener('click', () => {
      this.hideReviewModal();
    });
    
    // Star rating
    document.addEventListener('click', (e) => {
      if (e.target.closest('#starRating .fa-star')) {
        const star = e.target;
        const rating = parseInt(star.dataset.rating);
        this.setStarRating(rating);
      }
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitReview();
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideReviewModal();
      }
    });
  }

  setupShareModalEvents() {
    const modal = document.getElementById('shareModal');
    const closeBtn = document.getElementById('shareModalClose');
    const copyBtn = document.getElementById('copyLink');
    
    closeBtn.addEventListener('click', () => {
      this.hideShareModal();
    });
    
    copyBtn.addEventListener('click', () => {
      this.copyShareLink();
    });
    
    // Share buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.share-btn[data-platform]')) {
        const platform = e.target.closest('.share-btn').dataset.platform;
        this.shareOnPlatform(platform);
      }
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideShareModal();
      }
    });
  }

  // Image gallery methods
  changeImage(index) {
    const images = this.product.images || [];
    if (index < 0 || index >= images.length) return;
    
    this.currentImageIndex = index;
    
    // Update main image
    const mainImage = document.getElementById('mainImage');
    mainImage.src = images[index];
    
    // Update thumbnails
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }

  previousImage() {
    const images = this.product.images || [];
    const newIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : images.length - 1;
    this.changeImage(newIndex);
  }

  nextImage() {
    const images = this.product.images || [];
    const newIndex = this.currentImageIndex < images.length - 1 ? this.currentImageIndex + 1 : 0;
    this.changeImage(newIndex);
  }

  toggleZoom() {
    const mainImage = document.getElementById('mainImage');
    const zoomDiv = document.getElementById('imageZoom');
    const zoomToggle = document.getElementById('zoomToggle');
    
    this.isZoomed = !this.isZoomed;
    
    if (this.isZoomed) {
      mainImage.style.display = 'none';
      zoomDiv.style.display = 'block';
      zoomDiv.style.backgroundImage = `url(${mainImage.src})`;
      zoomToggle.innerHTML = '<i class="fas fa-search-minus"></i>';
      
      // Add zoom functionality
      this.setupZoomEvents(zoomDiv);
    } else {
      mainImage.style.display = 'block';
      zoomDiv.style.display = 'none';
      zoomToggle.innerHTML = '<i class="fas fa-search-plus"></i>';
    }
  }

  setupZoomEvents(zoomDiv) {
    zoomDiv.addEventListener('mousemove', (e) => {
      const rect = zoomDiv.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      zoomDiv.style.backgroundPosition = `${x}% ${y}%`;
    });
  }

  // Product actions
  async addToCart() {
    try {
      // Validate required options
      if (this.product.sizes && this.product.sizes.length > 0 && !this.selectedSize) {
        utils.showToast('Please select a size', 'warning');
        return;
      }
      
      if (this.product.colors && this.product.colors.length > 0 && !this.selectedColor) {
        utils.showToast('Please select a color', 'warning');
        return;
      }
      
      const cartItem = {
        product_id: this.product.id,
        quantity: this.quantity,
        size: this.selectedSize,
        color: this.selectedColor
      };
      
      await window.cartManager.addItem(cartItem);
      utils.showToast('Product added to cart!', 'success');
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
      utils.showToast('Failed to add product to cart', 'error');
    }
  }

  toggleWishlist() {
    // Implement wishlist functionality
    const wishlistBtn = document.getElementById('wishlistBtn');
    const icon = wishlistBtn.querySelector('i');
    
    if (icon.classList.contains('far')) {
      icon.classList.remove('far');
      icon.classList.add('fas');
      wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Wishlist';
      utils.showToast('Added to wishlist!', 'success');
    } else {
      icon.classList.remove('fas');
      icon.classList.add('far');
      wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
      utils.showToast('Removed from wishlist', 'info');
    }
  }

  // Tabs
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}Tab`);
    });
  }

  // Reviews
  async loadReviews() {
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use mock data
      this.reviews = [
        {
          id: 1,
          rating: 5,
          title: 'Beautiful and elegant',
          comment: 'This abaya is absolutely stunning! The quality is excellent and the fit is perfect.',
          reviewer_name: 'Sarah M.',
          created_at: '2024-01-15',
          helpful_count: 12
        },
        {
          id: 2,
          rating: 4,
          title: 'Good quality',
          comment: 'Nice fabric and design. Shipping was fast. Would recommend.',
          reviewer_name: 'Fatima A.',
          created_at: '2024-01-10',
          helpful_count: 8
        }
      ];
      
      this.renderReviews();
      this.renderReviewsSummary();
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  }

  renderReviewsSummary() {
    const averageRating = this.product.average_rating || 0;
    const totalReviews = this.product.review_count || 0;
    
    document.getElementById('averageRating').textContent = averageRating.toFixed(1);
    document.getElementById('averageStars').innerHTML = this.renderStars(averageRating);
    document.getElementById('totalReviews').textContent = `${totalReviews} reviews`;
    
    // Render rating breakdown
    const breakdownContainer = document.getElementById('ratingBreakdown');
    const breakdown = this.calculateRatingBreakdown();
    
    breakdownContainer.innerHTML = [5, 4, 3, 2, 1].map(rating => {
      const count = breakdown[rating] || 0;
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      
      return `
        <div class="rating-bar">
          <span class="rating-label">${rating} stars</span>
          <div class="rating-progress">
            <div class="rating-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="rating-count">${count}</span>
        </div>
      `;
    }).join('');
  }

  calculateRatingBreakdown() {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    this.reviews.forEach(review => {
      breakdown[review.rating]++;
    });
    
    return breakdown;
  }

  renderReviews() {
    const reviewsList = document.getElementById('reviewsList');
    
    if (this.reviews.length === 0) {
      reviewsList.innerHTML = `
        <div class="no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      `;
      return;
    }
    
    reviewsList.innerHTML = this.reviews.map(review => `
      <div class="review-item">
        <div class="review-header">
          <div class="review-rating">
            ${this.renderStars(review.rating)}
          </div>
          <div class="review-meta">
            <span class="reviewer-name">${review.reviewer_name}</span>
            <span class="review-date">${utils.formatDate(review.created_at)}</span>
          </div>
        </div>
        
        <div class="review-content">
          <h4 class="review-title">${review.title}</h4>
          <p class="review-comment">${review.comment}</p>
        </div>
        
        <div class="review-actions">
          <button class="helpful-btn" data-review-id="${review.id}">
            <i class="fas fa-thumbs-up"></i>
            Helpful (${review.helpful_count || 0})
          </button>
        </div>
      </div>
    `).join('');
  }

  sortReviews(sortBy) {
    switch (sortBy) {
      case 'newest':
        this.reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        this.reviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'highest':
        this.reviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        this.reviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        this.reviews.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
        break;
    }
    
    this.renderReviews();
  }

  filterReviews(rating) {
    // This would filter reviews by rating
    // For now, just re-render all reviews
    this.renderReviews();
  }

  // Related products
  async loadRelatedProducts() {
    try {
      // In a real implementation, this would fetch related products from Supabase
      // For now, we'll use mock data
      this.relatedProducts = [];
      
      this.renderRelatedProducts();
    } catch (error) {
      console.error('Failed to load related products:', error);
    }
  }

  renderRelatedProducts() {
    const container = document.getElementById('relatedProductsGrid');
    
    if (this.relatedProducts.length === 0) {
      document.getElementById('relatedProducts').style.display = 'none';
      return;
    }
    
    container.innerHTML = this.relatedProducts.map(product => {
      const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';
      const hasDiscount = product.sale_price && product.sale_price < product.price;
      
      return `
        <div class="product-card">
          <div class="product-image">
            <img src="${imageUrl}" alt="${product.name}" loading="lazy">
            ${hasDiscount ? `<span class="discount-badge">${window.i18n.t('sale')}</span>` : ''}
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
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Modal methods
  showReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  hideReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    
    // Reset form
    document.getElementById('reviewForm').reset();
    this.resetStarRating();
  }

  showShareModal() {
    const modal = document.getElementById('shareModal');
    const shareLink = document.getElementById('shareLink');
    
    shareLink.value = window.location.href;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  hideShareModal() {
    const modal = document.getElementById('shareModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  setStarRating(rating) {
    const stars = document.querySelectorAll('#starRating .fa-star');
    const ratingInput = document.getElementById('reviewRating');
    
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.remove('far');
        star.classList.add('fas');
      } else {
        star.classList.remove('fas');
        star.classList.add('far');
      }
    });
    
    ratingInput.value = rating;
  }

  resetStarRating() {
    const stars = document.querySelectorAll('#starRating .fa-star');
    const ratingInput = document.getElementById('reviewRating');
    
    stars.forEach(star => {
      star.classList.remove('fas');
      star.classList.add('far');
    });
    
    ratingInput.value = '';
  }

  async submitReview() {
    try {
      const formData = new FormData(document.getElementById('reviewForm'));
      const reviewData = {
        product_id: this.product.id,
        rating: parseInt(formData.get('rating')),
        title: formData.get('title'),
        comment: formData.get('comment'),
        reviewer_name: formData.get('name'),
        reviewer_email: formData.get('email')
      };
      
      // In a real implementation, this would submit to Supabase
      console.log('Submitting review:', reviewData);
      
      utils.showToast('Review submitted successfully!', 'success');
      this.hideReviewModal();
      
      // Reload reviews
      await this.loadReviews();
      
    } catch (error) {
      console.error('Failed to submit review:', error);
      utils.showToast('Failed to submit review', 'error');
    }
  }

  copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    utils.showToast('Link copied to clipboard!', 'success');
  }

  shareOnPlatform(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.product.name);
    const description = encodeURIComponent(this.product.description || '');
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'pinterest':
        const imageUrl = this.product.images && this.product.images.length > 0 ? encodeURIComponent(this.product.images[0]) : '';
        shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${imageUrl}&description=${title}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${title} ${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${title}&body=${description} ${decodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
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

  showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    
    const errorContent = document.querySelector('.error-content p');
    if (errorContent) {
      errorContent.textContent = message;
    }
  }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('product.html') || window.location.pathname.includes('product-details.html')) {
    window.productManager = new ProductManager();
  }
});

// Export for global use
window.ProductManager = ProductManager;