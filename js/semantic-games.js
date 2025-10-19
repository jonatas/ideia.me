/**
 * Semantic Games - Interactive Mini-Games for Each Chapter
 * Uses ideia.me logo colors throughout
 */

const SemanticGames = {
  // Game state
  currentGame: null,
  gameTimer: null,
  gameScore: 0,
  
  // Logo colors for consistency
  colors: {
    goldenYellow: '#FBBF24',
    vibrantLightBlue: '#0EA5E9',
    reddishOrange: '#EF4444',
    deepPurpleBlue: '#1E3A8A'
  },
  
  /**
   * Initialize Word Web Builder game for Chapter 1
   */
  initWordWeb() {
    const canvas = document.getElementById('word-web-canvas');
    if (!canvas) return;
    
    // Word pairs for the game
    const wordPairs = [
      { old: 'I can\'t', new: 'I choose to' },
      { old: 'I\'m stuck', new: 'I\'m exploring options' },
      { old: 'This is hard', new: 'This is a challenge' },
      { old: 'I\'m failing', new: 'I\'m learning' },
      { old: 'I hate this', new: 'This is difficult' },
      { old: 'I\'m stupid', new: 'I\'m growing' },
      { old: 'I\'m alone', new: 'I\'m independent' },
      { old: 'I\'m worthless', new: 'I have value' }
    ];
    
    // Create word nodes
    const leftColumn = document.createElement('div');
    leftColumn.className = 'word-column left';
    leftColumn.innerHTML = '<h4>Limiting Phrases</h4>';
    
    const rightColumn = document.createElement('div');
    rightColumn.className = 'word-column right';
    rightColumn.innerHTML = '<h4>Empowering Alternatives</h4>';
    
    wordPairs.forEach((pair, index) => {
      const oldWord = document.createElement('div');
      oldWord.className = 'word-node old-word';
      oldWord.textContent = pair.old;
      oldWord.dataset.pair = index;
      oldWord.style.backgroundColor = this.colors.reddishOrange;
      
      const newWord = document.createElement('div');
      newWord.className = 'word-node new-word';
      newWord.textContent = pair.new;
      newWord.dataset.pair = index;
      newWord.style.backgroundColor = this.colors.goldenYellow;
      
      leftColumn.appendChild(oldWord);
      rightColumn.appendChild(newWord);
    });
    
    canvas.innerHTML = '';
    canvas.appendChild(leftColumn);
    canvas.appendChild(rightColumn);
    
    // Setup drag and drop
    this.setupWordWebDragDrop();
  },
  
  /**
   * Setup drag and drop for word web game
   */
  setupWordWebDragDrop() {
    let draggedElement = null;
    let connections = [];
    
    const oldWords = document.querySelectorAll('.old-word');
    const newWords = document.querySelectorAll('.new-word');
    
    // Make old words draggable
    oldWords.forEach(word => {
      word.draggable = true;
      word.addEventListener('dragstart', (e) => {
        draggedElement = e.target;
        e.target.style.opacity = '0.5';
      });
      
      word.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
        draggedElement = null;
      });
    });
    
    // Make new words drop targets
    newWords.forEach(word => {
      word.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.target !== draggedElement) {
          e.target.style.border = `3px dashed ${this.colors.vibrantLightBlue}`;
        }
      });
      
      word.addEventListener('dragleave', (e) => {
        e.target.style.border = 'none';
      });
      
      word.addEventListener('drop', (e) => {
        e.preventDefault();
        e.target.style.border = 'none';
        
        if (draggedElement && draggedElement.dataset.pair === e.target.dataset.pair) {
          // Correct match
          this.createConnection(draggedElement, e.target);
          connections.push({
            old: draggedElement,
            new: e.target,
            correct: true
          });
          
          // Visual feedback
          draggedElement.style.backgroundColor = this.colors.goldenYellow;
          e.target.style.backgroundColor = this.colors.goldenYellow;
          draggedElement.style.pointerEvents = 'none';
          e.target.style.pointerEvents = 'none';
          
          // Check if all pairs are matched
          if (connections.length === 8) {
            this.showGameFeedback('🎉 Excellent! All vocabulary pairs matched correctly!', 'success');
          }
        } else {
          // Wrong match
          this.showGameFeedback('❌ Try again! Think about what would be more empowering.', 'error');
        }
      });
    });
  },
  
  /**
   * Create visual connection between matched words
   */
  createConnection(oldWord, newWord) {
    const canvas = document.getElementById('word-web-canvas');
    const line = document.createElement('div');
    line.className = 'connection-line';
    line.style.cssText = `
      position: absolute;
      height: 3px;
      background: linear-gradient(90deg, ${this.colors.reddishOrange}, ${this.colors.goldenYellow});
      border-radius: 2px;
      z-index: 1;
      pointer-events: none;
      animation: connectionDraw 0.5s ease;
    `;
    
    // Calculate position
    const oldRect = oldWord.getBoundingClientRect();
    const newRect = newWord.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    const startX = oldRect.right - canvasRect.left;
    const startY = oldRect.top + oldRect.height / 2 - canvasRect.top;
    const endX = newRect.left - canvasRect.left;
    const endY = newRect.top + newRect.height / 2 - canvasRect.top;
    
    const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
    line.style.width = length + 'px';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 50%';
    
    canvas.style.position = 'relative';
    canvas.appendChild(line);
  },
  
  /**
   * Reset Word Web game
   */
  resetWordWeb() {
    const canvas = document.getElementById('word-web-canvas');
    canvas.innerHTML = '';
    this.initWordWeb();
    this.clearGameFeedback();
  },
  
  /**
   * Check Word Web answers
   */
  checkWordWeb() {
    const connections = document.querySelectorAll('.connection-line');
    const correctConnections = connections.length;
    const totalPairs = 8;
    
    if (correctConnections === totalPairs) {
      this.showGameFeedback('🎉 Perfect! You\'ve mastered the vocabulary transformation!', 'success');
    } else {
      this.showGameFeedback(`You have ${correctConnections} out of ${totalPairs} correct. Keep matching the pairs!`, 'info');
    }
  },
  
  /**
   * Start Vocabulary Swap Challenge for Chapter 2
   */
  startVocabSwap() {
    const gameContainer = document.getElementById('swap-cards');
    if (!gameContainer) return;
    
    // Card pairs for matching
    const cardPairs = [
      { old: 'I can\'t do this', new: 'I\'ll figure this out' },
      { old: 'This is impossible', new: 'This requires creativity' },
      { old: 'I\'m terrible at this', new: 'I\'m learning this skill' },
      { old: 'I\'ll never succeed', new: 'Success is a journey' },
      { old: 'I\'m not good enough', new: 'I\'m growing and improving' },
      { old: 'This is too difficult', new: 'This is challenging' },
      { old: 'I\'m a failure', new: 'I\'m learning from this' },
      { old: 'I hate myself', new: 'I\'m working on self-love' },
      { old: 'Nothing ever works', new: 'I\'m finding solutions' },
      { old: 'I\'m worthless', new: 'I have inherent value' }
    ];
    
    // Shuffle and create cards
    const shuffledCards = this.shuffleArray([...cardPairs, ...cardPairs]);
    let flippedCards = [];
    let matchedPairs = 0;
    
    gameContainer.innerHTML = '';
    
    shuffledCards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'match-card';
      cardElement.dataset.cardIndex = index;
      cardElement.dataset.cardText = card.old;
      cardElement.dataset.cardType = card === cardPairs.find(pair => pair.old === card.old) ? 'old' : 'new';
      
      cardElement.addEventListener('click', () => {
        if (cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) return;
        
        cardElement.classList.add('flipped');
        cardElement.textContent = cardElement.dataset.cardText;
        cardElement.style.backgroundColor = cardElement.dataset.cardType === 'old' ? 
          this.colors.reddishOrange : this.colors.goldenYellow;
        
        flippedCards.push({
          element: cardElement,
          text: cardElement.dataset.cardText,
          type: cardElement.dataset.cardType
        });
        
        if (flippedCards.length === 2) {
          setTimeout(() => {
            if (this.isMatch(flippedCards[0], flippedCards[1])) {
              flippedCards.forEach(card => {
                card.element.classList.add('matched');
                card.element.style.backgroundColor = this.colors.vibrantLightBlue;
              });
              matchedPairs++;
              
              if (matchedPairs === cardPairs.length) {
                this.showGameFeedback('🎉 Congratulations! All vocabulary pairs matched!', 'success');
              }
            } else {
              flippedCards.forEach(card => {
                card.element.classList.remove('flipped');
                card.element.textContent = '';
                card.element.style.backgroundColor = this.colors.deepPurpleBlue;
              });
            }
            flippedCards = [];
          }, 1000);
        }
      });
      
      gameContainer.appendChild(cardElement);
    });
    
    // Start timer
    this.startTimer('swap-timer');
  },
  
  /**
   * Check if two flipped cards match
   */
  isMatch(card1, card2) {
    return card1.type !== card2.type && 
           ((card1.type === 'old' && card2.text === this.getMatchingNew(card1.text)) ||
            (card2.type === 'old' && card1.text === this.getMatchingNew(card2.text)));
  },
  
  /**
   * Get matching new phrase for old phrase
   */
  getMatchingNew(oldPhrase) {
    const pairs = [
      { old: 'I can\'t do this', new: 'I\'ll figure this out' },
      { old: 'This is impossible', new: 'This requires creativity' },
      { old: 'I\'m terrible at this', new: 'I\'m learning this skill' },
      { old: 'I\'ll never succeed', new: 'Success is a journey' },
      { old: 'I\'m not good enough', new: 'I\'m growing and improving' },
      { old: 'This is too difficult', new: 'This is challenging' },
      { old: 'I\'m a failure', new: 'I\'m learning from this' },
      { old: 'I hate myself', new: 'I\'m working on self-love' },
      { old: 'Nothing ever works', new: 'I\'m finding solutions' },
      { old: 'I\'m worthless', new: 'I have inherent value' }
    ];
    
    const pair = pairs.find(p => p.old === oldPhrase || p.new === oldPhrase);
    return pair ? (pair.old === oldPhrase ? pair.new : pair.old) : null;
  },
  
  /**
   * Initialize Emotion-Need Matcher for Chapter 3
   */
  initEmotionNeed() {
    const emotionsList = document.getElementById('emotions-list');
    const needsList = document.getElementById('needs-list');
    
    if (!emotionsList || !needsList) return;
    
    const emotionNeedPairs = [
      { emotion: 'Frustrated', need: 'Understanding' },
      { emotion: 'Lonely', need: 'Connection' },
      { emotion: 'Anxious', need: 'Security' },
      { emotion: 'Angry', need: 'Respect' },
      { emotion: 'Sad', need: 'Comfort' },
      { emotion: 'Excited', need: 'Celebration' },
      { emotion: 'Confused', need: 'Clarity' },
      { emotion: 'Overwhelmed', need: 'Support' }
    ];
    
    // Shuffle arrays
    const shuffledEmotions = this.shuffleArray([...emotionNeedPairs.map(p => p.emotion)]);
    const shuffledNeeds = this.shuffleArray([...emotionNeedPairs.map(p => p.need)]);
    
    // Create emotion items
    emotionsList.innerHTML = '';
    shuffledEmotions.forEach(emotion => {
      const item = document.createElement('div');
      item.className = 'draggable-item';
      item.textContent = emotion;
      item.dataset.emotion = emotion;
      item.style.backgroundColor = this.colors.vibrantLightBlue;
      emotionsList.appendChild(item);
    });
    
    // Create need drop zones
    needsList.innerHTML = '';
    shuffledNeeds.forEach(need => {
      const zone = document.createElement('div');
      zone.className = 'drop-zone';
      zone.dataset.need = need;
      zone.innerHTML = `<span class="need-label">${need}</span>`;
      needsList.appendChild(zone);
    });
    
    // Setup drag and drop
    this.setupEmotionNeedDragDrop();
  },
  
  /**
   * Setup drag and drop for emotion-need matching
   */
  setupEmotionNeedDragDrop() {
    let draggedElement = null;
    
    const draggableItems = document.querySelectorAll('.draggable-item');
    const dropZones = document.querySelectorAll('.drop-zone');
    
    // Make emotions draggable
    draggableItems.forEach(item => {
      item.draggable = true;
      item.addEventListener('dragstart', (e) => {
        draggedElement = e.target;
        e.target.style.opacity = '0.5';
      });
      
      item.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
        draggedElement = null;
      });
    });
    
    // Setup drop zones
    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('over');
      });
      
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('over');
      });
      
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('over');
        
        if (draggedElement && !zone.querySelector('.draggable-item')) {
          // Check if this is a correct match
          const emotion = draggedElement.dataset.emotion;
          const need = zone.dataset.need;
          const isCorrect = this.isEmotionNeedMatch(emotion, need);
          
          // Move the item
          zone.appendChild(draggedElement);
          zone.classList.add('filled');
          
          if (isCorrect) {
            zone.style.borderColor = this.colors.goldenYellow;
            draggedElement.style.backgroundColor = this.colors.goldenYellow;
          } else {
            zone.style.borderColor = this.colors.reddishOrange;
            draggedElement.style.backgroundColor = this.colors.reddishOrange;
          }
          
          // Check if all items are placed
          const allPlaced = document.querySelectorAll('.drop-zone.filled').length === 8;
          if (allPlaced) {
            setTimeout(() => {
              this.showGameFeedback('🎉 Great job! You\'ve matched emotions with their underlying needs!', 'success');
            }, 500);
          }
        }
      });
    });
  },
  
  /**
   * Check if emotion-need pair is correct
   */
  isEmotionNeedMatch(emotion, need) {
    const correctPairs = [
      { emotion: 'Frustrated', need: 'Understanding' },
      { emotion: 'Lonely', need: 'Connection' },
      { emotion: 'Anxious', need: 'Security' },
      { emotion: 'Angry', need: 'Respect' },
      { emotion: 'Sad', need: 'Comfort' },
      { emotion: 'Excited', need: 'Celebration' },
      { emotion: 'Confused', need: 'Clarity' },
      { emotion: 'Overwhelmed', need: 'Support' }
    ];
    
    return correctPairs.some(pair => pair.emotion === emotion && pair.need === need);
  },
  
  /**
   * Reset Emotion-Need game
   */
  resetEmotionNeed() {
    const emotionsList = document.getElementById('emotions-list');
    const needsList = document.getElementById('needs-list');
    
    if (emotionsList && needsList) {
      // Move all items back to emotions list
      const items = document.querySelectorAll('.draggable-item');
      items.forEach(item => {
        emotionsList.appendChild(item);
        item.style.backgroundColor = this.colors.vibrantLightBlue;
      });
      
      // Reset drop zones
      const dropZones = document.querySelectorAll('.drop-zone');
      dropZones.forEach(zone => {
        zone.classList.remove('filled', 'over');
        zone.style.borderColor = '';
        zone.innerHTML = `<span class="need-label">${zone.dataset.need}</span>`;
      });
    }
    
    this.clearGameFeedback();
  },
  
  /**
   * Check Emotion-Need answers
   */
  checkEmotionNeed() {
    const dropZones = document.querySelectorAll('.drop-zone.filled');
    let correctMatches = 0;
    
    dropZones.forEach(zone => {
      const item = zone.querySelector('.draggable-item');
      if (item && this.isEmotionNeedMatch(item.dataset.emotion, zone.dataset.need)) {
        correctMatches++;
      }
    });
    
    const totalPairs = 8;
    if (correctMatches === totalPairs) {
      this.showGameFeedback('🎉 Perfect! All emotion-need pairs are correctly matched!', 'success');
    } else {
      this.showGameFeedback(`You have ${correctMatches} out of ${totalPairs} correct matches. Try again!`, 'info');
    }
  },
  
  /**
   * Initialize Brain City Simulator for Chapter 4
   */
  initBrainCity() {
    const canvas = document.getElementById('brain-city-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const pathwayTypes = {
      positive: { color: this.colors.goldenYellow, label: 'Positive Self-Talk' },
      gratitude: { color: this.colors.vibrantLightBlue, label: 'Gratitude Practice' },
      resilience: { color: this.colors.reddishOrange, label: 'Resilience Building' }
    };
    
    let selectedPathway = 'positive';
    let practiceCount = 0;
    let pathwayStrength = 0;
    
    // Draw initial brain city
    this.drawBrainCity(ctx, selectedPathway, pathwayStrength);
    
    // Canvas click handler
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is in pathway area
      if (this.isClickInPathway(x, y)) {
        practiceCount++;
        pathwayStrength = Math.min(practiceCount * 2, 100);
        
        // Update displays
        document.getElementById('practice-count').textContent = practiceCount;
        document.getElementById('pathway-strength').textContent = 
          pathwayStrength < 25 ? 'Weak' : 
          pathwayStrength < 50 ? 'Growing' :
          pathwayStrength < 75 ? 'Strong' : 'Highway';
        
        // Redraw with stronger pathway
        this.drawBrainCity(ctx, selectedPathway, pathwayStrength);
        
        // Show feedback
        if (practiceCount % 5 === 0) {
          this.showGameFeedback(`💪 Pathway strengthened! Keep practicing! (${practiceCount} clicks)`, 'success');
        }
      }
    });
    
    // Pathway selector
    document.querySelectorAll('.pathway-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedPathway = btn.dataset.pathway;
        practiceCount = 0;
        pathwayStrength = 0;
        
        // Update button states
        document.querySelectorAll('.pathway-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update displays
        document.getElementById('practice-count').textContent = '0';
        document.getElementById('pathway-strength').textContent = 'Weak';
        
        // Redraw
        this.drawBrainCity(ctx, selectedPathway, pathwayStrength);
      });
    });
  },
  
  /**
   * Draw the brain city visualization
   */
  drawBrainCity(ctx, pathwayType, strength) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw brain outline
    ctx.strokeStyle = this.colors.deepPurpleBlue;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width * 0.4, canvas.height * 0.3, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw neural pathways based on strength
    const pathwayConfig = {
      positive: { color: this.colors.goldenYellow, label: 'Positive Self-Talk' },
      gratitude: { color: this.colors.vibrantLightBlue, label: 'Gratitude Practice' },
      resilience: { color: this.colors.reddishOrange, label: 'Resilience Building' }
    };
    
    const config = pathwayConfig[pathwayType];
    
    // Draw pathway lines
    ctx.strokeStyle = config.color;
    ctx.lineWidth = Math.max(2, strength / 10);
    ctx.globalAlpha = Math.max(0.3, strength / 100);
    
    for (let i = 0; i < strength / 5; i++) {
      ctx.beginPath();
      const startX = 50 + Math.random() * (canvas.width - 100);
      const startY = 50 + Math.random() * (canvas.height - 100);
      const endX = 50 + Math.random() * (canvas.width - 100);
      const endY = 50 + Math.random() * (canvas.height - 100);
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    // Draw neurons (nodes)
    ctx.fillStyle = config.color;
    for (let i = 0; i < strength / 10; i++) {
      const x = 50 + Math.random() * (canvas.width - 100);
      const y = 50 + Math.random() * (canvas.height - 100);
      
      ctx.beginPath();
      ctx.arc(x, y, 5 + strength / 20, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw title
    ctx.fillStyle = this.colors.goldenYellow;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(config.label, canvas.width / 2, 40);
    
    // Draw strength indicator
    ctx.fillStyle = this.colors.vibrantLightBlue;
    ctx.font = '16px Arial';
    ctx.fillText(`Strength: ${strength}%`, canvas.width / 2, canvas.height - 20);
  },
  
  /**
   * Check if click is in pathway area
   */
  isClickInPathway(x, y) {
    const canvas = document.getElementById('brain-city-canvas');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radiusX = canvas.width * 0.4;
    const radiusY = canvas.height * 0.3;
    
    return Math.pow((x - centerX) / radiusX, 2) + Math.pow((y - centerY) / radiusY, 2) <= 1;
  },
  
  /**
   * Initialize Therapist Toolkit Builder for Chapter 5
   */
  initToolkitBuilder() {
    const questions = document.querySelectorAll('.quiz-question');
    let currentQuestion = 1;
    
    // Show first question
    this.showQuestion(currentQuestion);
    
    // Next button handler
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentQuestion < 3) {
          currentQuestion++;
          this.showQuestion(currentQuestion);
        } else {
          this.showToolkitResults();
        }
      });
    }
    
    // Previous button handler
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentQuestion > 1) {
          currentQuestion--;
          this.showQuestion(currentQuestion);
        }
      });
    }
  },
  
  /**
   * Show specific question
   */
  showQuestion(questionNum) {
    const questions = document.querySelectorAll('.quiz-question');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    
    // Hide all questions
    questions.forEach(q => q.classList.remove('active'));
    
    // Show current question
    const currentQ = document.querySelector(`.quiz-question[data-question="${questionNum}"]`);
    if (currentQ) {
      currentQ.classList.add('active');
    }
    
    // Update button states
    if (prevBtn) {
      prevBtn.disabled = questionNum === 1;
    }
    
    if (nextBtn) {
      nextBtn.textContent = questionNum === 3 ? 'Get Results' : 'Next →';
    }
  },
  
  /**
   * Show toolkit results
   */
  showToolkitResults() {
    const answers = this.getQuizAnswers();
    const recommendations = this.generateRecommendations(answers);
    
    const resultsDiv = document.getElementById('toolkit-results');
    const recommendationsDiv = document.getElementById('toolkit-recommendations');
    
    if (resultsDiv && recommendationsDiv) {
      recommendationsDiv.innerHTML = '';
      
      recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
          <h4>${rec.title}</h4>
          <p>${rec.description}</p>
        `;
        recommendationsDiv.appendChild(item);
      });
      
      resultsDiv.style.display = 'block';
      this.showGameFeedback('🎯 Your personalized toolkit is ready!', 'success');
    }
  },
  
  /**
   * Get quiz answers
   */
  getQuizAnswers() {
    const answers = {};
    
    for (let i = 1; i <= 3; i++) {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      if (selected) {
        answers[`q${i}`] = selected.value;
      }
    }
    
    return answers;
  },
  
  /**
   * Generate recommendations based on answers
   */
  generateRecommendations(answers) {
    const recommendations = [];
    
    // Age-based recommendations
    if (answers.q1 === 'adolescent') {
      recommendations.push({
        title: '🎮 Gaming-Based Approach',
        description: 'Use achievement systems, role-playing scenarios, and digital tools to engage adolescent patients.'
      });
    } else if (answers.q1 === 'elderly') {
      recommendations.push({
        title: '📚 Life Review Therapy',
        description: 'Focus on wisdom sharing, memory mapping, and legacy-building activities.'
      });
    } else {
      recommendations.push({
        title: '💼 Career-Focused Techniques',
        description: 'Integrate goal-setting, stress management, and work-life balance strategies.'
      });
    }
    
    // Learning style recommendations
    if (answers.q2 === 'visual') {
      recommendations.push({
        title: '📊 Visual Mapping Tools',
        description: 'Use charts, diagrams, and art therapy to help patients visualize their progress.'
      });
    } else if (answers.q2 === 'auditory') {
      recommendations.push({
        title: '🎵 Music and Discussion',
        description: 'Incorporate music therapy and group discussion circles.'
      });
    } else if (answers.q2 === 'kinesthetic') {
      recommendations.push({
        title: '🤸 Movement-Based Therapy',
        description: 'Use dance therapy, physical exercises, and hands-on activities.'
      });
    } else {
      recommendations.push({
        title: '📝 Writing and Reading',
        description: 'Focus on journaling, creative writing, and literature-based exercises.'
      });
    }
    
    // Goal-based recommendations
    if (answers.q3 === 'emotional') {
      recommendations.push({
        title: '😊 Emotional Regulation',
        description: 'Teach mindfulness, breathing exercises, and emotional awareness techniques.'
      });
    } else if (answers.q3 === 'communication') {
      recommendations.push({
        title: '💬 Communication Skills',
        description: 'Practice NVC, active listening, and conflict resolution strategies.'
      });
    } else if (answers.q3 === 'trauma') {
      recommendations.push({
        title: '🛡️ Trauma Processing',
        description: 'Use EMDR techniques, art therapy, and safe space creation.'
      });
    } else {
      recommendations.push({
        title: '🔍 Identity Exploration',
        description: 'Focus on values clarification, strengths assessment, and personal growth.'
      });
    }
    
    return recommendations;
  },
  
  /**
   * Restart quiz
   */
  restartQuiz() {
    // Clear all selections
    document.querySelectorAll('input[type="radio"]').forEach(input => {
      input.checked = false;
    });
    
    // Hide results
    const resultsDiv = document.getElementById('toolkit-results');
    if (resultsDiv) {
      resultsDiv.style.display = 'none';
    }
    
    // Show first question
    this.showQuestion(1);
    this.clearGameFeedback();
  },
  
  /**
   * Start timer for games
   */
  startTimer(timerId) {
    let seconds = 0;
    this.gameTimer = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const timerElement = document.getElementById(timerId);
      if (timerElement) {
        timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  },
  
  /**
   * Stop timer
   */
  stopTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  },
  
  /**
   * Show game feedback
   */
  showGameFeedback(message, type = 'info') {
    const feedbackElement = document.querySelector('.game-feedback');
    if (feedbackElement) {
      feedbackElement.textContent = message;
      feedbackElement.className = `game-feedback ${type}`;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        feedbackElement.textContent = '';
        feedbackElement.className = 'game-feedback';
      }, 5000);
    }
  },
  
  /**
   * Clear game feedback
   */
  clearGameFeedback() {
    const feedbackElement = document.querySelector('.game-feedback');
    if (feedbackElement) {
      feedbackElement.textContent = '';
      feedbackElement.className = 'game-feedback';
    }
  },
  
  /**
   * Utility: Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
};

// Make available globally
window.SemanticGames = SemanticGames;
