---
layout: page
title: "Speaking @jonatasdp"
---

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<link rel="stylesheet" href="/assets/css/talks.css">

<div class="talks-container">
  <div class="talks-header">
    <h1>Global Speaker, SQL Enthusiast, Ruby Advocate</h1>
  </div>
  
  <div class="talks-intro">
    <p>From international conferences to local meetups, I share my passion for PostgreSQL, Ruby, TimescaleDB, and data science across the globe. Join me for practical insights, live coding, and real-world problem solving.</p>
  </div>
  
  <div class="upcoming-talks-highlight">
    <h2 class="highlight-heading">Upcoming Talks <i class="fas fa-calendar-alt"></i></h2>
    <div class="highlight-grid">
      {% assign today_date = 'now' | date: '%Y-%m-%d' %}
      {% assign upcoming_talks = site.data.talks.talks | sort: "date" %}
      
      <!-- Group talks by title to find series -->
      {% assign grouped_talks = upcoming_talks | group_by: "title" %}
      
      {% for group in grouped_talks %}
        {% assign has_future_talk = false %}
        {% for talk in group.items %}
          {% if talk.date > today_date %}
            {% assign has_future_talk = true %}
            {% assign first_talk = talk %}
            {% assign talk_date_parts = talk.date | split: "-" %}
            {% assign talk_year = talk_date_parts[0] %}
            {% assign talk_month = talk_date_parts[1] | plus: 0 %}
            {% assign talk_day = talk_date_parts[2] | plus: 0 %}
            {% assign talk_month_name = site.data.months[talk_month] %}
          {% endif %}
        {% endfor %}
        
        {% if has_future_talk %}
          <div class="highlight-card">
            <div class="highlight-card-header">
              <h3 class="highlight-title">{{ first_talk.title }}</h3>
            </div>
            <div class="highlight-card-body">
              {% if first_talk.series %}
                <div class="series-locations">
                  {% assign sorted_series = first_talk.series | sort: "date" %}
                  <div class="series-location-item">
                    <div class="talk-info-line">
                      <div class="series-dates-container">
                        {% for talk in sorted_series %}
                          {% if talk.date >= today_date %}
                            {% assign event_date_parts = talk.date | split: "-" %}
                            {% assign event_year = event_date_parts[0] %}
                            {% assign event_month = event_date_parts[1] | plus: 0 %}
                            {% assign event_day = event_date_parts[2] | plus: 0 %}
                            {% assign event_month_name = site.data.months[event_month] %}
                            
                            <div class="series-date-chip">
                              <span class="series-date">
                                <i class="far fa-calendar-alt"></i> {{ event_month_name }} {{ event_day }}, {{ event_year }}
                              </span>
                              <span class="series-location">
                                {% if talk.location contains "Spain" %}
                                  🇪🇸
                                {% elsif talk.location contains "Brazil" %}
                                  🇧🇷
                                {% elsif talk.location contains "Latvia" %}
                                  🇱🇻
                                {% elsif talk.location contains "Poland" %}
                                  🇵🇱
                                {% elsif talk.location contains "online" or talk.location contains "Online" %}
                                  🌐
                                {% else %}
                                  🏳️
                                {% endif %}
                                {{ talk.location }}
                              </span>
                              
                              {% if talk.url and talk.url != "" and talk.registration_open %}
                                <a href="{{ talk.url }}" class="series-date-cta">Register <i class="fas fa-arrow-right"></i></a>
                              {% endif %}
                            </div>
                          {% endif %}
                        {% endfor %}
                      </div>
                      
                      {% assign first_series_talk = sorted_series | where_exp: "item", "item.date >= today_date" | first %}
                      {% if first_series_talk %}
                        <div class="series-event">
                          <i class="fas fa-users"></i> 
                          {% if first_series_talk.url and first_series_talk.url != "" %}
                            <a href="{{ first_series_talk.url }}" class="event-link" target="_blank">{{ first_series_talk.event }}</a>
                          {% else %}
                            {{ first_series_talk.event }}
                          {% endif %}
                        </div>
                      {% endif %}
                    </div>
                  </div>
                </div>
              {% else %}
                <!-- Single event (not a series) - same structure -->
                <div class="series-locations">
                  <div class="series-location-item">
                    <!-- Consolidated single line with all information -->
                    <div class="talk-info-line">
                      <div class="series-date">
                        <i class="far fa-calendar-alt"></i> {{ talk_month_name }} {{ talk_day }}, {{ talk_year }}
                      </div>
                      
                      <div class="info-divider">•</div>
                      
                      <div class="series-location">
                        {% if first_talk.location contains "Spain" %}
                          🇪🇸
                        {% elsif first_talk.location contains "Brazil" %}
                          🇧🇷
                        {% elsif first_talk.location contains "Latvia" %}
                          🇱🇻
                        {% elsif first_talk.location contains "Poland" %}
                          🇵🇱
                        {% elsif first_talk.location contains "online" or first_talk.location contains "Online" %}
                          🌐
                        {% else %}
                          🏳️
                        {% endif %}
                        {{ first_talk.location }}
                      </div>
                      
                      <div class="info-divider">•</div>
                      
                      <div class="series-event">
                        <i class="fas fa-users"></i> 
                        {% if first_talk.url and first_talk.url != "" %}
                          <a href="{{ first_talk.url }}" class="event-link" target="_blank">{{ first_talk.event }}</a>
                        {% else %}
                          {{ first_talk.event }}
                        {% endif %}
                      </div>
                      
                      {% if first_talk.url and first_talk.url != "" and first_talk.registration_open %}
                        <div class="register-button-container">
                          <a href="{{ first_talk.url }}" class="series-date-cta">Register <i class="fas fa-arrow-right"></i></a>
                        </div>
                      {% endif %}
                    </div>
                  </div>
                </div>
              {% endif %}
            </div>
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>
  
  <div class="global-impact">
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">Total Talks</div>
    </div>
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">Delivered</div>
    </div>
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">Countries</div>
    </div>
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">Continents</div>
    </div>
    <div class="stat-box">
      <div class="stat-number counter" data-count="0">0</div>
      <div class="stat-label">International</div>
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
    <p class="booking-text">Looking for a speaker on PostgreSQL, Ruby, TimescaleDB, or Data Science? I'm available for conferences, workshops, and meetups worldwide. Let's create an engaging experience for your audience!</p>

    <a href="javascript:openBookingForm()" class="booking-button">Book Me for Your Event</a>
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
          <div class="talk-card {% if talk.date < today_date %}past-event{% endif %}" data-topics="{{ talk.topic | replace: ', ', ',' }}" data-year="{{ talk_year }}">
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
        <div class="talk-card talk-series" data-topics="{{ first_talk.topic | replace: ', ', ',' }}" data-year="{{ talk_year }}">
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
        <div class="talk-card {% if first_talk.date < today_date %}past-event{% endif %}" data-topics="{{ first_talk.topic | replace: ', ', ',' }}" data-year="{{ talk_year }}">
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
  
  <div class="booking-modal" id="booking-modal">
    <div class="booking-form">
      <div class="close-modal" onclick="closeBookingForm()">&times;</div>
      <h2>Book Me for Your Event</h2>
      <form id="speaking-request">
        <div class="form-group">
          <label for="name" class="form-label">Your Name</label>
          <input type="text" id="name" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input type="email" id="email" name="email" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="event" class="form-label">Event Name</label>
          <input type="text" id="event" name="event" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="date" class="form-label">Event Date</label>
          <input type="date" id="date" name="date" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="location" class="form-label">Event Location</label>
          <input type="text" id="location" name="location" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="topic" class="form-label">Preferred Topic</label>
          <select id="topic" name="topic" class="form-input" required>
            <option value="">Select a topic</option>
            {% for topic in site.data.talks.topics %}
              <option value="{{ topic.name }}">{{ topic.name }}</option>
            {% endfor %}
          </select>
        </div>
        <div class="form-group">
          <label for="message" class="form-label">Additional Information</label>
          <textarea id="message" name="message" class="form-input" rows="4"></textarea>
        </div>
        <button type="submit" class="form-submit">Submit Request</button>
      </form>
    </div>
  </div>
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

