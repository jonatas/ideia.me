document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("glossary-mount");
  const searchInput = document.getElementById("symbol-search");
  
  let allSymbols = [];
  try {
    const res = await fetch("/js/bliss_symbols.json");
    if(!res.ok) throw new Error("Failed to load JSON");
    allSymbols = await res.json();
  } catch(e) {
    mount.innerHTML = `<div class="alert alert-danger p-4 text-center">Failed to dynamically load the symbol glossary network.</div>`;
    return;
  }

  // Keyboard shortcut listener for Cmd-F / Ctrl-F
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Escape HTML utility for absolute safety against broken tags
  const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  };

  const renderGrid = (symbols) => {
    if (symbols.length === 0) {
      mount.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="bi bi-search" style="font-size: 3rem; opacity: 0.5;"></i>
          <p class="mt-3 fs-5">No symbols found matching your search.</p>
        </div>`;
      return;
    }

    // Group by category
    const grouped = {};
    symbols.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });

    let html = "";
    Object.keys(grouped).forEach(cat => {
      const items = grouped[cat];
      html += `<h2 class='category-header'>${escapeHTML(cat)} <span class='badge bg-secondary fs-6 align-middle float-end'>${items.length} symbols</span></h2>`;
      html += `<div class='glossary-grid'>`;
      items.forEach(item => {
        const safeImage = escapeHTML(item.image);
        const safeId = escapeHTML(item.id);
        const safeName = escapeHTML(item.name);
        html += `
          <div class='symbol-card'>
            <img class='symbol-img' src="${safeImage}" alt="${safeId}" loading="lazy">
            <div class='symbol-name'>${safeName}</div>
          </div>
        `;
      });
      html += `</div>`;
    });

    mount.innerHTML = html;
  };

  // Initial render
  renderGrid(allSymbols);

  // Live Search listener implementing simple fuzzy match
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
      renderGrid(allSymbols);
      return;
    }
    
    const terms = query.split(' ').filter(t => t.length > 0);
    
    const filtered = allSymbols.filter(s => {
      const target = (s.name + " " + s.category + " " + s.id).toLowerCase();
      // Must match ALL terms
      return terms.every(term => target.includes(term));
    });
    
    renderGrid(filtered);
  });
});
