// Système d'internationalisation pour Abaya Elegance
class I18n {
    constructor() {
        this.currentLanguage = 'fr'; // Français par défaut
        this.translations = {
            fr: {
                // Navigation
                home: 'Accueil',
                categories: 'Catégories',
                shop: 'Boutique',
                about: 'À propos',
                contact: 'Contact',
                
                // Authentification
                signIn: 'Se connecter',
                register: 'S\'inscrire',
                signOut: 'Se déconnecter',
                myAccount: 'Mon compte',
                orders: 'Commandes',
                
                // Pages principales
                welcomeBack: 'Bon retour',
                signInToAccount: 'Connectez-vous à votre compte pour continuer vos achats',
                createAccount: 'Créer un compte',
                joinCommunity: 'Rejoignez notre communauté et découvrez la beauté de la mode modeste',
                
                // Panier
                shoppingCart: 'Panier',
                cartEmpty: 'Votre panier est vide',
                cartEmptyDesc: 'Il semble que vous n\'ayez encore ajouté aucun article à votre panier.',
                continueShopping: 'Continuer les achats',
                addToCart: 'Ajouter au panier',
                
                // Produits
                newArrivals: 'Nouvelles arrivées',
                featuredCollections: 'Collections vedettes',
                viewAllProducts: 'Voir tous les produits',
                productCatalog: 'Catalogue des produits',
                
                // Footer
                quickLinks: 'Liens rapides',
                customerService: 'Service client',
                newsletter: 'Newsletter',
                aboutUs: 'À propos de nous',
                
                // Hero section
                heroTitle: 'Abayas Élégantes pour la Femme Moderne',
                heroSubtitle: 'Découvrez notre exquise collection d\'abayas traditionnelles et contemporaines, confectionnées avec des tissus premium et une attention aux détails.',
                shopCollection: 'Voir la collection',
                viewFeatured: 'Voir les vedettes',
                
                // About section
                aboutTitle: 'À propos d\'Abaya Elegance',
                aboutDesc: 'Nous nous consacrons à fournir des abayas de la plus haute qualité qui allient les valeurs islamiques traditionnelles à la mode contemporaine. Notre collection présente des tissus soigneusement sélectionnés, un savoir-faire exquis et des designs qui célèbrent la beauté de la mode modeste.',
                premiumQuality: 'Qualité Premium',
                premiumDesc: 'Seulement les meilleurs tissus et matériaux',
                modestFashion: 'Mode Modeste',
                modestDesc: 'Des designs qui honorent les valeurs islamiques',
                fastDelivery: 'Livraison Rapide',
                fastDesc: 'Expédition mondiale rapide et sécurisée',
                
                // Newsletter
                stayUpdated: 'Restez informé',
                newsletterDesc: 'Abonnez-vous à notre newsletter pour les dernières collections et offres exclusives',
                enterEmail: 'Entrez votre email',
                subscribe: 'S\'abonner',
                
                // Contact
                contactUs: 'Nous contacter',
                getInTouch: 'Prenez contact',
                contactDesc: 'Nous aimerions avoir de vos nouvelles. Envoyez-nous un message et nous vous répondrons dès que possible.',
                
                // Breadcrumb
                catalog: 'Catalogue',
                
                // Mobile menu
                shopAll: 'Tout voir',
                collections: 'Collections',
                
                // Product page additions
                category: 'Catégorie',
                product: 'Produit',
                size: 'Taille',
                color: 'Couleur',
                quantity: 'Quantité',
                addToWishlist: 'Ajouter aux favoris',
                share: 'Partager',
                description: 'Description',
                specifications: 'Caractéristiques',
                care: 'Entretien',
                shippingReturns: 'Livraison & Retours',
                customerReviews: 'Avis des clients',
                writeReview: 'Rédiger un avis',
                newestFirst: 'Plus récents',
                oldestFirst: 'Plus anciens',
                highestRated: 'Mieux notés',
                lowestRated: 'Moins bien notés',
                mostHelpful: 'Les plus utiles',
                filterByRating: 'Filtrer par note :',
                allRatings: 'Toutes les notes',
                email: 'Email',
                shareLink: 'Lien de partage :',
                copy: 'Copier',
                sizeGuide: 'Guide des tailles',
                shippingInfo: 'Informations de livraison',
                returns: 'Retours',
                faq: 'FAQ',
                trackOrder: 'Suivre la commande',
                support: 'Support',
                
                // Catalog page additions
                filters: 'Filtres',
                clearAll: 'Tout effacer',
                priceRange: 'Plage de prix',
                apply: 'Appliquer',
                sizes: 'Tailles',
                colors: 'Couleurs',
                availability: 'Disponibilité',
                inStock: 'En stock',
                onSale: 'En promotion',
                sale: 'Promotion',
                outOfStock: 'Rupture de stock',
                viewDetails: 'Voir les détails',
                off: 'de réduction',
                cancel: 'Annuler',
                reorder: 'Commander à nouveau',
                noOrdersFound: 'Aucune commande trouvée',
                youHaventPlacedOrdersYet: 'Vous n\'avez pas encore passé de commande',
                startShopping: 'Commencer mes achats',
                items: 'Articles :',
                total: 'Total :',
                yourWishlistIsEmpty: 'Votre liste de souhaits est vide',
                saveItemsToWishlist: 'Enregistrez les articles que vous aimez dans votre liste de souhaits',
                browseProducts: 'Parcourir les produits',
                viewProduct: 'Voir le produit',
                noSavedAddresses: 'Aucune adresse enregistrée',
                addAddress: 'Ajouter une adresse'
             },
             en: {
                // Navigation
                home: 'Home',
                categories: 'Categories',
                shop: 'Shop',
                about: 'About',
                contact: 'Contact',
                
                // Authentication
                signIn: 'Sign In',
                register: 'Register',
                signOut: 'Sign Out',
                myAccount: 'My Account',
                orders: 'Orders',
                
                // Main pages
                welcomeBack: 'Welcome Back',
                signInToAccount: 'Sign in to your account to continue shopping',
                createAccount: 'Create Account',
                joinCommunity: 'Join our community and discover the beauty of modest fashion',
                
                // Cart
                shoppingCart: 'Shopping Cart',
                cartEmpty: 'Your cart is empty',
                cartEmptyDesc: 'Looks like you haven\'t added any items to your cart yet.',
                continueShopping: 'Continue Shopping',
                addToCart: 'Add to Cart',
                
                // Products
                newArrivals: 'New Arrivals',
                featuredCollections: 'Featured Collections',
                viewAllProducts: 'View All Products',
                productCatalog: 'Product Catalog',
                
                // Footer
                quickLinks: 'Quick Links',
                customerService: 'Customer Service',
                newsletter: 'Newsletter',
                aboutUs: 'About Us',
                
                // Hero section
                heroTitle: 'Elegant Abayas for the Modern Woman',
                heroSubtitle: 'Discover our exquisite collection of traditional and contemporary abayas, crafted with premium fabrics and attention to detail.',
                shopCollection: 'Shop Collection',
                viewFeatured: 'View Featured',
                
                // About section
                aboutTitle: 'About Abaya Elegance',
                aboutDesc: 'We are dedicated to providing the finest quality abayas that blend traditional Islamic values with contemporary fashion. Our collection features carefully selected fabrics, exquisite craftsmanship, and designs that celebrate the beauty of modest fashion.',
                premiumQuality: 'Premium Quality',
                premiumDesc: 'Only the finest fabrics and materials',
                modestFashion: 'Modest Fashion',
                modestDesc: 'Designs that honor Islamic values',
                fastDelivery: 'Fast Delivery',
                fastDesc: 'Quick and secure worldwide shipping',
                
                // Newsletter
                stayUpdated: 'Stay Updated',
                newsletterDesc: 'Subscribe to our newsletter for the latest collections and exclusive offers',
                enterEmail: 'Enter your email',
                subscribe: 'Subscribe',
                
                // Contact
                contactUs: 'Contact Us',
                getInTouch: 'Get In Touch',
                contactDesc: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
                
                // Breadcrumb
                catalog: 'Catalog',
                
                // Mobile menu
                shopAll: 'Shop All',
                collections: 'Collections',
                
                // Product page additions
                category: 'Category',
                product: 'Product',
                size: 'Size',
                color: 'Color',
                quantity: 'Quantity',
                addToWishlist: 'Add to Wishlist',
                share: 'Share',
                description: 'Description',
                specifications: 'Specifications',
                care: 'Care',
                shippingReturns: 'Shipping & Returns',
                customerReviews: 'Customer Reviews',
                writeReview: 'Write a Review',
                newestFirst: 'Newest First',
                oldestFirst: 'Oldest First',
                highestRated: 'Highest Rated',
                lowestRated: 'Lowest Rated',
                mostHelpful: 'Most Helpful',
                filterByRating: 'Filter by rating:',
                allRatings: 'All ratings',
                email: 'Email',
                shareLink: 'Share link:',
                copy: 'Copy',
                sizeGuide: 'Size Guide',
                shippingInfo: 'Shipping Information',
                returns: 'Returns',
                faq: 'FAQ',
                trackOrder: 'Track Order',
                support: 'Support',
                
                // Catalog page additions
                filters: 'Filters',
                clearAll: 'Clear All',
                priceRange: 'Price Range',
                apply: 'Apply',
                sizes: 'Sizes',
                colors: 'Colors',
                availability: 'Availability',
                inStock: 'In Stock',
                onSale: 'On Sale',
                sale: 'Sale',
                outOfStock: 'Out of Stock',
                viewDetails: 'View Details',
                off: 'OFF',
                cancel: 'Cancel',
                reorder: 'Reorder',
                noOrdersFound: 'No orders found',
                youHaventPlacedOrdersYet: 'You haven\'t placed any orders yet',
                startShopping: 'Start Shopping',
                items: 'Items:',
                total: 'Total:',
                yourWishlistIsEmpty: 'Your wishlist is empty',
                saveItemsToWishlist: 'Save items you love to your wishlist',
                browseProducts: 'Browse Products',
                viewProduct: 'View Product',
                noSavedAddresses: 'No saved addresses',
                addAddress: 'Add Address'
             }
        };
        
        this.init();
    }
    
