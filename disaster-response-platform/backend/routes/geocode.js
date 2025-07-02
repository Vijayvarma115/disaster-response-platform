const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Mock Gemini API for location extraction
const extractLocationWithGemini = async (description) => {
  // In a real implementation, this would call the Google Gemini API
  // For now, we'll use a simple regex-based approach
  
  const locationPatterns = [
    /in\s+([A-Z][a-zA-Z\s,]+)/g,
    /at\s+([A-Z][a-zA-Z\s,]+)/g,
    /near\s+([A-Z][a-zA-Z\s,]+)/g,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,})/g, // City, State format
    /([A-Z][a-zA-Z\s]+\s+[A-Z][a-zA-Z\s]+)/g // General location names
  ];

  const locations = [];
  
  for (const pattern of locationPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/^(in|at|near)\s+/i, '').trim();
        if (cleaned.length > 2 && !locations.includes(cleaned)) {
          locations.push(cleaned);
        }
      });
    }
  }

  // Return the first location found, or null if none
  return locations.length > 0 ? locations[0] : null;
};

// Mock geocoding service
const geocodeLocation = async (locationName) => {
  // Mock coordinates for common locations
  const mockCoordinates = {
    'Manhattan, NYC': { lat: 40.7831, lng: -73.9712 },
    'Manhattan': { lat: 40.7831, lng: -73.9712 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'NYC': { lat: 40.7128, lng: -74.0060 },
    'Brooklyn': { lat: 40.6782, lng: -73.9442 },
    'Queens': { lat: 40.7282, lng: -73.7949 },
    'Bronx': { lat: 40.8448, lng: -73.8648 },
    'Staten Island': { lat: 40.5795, lng: -74.1502 },
    'Lower East Side': { lat: 40.7209, lng: -73.9896 },
    'Lower East Side, NYC': { lat: 40.7209, lng: -73.9896 },
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Houston': { lat: 29.7604, lng: -95.3698 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Seattle': { lat: 47.6062, lng: -122.3321 },
    'Boston': { lat: 42.3601, lng: -71.0589 },
    'Washington DC': { lat: 38.9072, lng: -77.0369 },
    'Philadelphia': { lat: 39.9526, lng: -75.1652 },
    'Atlanta': { lat: 33.7490, lng: -84.3880 }
  };

  // Check if we have mock coordinates
  const normalizedName = locationName.trim();
  if (mockCoordinates[normalizedName]) {
    return mockCoordinates[normalizedName];
  }

  // Try partial matches
  for (const [key, coords] of Object.entries(mockCoordinates)) {
    if (normalizedName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(normalizedName.toLowerCase())) {
      return coords;
    }
  }

  // Default to NYC if no match found
  logger.warn(`No coordinates found for location: ${locationName}, defaulting to NYC`);
  return { lat: 40.7128, lng: -74.0060 };
};

// POST /geocode - Extract location from text and convert to coordinates
router.post('/', async (req, res) => {
  try {
    const { description, location_name } = req.body;

    if (!description && !location_name) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'Either description or location_name is required'
      });
    }

    let extractedLocation = location_name;
    let coordinates = null;

    // If we have a description but no location_name, extract location using Gemini
    if (description && !location_name) {
      const cacheKey = `gemini_location_${Buffer.from(description).toString('base64')}`;
      
      // Check cache first
      extractedLocation = await cache.get(cacheKey);
      
      if (!extractedLocation) {
        extractedLocation = await extractLocationWithGemini(description);
        
        if (extractedLocation) {
          // Cache the result
          await cache.set(cacheKey, extractedLocation, 3600); // 1 hour TTL
          logger.info(`Location extracted from description: ${extractedLocation}`);
        }
      } else {
        logger.debug(`Using cached location extraction: ${extractedLocation}`);
      }
    }

    // If we have a location name, geocode it
    if (extractedLocation) {
      const geocodeCacheKey = `geocode_${extractedLocation.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Check cache first
      coordinates = await cache.get(geocodeCacheKey);
      
      if (!coordinates) {
        coordinates = await geocodeLocation(extractedLocation);
        
        if (coordinates) {
          // Cache the result
          await cache.set(geocodeCacheKey, coordinates, 3600); // 1 hour TTL
          logger.info(`Location geocoded: ${extractedLocation} -> ${coordinates.lat}, ${coordinates.lng}`);
        }
      } else {
        logger.debug(`Using cached geocoding: ${extractedLocation}`);
      }
    }

    const result = {
      original_description: description,
      extracted_location: extractedLocation,
      coordinates: coordinates,
      success: !!coordinates
    };

    if (!coordinates) {
      result.message = 'Could not extract or geocode location';
    }

    res.json(result);

  } catch (error) {
    logger.error('Error in geocoding:', error);
    res.status(500).json({ error: 'Failed to process geocoding request' });
  }
});

// GET /geocode/location/:name - Direct geocoding of location name
router.get('/location/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Location name is required' });
    }

    const cacheKey = `geocode_${name.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check cache first
    let coordinates = await cache.get(cacheKey);
    
    if (!coordinates) {
      coordinates = await geocodeLocation(name);
      
      if (coordinates) {
        // Cache the result
        await cache.set(cacheKey, coordinates, 3600); // 1 hour TTL
        logger.info(`Location geocoded: ${name} -> ${coordinates.lat}, ${coordinates.lng}`);
      }
    } else {
      logger.debug(`Using cached geocoding: ${name}`);
    }

    res.json({
      location_name: name,
      coordinates: coordinates,
      success: !!coordinates
    });

  } catch (error) {
    logger.error('Error in direct geocoding:', error);
    res.status(500).json({ error: 'Failed to geocode location' });
  }
});

module.exports = router;

