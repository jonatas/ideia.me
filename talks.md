---
layout: page
title: "Speaking @jonatasdp"
---

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<link rel="stylesheet" href="/assets/css/talks.css">

<div class="talks-container">
  <div class="talks-header">
    <h1>Global Speaker, SQL Enthusiast, Developer Advocate</h1>
  </div>
  
  <div class="talks-intro">
    <p>From international conferences to local meetups, I share my passion for PostgreSQL, Ruby, TimescaleDB, and data science across the globe. Join me for practical insights, live coding, and real-world problem solving.</p>
  </div>
  
  <div class="conference-carousel">
    <div class="carousel-container">
      {% assign talks_with_images = site.data.talks.talks | where_exp: "talk", "talk.media.images" %}
      {% assign featured_talks = talks_with_images | sort: "date" | reverse | slice: 0, 6 %}
      {% for talk in featured_talks %}
        {% for image in talk.media.images %}
          <div class="carousel-slide" data-talk-date="{{ talk.date }}">
            <img src="{{ image.src }}" alt="{{ image.alt }}">
            <div class="carousel-caption">
              <h3>{{ talk.event }}</h3>
              <p>{{ image.caption }}</p>
              <a href="#{{ talk.title | slugify }}" class="carousel-link">View Event Details</a>
            </div>
          </div>
        {% endfor %}
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
      <div class="stat-number" data-count="44">0</div>
      <div class="stat-label">Total Talks</div>
    </div>
    <div class="stat-box">
      <div class="stat-number" data-count="37">0</div>
      <div class="stat-label">Delivered</div>
    </div>
    <div class="stat-box">
      <div class="stat-number" data-count="9">0</div>
      <div class="stat-label">Countries</div>
    </div>
    <div class="stat-box">
      <div class="stat-number" data-count="4">0</div>
      <div class="stat-label">Continents</div>
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
  
  <div class="booking-section">
    <h2 class="booking-heading">Invite Me to Speak at Your Event</h2>
    <p class="booking-text">
    I'm sharing my speaking journey to connect with event organizers and communities. Are you looking for a speaker on PostgreSQL, Ruby, TimescaleDB, or Data Science? I'm available for conferences, workshops, and meetups worldwide, especially if I'm already visiting your region. Let's create an engaging experience for your audience! Connect with me on <a href="https://www.linkedin.com/in/jonatasdp" target="_blank" rel="noopener">LinkedIn <i class="fab fa-linkedin"></i></a> to discuss speaking opportunities.</p>
  </div>
  
  <h2 class="section-heading">Chronological Talk History</h2>
  
  <div class="year-filters">
    {% assign years = site.data.talks.talks | map: "date" | map: "slice" | map: "0,4" | uniq | sort | reverse %}
    {% for year in years %}
      <div class="year-filter" data-year="{{ year }}">{{ year }}</div>
    {% endfor %}
    <div class="year-filter active" data-year="all">All Years</div>
  </div>
  
  <div class="talks-grid">
    {% assign sorted_talks = site.data.talks.talks | sort: "date" | reverse %}
    {% assign today_date = 'now' | date: '%Y-%m-%d' %}
    
    <!-- Group talks by title to identify series -->
    {% assign grouped_talks_by_title = sorted_talks | group_by: "title" %}
    
    {% for group in grouped_talks_by_title %}
      {% assign first_talk = group.items | first %}
      {% assign talk_year = first_talk.date | slice: 0,4 %}
      
      <!-- Special handling for annual conferences like Lambda Days -->
      {% assign conference_years = "" | split: "" %}
      {% for talk in group.items %}
        {% assign conf_year = talk.date | slice: 0,4 %}
        {% if talk.event contains "Lambda Days" or talk.event contains "RubyConf" %}
          {% assign conference_years = conference_years | push: conf_year %}
        {% endif %}
      {% endfor %}
      
      {% if conference_years.size > 1 %}
        <!-- Display each conference talk separately -->
        {% for talk in group.items %}
          {% assign talk_year = talk.date | slice: 0,4 %}
          <div class="talk-card {% if talk.date < today_date %}past-event{% endif %}" 
               data-topics="{{ talk.topic | replace: ', ', ',' }}" 
               data-year="{{ talk_year }}"
               id="{{ talk.title | slugify }}">
            <div class="talk-card-header">
              {% if talk.media.youtube %}
                <img src="https://img.youtube.com/vi/{{ talk.media.youtube }}/mqdefault.jpg" alt="{{ talk.title }}" class="talk-card-thumbnail">
              {% else %}
                <img src="https://picsum.photos/seed/{{ talk.event | slugify }}/600/400" alt="{{ talk.title }}" class="talk-card-thumbnail">
              {% endif %}
              <div class="talk-card-overlay">
                <div class="talk-card-title-top">{{ talk.title }}</div>
                {% if talk.event contains "Lambda Days" or talk.event contains "RubyConf" %}
                  <div class="talk-card-event">{{ talk.event }} {{ talk_year }}</div>
                {% else %}
                  <div class="talk-card-event">{{ talk.event }}</div>
                {% endif %}
              </div>
            </div>
            <div class="talk-card-body">
              {% if talk.github %}
                <h3 class="talk-card-title"><a href="{{ talk.github }}" class="github-title-link" target="_blank">{{ talk.title }} <i class="fab fa-github" style="font-size: 0.7em; vertical-align: middle; opacity: 0.7;"></i></a></h3>
              {% else %}
                <h3 class="talk-card-title">{{ talk.title }}</h3>
              {% endif %}
              <div class="series-date">{{ talk.date | date: "%B %d, %Y" }}</div>
              <div class="series-location" 
                {% if talk.location contains "Madrid" %}
                  data-emoji="🇪🇸"
                {% elsif talk.location contains "São Paulo" or talk.location contains "Sao Paulo" %}
                  data-emoji="🇧🇷"
                {% elsif talk.location contains "Krakow" %}
                  data-emoji="🇵🇱"
                {% elsif talk.location contains "Latvia" or talk.location contains "Riga" %}
                  data-emoji="🇱🇻"
                {% elsif talk.location contains "Online" %}
                  data-emoji="🌐"
                {% elsif talk.location contains "PR" or talk.location contains "Brazil" %}
                  data-emoji="🇧🇷"
                {% elsif talk.international %}
                  data-emoji="🌐"
                {% else %}
                  data-emoji="🏳️"
                {% endif %}>
                {{ talk.location }}
              </div>
              <div class="talk-card-topics">
                {% assign topic_list = talk.topic | split: ", " %}
                {% for topic in topic_list %}
                  <div class="talk-card-topic topic-{{ topic | replace: ' ', '-' }}">{{ topic }}</div>
                {% endfor %}
              </div>
              
              {% if talk.media %}
                <div class="talk-card-video">
                  {% if talk.media.youtube %}
                    <div class="video-container">
                      <iframe width="100%" height="200" 
                        src="https://www.youtube.com/embed/{{ talk.media.youtube }}" 
                        frameborder="0" 
                        allowfullscreen 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
                      </iframe>
                    </div>
                  {% elsif talk.media.vimeo %}
                    <div class="video-container">
                      <iframe 
                        src="https://player.vimeo.com/video/{{ talk.media.vimeo }}" 
                        width="100%" 
                        height="200" 
                        frameborder="0" 
                        loading="lazy" 
                        title="{{ talk.title }}"
                        allowfullscreen>
                      </iframe>
                    </div>
                  {% elsif talk.media.slides %}
                    <div class="slides-container">
                      <iframe 
                        src="https://docs.google.com/presentation/d/e/{{ talk.media.slides }}/embed?start=false&loop=false&delayms=3000" 
                        width="100%" 
                        height="200" 
                        frameborder="0" 
                        loading="lazy" 
                        title="{{ talk.title }} Slides"
                        allowfullscreen="true" 
                        mozallowfullscreen="true" 
                        webkitallowfullscreen="true">
                      </iframe>
                    </div>
                  {% endif %}
                </div>
              {% endif %}
            </div>
            <div class="talk-card-footer">
              {% if talk.url and talk.url != "" %}
                <a href="{{ talk.url }}" target="_blank" class="talk-card-button">Event Details <i class="fas fa-arrow-right"></i></a>
              {% elsif talk.type %}
                <span class="talk-card-info">{{ talk.type | capitalize }}</span>
              {% else %}
                <span class="talk-card-info">{{ talk.event }}</span>
              {% endif %}
              
              {% if talk.media.slides %}
                <a href="https://docs.google.com/presentation/d/e/{{ talk.media.slides }}/pub?start=false&loop=false&delayms=3000" target="_blank" class="slides-button">
                  <i class="fas fa-file-powerpoint"></i> View Slides <i class="fas fa-external-link-alt"></i>
                </a>
              {% endif %}
              
              {% if talk.media.youtube %}
                <a href="https://www.youtube.com/watch?v={{ talk.media.youtube }}" target="_blank" class="video-button">
                  <i class="fab fa-youtube"></i> Watch Video <i class="fas fa-external-link-alt"></i>
                </a>
              {% endif %}
              
              {% if talk.language and talk.language != "English" %}
                <span class="language-badge">{{ talk.language }}</span>
              {% endif %}
            </div>
          </div>
        {% endfor %}
      {% elsif group.items.size > 1 %}
        <!-- This is a regular talk series with multiple instances -->
        <div class="talk-card talk-series" 
             data-topics="{{ first_talk.topic | replace: ', ', ',' }}" 
             data-year="{{ talk_year }}"
             id="{{ first_talk.title | slugify }}">
          <div class="talk-card-header">
            {% if first_talk.media.youtube %}
              <img src="https://img.youtube.com/vi/{{ first_talk.media.youtube }}/mqdefault.jpg" alt="{{ first_talk.title }}" class="talk-card-thumbnail">
            {% else %}
              <img src="https://picsum.photos/seed/{{ first_talk.event | slugify }}/600/400" alt="{{ first_talk.title }}" class="talk-card-thumbnail">
            {% endif %}
            <div class="talk-card-overlay">
              <div class="talk-card-title-top">{{ first_talk.title }}</div>
              {% if first_talk.event contains "Lambda Days" or first_talk.event contains "RubyConf" %}
                <div class="talk-card-event">{{ first_talk.event }} {{ talk_year }}</div>
              {% else %}
                <div class="talk-card-event">{{ first_talk.event }}</div>
              {% endif %}
            </div>
          </div>
          <div class="talk-card-body">
            {% if first_talk.github %}
              <h3 class="talk-card-title"><a href="{{ first_talk.github }}" class="github-title-link" target="_blank">{{ first_talk.title }} <i class="fab fa-github" style="font-size: 0.7em; vertical-align: middle; opacity: 0.7;"></i></a></h3>
            {% else %}
              <h3 class="talk-card-title">{{ first_talk.title }}</h3>
            {% endif %}
            <div class="talk-card-topics">
              {% assign topic_list = first_talk.topic | split: ", " %}
              {% for topic in topic_list %}
                <div class="talk-card-topic topic-{{ topic | replace: ' ', '-' }}">{{ topic }}</div>
              {% endfor %}
            </div>
            
            <div class="series-locations">
              {% assign sorted_items = group.items | sort: "date" %}
              {% for talk in sorted_items %}
                <div class="series-location-item {% if talk.date < today_date %}past-event{% endif %}">
                  <div class="series-date">{{ talk.date | date: "%B %d, %Y" }}</div>
                  <div class="series-location" 
                    {% if talk.location contains "Madrid" %}
                      data-emoji="🇪🇸"
                    {% elsif talk.location contains "São Paulo" or talk.location contains "Sao Paulo" %}
                      data-emoji="🇧🇷"
                    {% elsif talk.location contains "Krakow" %}
                      data-emoji="🇵🇱"
                    {% elsif talk.location contains "Latvia" or talk.location contains "Riga" %}
                      data-emoji="🇱🇻"
                    {% elsif talk.location contains "Online" %}
                      data-emoji="🌐"
                    {% elsif talk.location contains "PR" or talk.location contains "Brazil" %}
                      data-emoji="🇧🇷"
                    {% elsif talk.international %}
                      data-emoji="🌐"
                    {% else %}
                      data-emoji="🏳️"
                    {% endif %}>
                    {{ talk.location }}
                  </div>
                  {% assign talk_year = talk.date | slice: 0,4 %}
                  {% if talk.url != "" %}
                    {% if talk.event contains "Lambda Days" or talk.event contains "RubyConf" %}
                      <div class="series-event"><i class="fas fa-calendar-alt"></i> <a href="{{ talk.url }}" class="event-link" target="_blank">{{ talk.event }} {{ talk_year }}</a></div>
                    {% else %}
                      <div class="series-event"><i class="fas fa-calendar-alt"></i> <a href="{{ talk.url }}" class="event-link" target="_blank">{{ talk.event }}</a></div>
                    {% endif %}
                  {% else %}
                    {% if talk.event contains "Lambda Days" or talk.event contains "RubyConf" %}
                      <div class="series-event"><i class="fas fa-calendar-alt"></i> {{ talk.event }} {{ talk_year }}</div>
                    {% else %}
                      <div class="series-event"><i class="fas fa-calendar-alt"></i> {{ talk.event }}</div>
                    {% endif %}
                  {% endif %}
                  {% if talk.date > today_date and talk.url != "" %}
                    <a href="{{ talk.url }}" class="series-date-cta">Register <i class="fas fa-arrow-right"></i></a>
                  {% endif %}
                </div>
              {% endfor %}
            </div>
            
            {% if first_talk.media %}
              <div class="talk-card-video">
                {% if first_talk.media.youtube %}
                  <div class="video-container">
                    <iframe width="100%" height="200" 
                      src="https://www.youtube.com/embed/{{ first_talk.media.youtube }}" 
                      frameborder="0" 
                      allowfullscreen 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
                    </iframe>
                  </div>
                {% elsif first_talk.media.vimeo %}
                  <div class="video-container">
                    <iframe 
                      src="https://player.vimeo.com/video/{{ first_talk.media.vimeo }}" 
                      width="100%" 
                      height="200" 
                      frameborder="0" 
                      loading="lazy" 
                      title="{{ first_talk.title }}"
                      allowfullscreen>
                    </iframe>
                  </div>
                {% elsif first_talk.media.slides %}
                  <div class="slides-container">
                    <iframe 
                      src="https://docs.google.com/presentation/d/e/{{ first_talk.media.slides }}/embed?start=false&loop=false&delayms=3000" 
                      width="100%" 
                      height="200" 
                      frameborder="0" 
                      loading="lazy" 
                      title="{{ first_talk.title }} Slides"
                      allowfullscreen="true" 
                      mozallowfullscreen="true" 
                      webkitallowfullscreen="true">
                    </iframe>
                  </div>
                {% endif %}
              </div>
            {% endif %}
          </div>
          <div class="talk-card-footer">
            {% if first_talk.type %}
              <span class="talk-card-info">{{ first_talk.type | capitalize }}</span>
            {% else %}
              <span class="talk-card-info">{{ first_talk.event }}</span>
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
            
            {% if first_talk.language and first_talk.language != "English" %}
              <span class="language-badge">{{ first_talk.language }}</span>
            {% endif %}
          </div>
        </div>
      {% else %}
        <!-- Regular single talk -->
        <div class="talk-card {% if first_talk.date < today_date %}past-event{% endif %}" 
             data-topics="{{ first_talk.topic | replace: ', ', ',' }}" 
             data-year="{{ talk_year }}"
             id="{{ first_talk.title | slugify }}">
          <div class="talk-card-header">
            {% if first_talk.media.youtube %}
              <img src="https://img.youtube.com/vi/{{ first_talk.media.youtube }}/mqdefault.jpg" alt="{{ first_talk.title }}" class="talk-card-thumbnail">
            {% else %}
              <img src="https://picsum.photos/seed/{{ first_talk.event | slugify }}/600/400" alt="{{ first_talk.title }}" class="talk-card-thumbnail">
            {% endif %}
            <div class="talk-card-overlay">
              <div class="talk-card-title-top">{{ first_talk.title }}</div>
              {% if first_talk.event contains "Lambda Days" or first_talk.event contains "RubyConf" %}
                <div class="talk-card-event">{{ first_talk.event }} {{ talk_year }}</div>
              {% else %}
                <div class="talk-card-event">{{ first_talk.event }}</div>
              {% endif %}
            </div>
          </div>
          <div class="talk-card-body">
            {% if first_talk.github %}
              <h3 class="talk-card-title"><a href="{{ first_talk.github }}" class="github-title-link" target="_blank">{{ first_talk.title }} <i class="fab fa-github" style="font-size: 0.7em; vertical-align: middle; opacity: 0.7;"></i></a></h3>
            {% else %}
              <h3 class="talk-card-title">{{ first_talk.title }}</h3>
            {% endif %}
            <div class="series-date">{{ first_talk.date | date: "%B %d, %Y" }}</div>
            <div class="series-location" 
              {% if first_talk.location contains "Madrid" %}
                data-emoji="🇪🇸"
              {% elsif first_talk.location contains "São Paulo" or first_talk.location contains "Sao Paulo" %}
                data-emoji="🇧🇷"
              {% elsif first_talk.location contains "Krakow" %}
                data-emoji="🇵🇱"
              {% elsif first_talk.location contains "Latvia" or first_talk.location contains "Riga" %}
                data-emoji="🇱🇻"
              {% elsif first_talk.location contains "Online" %}
                data-emoji="🌐"
              {% elsif first_talk.location contains "PR" or first_talk.location contains "Brazil" %}
                data-emoji="🇧🇷"
              {% elsif first_talk.international %}
                data-emoji="🌐"
              {% else %}
                data-emoji="🏳️"
              {% endif %}>
              {{ first_talk.location }}
            </div>
            <div class="talk-card-topics">
              {% assign topic_list = first_talk.topic | split: ", " %}
              {% for topic in topic_list %}
                <div class="talk-card-topic topic-{{ topic | replace: ' ', '-' }}">{{ topic }}</div>
              {% endfor %}
            </div>
            
            {% if first_talk.media %}
              <div class="talk-card-video">
                {% if first_talk.media.youtube %}
                  <div class="video-container">
                    <iframe width="100%" height="200" 
                      src="https://www.youtube.com/embed/{{ first_talk.media.youtube }}" 
                      frameborder="0" 
                      allowfullscreen 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
                    </iframe>
                  </div>
                {% elsif first_talk.media.vimeo %}
                  <div class="video-container">
                    <iframe 
                      src="https://player.vimeo.com/video/{{ first_talk.media.vimeo }}" 
                      width="100%" 
                      height="200" 
                      frameborder="0" 
                      loading="lazy" 
                      title="{{ first_talk.title }}"
                      allowfullscreen>
                    </iframe>
                  </div>
                {% elsif first_talk.media.slides %}
                  <div class="slides-container">
                    <iframe 
                      src="https://docs.google.com/presentation/d/e/{{ first_talk.media.slides }}/embed?start=false&loop=false&delayms=3000" 
                      width="100%" 
                      height="200" 
                      frameborder="0" 
                      loading="lazy" 
                      title="{{ first_talk.title }} Slides"
                      allowfullscreen="true" 
                      mozallowfullscreen="true" 
                      webkitallowfullscreen="true">
                    </iframe>
                  </div>
                {% endif %}
              </div>
            {% endif %}
          </div>
          <div class="talk-card-footer">
            {% if first_talk.url and first_talk.url != "" %}
              <a href="{{ first_talk.url }}" target="_blank" class="talk-card-button">Event Details <i class="fas fa-arrow-right"></i></a>
            {% elsif first_talk.type %}
              <span class="talk-card-info">{{ first_talk.type | capitalize }}</span>
            {% else %}
              <span class="talk-card-info">{{ first_talk.event }}</span>
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
            
            {% if first_talk.language and first_talk.language != "English" %}
              <span class="language-badge">{{ first_talk.language }}</span>
            {% endif %}
          </div>
        </div>
      {% endif %}
    {% endfor %}
  </div>
  <!-- End of the page -->

<!-- Preload talks data for JavaScript calculations -->
<script id="talks-data" type="application/json">
{{ site.data.talks.talks | jsonify }}
</script>

<script src="/assets/js/talks.js"></script>

<script>
  // Make talks data globally available immediately
  window.talksJson = {{ site.data.talks.talks | jsonify }};
  
  // This script will be rendered in the Jekyll site
  document.addEventListener('DOMContentLoaded', function() {
    // Force recalculation of topic counts
    if (typeof updateTopicCounts === 'function') {
      updateTopicCounts();
    }
    
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

