---
layout: default
title: My Space
permalink: /profile/
---

<div class="row mb-5 fade-in">
  <div class="col-12">
    <div class="card glass-card border-0 p-4 position-relative overflow-hidden mb-4">
      <div class="position-absolute top-0 end-0 p-4 opacity-10">
        <i class="bi bi-person-workspace" style="font-size: 8rem;"></i>
      </div>
      <div class="card-body position-relative z-1">
        <h1 class="display-4 text-primary mb-3"><i class="bi bi-stars me-2"></i>My Space</h1>
        <p class="lead text-muted">A private, local-first dashboard. Your data never leaves your browser.</p>
        
        <div class="row mt-5">
          <div class="col-md-4 mb-4">
            <div class="p-4 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 h-100 text-center text-md-start">
              <h5 class="text-muted mb-2 text-uppercase tracking-wide small"><i class="bi bi-clock-history me-2"></i>Life Time Here</h5>
              <div id="life-time-display" class="fs-2 font-monospace text-white mt-3">0s</div>
              <div class="small text-muted mt-2">Time spent exploring the site</div>
            </div>
          </div>
          <div class="col-md-4 mb-4">
            <div class="p-4 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 h-100 text-center text-md-start">
              <h5 class="text-muted mb-2 text-uppercase tracking-wide small"><i class="bi bi-calendar-event me-2"></i>First Visit</h5>
              <div id="first-visit-display" class="fs-4 text-white mt-3">--</div>
            </div>
          </div>
          <div class="col-md-4 mb-4">
            <div class="p-4 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 h-100 text-center text-md-start">
              <h5 class="text-muted mb-2 text-uppercase tracking-wide small"><i class="bi bi-bookmark-star me-2"></i>Saved Items</h5>
              <div id="saved-count-display" class="fs-2 font-monospace text-white mt-3">0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="row fade-in">
  <div class="col-12">
    <h3 class="mb-4 text-white"><i class="bi bi-collection me-2 text-primary"></i>Saved Collection</h3>
    <div id="saved-items-grid" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <!-- Items will be injected here via JS -->
      <div class="col w-100 text-center text-muted" id="empty-state">
        <div class="p-5 border border-secondary border-opacity-25 border-dashed rounded bg-dark bg-opacity-25">
          <i class="bi bi-inbox fs-1 mb-3 text-muted opacity-50"></i>
          <p>Your collection is empty.</p>
          <a href="/apps" class="btn btn-outline-primary btn-sm mt-2">Explore Apps</a>
          <a href="/talks" class="btn btn-outline-primary btn-sm mt-2 ms-2">Watch Talks</a>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Clear Data Modal -->
<div class="mt-5 text-center text-md-end fade-in">
  <button class="btn btn-link text-danger text-decoration-none opacity-50 hover-opacity-100 btn-sm" data-bs-toggle="modal" data-bs-target="#clearDataModal">
    <i class="bi bi-trash3 me-1"></i> Reset Local Data
  </button>
</div>

<div class="modal fade" id="clearDataModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-dark border border-secondary border-opacity-50">
      <div class="modal-header border-secondary border-opacity-25">
        <h5 class="modal-title text-white">Reset Local Data?</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body text-muted">
        This will clear your tracked time and remove all saved items from your browser. This action cannot be undone.
      </div>
      <div class="modal-footer border-secondary border-opacity-25 d-flex justify-content-between">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-danger" id="btn-confirm-clear" data-bs-dismiss="modal">Yes, Reset Data</button>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const timeDisplay = document.getElementById('life-time-display');
  const firstVisitDisplay = document.getElementById('first-visit-display');
  const countDisplay = document.getElementById('saved-count-display');
  const grid = document.getElementById('saved-items-grid');
  const emptyState = document.getElementById('empty-state');
  
  function renderSavedItems(items) {
    if (!items || items.length === 0) {
      emptyState.style.display = 'block';
      Array.from(grid.children).forEach(el => {
        if (el.id !== 'empty-state') el.remove();
      });
      return;
    }
    
    emptyState.style.display = 'none';
    
    // Clear existing item cards
    Array.from(grid.children).forEach(el => {
      if (el.id !== 'empty-state') el.remove();
    });
    
    // Sort by newest first
    const sorted = [...items].sort((a,b) => b.savedAt - a.savedAt);
    
    sorted.forEach(item => {
      const col = document.createElement('div');
      col.className = 'col animate__animated animate__fadeIn';
      
      const categoryBadge = item.category === 'presentation' 
        ? '<span class="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 mt-2 d-inline-block">Presentation</span>'
        : `<span class="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 mt-2 d-inline-block">${item.category}</span>`;
      
      col.innerHTML = `
        <div class="card h-100 glass-card position-relative overflow-hidden group">
          <div class="card-body p-4 d-flex flex-column">
             <div class="d-flex justify-content-between align-items-start mb-3">
               <div class="icon-square bg-dark bg-opacity-50 text-white rounded p-2 border border-secondary border-opacity-25">
                 <i class="bi ${item.iconClass || 'bi-bookmark'} fs-4"></i>
               </div>
               <button class="btn btn-link text-muted p-0 opacity-50 hover-opacity-100 btn-remove-item" data-id="${item.id}" title="Remove">
                 <i class="bi bi-x-circle fs-5"></i>
               </button>
             </div>
             <h5 class="card-title text-white mb-1"><a href="${item.url}" class="text-white text-decoration-none stretched-link">${item.title}</a></h5>
             <div>${categoryBadge}</div>
             <div class="mt-auto pt-3 text-muted small"><i class="bi bi-clock-history me-1"></i> Saved ${new Date(item.savedAt).toLocaleDateString()}</div>
          </div>
        </div>
      `;
      grid.appendChild(col);
    });
    
    // Bind remove buttons
    document.querySelectorAll('.btn-remove-item').forEach(btn => {
      // Must prevent default to not follow stretched-link
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if(window.userProfile) {
          window.userProfile.removeItem(btn.getAttribute('data-id'));
        }
      });
    });
  }
  
  if (window.userProfile) {
    // Initial render
    firstVisitDisplay.innerText = new Date(window.userProfile.data.firstVisit).toLocaleDateString();
    
    // Subscribe to real-time updates
    window.userProfile.subscribe((data) => {
      timeDisplay.innerText = window.userProfile.formatTime(data.totalTimeSeconds);
      countDisplay.innerText = data.savedItems.length;
      renderSavedItems(data.savedItems);
    });
  }
  
  document.getElementById('btn-confirm-clear').addEventListener('click', () => {
    localStorage.removeItem('ideiame_profile');
    window.location.reload();
  });
});
</script>
