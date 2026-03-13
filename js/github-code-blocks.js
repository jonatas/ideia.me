// GitHub-style code blocks enhancement
document.addEventListener('DOMContentLoaded', function() {
  // Add data-lang attribute to code blocks based on their language class
  const codeBlocks = document.querySelectorAll('pre.highlight');
  
  codeBlocks.forEach(function(block) {
    // Find language class from the code element
    const codeElement = block.querySelector('code');
    if (!codeElement) return;
    
    // Extract language from class name (optional, for data-lang attribute)
    const langClass = Array.from(codeElement.classList)
      .find(cls => cls.startsWith('language-'));
    if (langClass) {
      block.setAttribute('data-language', langClass.replace('language-', ''));
    }

    // Add copy button to all code blocks
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '<i class="bi bi-clipboard"></i>';
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');
    copyButton.setAttribute('title', 'Copy code');
    copyButton.addEventListener('click', function() {
      const lang = block.getAttribute('data-language');
      let text = codeElement.textContent;
      if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
        text = text.split('\n').map(line => line.replace(/^\$ /, '')).join('\n');
      }
      copyToClipboard(text, copyButton);
    });
    // Append to parent div.highlight so position:absolute works outside overflow:auto
    const container = block.parentElement.classList.contains('highlight') ? block.parentElement : block;
    container.style.position = 'relative';
    copyButton.style.setProperty('position', 'absolute', 'important');
    copyButton.style.setProperty('top', '8px', 'important');
    copyButton.style.setProperty('right', '8px', 'important');
    copyButton.style.setProperty('z-index', '10', 'important');
    container.appendChild(copyButton);
    
    // Remove any existing line number elements
    const lineNumbers = block.querySelectorAll('.lineno, .line-numbers-rows');
    lineNumbers.forEach(el => el.remove());
  });
  
  // Function to copy text to clipboard
  function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(function() {
      // Success - show copied state
      button.innerHTML = '<i class="bi bi-clipboard-check"></i>';
      button.setAttribute('title', 'Copied!');
      button.classList.add('copied');

      // Reset after 2 seconds
      setTimeout(function() {
        button.innerHTML = '<i class="bi bi-clipboard"></i>';
        button.setAttribute('title', 'Copy code');
        button.classList.remove('copied');
      }, 2000);
    }).catch(function(err) {
      console.error('Could not copy text: ', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = 0;
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        button.innerHTML = '<i class="bi bi-clipboard-check"></i>';
        button.setAttribute('title', 'Copied!');
        button.classList.add('copied');

        // Reset after 2 seconds
        setTimeout(function() {
          button.innerHTML = '<i class="bi bi-clipboard"></i>';
          button.setAttribute('title', 'Copy code');
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
        button.innerHTML = '<i class="bi bi-x-circle"></i>';
        button.setAttribute('title', 'Copy failed');
      }
      
      document.body.removeChild(textArea);
    });
  }
  
  // Force remove any persistent line numbers
  function removeLineNumbers() {
    document.querySelectorAll('.lineno, .line-numbers-rows, .gutter').forEach(el => {
      el.style.display = 'none';
      el.classList.add('hidden');
    });
    
    // Also adjust pre elements that might have line-number classes
    document.querySelectorAll('pre').forEach(pre => {
      pre.classList.remove('line-numbers', 'lineno');
    });
  }
  
  // Run immediately and after a short delay in case of dynamic content
  removeLineNumbers();
  setTimeout(removeLineNumbers, 100);
  setTimeout(removeLineNumbers, 500);
}); 