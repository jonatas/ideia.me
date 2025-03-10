/**
 * SEO Helper for Blog Posts
 * 
 * This script helps analyze and improve SEO for blog posts on ideia.me
 */

document.addEventListener('DOMContentLoaded', function() {
  // Only run on post pages
  if (!document.querySelector('.post-container')) {
    return;
  }
  
  // Initialize SEO analysis
  initSeoAnalysis();
});

function initSeoAnalysis() {
  // Create SEO analysis panel
  createSeoPanel();
  
  // Analyze current post
  analyzeCurrentPost();
  
  // Setup event listeners
  setupEventListeners();
}

function createSeoPanel() {
  const panel = document.createElement('div');
  panel.id = 'seo-panel';
  panel.className = 'seo-panel';
  
  panel.innerHTML = `
    <div class="seo-panel-header">
      <h3>SEO Analysis</h3>
      <button id="seo-panel-toggle" class="seo-panel-toggle">
        <i class="bi bi-chevron-down"></i>
      </button>
    </div>
    <div class="seo-panel-content">
      <div class="seo-score">
        <div class="score-circle">
          <span id="seo-score-value">0</span>
        </div>
        <div class="score-label">SEO Score</div>
      </div>
      <div class="seo-analysis-results">
        <h4>Recommendations</h4>
        <ul id="seo-recommendations" class="seo-recommendations">
          <li class="loading">Analyzing post...</li>
        </ul>
      </div>
      <div class="seo-keywords">
        <h4>Detected Keywords</h4>
        <div id="seo-keywords-list" class="seo-keywords-list">
          <span class="loading">Analyzing keywords...</span>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .seo-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background-color: var(--card-bg-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      transition: height 0.3s ease;
    }
    
    .seo-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: var(--primary-color);
      color: white;
    }
    
    .seo-panel-header h3 {
      margin: 0;
      font-size: 16px;
    }
    
    .seo-panel-toggle {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0;
      font-size: 16px;
    }
    
    .seo-panel-content {
      padding: 15px;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .seo-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .score-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 5px;
      font-size: 24px;
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .seo-recommendations {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    
    .seo-recommendations li {
      margin-bottom: 10px;
      padding-left: 20px;
      position: relative;
    }
    
    .seo-recommendations li:before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .seo-recommendations li.good:before {
      background-color: #4caf50;
    }
    
    .seo-recommendations li.warning:before {
      background-color: #ff9800;
    }
    
    .seo-recommendations li.error:before {
      background-color: #f44336;
    }
    
    .seo-keywords-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    
    .keyword-tag {
      padding: 3px 8px;
      background-color: var(--hover-bg-color);
      border-radius: 12px;
      font-size: 12px;
    }
    
    .loading {
      font-style: italic;
      color: var(--gray-color);
    }
    
    .seo-panel.collapsed .seo-panel-content {
      display: none;
    }
    
    .seo-panel.collapsed .seo-panel-toggle i {
      transform: rotate(180deg);
    }
  `;
  
  document.head.appendChild(style);
}

function analyzeCurrentPost() {
  // Get post content
  const postTitle = document.querySelector('.post-title').textContent;
  const postContent = document.querySelector('.post-content').textContent;
  const postDescription = getMetaDescription();
  const postUrl = window.location.pathname;
  
  // Analyze post
  setTimeout(() => {
    // This is a simulated delay to show loading state
    // In a real implementation, you might want to use more sophisticated analysis
    
    // Extract keywords
    const keywords = extractKeywords(postTitle, postContent);
    displayKeywords(keywords);
    
    // Analyze SEO factors
    const seoFactors = analyzeSeoFactors(postTitle, postContent, postDescription, postUrl, keywords);
    displaySeoAnalysis(seoFactors);
    
    // Calculate and display score
    const score = calculateSeoScore(seoFactors);
    displaySeoScore(score);
  }, 1000);
}

function getMetaDescription() {
  const metaDescription = document.querySelector('meta[name="description"]');
  return metaDescription ? metaDescription.getAttribute('content') : '';
}

