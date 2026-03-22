/**
 * Semantic Progress - Progress Tracking and Analytics
 * Handles detailed progress tracking, statistics, and achievement management
 */

const SemanticProgress = {
  // Progress data
  progressData: {
    chaptersCompleted: [],
    gamesPlayed: {},
    vocabularyCreated: 0,
    timeSpent: {},
    achievements: [],
    reflections: {},
    lastAccessed: null
  },
  
  /**
   * Initialize progress tracking
   */
  init() {
    this.loadProgressData();
    this.startSessionTimer();
    this.setupProgressTracking();
  },
  
  /**
   * Load progress data from localStorage
   */
  loadProgressData() {
    const saved = localStorage.getItem('semantic-progress-data');
    if (saved) {
      try {
        this.progressData = { ...this.progressData, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error loading progress data:', e);
      }
    }
  },
  
  /**
   * Save progress data to localStorage
   */
  saveProgressData() {
    this.progressData.lastAccessed = Date.now();
    localStorage.setItem('semantic-progress-data', JSON.stringify(this.progressData));
  },
  
  /**
   * Start session timer
   */
  startSessionTimer() {
    const startTime = Date.now();
    
    // Track time spent on each chapter
    let currentChapter = null;
    
    const trackChapterTime = () => {
      const activeChapter = document.querySelector('.chapter.active');
      if (activeChapter) {
        const chapterId = activeChapter.id;
        if (chapterId !== currentChapter) {
          // Save time for previous chapter
          if (currentChapter) {
            this.recordChapterTime(currentChapter, Date.now() - startTime);
          }
          currentChapter = chapterId;
        }
      }
    };
    
    // Track every minute
    setInterval(trackChapterTime, 60000);
    
    // Track on page unload
    window.addEventListener('beforeunload', () => {
      if (currentChapter) {
        this.recordChapterTime(currentChapter, Date.now() - startTime);
      }
    });
  },
  
  /**
   * Record time spent on a chapter
   */
  recordChapterTime(chapterId, timeSpent) {
    if (!this.progressData.timeSpent[chapterId]) {
      this.progressData.timeSpent[chapterId] = 0;
    }
    this.progressData.timeSpent[chapterId] += timeSpent;
    this.saveProgressData();
  },
  
  /**
   * Setup progress tracking for various activities
   */
  setupProgressTracking() {
    // Track chapter completions
    const originalCompleteChapter = SemanticLearn.completeChapter;
    SemanticLearn.completeChapter = (chapterNum) => {
      this.recordChapterCompletion(chapterNum);
      return originalCompleteChapter.call(SemanticLearn, chapterNum);
    };
    
    // Track vocabulary creation
    const originalAddVocabPair = SemanticLearn.addVocabPair;
    SemanticLearn.addVocabPair = () => {
      const result = originalAddVocabPair.call(SemanticLearn);
      if (result !== false) {
        this.recordVocabularyCreation();
      }
      return result;
    };
    
    // Track game plays
    this.setupGameTracking();
  },
  
  /**
   * Setup game tracking
   */
  setupGameTracking() {
    // Track Word Web game
    const originalCheckWordWeb = SemanticGames.checkWordWeb;
    SemanticGames.checkWordWeb = () => {
      this.recordGamePlay('word-web');
      return originalCheckWordWeb.call(SemanticGames);
    };
    
    // Track Vocabulary Swap game
    const originalStartVocabSwap = SemanticGames.startVocabSwap;
    SemanticGames.startVocabSwap = () => {
      this.recordGamePlay('vocab-swap');
      return originalStartVocabSwap.call(SemanticGames);
    };
    
    // Track Emotion-Need game
    const originalCheckEmotionNeed = SemanticGames.checkEmotionNeed;
    SemanticGames.checkEmotionNeed = () => {
      this.recordGamePlay('emotion-need');
      return originalCheckEmotionNeed.call(SemanticGames);
    };
    
    // Track Brain City game
    const originalInitBrainCity = SemanticGames.initBrainCity;
    SemanticGames.initBrainCity = () => {
      this.recordGamePlay('brain-city');
      return originalInitBrainCity.call(SemanticGames);
    };
    
    // Track Toolkit Builder game
    const originalShowToolkitResults = SemanticGames.showToolkitResults;
    SemanticGames.showToolkitResults = () => {
      this.recordGamePlay('toolkit-builder');
      return originalShowToolkitResults.call(SemanticGames);
    };
  },
  
  /**
   * Record chapter completion
   */
  recordChapterCompletion(chapterNum) {
    if (!this.progressData.chaptersCompleted.includes(chapterNum)) {
      this.progressData.chaptersCompleted.push(chapterNum);
      this.saveProgressData();
      
      // Trigger achievement check
      this.checkProgressAchievements();
    }
  },
  
  /**
   * Record vocabulary creation
   */
  recordVocabularyCreation() {
    this.progressData.vocabularyCreated++;
    this.saveProgressData();
    
    // Check for vocabulary milestone achievements
    if (this.progressData.vocabularyCreated === 5) {
      this.unlockAchievement('vocabulary-milestone-5');
    } else if (this.progressData.vocabularyCreated === 10) {
      this.unlockAchievement('vocabulary-milestone-10');
    } else if (this.progressData.vocabularyCreated === 25) {
      this.unlockAchievement('vocabulary-milestone-25');
    }
  },
  
  /**
   * Record game play
   */
  recordGamePlay(gameId) {
    if (!this.progressData.gamesPlayed[gameId]) {
      this.progressData.gamesPlayed[gameId] = 0;
    }
    this.progressData.gamesPlayed[gameId]++;
    this.saveProgressData();
    
    // Check for gaming achievements
    this.checkGamingAchievements();
  },
  
  /**
   * Record reflection completion
   */
  recordReflectionCompletion(chapterId, reflectionText) {
    this.progressData.reflections[chapterId] = {
      completed: true,
      text: reflectionText,
      timestamp: Date.now()
    };
    this.saveProgressData();
    
    // Check for reflection achievements
    const completedReflections = Object.values(this.progressData.reflections).filter(r => r.completed).length;
    if (completedReflections === 5) {
      this.unlockAchievement('reflection-master');
    }
  },
  
  /**
   * Check progress-based achievements
   */
  checkProgressAchievements() {
    const completedChapters = this.progressData.chaptersCompleted.length;
    
    // Speed reading achievement
    const totalTime = Object.values(this.progressData.timeSpent).reduce((sum, time) => sum + time, 0);
    const averageTimePerChapter = totalTime / completedChapters;
    
    if (averageTimePerChapter < 300000) { // Less than 5 minutes per chapter
      this.unlockAchievement('speed-reader');
    }
    
    // Dedication achievement
    const daysSinceStart = this.getDaysSinceStart();
    if (daysSinceStart >= 7 && completedChapters >= 3) {
      this.unlockAchievement('dedicated-learner');
    }
  },
  
  /**
   * Check gaming achievements
   */
  checkGamingAchievements() {
    const totalGamesPlayed = Object.values(this.progressData.gamesPlayed).reduce((sum, count) => sum + count, 0);
    
    if (totalGamesPlayed >= 10) {
      this.unlockAchievement('game-enthusiast');
    }
    
    // Check for perfect scores
    const perfectGames = Object.values(this.progressData.gamesPlayed).filter(count => count >= 3);
    if (perfectGames.length >= 3) {
      this.unlockAchievement('perfectionist');
    }
  },
  
  /**
   * Unlock achievement
   */
  unlockAchievement(achievementId) {
    if (!this.progressData.achievements.includes(achievementId)) {
      this.progressData.achievements.push(achievementId);
      this.saveProgressData();
      
      // Show achievement notification
      this.showAchievementNotification(achievementId);
    }
  },
  
  /**
   * Show achievement notification
   */
  showAchievementNotification(achievementId) {
    const achievements = {
      'vocabulary-milestone-5': { icon: '📚', name: 'Vocabulary Builder', desc: 'Created 5 vocabulary pairs' },
      'vocabulary-milestone-10': { icon: '📖', name: 'Word Master', desc: 'Created 10 vocabulary pairs' },
      'vocabulary-milestone-25': { icon: '📚', name: 'Vocabulary Guru', desc: 'Created 25 vocabulary pairs' },
      'reflection-master': { icon: '💭', name: 'Deep Thinker', desc: 'Completed all reflections' },
      'speed-reader': { icon: '⚡', name: 'Speed Reader', desc: 'Completed chapters quickly' },
      'dedicated-learner': { icon: '🎯', name: 'Dedicated Learner', desc: 'Consistent learning over time' },
      'game-enthusiast': { icon: '🎮', name: 'Game Enthusiast', desc: 'Played 10+ mini-games' },
      'perfectionist': { icon: '⭐', name: 'Perfectionist', desc: 'Mastered multiple games' }
    };
    
    const achievement = achievements[achievementId];
    if (achievement) {
      SemanticLearn.showNotification(`🏆 ${achievement.icon} ${achievement.name}: ${achievement.desc}`);
    }
  },
  
  /**
   * Get days since start
   */
  getDaysSinceStart() {
    const startTime = localStorage.getItem('semantic-start-time');
    if (!startTime) {
      localStorage.setItem('semantic-start-time', Date.now());
      return 0;
    }
    return Math.floor((Date.now() - parseInt(startTime)) / (1000 * 60 * 60 * 24));
  },
  
  /**
   * Generate progress report
   */
  generateProgressReport() {
    const completedChapters = this.progressData.chaptersCompleted.length;
    const totalChapters = 5;
    const vocabularyCount = this.progressData.vocabularyCreated;
    const gamesPlayed = Object.values(this.progressData.gamesPlayed).reduce((sum, count) => sum + count, 0);
    const achievementsUnlocked = this.progressData.achievements.length;
    const totalTime = Object.values(this.progressData.timeSpent).reduce((sum, time) => sum + time, 0);
    const daysSinceStart = this.getDaysSinceStart();
    
    return {
      completionPercentage: Math.round((completedChapters / totalChapters) * 100),
      vocabularyCreated: vocabularyCount,
      gamesPlayed: gamesPlayed,
      achievementsUnlocked: achievementsUnlocked,
      totalTimeSpent: totalTime,
      daysSinceStart: daysSinceStart,
      averageTimePerChapter: totalTime / Math.max(completedChapters, 1),
      mostPlayedGame: this.getMostPlayedGame(),
      strongestChapter: this.getStrongestChapter(),
      learningStreak: this.calculateLearningStreak()
    };
  },
  
  /**
   * Get most played game
   */
  getMostPlayedGame() {
    let maxCount = 0;
    let mostPlayed = null;
    
    Object.entries(this.progressData.gamesPlayed).forEach(([game, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPlayed = game;
      }
    });
    
    return mostPlayed;
  },
  
  /**
   * Get strongest chapter (most time spent)
   */
  getStrongestChapter() {
    let maxTime = 0;
    let strongestChapter = null;
    
    Object.entries(this.progressData.timeSpent).forEach(([chapter, time]) => {
      if (time > maxTime) {
        maxTime = time;
        strongestChapter = chapter;
      }
    });
    
    return strongestChapter;
  },
  
  /**
   * Calculate learning streak
   */
  calculateLearningStreak() {
    // Simple implementation - could be enhanced with more sophisticated tracking
    const daysSinceStart = this.getDaysSinceStart();
    return Math.min(daysSinceStart, this.progressData.chaptersCompleted.length);
  },
  
  /**
   * Export progress data
   */
  exportProgressData() {
    const report = this.generateProgressReport();
    const data = {
      report: report,
      detailedData: this.progressData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'semantic-fields-progress.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    SemanticLearn.showNotification('📊 Progress data exported!');
  },
  
  /**
   * Reset all progress data
   */
  resetProgressData() {
    if (confirm('Are you sure you want to reset all progress data? This cannot be undone.')) {
      this.progressData = {
        chaptersCompleted: [],
        gamesPlayed: {},
        vocabularyCreated: 0,
        timeSpent: {},
        achievements: [],
        reflections: {},
        lastAccessed: null
      };
      
      localStorage.removeItem('semantic-progress-data');
      localStorage.removeItem('semantic-start-time');
      
      SemanticLearn.showNotification('🔄 Progress data reset');
      location.reload();
    }
  },
  
  /**
   * Get achievement progress
   */
  getAchievementProgress() {
    const allAchievements = [
      'first-steps', 'vocabulary-master', 'neural-architect', 
      'communicator', 'scholar', 'vocabulary-milestone-5',
      'vocabulary-milestone-10', 'vocabulary-milestone-25',
      'reflection-master', 'speed-reader', 'dedicated-learner',
      'game-enthusiast', 'perfectionist'
    ];
    
    const unlocked = this.progressData.achievements.length;
    const total = allAchievements.length;
    
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
      remaining: allAchievements.filter(a => !this.progressData.achievements.includes(a))
    };
  }
};

// Make available globally
window.SemanticProgress = SemanticProgress;
