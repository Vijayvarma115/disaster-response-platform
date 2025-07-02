const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Mock social media data
const mockSocialMediaPosts = [
  {
    id: 'post_1',
    user: 'citizen1',
    content: '#floodrelief Need food in Lower East Side NYC. Water levels rising fast!',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    platform: 'twitter',
    location: 'Lower East Side, NYC',
    urgency: 'high',
    keywords: ['flood', 'relief', 'food', 'urgent']
  },
  {
    id: 'post_2',
    user: 'reliefworker_ny',
    content: 'Shelter available at Manhattan Community Center. #disasterrelief #shelter',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    platform: 'twitter',
    location: 'Manhattan, NYC',
    urgency: 'medium',
    keywords: ['shelter', 'relief', 'available']
  },
  {
    id: 'post_3',
    user: 'nyc_emergency',
    content: 'URGENT: Evacuation recommended for areas near East River. #evacuation #flood',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    platform: 'twitter',
    location: 'East River, NYC',
    urgency: 'critical',
    keywords: ['urgent', 'evacuation', 'flood']
  },
  {
    id: 'post_4',
    user: 'volunteer_help',
    content: 'Medical supplies needed in Brooklyn. Can deliver. #medical #supplies #brooklyn',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    platform: 'twitter',
    location: 'Brooklyn, NYC',
    urgency: 'medium',
    keywords: ['medical', 'supplies', 'volunteer']
  },
  {
    id: 'post_5',
    user: 'local_news',
    content: 'Power outages reported across Queens. Crews working to restore. #poweroutage #queens',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    platform: 'twitter',
    location: 'Queens, NYC',
    urgency: 'low',
    keywords: ['power', 'outage', 'crews']
  }
];

// Function to filter posts by disaster-related keywords
const filterRelevantPosts = (posts, disasterTags = []) => {
  const disasterKeywords = [
    'flood', 'earthquake', 'fire', 'hurricane', 'tornado', 'emergency',
    'disaster', 'relief', 'help', 'urgent', 'sos', 'evacuation', 'shelter',
    'rescue', 'medical', 'supplies', 'food', 'water', 'power', 'outage'
  ];

  // Add disaster tags to keywords
  const allKeywords = [...disasterKeywords, ...disasterTags.map(tag => tag.toLowerCase())];

  return posts.filter(post => {
    const content = post.content.toLowerCase();
    return allKeywords.some(keyword => content.includes(keyword));
  });
};

