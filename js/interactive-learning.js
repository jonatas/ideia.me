/**
 * Interactive Learning Engine
 * 
 * Defines Web Components for Interactive Learning and 
 * parses standard Markdown elements into these components.
 */

// 1. Define `<semantic-quiz>` Web Component
class SemanticQuiz extends HTMLElement {
  constructor() {
    super();
    this.answered = false;
  }

  connectedCallback() {
    // Only render once if parsed
    if (this.querySelector('.quiz-wrapper')) return;

    // Read attributes parsed from Markdown
    const questionText = this.getAttribute('question-text') || 'Question';
    
    let options = [];
    try {
      options = JSON.parse(this.getAttribute('options-data') || '[]');
    } catch (e) {
      console.error("Failed to parse quiz options data", e);
    }

    const secretImageId = this.getAttribute('secret-image-id');

    // Build internal DOM (not fully shadow DOM to inherit global styles easily)
    const wrapper = document.createElement('div');
    wrapper.className = 'quiz-wrapper';
    
    const questionHeader = document.createElement('h4');
    questionHeader.className = 'quiz-question';
    questionHeader.textContent = questionText;
    wrapper.appendChild(questionHeader);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quiz-options';

    options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.dataset.index = index;
      
      const textSpan = document.createElement('span');
      textSpan.className = 'quiz-option-text';
      textSpan.textContent = opt.text;
      btn.appendChild(textSpan);

      if (opt.hint) {
        const hintSpan = document.createElement('span');
        hintSpan.className = 'quiz-hint';
        hintSpan.textContent = opt.hint;
        btn.appendChild(hintSpan);
      }

      btn.addEventListener('click', () => this.handleOptionClick(btn, opt, optionsContainer, secretImageId));
      optionsContainer.appendChild(btn);
    });

    wrapper.appendChild(optionsContainer);
    this.appendChild(wrapper);
  }

  handleOptionClick(clickedBtn, optionData, container, secretImageId) {
    if (this.answered) return; // Prevent multiple answers
    this.answered = true;
    
    this.classList.add('answered');

    // Show hints for the clicked button (if any)
    const clickedHint = clickedBtn.querySelector('.quiz-hint');
    if (clickedHint) clickedHint.classList.add('visible');

    // Evaluate
    if (optionData.isCorrect) {
      clickedBtn.classList.add('reveal-correct');
    } else {
      clickedBtn.classList.add('selected-wrong');
      // Find and reveal the actual correct option
      const correctBtn = container.querySelector(`[data-index="${this.findCorrectIndex()}"]`);
      if (correctBtn) {
        correctBtn.classList.add('reveal-correct');
        const correctHint = correctBtn.querySelector('.quiz-hint');
        if (correctHint) correctHint.classList.add('visible');
      }
    }

    // Reveal attached secret image if exists
    if (secretImageId) {
      const secretImgContainer = document.getElementById(secretImageId);
      if (secretImgContainer) {
        secretImgContainer.classList.add('revealed');
        // trigger reflow
        void secretImgContainer.offsetWidth; 
        secretImgContainer.classList.add('animate-in');
      }
    }
  }

  findCorrectIndex() {
    try {
      const options = JSON.parse(this.getAttribute('options-data') || '[]');
      return options.findIndex(o => o.isCorrect);
    } catch(e) {
      return -1;
    }
  }
}

customElements.define('semantic-quiz', SemanticQuiz);

// 2. DOM Transformer: Parse standard markdown into `<semantic-quiz>` elements
function transformMarkdownToInteractiveElements() {
  // Find all h3, h4, h5 elements
  const headings = document.querySelectorAll('.content-container h3, .content-container h4, .content-container h5');
  
  headings.forEach(heading => {
    const text = heading.textContent.trim();
    // Check if it ends with a question mark
    if (!text.endsWith('?')) return;

    // Check if the immediately following element is an unordered list
    let nextNode = heading.nextElementSibling;
    // skip text nodes or empty paragraphs that markdown might generate
    while (nextNode && (nextNode.tagName === 'P' && nextNode.textContent.trim() === '')) {
      nextNode = nextNode.nextElementSibling;
    }

    if (!nextNode || nextNode.tagName !== 'UL') return;

    const listElement = nextNode;
    const listItems = listElement.querySelectorAll('li');
    
    if (listItems.length === 0) return;

    // We found a quiz signature! Let's parse it.
    const questionText = text;
    const optionsData = [];

    listItems.forEach(li => {
      let rawText = li.textContent.trim();
      let isCorrect = false;
      let hint = "";

      // Check for right choice flag
      if (rawText.includes('<-')) {
        isCorrect = true;
        rawText = rawText.replace('<-', '').trim();
      }

      // Check for hints inside parenthesis at the end
      const hintMatch = rawText.match(/\(([^)]+)\)$/);
      if (hintMatch) {
        hint = hintMatch[1];
        rawText = rawText.replace(hintMatch[0], '').trim();
      }

      optionsData.push({
        text: rawText,
        isCorrect: isCorrect,
        hint: hint
      });
    });

    // Check if an image immediately follows the list
    let possibleImageNode = listElement.nextElementSibling;
    let secretImageContainer = null;
    let secretImageId = null;

    if (possibleImageNode) {
      // Markdown usually wraps images in <p> labels
      const imgInP = possibleImageNode.tagName === 'P' && possibleImageNode.querySelector('img');
      const directImg = possibleImageNode.tagName === 'IMG';
      const figureImg = possibleImageNode.tagName === 'FIGURE' && possibleImageNode.querySelector('img');
      
      // Also check for mermaid diagrams (either wrapped in P or direct div)
      const isMermaid = possibleImageNode.classList && possibleImageNode.classList.contains('mermaid');
      const mermaidInP = possibleImageNode.tagName === 'P' && possibleImageNode.querySelector('.mermaid');

      if (imgInP || directImg || figureImg || isMermaid || mermaidInP) {
        // Wrap it in our secret container
        secretImageContainer = document.createElement('div');
        secretImageId = 'secret-media-' + Math.random().toString(36).substr(2, 9);
        secretImageContainer.id = secretImageId;
        secretImageContainer.className = 'learning-secret-media';
        
        // Clone the content into our container
        secretImageContainer.appendChild(possibleImageNode.cloneNode(true));
        
        // Replace the original image in DOM with our hidden container
        possibleImageNode.parentNode.replaceChild(secretImageContainer, possibleImageNode);
      }
    }

    // Now, let's create our Web Component and replace the H* and UL
    const semanticQuiz = document.createElement('semantic-quiz');
    semanticQuiz.setAttribute('question-text', questionText);
    semanticQuiz.setAttribute('options-data', JSON.stringify(optionsData));
    
    if (secretImageId) {
      semanticQuiz.setAttribute('secret-image-id', secretImageId);
    }

    // Insert new element before the heading
    heading.parentNode.insertBefore(semanticQuiz, heading);
    
    // Remove old elements
    heading.remove();
    listElement.remove();
  });
}

// Ensure the transformer runs after DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add a slight delay to ensure Jekyll plugins or other markdown parsers have finished
  setTimeout(() => {
    transformMarkdownToInteractiveElements();
  }, 100);
});