    init() {
        // Charger la langue sauvegardée ou utiliser le français par défaut
        const savedLanguage = localStorage.getItem('abaya-language');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        
        // Appliquer les traductions
        this.applyTranslations();
        
        // Mettre à jour l'attribut lang du HTML
        document.documentElement.lang = this.currentLanguage;
    }
    
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('abaya-language', language);
            document.documentElement.lang = language;
            this.applyTranslations();
            
            // Émettre un événement pour notifier le changement de langue
            window.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language } 
            }));
        }
    }
    
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    applyTranslations() {
        // Trouver tous les éléments avec l'attribut data-i18n
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // Appliquer la traduction selon le type d'élément
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'email') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Mettre à jour le sélecteur de langue
        this.updateLanguageSelector();
    }
    
    updateLanguageSelector() {
        const languageSelectors = document.querySelectorAll('.language-selector select');
        languageSelectors.forEach(selector => {
            selector.value = this.currentLanguage;
        });
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Créer une instance globale
window.i18n = new I18n();

// Gestionnaire pour le sélecteur de langue
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter des gestionnaires d'événements aux sélecteurs de langue
    const languageSelectors = document.querySelectorAll('.language-selector select');
    
    languageSelectors.forEach(selector => {
        selector.addEventListener('change', function() {
            window.i18n.setLanguage(this.value);
        });
    });
});