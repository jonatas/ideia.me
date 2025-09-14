---
layout: page
title: "Speaking @jonatasdp"
---
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"><link rel="stylesheet" href="/assets/css/talks.css">

<div class="talks-container">
  <div class="talks-header">
    <h1>Global Speaker, SQL Enthusiast, Developer Advocate</h1>
  </div>
  
  <div class="talks-intro">
    <p>From international conferences to local meetups, I share my passion for PostgreSQL, Ruby, TimescaleDB, and data science across the globe. Join me for practical insights, live coding, and real-world problem solving.</p>
    <p class="videos-link"><a href="/videos" class="btn btn-primary">🍿 Watch My Tech Videos</a></p>
  </div>
  
  <div class="conference-carousel">
    <div class="carousel-container">
      {% assign talks_with_banners = site.data.talks.talks | where_exp: "talk", "talk.media.banner" %}
      {% assign sorted_talks = talks_with_banners | sort: "date" | reverse | slice: 0, 6 %}
      {% for talk in sorted_talks %}
        <div class="carousel-slide" data-talk-date="{{ talk.date }}">
          <img src="{{ talk.media.banner.src }}" alt="{{ talk.media.banner.alt }}">
          <div class="carousel-caption">
            <h3>{{ talk.event }}</h3>
            <p>{{ talk.title }}</p>
            <a href="#{{ talk.title | slugify }}" class="carousel-link">View Event Details</a>
          </div>
        </div>
      {% endfor %}
    </div>
    <div class="carousel-nav">
      <button class="carousel-button prev-button">
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="carousel-button next-button">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
  
  <div class="global-impact">
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">Total Talks</div>
    </div>
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">International</div>
    </div>
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">Countries</div>
    </div>
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">Continents</div>
    </div>
  </div>
  
  <!-- New Chronological Image Gallery Section -->
  <div class="image-gallery-section">
    <h2 class="section-heading">Conference Moments</h2>
    <p class="gallery-intro">A visual journey through my speaking engagements around the world, from the most recent to past events.</p>
    
    <div class="image-gallery-container">
      <div class="image-gallery" id="chronological-gallery">
        <!-- Images will be loaded here via JavaScript -->
      </div>
      <div class="load-more-container">
        <button id="load-more-images" class="load-more-button">
          <i class="fas fa-images"></i> Load More Images
        </button>
      </div>
    </div>
  </div>
  
  <div class="topic-filters">
    <h3>Filter by Topic:</h3>
    {% for topic in site.data.talks.topics %}
      <div class="topic-filter" data-topic="{{ topic.name }}" style="border: 2px solid {{ topic.color }};">
        {{ topic.name }}
      </div>
    {% endfor %}
  </div>
  
  <h2 class="section-heading">Chronological Talk History</h2>
  
  <div class="talks-list">
    {% assign sorted_talks = site.data.talks.talks | sort: "date" | reverse %}
    {% assign today_date = 'now' | date: '%Y-%m-%d' %}
    
    {% assign grouped_talks_by_title = sorted_talks | group_by: "title" %}

    {% for group in grouped_talks_by_title %}
      <div class="talk-card">
        <div class="talk-card-header">
          {% assign first_talk = group.items | first %}
          {% if first_talk.media.banner %}
            <img src="{{ first_talk.media.banner.src }}" alt="{{ first_talk.media.banner.alt }}" class="talk-card-thumbnail">
          {% elsif first_talk.media.images %}
            <img src="{{ first_talk.media.images[0].src }}" alt="{{ first_talk.media.images[0].alt }}" class="talk-card-thumbnail">
          {% elsif first_talk.media.youtube %}
            <img src="https://img.youtube.com/vi/{{ first_talk.media.youtube }}/mqdefault.jpg" alt="{{ first_talk.title }}" class="talk-card-thumbnail">
          {% else %}
            <div class="talk-card-thumbnail-placeholder">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
          {% endif %}
        </div>
        <div class="talk-card-body">
          <h3 class="talk-card-title">{{ first_talk.title }}</h3>
          <div class="series-locations">
            {% assign prev_event = "" %}
            {% for talk in group.items %}
              <div class="series-location-">
                {% if talk.event != prev_event %}
                  <span class="series-event">{{ talk.event }}</span>
                  {% assign prev_event = talk.event %}
                {% endif %}
                {% if talk.url and talk.url != "" %}
                  <a href="{{ talk.url }}" target="_blank">
                {% endif %}
                  <span class="series-date">{{ talk.date | date: "%B %d, %Y" }}</span>
                  <span class="series-location">{{ talk.location }}</span>
                {% if talk.url and talk.url != "" %}
                  </a>
                {% endif %}
              </div>
            {% endfor %}
          </div>
          <div class="talk-card-topics">
            {% assign topic_list = first_talk.topic | split: ", " %}
            {% for topic in topic_list %}
              <div class="talk-card-topic topic-{{ topic | replace: ' ', '-' }}">{{ topic }}</div>
            {% endfor %}
          </div>
        </div>
        <div class="talk-card-footer">
          {% if first_talk.url and first_talk.url != "" %}
            <a href="{{ first_talk.url }}" target="_blank" class="talk-card-button">Event Details <i class="fas fa-arrow-right"></i></a>
          {% endif %}
          {% if first_talk.media.slides %}
            <a href="https://docs.google.com/presentation/d/e/{{ first_talk.media.slides }}/pub?start=false&loop=false&delayms=3000" target="_blank" class="slides-button">
              <i class="fas fa-file-powerpoint"></i> View Slides <i class="fas fa-external-link-alt"></i>
            </a>
          {% endif %}
          {% if first_talk.media.youtube %}
            <a href="https://www.youtube.com/watch?v={{ first_talk.media.youtube }}" target="_blank" class="video-button">
              <i class="fab fa-youtube"></i> Watch Video <i class="fas fa-external-link-alt"></i>
            </a>
          {% endif %}
        </div>
      </div>
    {% endfor %}
  </div>
  <!-- End of the page -->

