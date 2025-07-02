const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Mock official updates data
const mockOfficialUpdates = [
  {
    id: 'update_1',
    source: 'FEMA',
    title: 'Emergency Declaration for NYC Flooding',
    content: 'Federal Emergency Management Agency has declared a state of emergency for New York City due to severe flooding. Federal assistance is now available to affected residents.',
    url: 'https://www.fema.gov/disaster/current/nyc-flooding-2025',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    category: 'official',
    tags: ['flood', 'emergency', 'federal']
  },
  {
    id: 'update_2',
    source: 'NYC Emergency Management',
    title: 'Evacuation Orders for Lower Manhattan',
    content: 'NYC Emergency Management has issued evacuation orders for residents in flood-prone areas of Lower Manhattan. Evacuation centers have been established at designated locations.',
    url: 'https://www1.nyc.gov/site/em/emergency_management/current-emergencies.page',
    published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    priority: 'critical',
    category: 'evacuation',
    tags: ['evacuation', 'manhattan', 'flood']
  },
  {
    id: 'update_3',
    source: 'American Red Cross',
    title: 'Emergency Shelters Now Open',
    content: 'The American Red Cross has opened emergency shelters across NYC. Shelters provide food, water, and temporary housing for displaced residents.',
    url: 'https://www.redcross.org/local/new-york/new-york-city',
    published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    priority: 'medium',
    category: 'shelter',
    tags: ['shelter', 'redcross', 'housing']
  },
  {
    id: 'update_4',
    source: 'NYC Department of Health',
    title: 'Health Advisory for Flood-Affected Areas',
    content: 'Health advisory issued for residents in flood-affected areas. Avoid contact with floodwater and seek medical attention if experiencing symptoms.',
    url: 'https://www1.nyc.gov/site/doh/health/emergency-preparedness/emergencies.page',
    published_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    priority: 'medium',
    category: 'health',
    tags: ['health', 'advisory', 'flood']
  },
  {
    id: 'update_5',
    source: 'MTA',
    title: 'Subway Service Disruptions',
    content: 'Multiple subway lines suspended due to flooding. Alternative transportation options available. Check MTA website for latest service updates.',
    url: 'https://new.mta.info/alerts',
    published_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    priority: 'medium',
    category: 'transportation',
    tags: ['transportation', 'subway', 'mta']
  }
];

