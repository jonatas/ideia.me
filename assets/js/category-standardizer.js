/**
 * Category Standardizer for Blog Posts
 * 
 * This script helps standardize categories across blog posts on ideia.me
 */

// Define standard categories with descriptions and related tags
const standardCategories = {
  'technical': {
    description: 'Technical articles about programming, databases, and software development',
    relatedTags: ['programming', 'code', 'development', 'software', 'engineering'],
    aliases: ['programming', 'coding', 'development', 'tech']
  },
  'postgresql': {
    description: 'Articles about PostgreSQL database and related technologies',
    relatedTags: ['database', 'sql', 'timescaledb', 'data'],
    aliases: ['postgres', 'pgsql', 'database']
  },
  'ruby': {
    description: 'Articles about Ruby programming language and ecosystem',
    relatedTags: ['rails', 'gems', 'programming', 'web'],
    aliases: ['rails', 'ruby-on-rails', 'rubygems']
  },
  'timescaledb': {
    description: 'Articles about TimescaleDB time-series database',
    relatedTags: ['postgresql', 'time-series', 'data', 'database'],
    aliases: ['timescale', 'time-series']
  },
  'community': {
    description: 'Articles about tech communities, events, and social aspects of technology',
    relatedTags: ['events', 'meetups', 'conferences', 'people'],
    aliases: ['communities', 'social', 'events']
  },
  'talks': {
    description: 'Articles about speaking engagements, presentations, and conferences',
    relatedTags: ['speaking', 'conferences', 'presentations', 'events'],
    aliases: ['speaking', 'conferences', 'presentations']
  },
  'personal': {
    description: 'Personal reflections, experiences, and life updates',
    relatedTags: ['life', 'reflections', 'thoughts', 'personal-growth'],
    aliases: ['personal-growth', 'life', 'reflections']
  },
  'tutorial': {
    description: 'Step-by-step guides and tutorials on various technical topics',
    relatedTags: ['howto', 'guide', 'learning', 'education'],
    aliases: ['guide', 'how-to', 'howto', 'guides']
  },
  'tools': {
    description: 'Articles about software tools, utilities, and productivity',
    relatedTags: ['software', 'productivity', 'utilities', 'apps'],
    aliases: ['utilities', 'software', 'apps']
  },
  'web': {
    description: 'Articles about web development, design, and technologies',
    relatedTags: ['frontend', 'backend', 'javascript', 'html', 'css'],
    aliases: ['web-development', 'website', 'frontend', 'backend']
  }
};

// Map of non-standard categories to standard ones
const categoryMapping = {
  // Technical categories
  'programming': 'technical',
  'coding': 'technical',
  'development': 'technical',
  'tech': 'technical',
  'software': 'technical',
  'engineering': 'technical',
  'code': 'technical',
  
  // PostgreSQL categories
  'postgres': 'postgresql',
  'pgsql': 'postgresql',
  'database': 'postgresql',
  'sql': 'postgresql',
  
  // Ruby categories
  'rails': 'ruby',
  'ruby-on-rails': 'ruby',
  'rubygems': 'ruby',
  'gem': 'ruby',
  
  // TimescaleDB categories
  'timescale': 'timescaledb',
  'time-series': 'timescaledb',
  
  // Community categories
  'communities': 'community',
  'social': 'community',
  'events': 'community',
  'meetups': 'community',
  
  // Talks categories
  'speaking': 'talks',
  'conferences': 'talks',
  'presentations': 'talks',
  'conference': 'talks',
  'talk': 'talks',
  
  // Personal categories
  'personal-growth': 'personal',
  'life': 'personal',
  'reflections': 'personal',
  'thoughts': 'personal',
  
  // Tutorial categories
  'guide': 'tutorial',
  'how-to': 'tutorial',
  'howto': 'tutorial',
  'guides': 'tutorial',
  'learning': 'tutorial',
  
  // Tools categories
  'utilities': 'tools',
  'software': 'tools',
  'apps': 'tools',
  'productivity': 'tools',
  
  // Web categories
  'web-development': 'web',
  'website': 'web',
  'frontend': 'web',
  'backend': 'web',
  'javascript': 'web',
  'html': 'web',
  'css': 'web'
};

