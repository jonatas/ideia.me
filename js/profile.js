/**
 * Local Profile System
 * Tracks user engagement anonymously via localStorage
 */

class LocalProfile {
  constructor() {
    this.storageKey = 'ideiame_profile';
    this.sessionStartTime = Date.now();
    this.lastSavedTime = this.sessionStartTime;
    this.pingInterval = 5000; // Update time every 5 seconds
    this.listeners = [];
    
    this.init();
  }
  
  init() {
    let data = localStorage.getItem(this.storageKey);
    if (!data) {
      this.data = {
        totalTimeSeconds: 0,
        firstVisit: Date.now(),
        lastVisit: Date.now(),
        savedItems: [],
        favorites: [],
        quizAnswers: {}
      };
      this.save();
    } else {
      try {
        this.data = JSON.parse(data);
        // Migration/defaults
        if(!this.data.favorites) this.data.favorites = [];
        if(!this.data.savedItems) this.data.savedItems = [];
        if(!this.data.quizAnswers) this.data.quizAnswers = {};
        this.data.lastVisit = Date.now();
      } catch(e) {
        console.error("Failed to parse local profile data", e);
        this.data = { totalTimeSeconds: 0, firstVisit: Date.now(), lastVisit: Date.now(), savedItems: [], favorites: [] };
      }
    }
    
    // Start tracking time
    this.startTracking();
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    this.notifyListeners();
  }

  startTracking() {
    setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - this.lastSavedTime) / 1000);
      if (elapsedSeconds > 0) {
        this.data.totalTimeSeconds += elapsedSeconds;
        this.lastSavedTime = now;
        this.save();
      }
    }, this.pingInterval);
  }

  formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  // category: 'presentation', 'app', 'yoga'
  saveItem(category, id, url, title, iconClass = 'bi-bookmark') {
    const exists = this.data.savedItems.findIndex(i => i.id === id);
    if (exists >= 0) {
      this.data.savedItems[exists] = { category, id, url, title, iconClass, savedAt: Date.now() };
    } else {
      this.data.savedItems.push({ category, id, url, title, iconClass, savedAt: Date.now() });
    }
    this.save();
  }

  removeItem(id) {
    this.data.savedItems = this.data.savedItems.filter(i => i.id !== id);
    this.save();
  }
  
  isSaved(id) {
    return this.data.savedItems.some(i => i.id === id);
  }

  saveQuizAnswer(question, answerStr, isCorrect) {
    if (!this.data.quizAnswers) this.data.quizAnswers = {};
    this.data.quizAnswers[question] = { answer: answerStr, isCorrect, answeredAt: Date.now() };
    this.save();
  }
  
  getQuizAnswer(question) {
    if (!this.data.quizAnswers) return null;
    return this.data.quizAnswers[question];
  }

  toggleFavorite(category, id, url, title, iconClass = 'bi-heart') {
    if (this.isSaved(id)) {
      this.removeItem(id);
      return false;
    } else {
      this.saveItem(category, id, url, title, iconClass);
      return true;
    }
  }

  // Subscribe to changes (useful for updating UI in real-time)
  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.data); // trigger immediately
  }
  
  unsubscribe(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.data));
  }
}

// Initialize global instance
window.userProfile = new LocalProfile();