<!-- Preload talks data for JavaScript calculations -->
<script id="talks-data" type="application/json">
{{ site.data.talks.talks | jsonify }}
</script>

<!-- Full-screen Image Viewer -->
<div id="fullscreen-viewer" class="fullscreen-viewer">
  <div class="fullscreen-viewer-content">
    <button class="close-viewer-btn"><i class="fas fa-times"></i></button>
    <button class="prev-image-btn"><i class="fas fa-chevron-left"></i></button>
    <button class="next-image-btn"><i class="fas fa-chevron-right"></i></button>
    <div class="fullscreen-image-container">
      <div class="fullscreen-loading">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <img id="fullscreen-image" src="" alt="Conference image">
    </div>
    <div class="fullscreen-image-caption">
      <h3 id="fullscreen-event"></h3>
      <p id="fullscreen-caption"></p>
      <div class="fullscreen-image-details">
        <span id="fullscreen-date"></span> | <span id="fullscreen-location"></span>
      </div>
      <a id="fullscreen-event-link" href="#" class="view-event-btn">View Event Details <i class="fas fa-arrow-right"></i></a>
    </div>
  </div>

  <div class="booking-section">
    <h2 class="booking-heading">Invite Me to Speak at Your Event</h2>
    <p class="booking-text">
    I'm sharing my speaking journey to connect with event organizers and communities. Are you looking for a speaker on PostgreSQL, Ruby, TimescaleDB, or Data Science? I'm available for conferences, workshops, and meetups worldwide, especially if I'm already visiting your region. Let's create an engaging experience for your audience! Connect with me on <a href="https://www.linkedin.com/in/jonatasdp" target="_blank" rel="noopener">LinkedIn <i class="fab fa-linkedin"></i></a> to discuss speaking opportunities.</p>
  </div>
  
</div>


<script src="/assets/js/talks.js"></script>

<script>
  // Make talks data globally available immediately
  window.talksJson = {{ site.data.talks.talks | jsonify }};
  
  // This script will be rendered in the Jekyll site
  document.addEventListener('DOMContentLoaded', function() {
    // Force recalculation of statistics from the JSON data
    console.log('Forcing recalculation of statistics with', window.talksJson.length, 'talks');
    
    if (typeof calculateAndDisplayStats === 'function') {
      calculateAndDisplayStats(window.talksJson);
    }
    
    // Force recalculation of topic counts
    if (typeof updateTopicCounts === 'function') {
      updateTopicCounts(window.talksJson);
    }
    
    // Animate the counters after stats are updated
    setTimeout(function() {
      if (typeof animateCounters === 'function') {
        animateCounters();
      }
    }, 100);
    
    // Form submission handling
    const form = document.getElementById('speaking-request');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        // In a real implementation, you'd send this data to a server
        alert('Thank you for your request! I will get back to you soon.');
        closeBookingForm();
      });
    }
  });
</script>

