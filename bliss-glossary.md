---
layout: default
title: Bliss Glossary
permalink: /bliss-glossary/
---

<div class="row align-items-center mb-5">
  <div class="col-md-8">
    <h1 class="display-4 fw-bold">Blissymbolics Glossary</h1>
    <p class="lead text-muted">
      Welcome to the complete Bliss semantic glossary! This page dynamically loads thousands of symbols, categorized by meaning.
    </p>
  </div>
  <div class="col-md-4 text-md-end">
    <i class="bi bi-journal-richtext text-primary" style="font-size: 4rem; opacity: 0.2;"></i>
  </div>
</div>

<div class="glossary-search-container position-relative mb-5 z-3">
  <input type="search" id="symbol-search" class="form-control form-control-lg rounded-pill shadow-sm glass-card border-primary" placeholder="Search symbols... (Cmd+F to focus)" style="padding-left: 3rem; background-color: rgba(255,255,255,0.05); color: #f8f9fa;">
  <i class="bi bi-search position-absolute text-muted" style="left: 1.25rem; top: 50%; transform: translateY(-50%);"></i>
</div>

<style>
.glossary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}
.symbol-card {
  text-align: center;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.symbol-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  border-color: var(--bs-primary);
}
.symbol-img {
  max-width: 100%;
  height: auto;
  max-height: 80px;
  object-fit: contain;
  margin-bottom: 1.25rem;
  filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.1));
}
.symbol-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: #f8f9fa;
  word-wrap: break-word;
}
.category-header {
  margin-bottom: 2rem;
  margin-top: 3rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(255,255,255,0.1);
  color: var(--bs-primary);
}
#symbol-search::placeholder {
  color: rgba(255,255,255,0.5);
}
#symbol-search:focus {
  background-color: rgba(255,255,255,0.1);
  color: #fff;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>

<div id="glossary-mount">
  <div class="text-center text-muted py-5">
    <div class="spinner-border text-primary" role="status"></div>
    <div class="mt-3">Loading thousands of symbols...</div>
  </div>
</div>

<script src="/js/bliss-glossary.js"></script>
