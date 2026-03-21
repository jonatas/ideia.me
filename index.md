---
layout: page
---

<style>
  .colored-divider {
    border: 0;
    height: 2px;
    margin: 3rem 0;
    opacity: 1;
  }
</style>

<!-- Hero section -->
<div class="hero-section mb-5">
  <div class="d-flex flex-column flex-md-row align-items-center">
    <div class="mb-4 mb-md-0 me-md-4">
      {% include about_me.html %}
    </div>
    <div class="text-center">
      <img src="{{ site.author.avatar }}" alt="{{ site.author.name }}" class="profile-image img-fluid mb-3" style="max-width: 250px; cursor: pointer;" title="Click me or hover for 3 seconds!">
      <div class="social-links mt-3">
        <a href="https://github.com/{{ site.author.github }}" class="btn btn-outline-light btn-sm me-2" target="_blank"><i class="bi bi-github"></i> GitHub</a>
        <a href="https://twitter.com/{{ site.author.twitter }}" class="btn btn-outline-light btn-sm me-2" target="_blank"><i class="bi bi-twitter"></i> Twitter</a>
        <a href="https://linkedin.com/in/{{ site.author.linkedin }}" class="btn btn-outline-light btn-sm" target="_blank"><i class="bi bi-linkedin"></i> LinkedIn</a>
      </div>
    </div>
  </div>
</div>

<hr class="colored-divider">

<!-- Featured content -->
<div class="featured-content mb-5">
  <h2 class="h3 fw-bold mb-4">Featured Content</h2>
  
  <div class="mb-4">
    <h3 class="h4">Latest Talks</h3>
    <p>Explore my recent presentations at conferences and meetups around the world.</p>
    <a href="/talks" class="btn btn-primary animated-link">View Talks <i class="bi bi-arrow-right"></i></a>
  </div>
  
  <div class="mb-4">
    <h3 class="h4">Technical Articles</h3>
    <p>Deep dives into PostgreSQL, TimescaleDB, Ruby, and more.</p>
    <a href="/categories.html#technical-ref" class="btn btn-primary animated-link">Read Articles <i class="bi bi-arrow-right"></i></a>
  </div>
  
  <div class="mb-4">
    <h3 class="h4">Community Insights</h3>
    <p>Thoughts on building and nurturing tech communities.</p>
    <a href="/categories.html#community-ref" class="btn btn-primary animated-link">Explore <i class="bi bi-arrow-right"></i></a>
  </div>
</div>

<hr class="colored-divider">

<div class="featured-apps mb-5">
  <h2 class="h3 fw-bold mb-4">Interactive Hub & Tools</h2>
  
  <div class="mb-4">
    <h3 class="h4 text-primary"><i class="bi bi-magic me-2"></i> Apps & Playgrounds</h3>
    <p>Check out the interactive tools directory, featuring the Semantic Learning journey, full-screen Drawing Recorder, and the 7m Geodesic Dome Builder.</p>
    <a href="/apps/" class="btn btn-outline-primary animated-link">Explore Apps <i class="bi bi-grid-3x3-gap"></i></a>
  </div>
  
  <div class="mb-4">
    <h3 class="h4"><i class="bi bi-palette me-2"></i> Mandala Drawings</h3>
    <p>Explore the Mandala Synth and Playground. Draw mandalas, sonify visuals, and experiment with complex geometries mapped to audio.</p>
    <a href="/mandala-playground.html" class="btn btn-primary animated-link">Launch Playground <i class="bi bi-play-circle"></i></a>
  </div>
</div>

<hr class="colored-divider">

<div class="latest-post mb-5">
  <h2 class="h3 fw-bold mb-4">Latest Post</h2>
  {% for post in site.posts limit: 1 %}
  <div class="mb-4">
    <h3 class="h2 mb-2">
      <a class="post text-decoration-none" href="{{ post.url }}">{{ post.title }}</a>
    </h3>
    <p class="text-muted mb-3" style="font-family: monospace;">
      {{ post.date | date: "%B %d, %Y" }}
      {% if post.categories %}
      <span class="ms-3">
        {% for category in post.categories %}
        <span class="badge bg-secondary text-white">{{ category }}</span>
        {% endfor %}
      </span>
      {% endif %}
    </p>
    <div>
      {{ post.content }}
    </div>
  </div>
  {% endfor %}
</div>

<hr class="colored-divider">

<div class="post-list">
  <h2 class="h3 fw-bold mb-4">Recent Posts</h2>
  <div class="post-list-group">
    {% for post in site.posts limit: 10 %}
    <div class="d-flex justify-content-between align-items-baseline mb-2">
      <a href="{{ post.url }}" class="text-decoration-none h5 mb-0">{{ post.title }}</a>
      <small class="text-nowrap ms-2" style="font-family: monospace;">
        {{ post.date | date: "%b %d, %Y" }}
      </small>
    </div>
    {% endfor %}
  </div>
  <div class="mt-4">
    <a href="/archive.html" class="btn btn-primary">View All Posts <i class="bi bi-journal-text"></i></a>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const rainbowColors = ['#FBBF24', '#0EA5E9', '#1E3A8A', '#EF4444'];
    document.querySelectorAll('.colored-divider').forEach((hr, i) => {
      hr.style.backgroundColor = rainbowColors[i % rainbowColors.length];
    });
  });
</script>
