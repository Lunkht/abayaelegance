// Authentication Module
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.init();
  }

  async init() {
    // Check for existing session
    await this.checkSession();
    this.updateUI();
    this.setupEventListeners();
  }

  async checkSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return;
      }

      if (session) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        
        // Get user profile
        await this.getUserProfile();
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }

  async getUserProfile() {
    if (!this.currentUser) return;

    try {
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        return;
      }

      if (data) {
        this.currentUser.profile = data;
      }
    } catch (error) {
      console.error('Get user profile failed:', error);
    }
  }

  async signUp(email, password, firstName, lastName) {
    try {
      utils.showLoading();

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create user profile
        await this.createUserProfile(data.user.id, firstName, lastName);
        
        utils.showToast('Account created successfully! Please check your email to verify your account.', 'success');
        return { success: true, user: data.user };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      utils.showToast(error.message || 'Failed to create account', 'error');
      return { success: false, error: error.message };
    } finally {
      utils.hideLoading();
    }
  }

  async createUserProfile(userId, firstName, lastName) {
    try {
      const { error } = await supabaseClient
        .from('user_profiles')
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName
        });

      if (error) {
        console.error('Profile creation error:', error);
      }
    } catch (error) {
      console.error('Create user profile failed:', error);
    }
  }

  async signIn(email, password) {
    try {
      utils.showLoading();

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        this.currentUser = data.user;
        this.isAuthenticated = true;
        
        await this.getUserProfile();
        this.updateUI();
        
        utils.showToast('Welcome back!', 'success');
        
        // Redirect to account page or previous page
        const returnUrl = utils.getQueryParam('return') || 'account.html';
        window.location.href = returnUrl;
        
        return { success: true, user: data.user };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      utils.showToast(error.message || 'Failed to sign in', 'error');
      return { success: false, error: error.message };
    } finally {
      utils.hideLoading();
    }
  }

  async signOut() {
    try {
      utils.showLoading();

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        throw error;
      }

      this.currentUser = null;
      this.isAuthenticated = false;
      this.updateUI();
      
      // Clear cart
      if (window.cartManager) {
        window.cartManager.clearCart();
      }
      
      utils.showToast('Signed out successfully', 'success');
      
      // Redirect to home page
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Sign out error:', error);
      utils.showToast('Failed to sign out', 'error');
    } finally {
      utils.hideLoading();
    }
  }

  async resetPassword(email) {
    try {
      utils.showLoading();

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
      });

      if (error) {
        throw error;
      }

      utils.showToast('Password reset email sent! Check your inbox.', 'success');
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      utils.showToast(error.message || 'Failed to send reset email', 'error');
      return { success: false, error: error.message };
    } finally {
      utils.hideLoading();
    }
  }

  async updatePassword(newPassword) {
    try {
      utils.showLoading();

      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      utils.showToast('Password updated successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      utils.showToast(error.message || 'Failed to update password', 'error');
      return { success: false, error: error.message };
    } finally {
      utils.hideLoading();
    }
  }

  async updateProfile(profileData) {
    if (!this.currentUser) {
      utils.showToast('Please sign in first', 'error');
      return { success: false };
    }

    try {
      utils.showLoading();

      const { error } = await supabaseClient
        .from('user_profiles')
        .update(profileData)
        .eq('id', this.currentUser.id);

      if (error) {
        throw error;
      }

      // Update local user data
      this.currentUser.profile = { ...this.currentUser.profile, ...profileData };
      
      utils.showToast('Profile updated successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      utils.showToast(error.message || 'Failed to update profile', 'error');
      return { success: false, error: error.message };
    } finally {
      utils.hideLoading();
    }
  }

  updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const accountBtn = document.getElementById('accountBtn');
    
    // Header dropdown sections
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');
    // Mobile menu sections
    const mobileAuth = document.getElementById('mobileAuth');
    const mobileUser = document.getElementById('mobileUser');
    
    if (this.isAuthenticated) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (accountBtn) {
        accountBtn.style.display = 'inline-block';
        accountBtn.textContent = this.currentUser.profile?.first_name || 'Account';
      }
      // Toggle header/mobile auth sections
      if (authLinks) authLinks.style.display = 'none';
      if (userLinks) userLinks.style.display = 'block';
      if (mobileAuth) mobileAuth.style.display = 'none';
      if (mobileUser) mobileUser.style.display = 'block';
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (accountBtn) accountBtn.style.display = 'none';
      // Toggle header/mobile auth sections
      if (authLinks) authLinks.style.display = 'block';
      if (userLinks) userLinks.style.display = 'none';
      if (mobileAuth) mobileAuth.style.display = 'flex';
      if (mobileUser) mobileUser.style.display = 'none';
    }

    // Update cart count if cart manager exists
    if (window.cartManager) {
      window.cartManager.updateCartCount();
    }
  }

  setupEventListeners() {
    // Listen for auth state changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        this.getUserProfile().then(() => this.updateUI());
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUI();
      }
    });

    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!utils.validateEmail(email)) {
          utils.showToast('Please enter a valid email address', 'error');
          return;
        }
        
        await this.signIn(email, password);
      });
    }

    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (!firstName || !lastName) {
          utils.showToast('Please enter your full name', 'error');
          return;
        }
        
        if (!utils.validateEmail(email)) {
          utils.showToast('Please enter a valid email address', 'error');
          return;
        }
        
        if (password.length < 6) {
          utils.showToast('Password must be at least 6 characters long', 'error');
          return;
        }
        
        if (password !== confirmPassword) {
          utils.showToast('Passwords do not match', 'error');
          return;
        }
        
        await this.signUp(email, password, firstName, lastName);
      });
    }

    // Handle forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(forgotPasswordForm);
        const email = formData.get('email');
        
        if (!utils.validateEmail(email)) {
          utils.showToast('Please enter a valid email address', 'error');
          return;
        }
        
        await this.resetPassword(email);
      });
    }

    // Handle sign out buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList && e.target.classList.contains('sign-out-btn')) {
        e.preventDefault();
        this.signOut();
      }
    });

    // Handle sign out buttons via ids
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.signOut();
      });
    }
    const mobileSignOutBtn = document.getElementById('mobileSignOutBtn');
    if (mobileSignOutBtn) {
      mobileSignOutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.signOut();
      });
    }
  }

  // Check if user is authenticated (for protected pages)
  requireAuth() {
    if (!this.isAuthenticated) {
      const currentPage = window.location.pathname;
      window.location.href = `login.html?return=${encodeURIComponent(currentPage)}`;
      return false;
    }
    return true;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user has specific role (for admin features)
  hasRole(role) {
    return this.currentUser?.user_metadata?.role === role;
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for global use
window.authManager = authManager;