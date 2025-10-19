---
layout: page
---

<!-- Hero section with glass card styling -->
<div class="hero-section glass-card mb-5 p-4 rounded">
  <div class="row align-items-center">
    <div class="col-md-8">
      {% include about_me.html %}
    </div>
    <div class="col-md-4 text-center">
      <img src="{{ site.author.avatar }}" alt="{{ site.author.name }}" class="profile-image img-fluid mb-3" style="max-width: 250px; border-radius: 10px; cursor: pointer;" title="Click me or hover for 3 seconds!">
      <div class="social-links">
        <a href="https://github.com/{{ site.author.github }}" class="btn btn-primary btn-sm me-2" target="_blank"><i class="bi bi-github"></i> GitHub</a>
        <a href="https://twitter.com/{{ site.author.twitter }}" class="btn btn-primary btn-sm me-2" target="_blank"><i class="bi bi-twitter"></i> Twitter</a>
        <a href="https://linkedin.com/in/{{ site.author.linkedin }}" class="btn btn-primary btn-sm" target="_blank"><i class="bi bi-linkedin"></i> LinkedIn</a>
      </div>
    </div>
  </div>
</div>

<!-- Featured content with geometric decorations -->
<div class="featured-content glass-card p-4 rounded mb-5 position-relative">
  <!-- Decorative circles in background -->
  <div class="circle-decoration" style="top: -20px; right: -20px;"></div>
  <div class="circle-decoration" style="bottom: -30px; left: -15px; width: 80px; height: 80px;"></div>
  
  <h2 class="h3 fw-bold mb-4">Featured Content</h2>
  <div class="row">
    <div class="col-md-4 mb-3">
      <div class="glass-card h-100">
        <div class="card-body">
          <h3 class="h5 card-title">Latest Talks</h3>
          <p class="card-text">Explore my recent presentations at conferences and meetups around the world.</p>
          <a href="/talks" class="btn btn-primary animated-link">View Talks <i class="bi bi-arrow-right"></i></a>
        </div>
      </div>
    </div>
    <div class="col-md-4 mb-3">
      <div class="glass-card h-100">
        <div class="card-body">
          <h3 class="h5 card-title">Technical Articles</h3>
          <p class="card-text">Deep dives into PostgreSQL, TimescaleDB, Ruby, and more.</p>
          <a href="/categories.html#technical-ref" class="btn btn-primary animated-link">Read Articles <i class="bi bi-arrow-right"></i></a>
        </div>
      </div>
    </div>
    <div class="col-md-4 mb-3">
      <div class="glass-card h-100">
        <div class="card-body">
          <h3 class="h5 card-title">Community Insights</h3>
          <p class="card-text">Thoughts on building and nurturing tech communities.</p>
          <a href="/categories.html#community-ref" class="btn btn-primary animated-link">Explore <i class="bi bi-arrow-right"></i></a>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="latest-post mb-5">
  <h2 class="h3 fw-bold border-bottom pb-3 mb-4">Latest Post</h2>
  {% for post in site.posts limit: 1 %}
  <div class="glass-card latest-post-card">
    <div class="card-body p-4">
      <h3 class="card-title h2">
        <a class="post animated-link" href="{{ post.url }}">{{ post.title }}</a>
      </h3>
      <p class="card-subtitle mb-3">
        <i class="bi bi-calendar3"></i> {{ post.date | date: "%B %d, %Y" }}
        {% if post.categories %}
        <span class="ms-3">
          {% for category in post.categories %}
          <span class="badge">{{ category }}</span>
          {% endfor %}
        </span>
        {% endif %}
      </p>
      <div class="card-text">
        {{ post.content }}
      </div>
    </div>
  </div>
  {% endfor %}
</div>

<div class="post-list">
  <h2 class="h3 fw-bold border-bottom pb-3 mb-4">Recent Posts</h2>
  <div class="post-list-group">
    {% for post in site.posts limit: 10 %}
    <a href="{{ post.url }}" class="glass-card d-block mb-3 p-3 text-decoration-none">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-1">{{ post.title }}</h5>
          <small>
            <i class="bi bi-calendar3"></i> {{ post.date | date: "%B %d, %Y" }}
            {% if post.categories %}
            <span class="ms-3">
              {% for category in post.categories %}
              <span class="badge">{{ category }}</span>
              {% endfor %}
            </span>
            {% endif %}
          </small>
        </div>
        <span class="badge rounded-pill">
          <i class="bi bi-arrow-right"></i>
        </span>
      </div>
    </a>
    {% endfor %}
  </div>
  <div class="text-center mt-4">
    <a href="/archive.html" class="btn btn-primary">View All Posts <i class="bi bi-journal-text"></i></a>
  </div>
</div>