// Function to suggest standard categories based on post content
function suggestCategories(title, content, currentCategories) {
  const text = `${title} ${content}`.toLowerCase();
  const suggestions = [];
  
  // Check each standard category
  Object.entries(standardCategories).forEach(([category, info]) => {
    // Check if category name is in the text
    if (text.includes(category)) {
      suggestions.push({
        category,
        confidence: 'high',
        reason: `The category name "${category}" appears in the content`
      });
      return;
    }
    
    // Check if any aliases are in the text
    const matchedAlias = info.aliases.find(alias => text.includes(alias));
    if (matchedAlias) {
      suggestions.push({
        category,
        confidence: 'medium',
        reason: `The text contains "${matchedAlias}", which is related to the "${category}" category`
      });
      return;
    }
    
    // Check if any related tags are in the text
    const matchedTags = info.relatedTags.filter(tag => text.includes(tag));
    if (matchedTags.length > 0) {
      suggestions.push({
        category,
        confidence: 'low',
        reason: `The text contains ${matchedTags.map(t => `"${t}"`).join(', ')}, which ${matchedTags.length > 1 ? 'are' : 'is'} related to the "${category}" category`
      });
    }
  });
  
  // Map current non-standard categories to standard ones
  currentCategories.forEach(category => {
    const lowerCategory = category.toLowerCase();
    if (standardCategories[lowerCategory]) {
      // Already a standard category
      if (!suggestions.some(s => s.category === lowerCategory)) {
        suggestions.push({
          category: lowerCategory,
          confidence: 'high',
          reason: `Already using the standard category "${lowerCategory}"`
        });
      }
    } else if (categoryMapping[lowerCategory]) {
      // Can be mapped to a standard category
      const mappedCategory = categoryMapping[lowerCategory];
      if (!suggestions.some(s => s.category === mappedCategory)) {
        suggestions.push({
          category: mappedCategory,
          confidence: 'high',
          reason: `The current category "${lowerCategory}" can be standardized to "${mappedCategory}"`
        });
      }
    }
  });
  
  // Sort by confidence
  return suggestions.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
}

// Function to generate front matter with standardized categories
function generateFrontMatter(title, layout, categories, tags, description) {
  let frontMatter = '---\n';
  frontMatter += `title: "${title}"\n`;
  frontMatter += `layout: ${layout || 'post'}\n`;
  
  if (categories && categories.length > 0) {
    frontMatter += 'categories: [';
    frontMatter += categories.map(c => `'${c}'`).join(', ');
    frontMatter += ']\n';
  }
  
  if (tags && tags.length > 0) {
    frontMatter += 'tags: [';
    frontMatter += tags.map(t => `'${t}'`).join(', ');
    frontMatter += ']\n';
  }
  
  if (description) {
    frontMatter += `description: "${description}"\n`;
  }
  
  frontMatter += '---\n';
  return frontMatter;
}

// Function to extract front matter from a post
function extractFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return {
      frontMatter: '',
      content: content
    };
  }
  
  const frontMatter = match[0];
  const remainingContent = content.slice(frontMatter.length);
  
  // Parse front matter
  const parsed = {};
  const lines = match[1].split('\n');
  
  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(item => {
          // Remove quotes and trim
          return item.replace(/['"]/g, '').trim();
        });
      } else if (value.startsWith('"') && value.endsWith('"')) {
        // Handle quoted strings
        value = value.slice(1, -1);
      }
      
      parsed[key] = value;
    }
  });
  
  return {
    original: frontMatter,
    parsed: parsed,
    content: remainingContent
  };
}