// Function to scrape official websites (mock implementation)
const scrapeOfficialWebsite = async (url, source) => {
  // In a real implementation, this would use Cheerio to scrape actual websites
  // For now, we'll return mock data based on the source
  
  const mockScrapedData = {
    'fema.gov': [
      {
        title: 'Disaster Relief Funding Available',
        content: 'Additional federal funding has been allocated for disaster relief efforts in affected areas.',
        published_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ],
    'nyc.gov': [
      {
        title: 'City Services Update',
        content: 'Essential city services continue to operate. Non-essential services may be limited during the emergency.',
        published_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      }
    ],
    'redcross.org': [
      {
        title: 'Volunteer Opportunities',
        content: 'The Red Cross is seeking volunteers to assist with disaster relief efforts. Training provided.',
        published_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      }
    ]
  };

  // Simulate scraping delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const domain = new URL(url).hostname.replace('www.', '').replace('www1.', '');
  return mockScrapedData[domain] || [];
};

// Function to fetch updates from multiple official sources
const fetchOfficialUpdates = async (disasterTags = []) => {
  const sources = [
    { name: 'FEMA', url: 'https://www.fema.gov' },
    { name: 'NYC Emergency Management', url: 'https://www1.nyc.gov/site/em' },
    { name: 'American Red Cross', url: 'https://www.redcross.org' },
    { name: 'NYC Department of Health', url: 'https://www1.nyc.gov/site/doh' },
    { name: 'National Weather Service', url: 'https://www.weather.gov' }
  ];

  const allUpdates = [];

  for (const source of sources) {
    try {
      const scrapedData = await scrapeOfficialWebsite(source.url, source.name);
      
      scrapedData.forEach((item, index) => {
        allUpdates.push({
          id: `scraped_${source.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
          source: source.name,
          title: item.title,
          content: item.content,
          url: source.url,
          published_at: item.published_at,
          priority: 'medium',
          category: 'official',
          tags: disasterTags,
          isScraped: true
        });
      });
    } catch (error) {
      logger.error(`Error scraping ${source.name}:`, error);
    }
  }

  return allUpdates;
};

// GET /disasters/:id/official-updates - Get official updates for a disaster
router.get('/:id/official-updates', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, priority, category, fresh = false } = req.query;

    // Get disaster details
    const supabase = require('../config/supabase');
    const { data: disaster, error: disasterError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (disasterError) {
      if (disasterError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw disasterError;
    }

    const cacheKey = `official_updates_${id}_${priority || 'all'}_${category || 'all'}`;
    let updates = [];

    // Check cache first (unless fresh data is requested)
    if (fresh !== 'true') {
      updates = await cache.get(cacheKey);
    }

    if (!updates || fresh === 'true') {
      // Start with mock updates
      let allUpdates = [...mockOfficialUpdates];

      // If fresh data is requested, scrape official websites
      if (fresh === 'true') {
        const scrapedUpdates = await fetchOfficialUpdates(disaster.tags || []);
        allUpdates = [...scrapedUpdates, ...allUpdates];
        
        logger.info(`Scraped ${scrapedUpdates.length} fresh updates for disaster ${id}`);
      }

      // Filter by priority if specified
      if (priority) {
        allUpdates = allUpdates.filter(update => update.priority === priority);
      }

      // Filter by category if specified
      if (category) {
        allUpdates = allUpdates.filter(update => update.category === category);
      }

      // Filter by disaster tags (relevance)
      if (disaster.tags && disaster.tags.length > 0) {
        allUpdates = allUpdates.filter(update => 
          update.tags.some(tag => disaster.tags.includes(tag))
        );
      }

      // Sort by priority and timestamp
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      updates = allUpdates
        .sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.published_at) - new Date(a.published_at);
        })
        .slice(0, parseInt(limit));

      // Cache the results (shorter TTL for fresh data)
      const ttl = fresh === 'true' ? 600 : 1800; // 10 minutes for fresh, 30 minutes for regular
      await cache.set(cacheKey, updates, ttl);
      
      logger.info(`Retrieved ${updates.length} official updates for disaster ${id}`);
    } else {
      logger.debug(`Using cached official updates for disaster ${id}`);
    }

    res.json({
      disaster_id: id,
      updates: updates,
      count: updates.length,
      filters: { priority, category },
      fresh_data: fresh === 'true',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error fetching official updates for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
});

// GET /disasters/:id/official-updates/sources - Get available update sources
router.get('/:id/official-updates/sources', async (req, res) => {
  try {
    const { id } = req.params;

    // Get disaster to ensure it exists
    const supabase = require('../config/supabase');
    const { data: disaster, error: disasterError } = await supabase
      .from('disasters')
      .select('id')
      .eq('id', id)
      .single();

    if (disasterError) {
      if (disasterError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw disasterError;
    }

    const sources = [
      {
        name: 'FEMA',
        description: 'Federal Emergency Management Agency',
        url: 'https://www.fema.gov',
        type: 'federal',
        update_count: mockOfficialUpdates.filter(u => u.source === 'FEMA').length
      },
      {
        name: 'NYC Emergency Management',
        description: 'New York City Emergency Management Department',
        url: 'https://www1.nyc.gov/site/em',
        type: 'local',
        update_count: mockOfficialUpdates.filter(u => u.source === 'NYC Emergency Management').length
      },
      {
        name: 'American Red Cross',
        description: 'American Red Cross Disaster Relief',
        url: 'https://www.redcross.org',
        type: 'nonprofit',
        update_count: mockOfficialUpdates.filter(u => u.source === 'American Red Cross').length
      },
      {
        name: 'NYC Department of Health',
        description: 'New York City Department of Health and Mental Hygiene',
        url: 'https://www1.nyc.gov/site/doh',
        type: 'local',
        update_count: mockOfficialUpdates.filter(u => u.source === 'NYC Department of Health').length
      },
      {
        name: 'MTA',
        description: 'Metropolitan Transportation Authority',
        url: 'https://new.mta.info',
        type: 'transportation',
        update_count: mockOfficialUpdates.filter(u => u.source === 'MTA').length
      }
    ];

    res.json({
      disaster_id: id,
      sources: sources,
      total_sources: sources.length,
      total_updates: mockOfficialUpdates.length
    });

  } catch (error) {
    logger.error(`Error fetching update sources for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch update sources' });
  }
});

// POST /disasters/:id/official-updates/refresh - Force refresh of official updates
router.post('/:id/official-updates/refresh', async (req, res) => {
  try {
    const { id } = req.params;

    // Get disaster details
    const supabase = require('../config/supabase');
    const { data: disaster, error: disasterError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (disasterError) {
      if (disasterError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw disasterError;
    }

    // Clear cache for this disaster
    const cacheKeys = [
      `official_updates_${id}_all_all`,
      `official_updates_${id}_high_all`,
      `official_updates_${id}_critical_all`,
      `official_updates_${id}_all_official`,
      `official_updates_${id}_all_evacuation`
    ];

    for (const key of cacheKeys) {
      await cache.delete(key);
    }

    // Fetch fresh updates
    const scrapedUpdates = await fetchOfficialUpdates(disaster.tags || []);
    
    logger.info(`Refreshed official updates for disaster ${id}: ${scrapedUpdates.length} new updates`);

    res.json({
      disaster_id: id,
      message: 'Official updates refreshed successfully',
      new_updates_count: scrapedUpdates.length,
      refreshed_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error refreshing official updates for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to refresh official updates' });
  }
});

module.exports = router;

