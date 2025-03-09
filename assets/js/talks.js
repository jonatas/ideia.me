document.addEventListener('DOMContentLoaded', function() {
  try {
    // Get all talk data from the data attribute
    const talksData = getSiteData();
    
    // Calculate statistics dynamically
    calculateAndDisplayStats(talksData);
    
    // Count topics and update the filter display
    updateTopicCounts(talksData);
    
    // Animation for stat counters
    animateCounters();
    
    // Topic filtering
    setupTopicFilters();
    
    // Year filtering
    setupYearFilters();
    
    // Add time-based classes for visual styling
    markPastAndUpcomingEvents();
  } catch (error) {
    console.error('Error initializing talks data:', error);
  }
  
  // Booking form functions - defined outside the try/catch block to ensure they're always available
  window.openBookingForm = function() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.add('active');
  };
  
  window.closeBookingForm = function() {
    const modal = document.getElementById('booking-modal');
    if (modal) modal.classList.remove('active');
  };
});

// Get site data from the window object - populated by Jekyll
function getSiteData() {
  // First try to get data directly from window object
  if (window.talksJson && Array.isArray(window.talksJson)) {
    return window.talksJson;
  }
  
  // Then try to parse from embedded element
  try {
    const talksDataElement = document.getElementById('talks-data');
    if (talksDataElement && talksDataElement.textContent) {
      return JSON.parse(talksDataElement.textContent);
    }
  } catch (e) {
    console.warn('Error parsing talks data from DOM:', e);
  }
  
  // Fallback: Extract minimal data from DOM
  return getAllTalksData();
}

// Fallback method: Get all talks data from the DOM
function getAllTalksData() {
  const talkCards = document.querySelectorAll('.talk-card');
  if (!talkCards || talkCards.length === 0) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let talks = [];
  
  talkCards.forEach(card => {
    try {
      // Extract data from each card
      const titleElement = card.querySelector('.talk-card-title');
      const title = titleElement ? titleElement.textContent.trim() : '';
      
      const dateElement = card.querySelector('.series-date');
      const dateStr = dateElement ? dateElement.textContent.trim() : '';
      
      const locationElement = card.querySelector('.series-location');
      const location = locationElement ? locationElement.textContent.trim() : '';
      
      const topics = card.getAttribute('data-topics') ? 
                    card.getAttribute('data-topics').split(',') : [];
      const year = card.getAttribute('data-year') || '';
      const isInternational = Boolean(card.querySelector('.international-badge'));
      const isSeries = card.classList.contains('talk-series');
      
      const infoElement = card.querySelector('.talk-card-info');
      const type = infoElement ? infoElement.textContent.trim().toLowerCase() : '';
      
      // Parse date string to determine if delivered or upcoming
      let date = null;
      try {
        date = new Date(dateStr);
      } catch (e) {
        console.warn('Could not parse date:', dateStr);
      }
      
      const isDelivered = date && date < today;
      
      talks.push({
        title,
        date,
        dateStr,
        location,
        topics,
        year,
        isInternational,
        isSeries,
        type,
        isDelivered
      });
      
      // For series talks, extract data for each event in the series
      if (isSeries) {
        const seriesItems = card.querySelectorAll('.series-location-item');
        
        seriesItems.forEach(item => {
          try {
            const itemDateElement = item.querySelector('.series-date');
            const itemDateStr = itemDateElement ? itemDateElement.textContent.trim() : '';
            
            const itemLocationElement = item.querySelector('.series-location');
            const itemLocation = itemLocationElement ? itemLocationElement.textContent.trim() : '';
            
            let itemDate = null;
            try {
              itemDate = new Date(itemDateStr);
            } catch (e) {
              console.warn('Could not parse date:', itemDateStr);
            }
            
            const itemIsDelivered = itemDate && itemDate < today;
            
            talks.push({
              title,
              date: itemDate,
              dateStr: itemDateStr,
              location: itemLocation,
              topics,
              year,
              isInternational,
              isSeries: false, // This is an individual event in a series
              isSeriesItem: true,
              type,
              isDelivered: itemIsDelivered
            });
          } catch (itemError) {
            console.warn('Error processing series item:', itemError);
          }
        });
      }
    } catch (cardError) {
      console.warn('Error processing talk card:', cardError);
    }
  });
  
  return talks;
}

