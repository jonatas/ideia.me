document.addEventListener("DOMContentLoaded", () => {
  const listItems = document.querySelectorAll("li");
  
  listItems.forEach(li => {
    // Jekyll parses markdown sometimes with HTML entities
    let textContent = li.innerHTML.trim();
    if (textContent.startsWith("-&gt;") || textContent.startsWith("->")) {
      li.classList.add('quiz-option-item');
      if(!li.parentElement.classList.contains('quiz-ul')) {
        li.parentElement.classList.add('quiz-ul');
      }
    }
  });

  const uls = document.querySelectorAll('ul.quiz-ul');
  
  uls.forEach(ul => {
    const quizContainer = document.createElement('div');
    quizContainer.className = 'quiz-container my-4 p-4 rounded-4 shadow-sm';
    quizContainer.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0))';
    quizContainer.style.backdropFilter = 'blur(10px)';
    quizContainer.style.border = '1px solid rgba(255,255,255,0.1)';
    quizContainer.style.borderLeft = '4px solid var(--bs-primary)';

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'd-grid gap-3 mt-3';

    const items = Array.from(ul.querySelectorAll('li'));
    items.forEach(li => {
      let isCorrect = false;
      let html = li.innerHTML.trim();
      
      html = html.replace(/^-\&gt;\s*/, '').replace(/^->\s*/, '');
      
      if (html.endsWith("&lt;-") || html.endsWith("<-")) {
        isCorrect = true;
        html = html.replace(/\s*\&lt;-$/, '').replace(/\s*<-$/, '');
      }

      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-primary text-start fs-5 quiz-btn position-relative overflow-hidden d-flex align-items-center justify-content-between p-3 rounded-3';
      btn.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
      btn.innerHTML = `<span>${html}</span><span class="quiz-icon-container"></span>`;

      btn.addEventListener('click', function() {
        Array.from(optionsGrid.children).forEach(b => {
          b.disabled = true;
          b.style.opacity = '0.6';
          b.style.transform = 'scale(0.98)';
        });
        
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1.02)';
        
        const iconContainer = btn.querySelector('.quiz-icon-container');

        if (isCorrect) {
          btn.classList.remove('btn-outline-primary');
          btn.classList.add('btn-success');
          btn.style.borderColor = 'var(--bs-success)';
          btn.style.boxShadow = '0 0 20px rgba(25, 135, 84, 0.4)';
          iconContainer.innerHTML = '<i class="bi bi-check-circle-fill fs-4 bounce-in"></i>';
        } else {
          btn.classList.remove('btn-outline-primary');
          btn.classList.add('btn-danger');
          btn.style.animation = 'shake 0.5s';
          btn.style.borderColor = 'var(--bs-danger)';
          iconContainer.innerHTML = '<i class="bi bi-x-circle-fill fs-4"></i>';
          
          const correctBtn = Array.from(optionsGrid.children).find(b => b.dataset.correct === 'true');
          if (correctBtn) {
            correctBtn.classList.remove('btn-outline-primary');
            correctBtn.classList.add('btn-success');
            correctBtn.style.opacity = '1';
            correctBtn.style.transform = 'scale(1.02)';
            correctBtn.querySelector('.quiz-icon-container').innerHTML = '<i class="bi bi-check-circle-fill fs-4 bounce-in"></i>';
          }
        }
      });

      if (isCorrect) {
        btn.dataset.correct = 'true';
      }

      optionsGrid.appendChild(btn);
    });

    quizContainer.appendChild(optionsGrid);
    ul.parentNode.replaceChild(quizContainer, ul);
  });
});
