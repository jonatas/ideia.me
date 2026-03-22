/**
 * Semantic Learn - Core Functionality
 * Handles chapter navigation, vocabulary builder, and main interactions
 */

const SemanticLearn = {
  currentChapter: 0,
  vocabulary: [],
  
  /**
   * Initialize the learning platform
   */
  init() {
    console.log('Semantic Learn initialized');
    
    // Initialize particles background
    this.initParticles();
    
    // Load saved progress
    this.loadProgress();
    
    // Setup auto-save for reflection textareas
    this.setupReflectionAutoSave();
    
    // Setup chapter navigation
    this.setupChapterNav();
    
    // Initialize vocabulary builder
    this.loadVocabulary();
    this.updateVocabularyCount();
    
    // Animate page elements
    this.animatePageElements();
  },
  
  /**
   * Initialize particles.js background
   */
  initParticles() {
    if (typeof particlesJS !== 'undefined') {
      particlesJS('particles-js', {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: ['#FBBF24', '#0EA5E9', '#EF4444', '#1E3A8A'] },
          shape: { type: 'circle' },
          opacity: {
            value: 0.5,
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#FBBF24',
            opacity: 0.2,
            width: 1
          },
          move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'grab' },
            onclick: { enable: true, mode: 'push' },
            resize: true
          },
          modes: {
            grab: { distance: 140, line_linked: { opacity: 0.5 } },
            push: { particles_nb: 4 }
          }
        },
        retina_detect: true
      });
    }
  },
  
  /**
   * Animate page elements with anime.js
   */
  animatePageElements() {
    if (typeof anime !== 'undefined') {
      // Animate feature cards
      anime({
        targets: '.feature-card',
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        easing: 'easeOutElastic(1, .8)',
        duration: 1000
      });
    }
  },
  
  /**
   * Setup chapter navigation clicks
   */
  setupChapterNav() {
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      item.addEventListener('click', () => {
        const chapterNum = parseInt(item.dataset.chapter);
        this.goToChapter(chapterNum);
      });
    });
  },

  
  /**
   * Navigate to a specific chapter
   */
  goToChapter(chapterNum) {
    // Hide all chapters
    document.querySelectorAll('.chapter').forEach(ch => {
      ch.classList.remove('active');
    });
    
    // Show selected chapter
    const chapter = document.getElementById(`chapter-${chapterNum}`);
    if (chapter) {
      chapter.classList.add('active');
      
      // Update navigation
      document.querySelectorAll('.chapter-item').forEach(item => {
        item.classList.remove('active');
      });
      
      const activeItem = document.querySelector(`.chapter-item[data-chapter="${chapterNum}"]`);
      if (activeItem) {
        activeItem.classList.add('active');
      }
      
      this.currentChapter = chapterNum;
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Save progress
      this.saveProgress();
      
      // Initialize chapter-specific features
      this.initChapterFeatures(chapterNum);
      
      // Re-render Mermaid diagrams in the newly visible chapter
      setTimeout(() => {
        if (typeof window.renderVisibleMermaid === 'function') {
          window.renderVisibleMermaid();
        }
      }, 100);
    }
  },
  
  /**
   * Initialize chapter-specific features
   */
  initChapterFeatures(chapterNum) {
    // Wait for DOM to be ready
    setTimeout(() => {
      switch(chapterNum) {
        case 1:
          this.initChapter1Features();
          break;
        case 2:
          // Content-focused, no games
          break;
        case 3:
          // Content-focused, no games
          break;
        case 4:
          // Content-focused, no games
          break;
        case 5:
          // Content-focused, no games
          break;
      }
    }, 100);
  },

  /**
   * Initialize Chapter 1 specific features
   */
  initChapter1Features() {
    // Initialize word exploration
    this.initWordExploration();
  },

  /**
   * Initialize word exploration functionality
   */
  initWordExploration() {
    // Word insights data
    this.wordInsights = {
      "can't": {
        impact: "Creates mental barriers and limits possibilities",
        alternative: "I choose to",
        practice: "When you catch yourself thinking 'can't', pause and ask: 'What would I choose to do instead?'"
      },
      "stuck": {
        impact: "Suggests permanent immobility and helplessness",
        alternative: "I'm exploring options",
        practice: "Replace 'stuck' with 'exploring options' to open your mind to possibilities"
      },
      "impossible": {
        impact: "Shuts down creative problem-solving",
        alternative: "This is a challenge I can work through",
        practice: "When facing 'impossible' situations, ask: 'What's the first small step I can take?'"
      },
      "failure": {
        impact: "Creates shame and stops learning",
        alternative: "I'm learning",
        practice: "Reframe failures as learning opportunities that bring you closer to success"
      },
      "maybe": {
        impact: "Creates uncertainty and delays decision-making",
        alternative: "I'll decide by [specific time]",
        practice: "Give yourself a deadline for decisions to avoid endless 'maybe' loops"
      },
      "sometimes": {
        impact: "Lacks specificity and commitment",
        alternative: "I choose to [specific action] when [specific condition]",
        practice: "Be specific about when and how you'll take action"
      },
      "possibly": {
        impact: "Maintains uncertainty and indecision",
        alternative: "I'm considering this option",
        practice: "Move from 'possibly' to clear consideration and decision-making"
      },
      "perhaps": {
        impact: "Keeps you in a state of perpetual uncertainty",
        alternative: "I'm evaluating this",
        practice: "Replace vague 'perhaps' with active evaluation and decision-making"
      },
      "choose": {
        impact: "Empowers you with agency and control",
        alternative: "I am choosing",
        practice: "Use 'choose' to remind yourself that you have power over your decisions"
      },
      "capable": {
        impact: "Builds confidence and self-belief",
        alternative: "I am developing my capability",
        practice: "Use 'capable' to reinforce your belief in your abilities"
      },
      "opportunity": {
        impact: "Opens your mind to positive possibilities",
        alternative: "This is an opportunity for growth",
        practice: "Look for opportunities in every situation, even challenges"
      },
      "growth": {
        impact: "Frames experiences as positive development",
        alternative: "I am growing through this",
        practice: "View every experience as contributing to your growth and development"
      }
    };
  },
  
  /**
   * Start the learning journey
   */
  startJourney() {
    this.goToChapter(1);
    
    // Show confetti celebration
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  },
  
  /**
   * Complete a chapter
   */
  completeChapter(chapterNum) {
    // Mark chapter as completed
    const chapterItem = document.querySelector(`.chapter-item[data-chapter="${chapterNum}"]`);
    if (chapterItem) {
      chapterItem.classList.add('completed');
    }
    
    // Navigate to next chapter or completion page
    if (chapterNum < 5) {
      this.goToChapter(chapterNum + 1);
    } else {
      // All chapters complete - go to completion page
      this.goToChapter('completion');
      this.showCompletionCelebration();
    }
    
    // Update progress
    this.updateProgress();
    
    // Check for achievements
    this.checkAchievements();
    
    // Save progress
    this.saveProgress();
    
    // Show confetti
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  },
  
  /**
   * Update progress bar and stats
   */
  updateProgress() {
    const completedChapters = document.querySelectorAll('.chapter-item.completed').length - 1; // -1 for welcome
    const totalChapters = 5;
    const percentage = Math.round((completedChapters / totalChapters) * 100);
    
    // Update progress bar
    const progressBar = document.getElementById('main-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    // Update percentage display
    const percentageDisplay = document.getElementById('completion-percentage');
    if (percentageDisplay) {
      percentageDisplay.textContent = `${percentage}%`;
    }
  },
  
  /**
   * Check and unlock achievements
   */
  checkAchievements() {
    const completedChapters = document.querySelectorAll('.chapter-item.completed').length - 1;
    
    // First Steps - Complete Chapter 1
    if (completedChapters >= 1) {
      this.unlockBadge('first-steps');
    }
    
    // Vocabulary Master - Create 10 neo-vocabulary pairs
    if (this.vocabulary.length >= 10) {
      this.unlockBadge('vocabulary-master');
    }
    
    // Neural Architect - Complete Chapter 4
    if (document.querySelector('.chapter-item[data-chapter="4"]')?.classList.contains('completed')) {
      this.unlockBadge('neural-architect');
    }
    
    // Compassionate Communicator - Complete Chapter 3
    if (document.querySelector('.chapter-item[data-chapter="3"]')?.classList.contains('completed')) {
      this.unlockBadge('communicator');
    }
    
    // Semantic Scholar - Complete all chapters
    if (completedChapters >= 5) {
      this.unlockBadge('scholar');
    }
    
    // Update achievement count
    const unlockedBadges = document.querySelectorAll('.badge.unlocked').length;
    const achievementCount = document.getElementById('achievement-count');
    if (achievementCount) {
      achievementCount.textContent = `${unlockedBadges}/5`;
    }
  },
  
  /**
   * Unlock an achievement badge
   */
  unlockBadge(badgeId) {
    const badge = document.querySelector(`.badge[data-badge="${badgeId}"]`);
    if (badge && !badge.classList.contains('unlocked')) {
      badge.classList.remove('locked');
      badge.classList.add('unlocked');
      
      // Show notification
      this.showNotification(`🎉 Achievement Unlocked: ${badge.querySelector('.badge-name').textContent}!`);
    }
  },
  
  /**
   * Show notification
   */
  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 140px;
      right: 20px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },
  
  /**
   * Add vocabulary pair
   */
  addVocabPair() {
    const oldWord = document.getElementById('old-word');
    const newWord = document.getElementById('new-word');
    
    if (oldWord && newWord && oldWord.value.trim() && newWord.value.trim()) {
      const pair = {
        old: oldWord.value.trim(),
        new: newWord.value.trim(),
        timestamp: Date.now()
      };
      
      this.vocabulary.push(pair);
      this.saveVocabulary();
      this.updateVocabularyDisplay();
      this.updateVocabularyCount();
      
      // Clear inputs
      oldWord.value = '';
      newWord.value = '';
      
      // Show success animation
      this.showNotification('✓ Vocabulary pair added!');
      
      // Check for achievement
      this.checkAchievements();
    }
  },
  
  /**
   * Update vocabulary display in the map
   */
  updateVocabularyDisplay() {
    const vocabMap = document.getElementById('vocab-map');
    if (!vocabMap) return;
    
    if (this.vocabulary.length === 0) {
      vocabMap.innerHTML = '<p class="empty-state">Start adding vocabulary pairs to see your transformation map...</p>';
      return;
    }
    
    vocabMap.innerHTML = '';
    this.vocabulary.forEach((pair, index) => {
      const pairDiv = document.createElement('div');
      pairDiv.className = 'vocab-pair';
      pairDiv.innerHTML = `
        <span class="old">${this.escapeHtml(pair.old)}</span>
        <span class="arrow">→</span>
        <span class="new">${this.escapeHtml(pair.new)}</span>
        <button class="remove" onclick="SemanticLearn.removeVocabPair(${index})" title="Remove">×</button>
      `;
      vocabMap.appendChild(pairDiv);
    });
    
    // Update floating builder
    this.updateVocabBuilder();
  },
  
  /**
   * Remove vocabulary pair
   */
  removeVocabPair(index) {
    this.vocabulary.splice(index, 1);
    this.saveVocabulary();
    this.updateVocabularyDisplay();
    this.updateVocabularyCount();
  },
  
  /**
   * Update vocabulary count display
   */
  updateVocabularyCount() {
    const countDisplay = document.getElementById('vocabulary-count');
    if (countDisplay) {
      countDisplay.textContent = this.vocabulary.length;
    }
    
    const badgeCount = document.getElementById('vocab-count-badge');
    if (badgeCount) {
      badgeCount.textContent = this.vocabulary.length;
    }
  },
  
  /**
   * Update floating vocabulary builder
   */
  updateVocabBuilder() {
    const listDiv = document.getElementById('vocab-builder-list');
    if (!listDiv) return;
    
    if (this.vocabulary.length === 0) {
      listDiv.innerHTML = '<p class="empty-state">Add vocabulary pairs as you progress through the chapters...</p>';
      return;
    }
    
    listDiv.innerHTML = '';
    this.vocabulary.forEach(pair => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'vocab-builder-item';
      itemDiv.innerHTML = `
        <span class="old">${this.escapeHtml(pair.old)}</span>
        <span class="arrow">→</span>
        <span class="new">${this.escapeHtml(pair.new)}</span>
      `;
      listDiv.appendChild(itemDiv);
    });
  },
  
  /**
   * Toggle vocabulary builder panel
   */
  toggleVocabBuilder() {
    const panel = document.getElementById('vocab-builder-panel');
    if (panel) {
      panel.classList.toggle('open');
      panel.classList.remove('minimized');
      
      // Update the panel content when opening
      if (panel.classList.contains('open')) {
        this.updateVocabBuilder();
      }
    }
  },
  
  /**
   * Minimize vocabulary builder
   */
  minimizeVocabBuilder() {
    const panel = document.getElementById('vocab-builder-panel');
    if (panel) {
      panel.classList.toggle('minimized');
    }
  },
  
  /**
   * Close vocabulary builder
   */
  closeVocabBuilder() {
    const panel = document.getElementById('vocab-builder-panel');
    if (panel) {
      panel.classList.remove('open');
    }
  },
  
  /**
   * Clear all vocabulary
   */
  clearVocabulary() {
    if (confirm('Are you sure you want to clear all vocabulary pairs?')) {
      this.vocabulary = [];
      this.saveVocabulary();
      this.updateVocabularyDisplay();
      this.updateVocabularyCount();
      this.showNotification('Vocabulary cleared');
    }
  },
  
  /**
   * Export vocabulary as text file
   */
  exportVocabulary() {
    if (this.vocabulary.length === 0) {
      alert('No vocabulary to export. Add some vocabulary pairs first!');
      return;
    }
    
    let content = '# My Neo-Vocabulary\n\n';
    content += `Created: ${new Date().toLocaleDateString()}\n\n`;
    content += '## Transformation Pairs\n\n';
    
    this.vocabulary.forEach((pair, index) => {
      content += `${index + 1}. **${pair.old}** → **${pair.new}**\n`;
    });
    
    content += '\n---\n';
    content += 'Generated from Semantic Fields Interactive Learning\n';
    
    // Create download
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-neo-vocabulary.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showNotification('📥 Vocabulary exported!');
  },
  
  /**
   * Update memory scale display
   */
  updateMemoryScale(value) {
    const labels = ['', 'Primitive', 'Evasive', 'Aware', 'Conscious', 'Awake'];
    const display = document.getElementById('current-memory-level');
    if (display) {
      display.textContent = labels[value] || 'Unknown';
    }
  },
  
  /**
   * Setup auto-save for reflection textareas
   */
  setupReflectionAutoSave() {
    const textareas = document.querySelectorAll('.reflection-textarea');
    textareas.forEach(textarea => {
      textarea.addEventListener('input', () => {
        this.saveReflection(textarea.id, textarea.value);
      });
      
      // Load saved reflection
      const saved = this.loadReflection(textarea.id);
      if (saved) {
        textarea.value = saved;
      }
    });
  },
  
  /**
   * Save reflection to localStorage
   */
  saveReflection(id, content) {
    localStorage.setItem(`reflection-${id}`, content);
    
    const statusElement = document.getElementById(`save-status-${id.replace('reflection-', '')}`);
    if (statusElement) {
      statusElement.textContent = '✓ Saved';
      setTimeout(() => {
        statusElement.textContent = '💾 Auto-saving...';
      }, 2000);
    }
  },
  
  /**
   * Load reflection from localStorage
   */
  loadReflection(id) {
    return localStorage.getItem(`reflection-${id}`);
  },
  
  /**
   * Save vocabulary to localStorage
   */
  saveVocabulary() {
    localStorage.setItem('semantic-vocabulary', JSON.stringify(this.vocabulary));
  },
  
  /**
   * Load vocabulary from localStorage
   */
  loadVocabulary() {
    const saved = localStorage.getItem('semantic-vocabulary');
    if (saved) {
      try {
        this.vocabulary = JSON.parse(saved);
        this.updateVocabularyDisplay();
      } catch (e) {
        console.error('Error loading vocabulary:', e);
      }
    }
  },
  
  /**
   * Save progress to localStorage
   */
  saveProgress() {
    const progress = {
      currentChapter: this.currentChapter,
      completedChapters: Array.from(document.querySelectorAll('.chapter-item.completed')).map(item => item.dataset.chapter),
      unlockedBadges: Array.from(document.querySelectorAll('.badge.unlocked')).map(badge => badge.dataset.badge),
      timestamp: Date.now()
    };
    localStorage.setItem('semantic-progress', JSON.stringify(progress));
  },
  
  /**
   * Load progress from localStorage
   */
  loadProgress() {
    const saved = localStorage.getItem('semantic-progress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        
        // Restore completed chapters
        progress.completedChapters?.forEach(chapterNum => {
          const item = document.querySelector(`.chapter-item[data-chapter="${chapterNum}"]`);
          if (item) {
            item.classList.add('completed');
            item.querySelector('.chapter-status').textContent = '✓';
          }
        });
        
        // Restore unlocked badges
        progress.unlockedBadges?.forEach(badgeId => {
          const badge = document.querySelector(`.badge[data-badge="${badgeId}"]`);
          if (badge) {
            badge.classList.remove('locked');
            badge.classList.add('unlocked');
          }
        });
        
        // Update displays
        this.updateProgress();
        this.checkAchievements();
        
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }
  },
  
  /**
   * Reset all progress
   */
  resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      localStorage.removeItem('semantic-progress');
      localStorage.removeItem('semantic-vocabulary');
      
      // Clear all reflections
      for (let i = 1; i <= 5; i++) {
        localStorage.removeItem(`reflection-reflection-ch${i}`);
      }
      
      location.reload();
    }
  },
  
  /**
   * Show completion celebration
   */
  showCompletionCelebration() {
    // Update final stats
    const finalAchievements = document.getElementById('final-achievement-count');
    if (finalAchievements) {
      finalAchievements.textContent = document.querySelectorAll('.badge.unlocked').length;
    }
    
    const finalVocab = document.getElementById('final-vocab-count');
    if (finalVocab) {
      finalVocab.textContent = this.vocabulary.length;
    }
    
    // Massive confetti celebration
    if (typeof confetti !== 'undefined') {
      const duration = 5 * 1000;
      const end = Date.now() + duration;
      
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  },
  
  /**
   * Share progress on social media
   */
  shareProgress() {
    const completed = document.querySelectorAll('.chapter-item.completed').length - 1;
    const achievements = document.querySelectorAll('.badge.unlocked').length;
    const vocabCount = this.vocabulary.length;
    
    const text = `I just completed ${completed}/5 chapters of the Semantic Fields Journey! 🎓\n${achievements} achievements unlocked and ${vocabCount} new vocabulary pairs created. Transform your mind through language! 🧠`;
    
    // Try Web Share API
    if (navigator.share) {
      navigator.share({
        title: 'My Semantic Fields Journey',
        text: text,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text + '\n' + window.location.href).then(() => {
        alert('Progress copied to clipboard! Share it wherever you like.');
      });
    }
  },
  
  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Make available globally
window.SemanticLearn = SemanticLearn;

/**
 * Global utility functions for interactive elements
 * These are called directly from HTML onclick handlers
 */

/**
 * Flip card animation handler
 */
window.flipCard = function(card) {
  card.classList.toggle('flipped');
};

/**
 * Explore word insights - shows detailed information about a word
 */
window.exploreWord = function(word) {
  const insightCard = document.getElementById('word-insight-card');
  const insightContent = document.getElementById('word-insight-content');
  
  if (SemanticLearn.wordInsights && SemanticLearn.wordInsights[word]) {
    const insight = SemanticLearn.wordInsights[word];
    insightContent.innerHTML = `
      <div class="word-insight-detail">
        <h3>"${word}"</h3>
        <div class="insight-section">
          <h4>Impact on Your Mind:</h4>
          <p>${insight.impact}</p>
        </div>
        <div class="insight-section">
          <h4>Empowering Alternative:</h4>
          <p><strong>${insight.alternative}</strong></p>
        </div>
        <div class="insight-section">
          <h4>Practice Tip:</h4>
          <p>${insight.practice}</p>
        </div>
      </div>
    `;
    insightCard.style.display = 'block';
    insightCard.scrollIntoView({ behavior: 'smooth' });
  }
};

/**
 * Show reflection prompt as alert
 */
window.showReflectionPrompt = function(type) {
  const prompts = {
    'body': 'Notice any tension, warmth, or other sensations. What does this word feel like in your body?',
    'mind': 'What thoughts automatically arise when you encounter this word? What memories or associations come up?',
    'possibility': 'How does this word affect your sense of what\'s possible? Does it open doors or close them?'
  };
  
  if (prompts[type]) {
    alert(prompts[type]);
  }
};

/**
 * Spin word wheel animation
 */
window.spinWordWheel = function() {
  const wheel = document.getElementById('word-wheel');
  if (wheel) {
    wheel.style.animation = 'none';
    setTimeout(() => {
      wheel.style.animation = 'gentleSpin 3s ease-in-out';
    }, 10);
  }
};