// Function to suggest improvements for a post
function suggestImprovements(postContent) {
  const { original, parsed, content } = extractFrontMatter(postContent);
  
  const suggestions = {
    categories: [],
    tags: [],
    description: null,
    title: null
  };
  
  // Check title
  if (parsed.title) {
    if (parsed.title.length < 30) {
      suggestions.title = {
        current: parsed.title,
        suggestion: `Consider a more descriptive title (current length: ${parsed.title.length} characters, aim for 50-60)`,
        reason: 'Short titles may not be descriptive enough for SEO'
      };
    } else if (parsed.title.length > 70) {
      suggestions.title = {
        current: parsed.title,
        suggestion: `Consider a shorter title (current length: ${parsed.title.length} characters, aim for 50-60)`,
        reason: 'Long titles may be truncated in search results'
      };
    }
  }
  
  // Check description
  if (!parsed.description) {
    // Extract first paragraph for description suggestion
    const firstParagraph = content.split('\n\n')[0].replace(/^#.*\n/, '').trim();
    const description = firstParagraph.length > 160 ? 
      firstParagraph.substring(0, 157) + '...' : 
      firstParagraph;
    
    suggestions.description = {
      current: null,
      suggestion: description,
      reason: 'Adding a meta description improves SEO'
    };
  } else if (parsed.description.length < 120) {
    suggestions.description = {
      current: parsed.description,
      suggestion: `Consider a more descriptive meta description (current length: ${parsed.description.length} characters, aim for 120-160)`,
      reason: 'Short descriptions may not provide enough context for search engines'
    };
  } else if (parsed.description.length > 160) {
    suggestions.description = {
      current: parsed.description,
      suggestion: `Consider a shorter meta description (current length: ${parsed.description.length} characters, aim for 120-160)`,
      reason: 'Long descriptions may be truncated in search results'
    };
  }
  
  // Check categories
  const currentCategories = Array.isArray(parsed.categories) ? 
    parsed.categories : 
    (parsed.categories ? [parsed.categories] : []);
  
  // Get category suggestions
  const title = parsed.title || '';
  const categorySuggestions = suggestCategories(title, content, currentCategories);
  
  // Filter out categories that are already used
  const newCategorySuggestions = categorySuggestions.filter(suggestion => 
    !currentCategories.some(category => 
      category.toLowerCase() === suggestion.category.toLowerCase()
    )
  );
  
  if (newCategorySuggestions.length > 0) {
    suggestions.categories = newCategorySuggestions.map(suggestion => ({
      category: suggestion.category,
      confidence: suggestion.confidence,
      reason: suggestion.reason
    }));
  }
  
  // Check for non-standard categories that should be replaced
  const categoriesToReplace = currentCategories.filter(category => {
    const lowerCategory = category.toLowerCase();
    return !standardCategories[lowerCategory] && categoryMapping[lowerCategory];
  });
  
  if (categoriesToReplace.length > 0) {
    categoriesToReplace.forEach(category => {
      const lowerCategory = category.toLowerCase();
      const mappedCategory = categoryMapping[lowerCategory];
      
      suggestions.categories.push({
        category: mappedCategory,
        replaces: category,
        confidence: 'high',
        reason: `Replace non-standard category "${category}" with standard category "${mappedCategory}"`
      });
    });
  }
  
  // Check tags
  const currentTags = Array.isArray(parsed.tags) ? 
    parsed.tags : 
    (parsed.tags ? [parsed.tags] : []);
  
  // Suggest tags based on content if none exist
  if (currentTags.length === 0) {
    // Use the suggested categories' related tags
    const suggestedTags = new Set();
    categorySuggestions.forEach(suggestion => {
      const categoryInfo = standardCategories[suggestion.category];
      if (categoryInfo && categoryInfo.relatedTags) {
        categoryInfo.relatedTags.forEach(tag => suggestedTags.add(tag));
      }
    });
    
    if (suggestedTags.size > 0) {
      suggestions.tags = Array.from(suggestedTags).map(tag => ({
        tag,
        reason: `Based on the content and suggested categories`
      }));
    }
  }
  
  return {
    original,
    parsed,
    content,
    suggestions
  };
}

// Function to apply suggestions and generate improved post content
function applyImprovements(postContent, options = {}) {
  const { original, parsed, content, suggestions } = suggestImprovements(postContent);
  
  // Create a copy of the parsed front matter
  const improved = { ...parsed };
  
  // Apply title improvement if selected
  if (options.title && suggestions.title) {
    improved.title = options.title;
  }
  
  // Apply description improvement if selected
  if (options.description && suggestions.description) {
    improved.description = options.description;
  }
  
  // Apply category improvements if selected
  if (options.categories && options.categories.length > 0) {
    // Start with current categories
    let categories = Array.isArray(parsed.categories) ? 
      [...parsed.categories] : 
      (parsed.categories ? [parsed.categories] : []);
    
    // Remove categories that should be replaced
    const categoriesToReplace = suggestions.categories
      .filter(s => s.replaces)
      .map(s => s.replaces.toLowerCase());
    
    categories = categories.filter(category => 
      !categoriesToReplace.includes(category.toLowerCase())
    );
    
    // Add new categories
    options.categories.forEach(category => {
      if (!categories.some(c => c.toLowerCase() === category.toLowerCase())) {
        categories.push(category);
      }
    });
    
    improved.categories = categories;
  }
  
  // Apply tag improvements if selected
  if (options.tags && options.tags.length > 0) {
    // Start with current tags
    let tags = Array.isArray(parsed.tags) ? 
      [...parsed.tags] : 
      (parsed.tags ? [parsed.tags] : []);
    
    // Add new tags
    options.tags.forEach(tag => {
      if (!tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
        tags.push(tag);
      }
    });
    
    improved.tags = tags;
  }
  
  // Generate new front matter
  const newFrontMatter = generateFrontMatter(
    improved.title,
    improved.layout,
    improved.categories,
    improved.tags,
    improved.description
  );
  
  // Replace original front matter with new one
  return postContent.replace(original, newFrontMatter);
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    standardCategories,
    categoryMapping,
    suggestCategories,
    generateFrontMatter,
    extractFrontMatter,
    suggestImprovements,
    applyImprovements
  };
} 