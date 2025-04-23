/**
 * Videos page functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get talks data from the JSON embedded in the page
  const talksJson = window.talksJson || [];
  
  // Get topic colors
  const topicColors = window.topicColors || {};
  
  // Create filter buttons
  createFilterButtons();
  
  // Enrich data - add categories based on regex matching
  const enrichedData = enrichTalksData(talksJson);
  
  // Filter talks with YouTube videos
  const videosData = enrichedData.filter(talk => talk.media && talk.media.youtube);
  
  // Render videos
  renderVideos(videosData);
  
  // Set up category filtering with emojis
  setupFilters();
  
  /**
   * Get emoji for a given topic
   */
  function getTopicEmoji(topic) {
    const emojiMap = {
      'PostgreSQL': '🐘',
      'Ruby': '💎',
      'TimescaleDB': '🐯',
      'Command Line': '🖥️',
      'Data Science': '📊',
      'Functional Programming': 'λ',
      'Time Series': '⏱️',
      'Analytics': '📈',
      'Data Processing': '⚙️',
      'Data Modeling': '🗂️',
      'Data Visualization': '📊',
      'Performance': '🚀',
      'Career': '👨‍💻',
      'Web': '🌐',
      'Audio': '🔊'
    };
    
    return emojiMap[topic] || '🏷️'; // Default to tag emoji
  }
  
  /**
   * Enrich talks data with additional categorization
   */
  function enrichTalksData(talks) {
    return talks.map(talk => {
      // Create a copy of the talk to avoid modifying the original
      const enrichedTalk = { ...talk };
      
      // Default topic field if missing
      if (!enrichedTalk.topic) {
        enrichedTalk.topic = '';
      }
      
      return enrichedTalk;
    });
  }
  
  /**
   * Render video cards for each video
   */
  function renderVideos(videos) {
    const videosList = document.querySelector('.videos-list');
    const template = document.getElementById('video-template');
    
    // Clear existing videos
    videosList.innerHTML = '';
    
    // Display message if no videos found
    if (!videos || videos.length === 0) {
      const noVideosMsg = document.createElement('div');
      noVideosMsg.className = 'no-videos-message';
      noVideosMsg.innerHTML = `
        <i class="fas fa-video-slash"></i>
        <p>No videos found. Check back later for new content!</p>
      `;
      videosList.appendChild(noVideosMsg);
      return;
    }
    
    // Loop through videos and create elements
    videos.forEach(video => {
      const videoElement = template.content.cloneNode(true);
      
      // Set video details
      videoElement.querySelector('.video-title').textContent = video.title;
      videoElement.querySelector('.video-event').textContent = video.event;
      videoElement.querySelector('.video-date').textContent = new Date(video.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      videoElement.querySelector('.video-location').textContent = video.location;
      
      // Create YouTube embed
      const embedDiv = videoElement.querySelector('.video-embed');
      embedDiv.innerHTML = `
        <div class="video-container">
          <iframe width="560" height="420" 
            src="https://www.youtube.com/embed/${video.media.youtube}" 
            frameborder="0" 
            allowfullscreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            color="white"
            theme="light">
          </iframe>
        </div>
      `;
      
      // Set up topics
      const topicsContainer = videoElement.querySelector('.video-topics');
      let topics = [];
      
      if (video.topic && typeof video.topic === 'string') {
        topics = video.topic.split(', ');
      }
      
      topics.forEach(topic => {
        const topicElement = document.createElement('div');
        topicElement.className = 'video-topic';
        
        // Add topic-specific class for CSS styling
        topicElement.classList.add('topic-' + topic.toLowerCase().replace(/\s+/g, '-'));
        
        // Add emoji to topic
        const emoji = getTopicEmoji(topic);
        topicElement.textContent = `${emoji} ${topic}`;
        
        topicElement.dataset.topic = topic;
        
        topicsContainer.appendChild(topicElement);
      });
      
      // Set up links (only show if available)
      const eventLink = videoElement.querySelector('.event-link');
      if (video.url && video.url !== "") {
        eventLink.href = video.url;
      } else {
        eventLink.style.display = 'none';
      }
      
      const slidesLink = videoElement.querySelector('.slides-link');
      if (video.media && video.media.slides) {
        slidesLink.href = `https://docs.google.com/presentation/d/e/${video.media.slides}/pub?start=false&loop=false&delayms=3000`;
      } else {
        slidesLink.style.display = 'none';
      }
      
      const githubLink = videoElement.querySelector('.github-link');
      if (video.github) {
        githubLink.href = video.github;
      } else {
        githubLink.style.display = 'none';
      }
      
      // Add data attributes for filtering
      const videoCard = videoElement.querySelector('.video-card');
      videoCard.dataset.topics = video.topic;
      
      // Add to the list
      videosList.appendChild(videoElement);
    });
  }
  
  /**
   * Set up category filtering functionality
   */
  function setupFilters() {
    // Get all filter buttons (including the newly created ones)
    const filterButtons = document.querySelectorAll('.filter-button');
    
    // Add emojis to filter buttons
    filterButtons.forEach(button => {
      const filter = button.dataset.filter;
      
      if (filter === 'all') {
        // Add film emoji to All Videos button
        button.innerHTML = `🎬 All Videos`;
        // Ensure it has the appropriate class
        button.classList.add('topic-all-videos');
      } else {
        // Get emoji for topic
        const emoji = getTopicEmoji(filter);
        
        // If button doesn't already have an emoji prepended, add it
        if (!button.textContent.trim().startsWith(emoji)) {
          button.innerHTML = `${emoji} ${filter}`;
        }
      }
      
      // Add click handler
      button.addEventListener('click', function() {
        // Set active class
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        const videos = document.querySelectorAll('.video-card');
        
        if (filter === 'all') {
          videos.forEach(video => {
            video.style.display = 'flex';
          });
        } else {
          videos.forEach(video => {
            if (video.dataset.topics.includes(filter)) {
              video.style.display = 'flex';
            } else {
              video.style.display = 'none';
            }
          });
        }
      });
    });
    
    // Hide filter buttons for topics that don't have videos
    const availableTopics = new Set();
    document.querySelectorAll('.video-card').forEach(card => {
      if (card.dataset.topics) {
        card.dataset.topics.split(', ').forEach(topic => {
          availableTopics.add(topic.trim());
        });
      }
    });
    
    // Hide buttons for topics with no videos
    filterButtons.forEach(button => {
      const filter = button.dataset.filter;
      if (filter !== 'all' && !availableTopics.has(filter)) {
        button.style.display = 'none';
      }
    });
  }
  
  /**
   * Create filter buttons based on the topics we want to display
   */
  function createFilterButtons() {
    const filtersContainer = document.querySelector('.category-filters');
    
    // Define which topics to show as filters
    const topicsToShow = [
      "PostgreSQL", 
      "Ruby", 
      "TimescaleDB", 
      "Command Line", 
      "Data Science", 
      "Functional Programming",
      "Performance",
      "Analytics"
    ];
    
    // Add buttons for selected topics
    topicsToShow.forEach(topicName => {
      if (topicColors[topicName]) {
        const button = document.createElement('div');
        button.className = 'filter-button';
        button.dataset.filter = topicName;
        
        // Add topic-specific class for CSS styling
        button.classList.add('topic-' + topicName.toLowerCase().replace(/\s+/g, '-'));
        
        // Add text (emoji will be added later)
        button.textContent = topicName;
        
        // Add to container
        filtersContainer.appendChild(button);
      }
    });
  }
}); 