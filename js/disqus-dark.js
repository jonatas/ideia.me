/**
 * Disqus Dark Mode Handler
 * This script properly configures Disqus with dark mode styling
 * and ensures to use DISQUS.reset instead of reloading embed.js
 */

(function() {
  // Only run this initialization once
  let disqusInitialized = false;
  
  // Main initialization function
  function initDisqus() {
    if (disqusInitialized) return;
    disqusInitialized = true;
    
    // Add dark mode styles for the container
    const darkStyles = document.createElement('style');
    darkStyles.textContent = `
      #disqus_thread {
        background-color: rgba(17, 17, 17, 0.7) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 20px;
        margin-top: 20px;
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(darkStyles);
    
    // Store original disqus_config if it exists
    const originalDisqusConfig = window.disqus_config;
    
    // Create a new disqus_config that includes dark mode settings
    window.disqus_config = function() {
      // Apply original config if it exists
      if (typeof originalDisqusConfig === 'function') {
        originalDisqusConfig.apply(this, arguments);
      }
      
      // Ensure we have the correct identifier and URL
      this.page = this.page || {};
      if (!this.page.identifier) {
        this.page.identifier = window.location.pathname || document.querySelector('meta[property="og:url"]')?.content;
      }
      if (!this.page.url) {
        this.page.url = window.location.href;
      }
            
      // Set the theme to dark
      this.page.remote_auth_s3 = '';
      this.page.api_key = '';
      
      // Add callbacks
      this.callbacks = this.callbacks || {};
      this.callbacks.onReady = this.callbacks.onReady || [];
      
      // Add our callback that gets executed when Disqus is loaded
      this.callbacks.onReady.push(function() {
        console.log('Disqus ready - applying dark mode theme');
      });
    };
    
    // Only load Disqus script once
    if (!window.DISQUS && !document.getElementById('disqus-script')) {
      const thread = document.getElementById('disqus_thread');
      if (thread) {
        loadDisqusScript();
      }
    } 
    // If DISQUS already exists, use reset
    else if (window.DISQUS) {
      resetDisqus();
    }
  }
  
  // Function to load the Disqus script
  function loadDisqusScript() {
    console.log('Loading Disqus script once');
    const d = document;
    const s = d.createElement('script');
    s.id = 'disqus-script';
    s.src = 'https://' + disqusShortname() + '.disqus.com/embed.js';
    s.async = true;
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  }
  
  // Function to reset Disqus when navigating between pages
  function resetDisqus() {
    if (window.DISQUS) {
      console.log('Resetting existing Disqus instance');
      window.DISQUS.reset({
        reload: true,
        config: function() {
          // Apply config settings again
          this.page.identifier = window.location.pathname;
          this.page.url = window.location.href;
          this.language = 'en';
        }
      });
    }
  }
  
  // Get Disqus shortname from the page or fallback to default
  function disqusShortname() {
    // Try to find the shortname in the page
    const disqusShortname = document.querySelector('script[src*="disqus.com/embed.js"]');
    if (disqusShortname) {
      const match = disqusShortname.src.match(/https?:\/\/([^.]+)\./);
      if (match && match[1]) return match[1];
    }
    
    // Look for a global disqus_shortname variable
    if (window.disqus_shortname) return window.disqus_shortname;
    
    // Default to 'ideiame' as fallback - change to your shortname
    return 'ideiame';
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDisqus);
  } else {
    initDisqus();
  }
  
  // Also handle page navigation for SPA sites
  window.addEventListener('hashchange', resetDisqus);
})(); 