function extractKeywords(title, content) {
  // Simple keyword extraction based on word frequency
  // In a real implementation, you might want to use more sophisticated NLP techniques
  
  // Combine title and content
  const text = `${title} ${content}`.toLowerCase();
  
  // Remove common words and punctuation
  const words = text.match(/\b\w{3,}\b/g) || [];
  
  // Count word frequency
  const wordCounts = {};
  words.forEach(word => {
    if (!isStopWord(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Sort by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  return sortedWords;
}

function isStopWord(word) {
  const stopWords = [
    'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
    'his', 'from', 'they', 'she', 'will', 'would', 'there', 'their', 'what',
    'about', 'which', 'when', 'make', 'can', 'like', 'time', 'just', 'him',
    'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
    'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
    'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
    'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
    'any', 'these', 'give', 'day', 'most', 'are', 'was', 'has', 'had', 'been'
  ];
  
  return stopWords.includes(word);
}

function analyzeSeoFactors(title, content, description, url, keywords) {
  const factors = [];
  
  // Title length
  if (title.length < 30) {
    factors.push({
      type: 'error',
      message: 'Title is too short (less than 30 characters)'
    });
  } else if (title.length > 60) {
    factors.push({
      type: 'warning',
      message: 'Title is too long (more than 60 characters)'
    });
  } else {
    factors.push({
      type: 'good',
      message: 'Title length is optimal'
    });
  }
  
  // Description
  if (!description) {
    factors.push({
      type: 'error',
      message: 'Meta description is missing'
    });
  } else if (description.length < 120) {
    factors.push({
      type: 'warning',
      message: 'Meta description is too short (less than 120 characters)'
    });
  } else if (description.length > 160) {
    factors.push({
      type: 'warning',
      message: 'Meta description is too long (more than 160 characters)'
    });
  } else {
    factors.push({
      type: 'good',
      message: 'Meta description length is optimal'
    });
  }
  
  // Content length
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 300) {
    factors.push({
      type: 'error',
      message: `Content is too short (${wordCount} words, aim for at least 300)`
    });
  } else if (wordCount < 600) {
    factors.push({
      type: 'warning',
      message: `Content could be longer (${wordCount} words, aim for at least 600)`
    });
  } else {
    factors.push({
      type: 'good',
      message: `Content length is good (${wordCount} words)`
    });
  }
  
  // URL structure
  if (url.length > 100) {
    factors.push({
      type: 'warning',
      message: 'URL is too long (more than 100 characters)'
    });
  } else {
    factors.push({
      type: 'good',
      message: 'URL length is good'
    });
  }
  
  // Headings
  const headings = document.querySelectorAll('.post-content h2, .post-content h3');
  if (headings.length === 0) {
    factors.push({
      type: 'error',
      message: 'No headings found in content'
    });
  } else {
    factors.push({
      type: 'good',
      message: `${headings.length} headings found in content`
    });
  }
  
  // Images
  const images = document.querySelectorAll('.post-content img');
  if (images.length === 0) {
    factors.push({
      type: 'warning',
      message: 'No images found in content'
    });
  } else {
    // Check for alt text
    let imagesWithoutAlt = 0;
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        imagesWithoutAlt++;
      }
    });
    
    if (imagesWithoutAlt > 0) {
      factors.push({
        type: 'warning',
        message: `${imagesWithoutAlt} images missing alt text`
      });
    } else {
      factors.push({
        type: 'good',
        message: `${images.length} images with alt text found`
      });
    }
  }
  
  // Links
  const links = document.querySelectorAll('.post-content a');
  if (links.length === 0) {
    factors.push({
      type: 'warning',
      message: 'No links found in content'
    });
  } else {
    factors.push({
      type: 'good',
      message: `${links.length} links found in content`
    });
  }
  
  // Keyword in title
  const keywordInTitle = keywords.some(keyword => 
    title.toLowerCase().includes(keyword)
  );
  
  if (keywordInTitle) {
    factors.push({
      type: 'good',
      message: 'Primary keyword found in title'
    });
  } else {
    factors.push({
      type: 'warning',
      message: 'Primary keyword not found in title'
    });
  }
  
  return factors;
}

function calculateSeoScore(factors) {
  // Calculate score based on factors
  let score = 0;
  let maxScore = 0;
  
  factors.forEach(factor => {
    maxScore += 10;
    
    if (factor.type === 'good') {
      score += 10;
    } else if (factor.type === 'warning') {
      score += 5;
    }
    // Errors add 0 points
  });
  
  // Convert to percentage
  return Math.round((score / maxScore) * 100);
}

function displaySeoScore(score) {
  const scoreElement = document.getElementById('seo-score-value');
  scoreElement.textContent = score;
  
  // Set color based on score
  const scoreCircle = document.querySelector('.score-circle');
  if (score >= 80) {
    scoreCircle.style.backgroundColor = '#e8f5e9';
    scoreCircle.style.color = '#4caf50';
  } else if (score >= 60) {
    scoreCircle.style.backgroundColor = '#fff8e1';
    scoreCircle.style.color = '#ff9800';
  } else {
    scoreCircle.style.backgroundColor = '#ffebee';
    scoreCircle.style.color = '#f44336';
  }
}

function displaySeoAnalysis(factors) {
  const recommendationsElement = document.getElementById('seo-recommendations');
  recommendationsElement.innerHTML = '';
  
  factors.forEach(factor => {
    const li = document.createElement('li');
    li.className = factor.type;
    li.textContent = factor.message;
    recommendationsElement.appendChild(li);
  });
}

function displayKeywords(keywords) {
  const keywordsElement = document.getElementById('seo-keywords-list');
  keywordsElement.innerHTML = '';
  
  keywords.forEach(keyword => {
    const span = document.createElement('span');
    span.className = 'keyword-tag';
    span.textContent = keyword;
    keywordsElement.appendChild(span);
  });
}

function setupEventListeners() {
  const toggleButton = document.getElementById('seo-panel-toggle');
  const panel = document.getElementById('seo-panel');
  
  toggleButton.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
  });
} 