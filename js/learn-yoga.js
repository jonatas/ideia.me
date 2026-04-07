const LearnYoga = (() => {
  let currentChapter = 1;
  const totalChapters = 5;

  const init = () => {
    bindEvents();
    renderPosePreviews();
    renderBreathingTechniques();
    updateProgress();
  };

  const bindEvents = () => {
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.addEventListener('click', () => {
        const chapter = parseInt(item.dataset.chapter);
        goToChapter(chapter);
      });
    });
  };

  const goToChapter = (chapter) => {
    if (chapter < 1 || chapter > totalChapters) return;

    // Update active chapter in nav
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.chapter) === chapter);
    });

    // Update visibility of chapters
    document.querySelectorAll('.chapter').forEach(section => {
      section.classList.toggle('active', parseInt(section.id.split('-')[1]) === chapter);
    });

    currentChapter = chapter;
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateProgress = () => {
    const progress = (currentChapter / totalChapters) * 100;
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) progressBar.style.width = `${progress}%`;
  };

  const renderPosePreviews = () => {
    const container = document.getElementById('core-poses-grid');
    if (!container || typeof POSES === 'undefined') return;

    // Pick 4-6 fundamental poses for the introduction
    const fundamentalIds = ['tadasana', 'adho-mukha-svanasana', 'virabhadrasana-i', 'balasana', 'savasana'];
    const selectedPoses = POSES.filter(p => fundamentalIds.includes(p.id));

    selectedPoses.forEach(pose => {
      const card = document.createElement('div');
      card.className = 'pose-preview-card';
      
      // Simple SVG rendering logic similar to yoga.js
      const varStyles = getVarStyles(pose.vars);
      
      card.innerHTML = `
        <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" class="pose-mini-svg" style="${varStyles}">
          <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.1)" stroke-width="4" />
          <use href="#stickman" />
        </svg>
        <h4>${pose.name.split(' (')[0]}</h4>
        <p class="text-muted" style="font-size: 0.8rem;">${pose.name.match(/\((.+?)\)/)?.[1] || ''}</p>
      `;
      
      card.onclick = () => {
        window.location.href = `/yoga.html?pose=${pose.id}`;
      };
      
      container.appendChild(card);
    });
  };

  const renderBreathingTechniques = () => {
    const container = document.getElementById('breathing-techniques-grid');
    if (!container || typeof PREDEFINED_CONFIGS === 'undefined') return;

    PREDEFINED_CONFIGS.slice(0, 4).forEach((cfg, idx) => {
      const widgetContainerId = `breathe-widget-${idx}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'content-card';
      wrapper.style.borderColor = cfg.idle;
      
      wrapper.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="display: flex; align-items: flex-start; gap: 15px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${cfg.idle}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="bi bi-wind"></i>
            </div>
            <div>
              <h3 style="margin: 0; color: ${cfg.idle};">${cfg.name}</h3>
              <p style="margin: 4px 0 0 0; font-size: 0.9rem;"><strong>Traditional:</strong> ${cfg.ancientName || 'N/A'}</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: center;">
            <div id="${widgetContainerId}"></div>
            <div>
              <p style="font-size: 0.95rem; line-height: 1.5;">${cfg.description}</p>
              <button class="btn-secondary btn-small" onclick="window.location.href='/breathe.html?ex=${cfg.id}'">Open Full App</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(wrapper);
      
      // Initialize the widget
      new BreatheWidget(widgetContainerId, cfg.id);
    });
  };

  const getVarStyles = (v) => {
    let s = '';
    Object.keys(v).forEach(k => {
      const val = (k.includes('rot')) ? `${v[k]}deg` : `${v[k]}px`;
      s += `${k}: ${val}; `;
    });
    return s;
  };

  const flipCard = (card) => {
    card.classList.toggle('flipped');
  };

  return {
    init,
    goToChapter,
    flipCard
  };
})();

// Global functions for convenience
window.flipCard = LearnYoga.flipCard;
window.goToChapter = LearnYoga.goToChapter;