// Function to simulate real-time social media monitoring
const generateRealtimePosts = (disasterId, disasterTags = []) => {
  // Simulate new posts based on disaster type
  const templates = {
    flood: [
      'Water levels rising in {location}. Need immediate help! #flood #emergency',
      'Basement flooded in {location}. Looking for shelter. #floodrelief',
      'Road closures due to flooding in {location}. Avoid area. #flood #traffic'
    ],
    earthquake: [
      'Building damage reported in {location}. #earthquake #emergency',
      'Aftershocks felt in {location}. Stay safe everyone. #earthquake',
      'Emergency services responding to {location}. #earthquake #rescue'
    ],
    fire: [
      'Smoke visible from {location}. Evacuating now. #fire #evacuation',
      'Fire spreading in {location}. Need firefighters! #fire #emergency',
      'Air quality poor in {location} due to fire. #fire #health'
    ]
  };

  const locations = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const users = ['citizen_alert', 'local_resident', 'emergency_watch', 'community_help'];

  // Generate 1-3 new posts
  const newPosts = [];
  const numPosts = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numPosts; i++) {
    const tag = disasterTags[Math.floor(Math.random() * disasterTags.length)] || 'emergency';
    const template = templates[tag] || templates.flood;
    const content = template[Math.floor(Math.random() * template.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const user = users[Math.floor(Math.random() * users.length)];

    newPosts.push({
      id: `realtime_${Date.now()}_${i}`,
      user: user,
      content: content.replace('{location}', location),
      timestamp: new Date().toISOString(),
      platform: 'twitter',
      location: location,
      urgency: Math.random() > 0.7 ? 'high' : 'medium',
      keywords: [tag, 'emergency'],
      isRealtime: true
    });
  }

  return newPosts;
};

// GET /disasters/:id/social-media - Get social media reports for a disaster
router.get('/:id/social-media', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, realtime = false } = req.query;

    // Get disaster details to understand context
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

    const cacheKey = `social_media_${id}`;
    let posts = [];

    // Check cache first
    const cachedPosts = await cache.get(cacheKey);
    
    if (cachedPosts && !realtime) {
      posts = cachedPosts;
      logger.debug(`Using cached social media posts for disaster ${id}`);
    } else {
      // Filter mock posts by disaster tags and location
      let relevantPosts = filterRelevantPosts(mockSocialMediaPosts, disaster.tags || []);
      
      // If realtime is requested, add some new posts
      if (realtime === 'true') {
        const realtimePosts = generateRealtimePosts(id, disaster.tags || []);
        relevantPosts = [...realtimePosts, ...relevantPosts];
        
        logger.info(`Generated ${realtimePosts.length} realtime posts for disaster ${id}`);
      }

      // Sort by timestamp (newest first)
      posts = relevantPosts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));

      // Cache the results (shorter TTL for realtime data)
      const ttl = realtime === 'true' ? 300 : 1800; // 5 minutes for realtime, 30 minutes for regular
      await cache.set(cacheKey, posts, ttl);
      
      logger.info(`Retrieved ${posts.length} social media posts for disaster ${id}`);
    }

    // Emit real-time update if new posts were generated
    if (realtime === 'true' && posts.some(post => post.isRealtime)) {
      req.io.emit('social_media_updated', {
        disaster_id: id,
        new_posts: posts.filter(post => post.isRealtime),
        total_posts: posts.length
      });
    }

    res.json({
      disaster_id: id,
      posts: posts,
      count: posts.length,
      realtime: realtime === 'true',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error fetching social media for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch social media reports' });
  }
});

// GET /disasters/:id/social-media/priority - Get priority/urgent social media reports
router.get('/:id/social-media/priority', async (req, res) => {
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

    // Filter for high priority posts
    const relevantPosts = filterRelevantPosts(mockSocialMediaPosts, disaster.tags || []);
    const priorityPosts = relevantPosts.filter(post => 
      post.urgency === 'critical' || post.urgency === 'high' ||
      post.content.toLowerCase().includes('urgent') ||
      post.content.toLowerCase().includes('sos') ||
      post.content.toLowerCase().includes('emergency')
    );

    // Sort by urgency and timestamp
    const urgencyOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    priorityPosts.sort((a, b) => {
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    logger.info(`Retrieved ${priorityPosts.length} priority social media posts for disaster ${id}`);

    res.json({
      disaster_id: id,
      priority_posts: priorityPosts,
      count: priorityPosts.length,
      criteria: ['critical', 'high', 'urgent', 'sos', 'emergency'],
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error fetching priority social media for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch priority social media reports' });
  }
});

// POST /disasters/:id/social-media/report - Submit a new social media report
router.post('/:id/social-media/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, location, urgency = 'medium' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Create new report entry in database
    const supabase = require('../config/supabase');
    const reportData = {
      disaster_id: id,
      user_id: req.user.id,
      content,
      verification_status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reports')
      .insert([reportData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create social media post format for real-time updates
    const socialMediaPost = {
      id: `user_report_${data.id}`,
      user: req.user.id,
      content: content,
      timestamp: data.created_at,
      platform: 'user_report',
      location: location || 'Unknown',
      urgency: urgency,
      keywords: [],
      verification_status: 'pending',
      report_id: data.id
    };

    logger.info(`New social media report submitted for disaster ${id} by ${req.user.id}`);

    // Emit real-time update
    req.io.emit('social_media_updated', {
      disaster_id: id,
      new_posts: [socialMediaPost],
      action: 'user_report'
    });

    res.status(201).json({
      report: data,
      social_media_post: socialMediaPost,
      message: 'Report submitted successfully'
    });

  } catch (error) {
    logger.error(`Error submitting social media report for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to submit social media report' });
  }
});

module.exports = router;

