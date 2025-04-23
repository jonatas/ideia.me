---
layout: page
title: "Videos by @jonatasdp"
---
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<link rel="stylesheet" href="/assets/css/talks.css">
<link rel="stylesheet" href="/assets/css/topic-colors.css">

<div class="videos-container">
  <div class="videos-header">
    <h1>Technical Talks & Presentations</h1>
  </div>
  
  <div class="videos-intro">
    <p>Watch my conference talks, presentations, and workshops on topics like PostgreSQL, Ruby, TimescaleDB, and data science.</p>
    <p class="talks-link"><a href="/talks" class="btn btn-primary">🎤 View All My Talks</a></p>
  </div>
  
  <div class="category-filters">
    <div class="filter-button active topic-all-videos" data-filter="all">All Videos</div>
    <!-- Topics will be populated by JavaScript -->
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

<!-- Pass data to JavaScript -->
<script>
// Make data available globally
window.talksJson = {{ site.data.talks.talks | jsonify }};
window.topicColors = {};
{% for topic in site.data.talks.topics %}
window.topicColors["{{ topic.name }}"] = "{{ topic.color }}";
{% endfor %}
</script>

<!-- Load the external JavaScript file -->
<script src="/assets/js/videos.js"></script>

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