// Calculate and display statistics
function calculateAndDisplayStats(talks) {
  // If the talks array is empty or undefined, get data directly from JSON
  if (!talks || !talks.length) {
    // Get direct data from the JSON
    const talksJson = window.talksJson || [];
    
    if (!talksJson.length) {
      console.warn('No talks data available for statistics calculation');
      return;
    }
    
    // Extract basic stats
    const stats = {
      total_talks: talksJson.length || 0,
      international_talks: talksJson.filter(talk => talk.international).length || 0,
      delivered: talksJson.filter(talk => talk.status === "Delivered").length || 0,
      upcoming: talksJson.filter(talk => talk.status !== "Delivered").length || 0
    };
    
    // Extract unique countries
    const countries = new Set();
    talksJson.forEach(talk => {
      if (talk.location) {
        const country = talk.location.split(',').pop().trim();
        if (country) countries.add(country);
      }
    });
    stats.countries = countries.size;
    
    // Very simplified continent detection
    const continents = detectContinents(countries);
    stats.continents = continents.size;
    
    // Now update the stats display
    updateStatsDisplay(stats);
    return;
  }

  // Remove duplicate series items for certain statistics
  const uniqueTalks = talks.filter(talk => !talk.isSeriesItem);
  
  // Calculate statistics
  const stats = {
    total_talks: talks.length,
    international_talks: talks.filter(talk => talk.isInternational).length,
    delivered: talks.filter(talk => talk.isDelivered).length,
    upcoming: talks.filter(talk => !talk.isDelivered).length,
    workshops: talks.filter(talk => talk.type === 'workshop').length,
    conferences: talks.filter(talk => talk.type === 'conference').length,
    meetups: talks.filter(talk => talk.type === 'meetup').length,
    panels: talks.filter(talk => talk.type === 'panel').length
  };
  
  // Calculate unique countries
  const countries = new Set();
  talks.forEach(talk => {
    if (talk.location) {
      const country = talk.location.split(',').pop().trim();
      if (country) countries.add(country);
    }
  });
  stats.countries = countries.size;
  
  // Detect continents from countries
  const continents = detectContinents(countries);
  stats.continents = continents.size;
  
  // Update the display with the calculated stats
  updateStatsDisplay(stats);
}

// Helper function to detect continents from countries
function detectContinents(countries) {
  const continents = new Set();
  const countryToContinent = {
    'Brazil': 'South America',
    'USA': 'North America',
    'United States': 'North America',
    'Canada': 'North America',
    'Poland': 'Europe',
    'Spain': 'Europe',
    'Latvia': 'Europe',
    'Thailand': 'Asia',
    'India': 'Asia',
    'Singapore': 'Asia'
  };
  
  countries.forEach(country => {
    const continent = countryToContinent[country];
    if (continent) continents.add(continent);
  });
  
  return continents;
}

// Update the stats display with calculated values
function updateStatsDisplay(stats) {
  if (!stats) return;
  
  // First approach: use data-count attribute
  document.querySelectorAll('.stat-box .counter').forEach(counter => {
    if (!counter) return;
    
    const statBox = counter.closest('.stat-box');
    if (!statBox) return;
    
    const labelEl = statBox.querySelector('.stat-label');
    if (!labelEl) return;
    
    const label = labelEl.textContent.trim().toLowerCase();
    const key = label.replace(/\s+/g, '_');
    
    if (stats[key] !== undefined) {
      counter.setAttribute('data-count', stats[key]);
    }
  });
  
  // Second approach: direct label matching
  const labelToKey = {
    'total talks': 'total_talks',
    'delivered': 'delivered',
    'countries': 'countries',
    'continents': 'continents',
    'international': 'international_talks'
  };
  
  document.querySelectorAll('.stat-box').forEach(box => {
    if (!box) return;
    
    const labelEl = box.querySelector('.stat-label');
    if (!labelEl) return;
    
    const label = labelEl.textContent.trim();
    const counter = box.querySelector('.counter');
    if (!counter) return;
    
    const key = labelToKey[label.toLowerCase()];
    
    if (key && stats[key] !== undefined) {
      counter.setAttribute('data-count', stats[key]);
    }
  });
}

