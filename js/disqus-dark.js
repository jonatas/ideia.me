/**
 * Disqus Dark Mode Handler
 * 
 * This script provides advanced support for Disqus in dark mode.
 * It applies dark mode styling directly to the Disqus iframe when possible,
 * and falls back to a filter-based approach when direct access is restricted.
 */

(function() {
  // Function to determine if dark mode is active
  function isDarkModeActive() {
    return document.documentElement.classList.contains('dark-mode') || 
           document.body.classList.contains('dark-mode') || 
           (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  
  // Function to apply dark mode to Disqus
  function applyDisqusDarkMode() {
    if (!isDarkModeActive()) return;
    
    // Find the Disqus container
    const disqusThread = document.getElementById('disqus_thread');
    if (!disqusThread) return;
    
    // Apply dark mode styling to the container
    disqusThread.style.backgroundColor = '#1e1e1e';
    disqusThread.style.color = '#f0f2f5';
    disqusThread.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    disqusThread.style.borderRadius = '8px';
    disqusThread.style.padding = '20px';
    
    // Function to handle Disqus iframe once loaded
    function handleDisqusIframe() {
      const disqusIframes = document.querySelectorAll('iframe[src*="disqus.com"]');
      
      disqusIframes.forEach(iframe => {
        // First try the direct approach via postMessage
        try {
          iframe.contentWindow.postMessage({
            name: 'theme',
            data: { theme: 'dark' }
          }, '*');
        } catch (e) {
          console.log('Could not post message to Disqus iframe:', e);
        }
        
        // Second try the direct style access
        try {
          const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
          
          const style = document.createElement('style');
          style.textContent = `
            body { background-color: #1e1e1e !important; color: #f0f2f5 !important; }
            .textarea-wrapper, .post-actions { background-color: #2a2d31 !important; }
            .wysiwyg__placeholder, input, textarea { color: #f0f2f5 !important; }
            .publisher-background-color { background-color: #1e1e1e !important; }
            .publisher-border-color { border-color: rgba(255, 255, 255, 0.1) !important; }
            .publisher-anchor-color, a { color: #5c9eff !important; }
          `;
          
          iframeDocument.head.appendChild(style);
        } catch (e) {
          console.log('Could not access Disqus iframe document:', e);
          
          // Fallback to the filter approach
          iframe.classList.add('disqus-dark-mode');
          
          // For better results, add a parent container with the filter inversion
          const parent = iframe.parentElement;
          if (parent) {
            parent.classList.add('force-disqus-dark');
          }
        }
      });
    }
    
    // Try multiple times as Disqus loads asynchronously
    setTimeout(handleDisqusIframe, 1000);
    setTimeout(handleDisqusIframe, 3000);
    setTimeout(handleDisqusIframe, 5000);
  }
  
  // Run when DOM content is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDisqusDarkMode);
  } else {
    applyDisqusDarkMode();
  }
  
  // Run when Disqus is loaded
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'disqus.frameLoaded') {
      applyDisqusDarkMode();
    }
  });
  
  // Run after a delay to catch late-loading content
  setTimeout(applyDisqusDarkMode, 2000);
  setTimeout(applyDisqusDarkMode, 5000);
  
  // Listen for theme changes
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function() {
      // Delay the application slightly to allow DOM changes to propagate
      setTimeout(applyDisqusDarkMode, 100);
    });
  }
})(); 