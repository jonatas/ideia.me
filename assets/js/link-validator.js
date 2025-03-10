/**
 * Link Validator for Blog Posts
 * 
 * This script helps validate and fix links in blog posts on ideia.me
 */

// Common patterns for links that might need fixing
const linkPatterns = {
  // GitHub repositories
  github: {
    pattern: /https?:\/\/github\.com\/([^\/]+)\/([^\/\s]+)(?:\/)?(\s|$)/g,
    fix: (match, user, repo) => `https://github.com/${user}/${repo}/`,
    validate: (url) => {
      const match = url.match(/https?:\/\/github\.com\/([^\/]+)\/([^\/\s]+)/);
      return match && match.length >= 3;
    }
  },
  
  // Twitter/X profiles
  twitter: {
    pattern: /https?:\/\/(?:www\.)?(twitter|x)\.com\/([^\/\s]+)(?:\/)?(\s|$)/g,
    fix: (match, platform, username) => `https://twitter.com/${username}/`,
    validate: (url) => {
      const match = url.match(/https?:\/\/(?:www\.)?(twitter|x)\.com\/([^\/\s]+)/);
      return match && match.length >= 3;
    }
  },
  
  // LinkedIn profiles
  linkedin: {
    pattern: /https?:\/\/(?:www\.)?linkedin\.com\/in\/([^\/\s]+)(?:\/)?(\s|$)/g,
    fix: (match, username) => `https://linkedin.com/in/${username}/`,
    validate: (url) => {
      const match = url.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([^\/\s]+)/);
      return match && match.length >= 2;
    }
  },
  
  // YouTube videos
  youtube: {
    pattern: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)(?:&[^&\s]+)*(\s|$)/g,
    fix: (match, videoId) => `https://www.youtube.com/watch?v=${videoId}`,
    validate: (url) => {
      const match = url.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/);
      return match && match.length >= 2;
    }
  },
  
  // Relative links within the site
  relative: {
    pattern: /\]\((?!https?:\/\/)(?!#)([^)]+)\)/g,
    fix: (match, path) => {
      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      return `](${path})`;
    },
    validate: (url) => {
      // Relative URLs should start with /
      return url.startsWith('/');
    }
  }
};

// Function to extract links from markdown content
function extractLinks(content) {
  const links = [];
  
  // Match markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    links.push({
      type: 'markdown',
      text: match[1],
      url: match[2],
      fullMatch: match[0],
      index: match.index
    });
  }
  
  // Match HTML links <a href="url">text</a>
  const htmlLinkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"(?:\s+[^>]*?)?>([^<]*)<\/a>/g;
  
  while ((match = htmlLinkRegex.exec(content)) !== null) {
    links.push({
      type: 'html',
      text: match[2],
      url: match[1],
      fullMatch: match[0],
      index: match.index
    });
  }
  
  // Match bare URLs
  const bareUrlRegex = /(?<![(\[])https?:\/\/[^\s)]+/g;
  
  while ((match = bareUrlRegex.exec(content)) !== null) {
    // Check if this URL is already part of a markdown or HTML link
    const isPartOfLink = links.some(link => {
      return link.index <= match.index && 
             link.index + link.fullMatch.length >= match.index + match[0].length;
    });
    
    if (!isPartOfLink) {
      links.push({
        type: 'bare',
        text: '',
        url: match[0],
        fullMatch: match[0],
        index: match.index
      });
    }
  }
  
  return links;
}