// Update topic counts
function updateTopicCounts(talks) {
  // Get data directly from the JSON
  const talksJson = window.talksJson || [];
  
  if (!talksJson.length) {
    console.warn('No talks data available for topic counting');
    return;
  }
  
  // Count occurrences of each topic
  const topicCounts = {};
  
  // Process each talk's topics
  talksJson.forEach(talk => {
    if (talk.topic) {
      const topics = talk.topic.split(',').map(t => t.trim());
      topics.forEach(topic => {
        if (topic) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
    }
  });
  
  console.log('Topic counts:', topicCounts);
  updateTopicDisplay(topicCounts);
}

// Update the topic display with counts
function updateTopicDisplay(topicCounts) {
  if (!topicCounts) return;
  
  // Update the topic filter elements with the counts
  document.querySelectorAll('.topic-filter').forEach(filter => {
    if (!filter) return;
    
    const topic = filter.getAttribute('data-topic');
    if (!topic) return;
    
    // Log for debugging
    console.log(`Topic: ${topic}, Count: ${topicCounts[topic] || 0}`);
    
    const count = topicCounts[topic] || 0;
    
    // Update the text to include the count
    filter.textContent = `${topic} (${count})`;
  });
}

// Inject talks data into the page
function injectTalksData() {
  try {
    // Check if the global variable is available
    if (window.talksJson) {
      // Create a script element to hold the data
      const script = document.createElement('script');
      script.id = 'talks-data';
      script.type = 'application/json';
      script.textContent = JSON.stringify(window.talksJson);
      document.body.appendChild(script);
    }
  } catch (error) {
    console.warn('Error injecting talks data:', error);
  }
}

// Animate the stat counters
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters || counters.length === 0) return;
  
  const speed = 200;
  
  counters.forEach(counter => {
    if (!counter) return;
    
    const updateCount = () => {
      const target = +counter.getAttribute('data-count') || 0;
      const count = +counter.innerText || 0;
      const inc = Math.max(1, target / speed);
      
      if (count < target) {
        counter.innerText = Math.ceil(count + inc);
        setTimeout(updateCount, 1);
      } else {
        counter.innerText = target;
      }
    };
    
    updateCount();
  });
}

// Set up topic filters
function setupTopicFilters() {
  const topicFilters = document.querySelectorAll('.topic-filter');
  if (!topicFilters || topicFilters.length === 0) return;
  
  const talkCards = document.querySelectorAll('.talk-card');
  if (!talkCards || talkCards.length === 0) return;
  
  topicFilters.forEach(filter => {
    if (!filter) return;
    
    filter.addEventListener('click', function() {
      const topic = this.getAttribute('data-topic');
      if (!topic) return;
      
      // Toggle active class
      this.classList.toggle('active');
      
      // Get all active filters
      const activeFilters = Array.from(document.querySelectorAll('.topic-filter.active'))
        .map(filter => filter.getAttribute('data-topic'))
        .filter(Boolean);
      
      // If no filters are active, show all cards
      if (activeFilters.length === 0) {
        talkCards.forEach(card => {
          if (card) card.style.display = 'block';
        });
        return;
      }
      
      // Show only cards that match active filters
      talkCards.forEach(card => {
        if (!card) return;
        
        const cardTopicsAttr = card.getAttribute('data-topics');
        if (!cardTopicsAttr) return;
        
        const cardTopics = cardTopicsAttr.split(',');
        const matchesFilter = activeFilters.some(filter => cardTopics.includes(filter));
        
        card.style.display = matchesFilter ? 'block' : 'none';
      });
    });
  });
}

// Set up year filters
function setupYearFilters() {
  const yearFilters = document.querySelectorAll('.year-filter');
  if (!yearFilters || yearFilters.length === 0) return;
  
  const talkCards = document.querySelectorAll('.talk-card');
  if (!talkCards || talkCards.length === 0) return;
  
  yearFilters.forEach(filter => {
    if (!filter) return;
    
    filter.addEventListener('click', function() {
      const year = this.getAttribute('data-year');
      if (!year) return;
      
      // Remove active class from all filters
      yearFilters.forEach(f => {
        if (f) f.classList.remove('active');
      });
      
      // Add active class to clicked filter
      this.classList.add('active');
      
      // Show all cards if 'all' is selected
      if (year === 'all') {
        talkCards.forEach(card => {
          if (card) card.style.display = 'block';
        });
        return;
      }
      
      // Show only cards from selected year
      talkCards.forEach(card => {
        if (!card) return;
        
        const cardYear = card.getAttribute('data-year');
        card.style.display = (cardYear === year) ? 'block' : 'none';
      });
    });
  });
}

// Mark past and upcoming events for visual styling
function markPastAndUpcomingEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Convert date strings to highlight upcoming events
  document.querySelectorAll('.series-date').forEach(dateElement => {
    if (!dateElement) return;
    
    try {
      const dateString = dateElement.textContent.trim();
      const eventDate = new Date(dateString);
      
      const locationItem = dateElement.closest('.series-location-item');
      if (!locationItem) return;
      
      if (eventDate >= today) {
        locationItem.classList.add('upcoming-event');
      } else {
        locationItem.classList.add('past-event');
      }
    } catch (error) {
      console.warn('Error processing date for visual styling:', error);
    }
  });
}

// Helper: Format date for display
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return dateString;
  }
}

