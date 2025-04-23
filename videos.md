---
layout: page
title: "Videos @jonatasdp"
---
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<link rel="stylesheet" href="/assets/css/talks.css">

<div class="videos-container">
  <div class="videos-header">
    <h1>Technical Talks & Presentations</h1>
  </div>
  
  <div class="videos-intro">
    <p>Watch my conference talks, presentations, and workshops on topics like PostgreSQL, Ruby, TimescaleDB, and data science.</p>
    <p class="talks-link"><a href="/talks" class="btn btn-primary">🎤 View All My Talks</a></p>
  </div>
  
  <div class="category-filters">
    <div class="filter-button active" data-filter="all" style="background-color: #333; color: #fff;">🎬 All Videos</div>
    {% for topic in site.data.talks.topics %}
      {% if topic.name == "PostgreSQL" or topic.name == "Ruby" or topic.name == "TimescaleDB" or topic.name == "Command Line" or topic.name == "Data Science" or topic.name == "Functional Programming" %}
        <div class="filter-button" data-filter="{{ topic.name }}" style="background-color: {{ topic.color }}; color: {% if topic.name == 'Ruby' or topic.name == 'TimescaleDB' %}#000{% else %}#fff{% endif %};">
          {% if topic.name == "PostgreSQL" %}🐘
          {% elsif topic.name == "Ruby" %}💎
          {% elsif topic.name == "TimescaleDB" %}⏱️
          {% elsif topic.name == "Command Line" %}🖥️
          {% elsif topic.name == "Data Science" %}📊
          {% elsif topic.name == "Functional Programming" %}λ
          {% endif %}
          {{ topic.name }}
        </div>
      {% endif %}
    {% endfor %}
  </div>
  
  <div class="videos-list">
    <!-- Videos will be populated by JavaScript -->
  </div>
</div>

<!-- Video template for JavaScript -->
<template id="video-template">
  <div class="video-card">
    <div class="video-embed">
      <!-- YouTube embed will be inserted here -->
    </div>
    <div class="video-details">
      <h3 class="video-title"></h3>
      <div class="video-meta">
        <span class="video-event"></span>
        <span class="video-date"></span>
        <span class="video-location"></span>
      </div>
      <div class="video-topics"></div>
      <div class="video-links">
        <a href="#" class="event-link" target="_blank"><i class="fas fa-external-link-alt"></i> Event Page</a>
        <a href="#" class="slides-link" target="_blank"><i class="fas fa-file-powerpoint"></i> Slides</a>
        <a href="#" class="github-link" target="_blank"><i class="fab fa-github"></i> GitHub</a>
      </div>
    </div>
  </div>
</template>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Get talks data from the JSON embedded in the page
  const talksJson = {{ site.data.talks.talks | jsonify }};
  
  // Filter talks with YouTube videos
  const videosData = talksJson.filter(talk => talk.media && talk.media.youtube);
  
  // Get topic colors
  const topicColors = {};
  {% for topic in site.data.talks.topics %}
  topicColors["{{ topic.name }}"] = "{{ topic.color }}";
  {% endfor %}
  
  // Render videos
  renderVideos(videosData);
  
  // Set up category filtering
  setupFilters();
  
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
        topicElement.textContent = topic;
        topicElement.dataset.topic = topic;
        
        // Apply color from topics if available
        if (topicColors[topic]) {
          topicElement.style.backgroundColor = topicColors[topic];
          
          // Calculate text color (white for dark backgrounds, black for light)
          const color = topicColors[topic].replace('#', '');
          const r = parseInt(color.substr(0, 2), 16);
          const g = parseInt(color.substr(2, 2), 16);
          const b = parseInt(color.substr(4, 2), 16);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          topicElement.style.color = brightness > 128 ? '#000' : '#fff';
        }
        
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
  
  function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-button');
    
    filterButtons.forEach(button => {
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
  }
});
</script>

<style>
.videos-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.videos-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.videos-intro {
  text-align: center;
  margin-bottom: 2rem;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
}

.filter-button {
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 5px;
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.filter-button.active {
  box-shadow: 0 0 0 2px white;
}

.videos-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.video-card {
  display: flex;
  flex-direction: column;
  background: rgba(30, 30, 30, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.video-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.video-embed {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}

.video-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-details {
  padding: 20px;
}

.video-title {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
  color: #ccc;
  font-size: 0.9rem;
}

.video-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.video-topic {
  background: rgba(80, 80, 80, 0.5);
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
}

.video-links {
  display: flex;
  gap: 15px;
}

.video-links a {
  color: #ccc;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.video-links a:hover {
  color: #fff;
}

.no-videos-message {
  text-align: center;
  padding: 50px 20px;
  background: rgba(30, 30, 30, 0.7);
  border-radius: 10px;
  margin: 20px auto;
}

.no-videos-message i {
  font-size: 4rem;
  color: #999;
  margin-bottom: 20px;
}

.no-videos-message p {
  font-size: 1.2rem;
  color: #ccc;
}

@media (min-width: 768px) {
  .videos-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .videos-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 