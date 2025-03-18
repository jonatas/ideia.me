// GitHub-style code blocks enhancement
document.addEventListener('DOMContentLoaded', function() {
  // Add data-lang attribute to code blocks based on their language class
  const codeBlocks = document.querySelectorAll('.highlight');
  
  codeBlocks.forEach(function(block) {
    // Find language class from the code element
    const codeElement = block.querySelector('code');
    if (!codeElement) return;
    
    // Extract language from class name
    const langClass = Array.from(codeElement.classList)
      .find(cls => cls.startsWith('language-'));
    
    if (langClass) {
      const language = langClass.replace('language-', '');
      block.setAttribute('data-lang', language);
      
      // Add copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.textContent = 'Copy';
      copyButton.setAttribute('aria-label', 'Copy code to clipboard');
      copyButton.addEventListener('click', function() {
        const code = codeElement.textContent;
        copyToClipboard(code, copyButton);
      });
      
      block.appendChild(copyButton);
    }
    
    // Remove any existing line number elements
    const lineNumbers = block.querySelectorAll('.lineno, .line-numbers-rows');
    lineNumbers.forEach(el => el.remove());
  });
  
  // Function to copy text to clipboard
  function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(function() {
      // Success - show copied state
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copied');
      
      // Reset after 2 seconds
      setTimeout(function() {
        button.textContent = originalText;
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
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        // Reset after 2 seconds
        setTimeout(function() {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
        button.textContent = 'Failed to copy';
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