// Enhance slides containers with loading indicators and error handling
// This function improves user experience when slides are loading
function enhanceSlidesContainers() {
  const slidesContainers = document.querySelectorAll('.slides-container');
  if (slidesContainers.length === 0) {
    console.log('No slides containers found on page');
    return;
  }
  
  console.log(`Found ${slidesContainers.length} slides containers to enhance`);
  
  slidesContainers.forEach((container, index) => {
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'slides-loading-indicator';
    loadingIndicator.innerHTML = `
      <div style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0.8); 
                 display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:2;">
        <div style="width:40px; height:40px; border:4px solid #f3f3f3; border-top:4px solid #3498db; 
                    border-radius:50%; animation:slides-spin 1s linear infinite;"></div>
        <div style="margin-top:10px; font-size:14px;">Loading slides...</div>
      </div>
      <style>
        @keyframes slides-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    `;
    container.appendChild(loadingIndicator);
    
    // Find the iframe
    const iframe = container.querySelector('iframe');
    if (!iframe) {
      console.error(`Slides container ${index} does not have an iframe`);
      loadingIndicator.innerHTML = `
        <div style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0.9); 
                   display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:2; color:#e74c3c;">
          <i class="fas fa-exclamation-triangle" style="font-size:24px; margin-bottom:10px;"></i>
          <div>Error: No iframe found</div>
        </div>
      `;
      return;
    }
    
    // Add debug info
    console.log(`Slide ${index} iframe src:`, iframe.src);
    
    // Handle iframe events
    iframe.addEventListener('load', function() {
      console.log(`Slides iframe ${index} loaded successfully`);
      loadingIndicator.remove();
    });
    
    iframe.addEventListener('error', function(e) {
      console.error(`Slides iframe ${index} failed to load:`, e);
      loadingIndicator.innerHTML = `
        <div style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0.9); 
                   display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:2; color:#e74c3c;">
          <i class="fas fa-exclamation-triangle" style="font-size:24px; margin-bottom:10px;"></i>
          <div>Error loading slides</div>
          <div style="font-size:12px; margin-top:5px;">Check browser console for details</div>
        </div>
      `;
    });
    
    // Set a timeout for loading
    setTimeout(() => {
      if (document.body.contains(loadingIndicator)) {
        console.warn(`Slides iframe ${index} taking too long to load`);
        loadingIndicator.querySelector('div > div:last-child').textContent = 'Loading slides... (taking longer than expected)';
      }
    }, 5000);
  });
}

// Run the enhancement after DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Calculate stats and initialize UI elements
  const talks = getAllTalksData();
  
  // Add logic to migrate any legacy media formats for compatibility
  migrateLegacyMediaFormats(talks);
  
  // Now proceed with regular initialization
  calculateAndDisplayStats(talks);
  injectTalksData();
  animateCounters();
  setupTopicFilters();
  setupYearFilters();
  markPastAndUpcomingEvents();
  
  // Initialize slides containers with slight delay to ensure DOM is ready
  setTimeout(enhanceSlidesContainers, 1000);
});

// Migrate any legacy media format to the new simpler format for backward compatibility
function migrateLegacyMediaFormats(talks) {
  if (!talks || !Array.isArray(talks)) return;
  
  console.log('Checking for legacy media formats...');
  let migratedCount = 0;
  
  talks.forEach(talk => {
    if (!talk.media) return;
    
    // Case 1: Old platform/id format
    if (talk.media.platform && talk.media.id) {
      const platform = talk.media.platform;
      const id = talk.media.id;
      
      if (platform === 'youtube' || platform === 'vimeo' || platform === 'slides') {
        talk.media[platform] = id;
        console.log(`Migrated ${platform} for talk: ${talk.title}`);
        migratedCount++;
      }
    }
    
    // Case 2: Old video sub-object
    if (talk.media.video && talk.media.video.platform) {
      const platform = talk.media.video.platform;
      const id = talk.media.video.id;
      
      talk.media[platform] = id;
      console.log(`Migrated nested ${platform} for talk: ${talk.title}`);
      migratedCount++;
    }
    
    // Case 3: Old slides sub-object
    if (talk.slides && talk.slides.id) {
      talk.media = talk.media || {};
      talk.media.slides = talk.slides.id;
      console.log(`Migrated external slides for talk: ${talk.title}`);
      migratedCount++;
    }
  });
  
  console.log(`Migration complete. ${migratedCount} items migrated.`);
}

// Make the function available globally
window.enhanceSlidesContainers = enhanceSlidesContainers;

// Booking form functions
function openBookingForm() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('active');
}

function closeBookingForm() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.remove('active');
} 