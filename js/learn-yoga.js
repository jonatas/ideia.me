const LearnYoga = (() => {
  let currentChapter = 1;
  const totalChapters = 5;

  const init = () => {
    bindEvents();
    renderPosePreviews();
    renderBreathingTechniques();
    initVinyasaComponent();
    updateProgress();
    checkUrlParams();
  };

  let vinyasaInterval = null;
  let vinyasaIndex = 0;
  const vinyasaPoses = ['phalakasana', 'chaturanga-dandasana', 'urdhva-mukha-svanasana', 'adho-mukha-svanasana'];

  const initVinyasaComponent = () => {
    const viewer = document.getElementById('vinyasa-viewer');
    if (!viewer) return;

    renderVinyasaPose(vinyasaPoses[0]);

    const playBtn = document.getElementById('vinyasa-play-pause');
    playBtn.addEventListener('click', toggleVinyasaFlow);

    document.querySelectorAll('.vinyasa-step').forEach((step, idx) => {
      step.addEventListener('click', () => {
        stopVinyasaFlow();
        vinyasaIndex = idx;
        updateVinyasaUI();
      });
    });
  };

  const renderVinyasaPose = (poseId) => {
    const viewer = document.getElementById('vinyasa-viewer');
    const pose = POSES.find(p => p.id === poseId);
    if (!pose) return;

    const varStyles = getVarStyles(pose.vars);
    viewer.innerHTML = `
      <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" style="${varStyles}">
        <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.1)" stroke-width="4" />
        <use href="#stickman" />
      </svg>
    `;
  };

  const updateVinyasaPose = (poseId) => {
    const viewer = document.getElementById('vinyasa-viewer');
    const svg = viewer.querySelector('svg');
    const pose = POSES.find(p => p.id === poseId);
    if (!pose || !svg) return;

    const v = pose.vars;
    Object.keys(v).forEach(k => {
      if (k.startsWith('--torso-cx') || k.startsWith('--torso-cy')) return;
      const val = (k.includes('rot')) ? `${v[k]}deg` : `${v[k]}px`;
      svg.style.setProperty(k, val);
    });

    // Update torso path
    let cx = v['--torso-cx'] !== undefined ? v['--torso-cx'] : 100;
    let cy = v['--torso-cy'] !== undefined ? v['--torso-cy'] : 150;
    svg.style.setProperty('--torso-path', `path('M 100 200 Q ${cx} ${cy} 100 100')`);
    
    const torsoPath = svg.querySelector('#torso-path');
    if (torsoPath) {
      torsoPath.setAttribute('d', `M 100 200 Q ${cx} ${cy} 100 100`);
    }
  };

  const toggleVinyasaFlow = () => {
    if (vinyInterval) {
      stopVinyasaFlow();
    } else {
      startVinyasaFlow();
    }
  };

  let vinyInterval = null;
  const startVinyasaFlow = () => {
    const btn = document.getElementById('vinyasa-play-pause');
    btn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause Flow';
    
    // Immediately move to next pose if we're at the end or just started
    vinyasaIndex = (vinyasaIndex + 1) % vinyasaPoses.length;
    updateVinyasaUI();

    vinyInterval = setInterval(() => {
      vinyasaIndex = (vinyasaIndex + 1) % vinyasaPoses.length;
      updateVinyasaUI();
    }, 3000);
  };

  const stopVinyasaFlow = () => {
    const btn = document.getElementById('vinyasa-play-pause');
    if (btn) btn.innerHTML = '<i class="bi bi-play-fill"></i> Play Flow';
    clearInterval(vinyInterval);
    vinyInterval = null;
  };

  const updateVinyasaUI = () => {
    const poseId = vinyasaPoses[vinyasaIndex];
    updateVinyasaPose(poseId);

    document.querySelectorAll('.vinyasa-step').forEach((step, idx) => {
      step.classList.toggle('active', idx === vinyasaIndex);
    });
  };

  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const poseId = params.get('pose');
    if (poseId) {
      loadPoseLesson(poseId);
    }
  };

  const loadPoseLesson = (poseId) => {
    if (typeof POSES === 'undefined') return;
    const pose = POSES.find(p => p.id === poseId);
    if (!pose) return;

    // Hide all chapters
    document.querySelectorAll('.chapter').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.chapter').forEach(c => c.style.display = 'none');
    
    // Show lesson section
    const lessonSec = document.getElementById('pose-lesson');
    lessonSec.style.display = 'block';
    lessonSec.classList.add('active');

    // Fill content
    const match = pose.name.match(/(.+?)\s*\((.+?)\)$/);
    document.getElementById('lesson-pose-name').textContent = match ? match[1] : pose.name;
    document.getElementById('lesson-pose-sanskrit').textContent = match ? match[2] : '';
    document.getElementById('lesson-pose-desc').textContent = pose.desc;
    
    const svgContainer = document.getElementById('lesson-svg-container');
    svgContainer.innerHTML = `
      <svg viewBox="-300 -100 800 600" preserveAspectRatio="xMidYMid meet" style="${getVarStyles(pose.vars)}">
        <line x1="-500" y1="368" x2="1000" y2="368" stroke="rgba(255,255,255,0.1)" stroke-width="4" />
        <use href="#stickman" />
      </svg>
    `;

    const detailsList = document.getElementById('lesson-details');
    detailsList.innerHTML = '';
    if (pose.details) {
      Object.keys(pose.details).forEach(part => {
        const item = document.createElement('div');
        item.style.marginBottom = '10px';
        item.innerHTML = `<strong>${part.charAt(0).toUpperCase() + part.slice(1)}:</strong> ${pose.details[part]}`;
        detailsList.appendChild(item);
      });
    }

    // Enrichment logic
    const enrichment = getEnrichment(pose);
    document.getElementById('lesson-enrichment-title').textContent = enrichment.title;
    document.getElementById('lesson-enrichment-content').textContent = enrichment.content;

    document.getElementById('lesson-back-to-app').onclick = () => {
      window.location.href = `/yoga.html?pose=${poseId}`;
    };
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getEnrichment = (pose) => {
    // Default enrichment
    let title = "Finding Balance";
    let content = "Every pose is an opportunity to listen to your body. Don't push beyond your limits; instead, find the edge where challenge meets comfort.";

    const poseId = pose.id;
    if (poseId === 'tadasana' || poseId === 'mountain') {
      title = "Rooting Like a Mountain";
      content = "Close your eyes and imagine roots growing from your feet into the earth. Feel the stability and stillness of a mountain. This simple standing pose can become a powerful meditation on presence.";
    } else if (poseId.includes('virabhadrasana') || poseId.includes('warrior')) {
      title = "The Peaceful Warrior";
      content = "While the body is strong and active, keep your gaze (Drishti) soft and your breath steady. The 'joy' in this pose comes from finding ease within the effort—a skill that translates perfectly into daily life.";
    } else if (poseId === 'vrikshasana' || poseId === 'tree') {
      title = "Swaying with the Wind";
      content = "Balance isn't about being perfectly still; it's about constant adjustment. If you wobble, imagine you're a tree branch swaying in a gentle breeze. Smile as you find your center again.";
    } else if (poseId === 'adho-mukha-svanasana' || poseId === 'downward-dog') {
      title = "A New Perspective";
      content = "Inversions like Downward Dog literally turn your world upside down. Use this moment to shake your head 'yes' and 'no' to release neck tension, and imagine any stress pouring out of the top of your head.";
    } else if (poseId === 'balasana' || poseId === 'childs-pose') {
      title = "Sacred Sanctuary";
      content = "This is your ultimate rest pose. Feel the support of the earth beneath you. It's a joyful return to a state of safety and surrender. Use it anytime your practice feels too intense.";
    } else if (poseId === 'savasana' || poseId === 'corpse') {
      title = "The Art of Letting Go";
      content = "Savasana is often called the most difficult pose because it requires total stillness and mental surrender. Enjoy the profound peace that comes when you stop 'doing' and simply 'be'.";
    }
    
    return { title, content };
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

    // Ensure lesson section is hidden if we are going to a chapter
    document.getElementById('pose-lesson').style.display = 'none';
    document.querySelectorAll('.chapter').forEach(c => {
        if (c.id !== 'pose-lesson') c.style.display = 'block';
    });

    // Update active chapter in nav
    document.querySelectorAll('.chapter-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.chapter) === chapter);
    });

    // Update visibility of chapters
    document.querySelectorAll('.chapter').forEach(section => {
      if (section.id !== 'pose-lesson') {
          section.classList.toggle('active', parseInt(section.id.split('-')[1]) === chapter);
      }
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
      if (k.startsWith('--torso-cx') || k.startsWith('--torso-cy')) return;
      const val = (k.includes('rot')) ? `${v[k]}deg` : `${v[k]}px`;
      s += `${k}: ${val}; `;
    });
    
    // Add torso path
    let cx = v['--torso-cx'] !== undefined ? v['--torso-cx'] : 100;
    let cy = v['--torso-cy'] !== undefined ? v['--torso-cy'] : 150;
    s += `--torso-path: path('M 100 200 Q ${cx} ${cy} 100 100'); `;
    
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