// Function to validate a link
function validateLink(link) {
  const issues = [];
  
  // Check for common issues
  
  // Empty URL
  if (!link.url || link.url.trim() === '') {
    issues.push({
      severity: 'error',
      message: 'Empty URL',
      fix: null
    });
    return issues;
  }
  
  // Malformed URL
  try {
    // For absolute URLs, try to parse them
    if (link.url.startsWith('http')) {
      new URL(link.url);
    }
  } catch (e) {
    issues.push({
      severity: 'error',
      message: 'Malformed URL',
      fix: null
    });
    return issues;
  }
  
  // Check for trailing spaces
  if (link.url.endsWith(' ')) {
    issues.push({
      severity: 'warning',
      message: 'URL has trailing space',
      fix: {
        url: link.url.trim(),
        reason: 'Remove trailing space'
      }
    });
  }
  
  // Check for missing protocol
  if (link.url.match(/^www\./)) {
    issues.push({
      severity: 'warning',
      message: 'URL missing protocol (http/https)',
      fix: {
        url: 'https://' + link.url,
        reason: 'Add https:// protocol'
      }
    });
  }
  
  // Check for common patterns that might need fixing
  Object.entries(linkPatterns).forEach(([type, pattern]) => {
    if (pattern.pattern.test(link.url)) {
      // Reset lastIndex to ensure we start from the beginning
      pattern.pattern.lastIndex = 0;
      
      // Check if the URL is valid according to the pattern
      if (!pattern.validate(link.url)) {
        const match = pattern.pattern.exec(link.url);
        pattern.pattern.lastIndex = 0; // Reset again
        
        if (match) {
          const fixedUrl = pattern.fix(...match);
          
          issues.push({
            severity: 'warning',
            message: `${type} URL format could be improved`,
            fix: {
              url: fixedUrl,
              reason: `Standardize ${type} URL format`
            }
          });
        }
      }
    }
  });
  
  // Check for bare URLs that should be markdown links
  if (link.type === 'bare') {
    issues.push({
      severity: 'info',
      message: 'Bare URL could be converted to markdown link',
      fix: {
        markdown: `[${link.url}](${link.url})`,
        reason: 'Convert to markdown link for better readability'
      }
    });
  }
  
  return issues;
}

// Function to fix links in content
function fixLinks(content, fixes) {
  let fixedContent = content;
  
  // Sort fixes by index in reverse order to avoid offset issues
  fixes.sort((a, b) => b.link.index - a.link.index);
  
  fixes.forEach(fix => {
    const link = fix.link;
    let replacement;
    
    if (fix.fix.markdown) {
      // Replace with markdown link
      replacement = fix.fix.markdown;
    } else if (fix.fix.url) {
      // Replace just the URL part
      if (link.type === 'markdown') {
        replacement = `[${link.text}](${fix.fix.url})`;
      } else if (link.type === 'html') {
        replacement = `<a href="${fix.fix.url}">${link.text}</a>`;
      } else {
        replacement = fix.fix.url;
      }
    } else {
      // No valid fix
      return;
    }
    
    // Replace the link in the content
    fixedContent = fixedContent.substring(0, link.index) + 
                   replacement + 
                   fixedContent.substring(link.index + link.fullMatch.length);
  });
  
  return fixedContent;
}

// Function to analyze links in content
function analyzeLinks(content) {
  const links = extractLinks(content);
  const analysis = {
    totalLinks: links.length,
    issues: []
  };
  
  links.forEach(link => {
    const linkIssues = validateLink(link);
    
    if (linkIssues.length > 0) {
      analysis.issues.push({
        link,
        issues: linkIssues
      });
    }
  });
  
  return analysis;
}

// Function to get fixes for content
function getLinkFixes(content) {
  const analysis = analyzeLinks(content);
  const fixes = [];
  
  analysis.issues.forEach(issue => {
    // Find the highest severity issue with a fix
    const highestSeverityIssue = issue.issues
      .filter(i => i.fix)
      .sort((a, b) => {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })[0];
    
    if (highestSeverityIssue) {
      fixes.push({
        link: issue.link,
        issue: highestSeverityIssue,
        fix: highestSeverityIssue.fix
      });
    }
  });
  
  return fixes;
}

// Function to fix all links in content
function fixAllLinks(content) {
  const fixes = getLinkFixes(content);
  return fixLinks(content, fixes);
}

// Function to validate links in a post and suggest improvements
function validatePostLinks(postContent) {
  // Extract front matter and content
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = postContent.match(frontMatterRegex);
  
  if (!match) {
    return {
      error: 'No front matter found in post'
    };
  }
  
  const frontMatter = match[0];
  const content = postContent.slice(frontMatter.length);
  
  // Analyze links
  const analysis = analyzeLinks(content);
  
  // Get fixes
  const fixes = getLinkFixes(content);
  
  // Generate fixed content
  const fixedContent = fixLinks(content, fixes);
  
  return {
    analysis,
    fixes,
    original: content,
    fixed: fixedContent,
    fullFixed: frontMatter + fixedContent
  };
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractLinks,
    validateLink,
    analyzeLinks,
    fixLinks,
    getLinkFixes,
    fixAllLinks,
    validatePostLinks
  };
} 