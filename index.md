---
layout: page
title:  Ideia-me!
---
{% include JB/setup %}
{% include about_me.html %}

<div class="latest-post mb-5">
  <h2 class="h3 fw-bold border-bottom pb-3 mb-4">Latest Post</h2>
  {% for post in site.posts limit: 1 %}
  <div class="card latest-post-card">
    <div class="card-body">
      <h3 class="card-title h2">
        <a class="post stretched-link text-decoration-none" href="{{ post.url }}">{{ post.title }}</a>
      </h3>
      <p class="card-subtitle text-muted mb-3">
        <i class="bi bi-calendar3"></i> {{ post.date | date: "%B %d, %Y" }}
        {% if post.categories %}
        <span class="ms-3">
          {% for category in post.categories %}
          <span class="badge bg-primary">{{ category }}</span>
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
  <h2 class="h3 fw-bold border-bottom pb-3 mb-4">All Posts</h2>
  <div class="list-group post-list-group">
    {% for post in site.posts %}
    <a href="{{ post.url }}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
      <div>
        <h5 class="mb-1">{{ post.title }}</h5>
        <small class="text-muted">
          <i class="bi bi-calendar3"></i> {{ post.date | date: "%B %d, %Y" }}
          {% if post.categories %}
          <span class="ms-3">
            {% for category in post.categories %}
            <span class="badge bg-primary">{{ category }}</span>
            {% endfor %}
          </span>
          {% endif %}
        </small>
      </div>
      <span class="badge bg-light text-dark rounded-pill">
        <i class="bi bi-arrow-right"></i>
      </span>
    </a>
    {% endfor %}
  </div>
</div>
