// Modern effects for ideia.me website
document.addEventListener('DOMContentLoaded', function() {
  // Add random floating circles to the background for visual interest
  addFloatingCircles();
  
  // Add parallax effect to decorative elements
  initParallaxEffect();
  
  // Add hover animations to cards
  enhanceCardAnimations();
  
  // Add glow effect to badges on hover
  enhanceBadgeGlow();
});

// Create and add floating circle elements to the page
function addFloatingCircles() {
  const container = document.querySelector('.geometric-bg');
  if (!container) return;
  
  // Add floating circles with various sizes and opacity
  for (let i = 0; i < 8; i++) {
    const size = Math.random() * 100 + 50; // Random size between 50-150px
    const circle = document.createElement('div');
    
    circle.classList.add('floating-circle');
    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.left = `${Math.random() * 95}%`;
    circle.style.top = `${Math.random() * 95}%`;
    circle.style.opacity = (Math.random() * 0.05 + 0.02).toFixed(2);
    
    // Randomize the animation duration and delay
    const duration = (Math.random() * 20 + 10).toFixed(1);
    const delay = (Math.random() * 5).toFixed(1);
    circle.style.animationDuration = `${duration}s`;
    circle.style.animationDelay = `${delay}s`;
    
    // Random gradient direction and colors
    const angle = Math.floor(Math.random() * 360);
    circle.style.background = `linear-gradient(${angle}deg, var(--primary-blue), var(--primary-purple))`;
    
    container.appendChild(circle);
  }
  
  // Add CSS for the floating animation if it doesn't exist
  if (!document.querySelector('#floating-animation-style')) {
    const style = document.createElement('style');
    style.id = 'floating-animation-style';
    style.textContent = `
      .floating-circle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        animation: float ease-in-out infinite alternate;
        z-index: -1;
      }
      
      @keyframes float {
        0% {
          transform: translate(0, 0) rotate(0deg);
        }
        50% {
          transform: translate(20px, -15px) rotate(5deg);
        }
        100% {
          transform: translate(-20px, 15px) rotate(-5deg);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Add parallax effect to decorative elements
function initParallaxEffect() {
  const decorations = document.querySelectorAll('.circle-decoration');
  if (!decorations.length) return;
  
  document.addEventListener('mousemove', function(e) {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    decorations.forEach(function(element, index) {
      const depth = 0.05 + (index * 0.01);
      const moveX = (mouseX - 0.5) * depth * 100;
      const moveY = (mouseY - 0.5) * depth * 100;
      
      element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    });
  });
}

// Add enhanced animations to cards
function enhanceCardAnimations() {
  const cards = document.querySelectorAll('.glass-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      
      // Add subtle glow effect on hover based on card position
      const rect = this.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      
      const windowCenterX = window.innerWidth / 2;
      const windowCenterY = window.innerHeight / 2;
      
      // Calculate angle for highlighting based on card position relative to window center
      const angleX = (cardCenterX - windowCenterX) / windowCenterX;
      const angleY = (cardCenterY - windowCenterY) / windowCenterY;
      
      // Create subtle shadow based on position
      this.style.boxShadow = `
        0 10px 30px rgba(0, 0, 0, 0.15),
        ${-angleX * 10}px ${-angleY * 10}px 20px rgba(139, 92, 246, 0.15),
        ${angleX * 10}px ${angleY * 10}px 20px rgba(59, 130, 246, 0.15)
      `;
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.boxShadow = '';
    });
  });
}

// Add glow effect to badges
function enhanceBadgeGlow() {
  const badges = document.querySelectorAll('.badge');
  
  badges.forEach(badge => {
    badge.addEventListener('mouseenter', function() {
      this.style.boxShadow = '0 0 10px var(--primary-purple), 0 0 20px rgba(139, 92, 246, 0.4)';
    });
    
    badge.addEventListener('mouseleave', function() {
      this.style.boxShadow = '';
    });
  });
} 