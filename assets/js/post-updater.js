/**
 * Post Updater for Blog Posts
 * 
 * This script helps update existing blog posts with improved SEO and standardized categories
 */

// Import required modules if running in Node.js
if (typeof require !== 'undefined') {
  const fs = require('fs');
  const path = require('path');
  const categoryStandardizer = require('./category-standardizer');
  const linkValidator = require('./link-validator');
}

// Function to update a single post file
function updatePostFile(filePath) {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Get category suggestions
  const { suggestions } = categoryStandardizer.suggestImprovements(content);
  
  // Get link fixes
  const { fixes } = linkValidator.validatePostLinks(content);
  
  // Apply improvements
  let updatedContent = content;
  
  // Apply category improvements
  if (suggestions.categories && suggestions.categories.length > 0) {
    const categoriesToAdd = suggestions.categories
      .filter(s => s.confidence === 'high')
      .map(s => s.category);
    
    if (categoriesToAdd.length > 0) {
      updatedContent = categoryStandardizer.applyImprovements(updatedContent, {
        categories: categoriesToAdd
      });
    }
  }
  
  // Apply description improvement if missing
  if (suggestions.description && !suggestions.description.current) {
    updatedContent = categoryStandardizer.applyImprovements(updatedContent, {
      description: suggestions.description.suggestion
    });
  }
  
  // Apply link fixes
  if (fixes && fixes.length > 0) {
    const { fullFixed } = linkValidator.validatePostLinks(updatedContent);
    updatedContent = fullFixed;
  }
  
  // Write updated content back to file
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  
  return {
    filePath,
    categorySuggestions: suggestions.categories,
    descriptionSuggestion: suggestions.description,
    linkFixes: fixes,
    updated: updatedContent !== content
  };
}

// Function to update all posts in a directory
function updateAllPosts(postsDir) {
  // Get all markdown files in the directory
  const files = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md') || file.endsWith('.markdown'))
    .map(file => path.join(postsDir, file));
  
  const results = [];
  
  // Update each file
  files.forEach(file => {
    try {
      const result = updatePostFile(file);
      results.push(result);
      console.log(`Updated ${file}: ${result.updated ? 'Changes made' : 'No changes needed'}`);
    } catch (error) {
      console.error(`Error updating ${file}:`, error);
      results.push({
        filePath: file,
        error: error.message,
        updated: false
      });
    }
  });
  
  // Generate summary
  const updatedCount = results.filter(r => r.updated).length;
  const errorCount = results.filter(r => r.error).length;
  
  console.log(`\nUpdate Summary:`);
  console.log(`Total files: ${files.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`No changes needed: ${files.length - updatedCount - errorCount}`);
  
  return results;
}

// Function to generate a report of suggested improvements for all posts
function generateImprovementReport(postsDir) {
  // Get all markdown files in the directory
  const files = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.md') || file.endsWith('.markdown'))
    .map(file => path.join(postsDir, file));
  
  const report = {
    totalPosts: files.length,
    postsWithSuggestions: 0,
    categorySuggestions: 0,
    descriptionSuggestions: 0,
    linkIssues: 0,
    postDetails: []
  };
  
  // Analyze each file
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Get category and description suggestions
      const { suggestions } = categoryStandardizer.suggestImprovements(content);
      
      // Get link issues
      const { analysis } = linkValidator.validatePostLinks(content);
      
      const hasSuggestions = 
        (suggestions.categories && suggestions.categories.length > 0) ||
        suggestions.description ||
        (analysis && analysis.issues && analysis.issues.length > 0);
      
      if (hasSuggestions) {
        report.postsWithSuggestions++;
        
        if (suggestions.categories && suggestions.categories.length > 0) {
          report.categorySuggestions += suggestions.categories.length;
        }
        
        if (suggestions.description) {
          report.descriptionSuggestions++;
        }
        
        if (analysis && analysis.issues && analysis.issues.length > 0) {
          report.linkIssues += analysis.issues.length;
        }
        
        report.postDetails.push({
          file: path.basename(file),
          categorySuggestions: suggestions.categories || [],
          descriptionSuggestion: suggestions.description,
          linkIssues: analysis && analysis.issues ? analysis.issues.length : 0
        });
      }
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error);
    }
  });
  
  return report;
}

// Function to generate HTML report
function generateHtmlReport(report) {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Post Improvement Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .summary-item {
      background-color: #fff;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .summary-number {
      font-size: 2.5rem;
      font-weight: bold;
      color: #3498db;
      margin: 10px 0;
    }
    .post-card {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .post-title {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .suggestion-list {
      list-style-type: none;
      padding: 0;
    }
    .suggestion-item {
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .high {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
    }
    .medium {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
    }
    .low {
      background-color: #f8f9fa;
      border-left: 4px solid #6c757d;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 5px;
    }
    .badge-primary {
      background-color: #3498db;
      color: white;
    }
    .badge-warning {
      background-color: #f39c12;
      color: white;
    }
    .badge-info {
      background-color: #2ecc71;
      color: white;
    }
  </style>
</head>
<body>
  <h1>Blog Post Improvement Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div>Total Posts</div>
        <div class="summary-number">${report.totalPosts}</div>
      </div>
      <div class="summary-item">
        <div>Posts Needing Improvements</div>
        <div class="summary-number">${report.postsWithSuggestions}</div>
      </div>
      <div class="summary-item">
        <div>Category Suggestions</div>
        <div class="summary-number">${report.categorySuggestions}</div>
      </div>
      <div class="summary-item">
        <div>Description Suggestions</div>
        <div class="summary-number">${report.descriptionSuggestions}</div>
      </div>
      <div class="summary-item">
        <div>Link Issues</div>
        <div class="summary-number">${report.linkIssues}</div>
      </div>
    </div>
  </div>
  
  <h2>Posts Needing Improvements</h2>
  
  ${report.postDetails.map(post => `
    <div class="post-card">
      <h3 class="post-title">${post.file}</h3>
      
      ${post.categorySuggestions.length > 0 ? `
        <h4>Category Suggestions</h4>
        <ul class="suggestion-list">
          ${post.categorySuggestions.map(suggestion => `
            <li class="suggestion-item ${suggestion.confidence}">
              <strong>Add category:</strong> ${suggestion.category}
              <br>
              <small>${suggestion.reason}</small>
              ${suggestion.replaces ? `<br><small><strong>Replaces:</strong> ${suggestion.replaces}</small>` : ''}
            </li>
          `).join('')}
        </ul>
      ` : ''}
      
      ${post.descriptionSuggestion ? `
        <h4>Description Suggestion</h4>
        <div class="suggestion-item medium">
          ${post.descriptionSuggestion.current ? 
            `<strong>Current:</strong> ${post.descriptionSuggestion.current}<br><strong>Suggested:</strong> ${post.descriptionSuggestion.suggestion}` : 
            `<strong>Add description:</strong> ${post.descriptionSuggestion.suggestion}`}
          <br>
          <small>${post.descriptionSuggestion.reason}</small>
        </div>
      ` : ''}
      
      ${post.linkIssues > 0 ? `
        <h4>Link Issues</h4>
        <div class="suggestion-item medium">
          <span class="badge badge-warning">${post.linkIssues}</span> link issues found
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
  `;
  
  return html;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updatePostFile,
    updateAllPosts,
    generateImprovementReport,
    generateHtmlReport
  };
} 