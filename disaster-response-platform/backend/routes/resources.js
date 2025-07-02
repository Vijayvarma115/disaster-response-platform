const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Mock resource data
const mockResources = [
  {
    id: 'resource_1',
    name: 'Red Cross Emergency Shelter',
    location_name: 'Manhattan Community Center',
    location: { lat: 40.7589, lng: -73.9851 },
    type: 'shelter',
    capacity: 200,
    current_occupancy: 45,
    contact: '(212) 555-0123',
    status: 'active',
    services: ['food', 'medical', 'clothing'],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resource_2',
    name: 'NYC Emergency Food Bank',
    location_name: 'Lower East Side',
    location: { lat: 40.7209, lng: -73.9896 },
    type: 'food',
    capacity: 500,
    current_occupancy: 120,
    contact: '(212) 555-0456',
    status: 'active',
    services: ['food', 'water'],
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resource_3',
    name: 'Mount Sinai Emergency Medical',
    location_name: 'Upper East Side',
    location: { lat: 40.7829, lng: -73.9654 },
    type: 'medical',
    capacity: 50,
    current_occupancy: 12,
    contact: '(212) 555-0789',
    status: 'active',
    services: ['medical', 'emergency'],
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resource_4',
    name: 'Brooklyn Relief Center',
    location_name: 'Downtown Brooklyn',
    location: { lat: 40.6892, lng: -73.9442 },
    type: 'shelter',
    capacity: 150,
    current_occupancy: 89,
    contact: '(718) 555-0321',
    status: 'active',
    services: ['shelter', 'food', 'clothing'],
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resource_5',
    name: 'Queens Emergency Supply Hub',
    location_name: 'Flushing, Queens',
    location: { lat: 40.7282, lng: -73.7949 },
    type: 'supplies',
    capacity: 1000,
    current_occupancy: 234,
    contact: '(718) 555-0654',
    status: 'active',
    services: ['supplies', 'clothing', 'tools'],
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  }
];

// Function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Function to filter resources by distance
const filterResourcesByDistance = (resources, lat, lng, radiusKm = 10) => {
  return resources
    .map(resource => ({
      ...resource,
      distance: calculateDistance(lat, lng, resource.location.lat, resource.location.lng)
    }))
    .filter(resource => resource.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

// GET /disasters/:id/resources - Get resources near disaster location
router.get('/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lon, lng, radius = 10, type, status = 'active' } = req.query;

    // Get disaster details
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

    let searchLat, searchLng;

    // Use provided coordinates or disaster location
    if (lat && (lon || lng)) {
      searchLat = parseFloat(lat);
      searchLng = parseFloat(lon || lng);
    } else if (disaster.location) {
      // If disaster has geospatial location stored
      searchLat = disaster.location.coordinates[1]; // PostGIS format: [lng, lat]
      searchLng = disaster.location.coordinates[0];
    } else {
      // Default to NYC center if no location available
      searchLat = 40.7128;
      searchLng = -74.0060;
      logger.warn(`No location data for disaster ${id}, using NYC center`);
    }

    const cacheKey = `resources_${id}_${searchLat}_${searchLng}_${radius}_${type || 'all'}_${status}`;
    
    // Check cache first
    let resources = await cache.get(cacheKey);
    
    if (!resources) {
      // Filter mock resources
      let filteredResources = mockResources.filter(resource => resource.status === status);
      
      // Filter by type if specified
      if (type) {
        filteredResources = filteredResources.filter(resource => resource.type === type);
      }

      // Filter by distance
      resources = filterResourcesByDistance(
        filteredResources, 
        searchLat, 
        searchLng, 
        parseFloat(radius)
      );

      // Cache the results
      await cache.set(cacheKey, resources, 1800); // 30 minutes TTL
      
      logger.info(`Found ${resources.length} resources near disaster ${id}`);
    } else {
      logger.debug(`Using cached resources for disaster ${id}`);
    }

    // Emit real-time update
    req.io.emit('resources_updated', {
      disaster_id: id,
      resources: resources,
      search_location: { lat: searchLat, lng: searchLng },
      radius: parseFloat(radius)
    });

    res.json({
      disaster_id: id,
      search_location: { lat: searchLat, lng: searchLng },
      radius: parseFloat(radius),
      resources: resources,
      count: resources.length,
      filters: { type, status },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error fetching resources for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET /disasters/:id/resources/types - Get available resource types
router.get('/:id/resources/types', async (req, res) => {
  try {
    const { id } = req.params;

    // Get disaster to ensure it exists
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

    const resourceTypes = [
      {
        type: 'shelter',
        name: 'Emergency Shelters',
        description: 'Temporary housing and accommodation',
        icon: 'home',
        count: mockResources.filter(r => r.type === 'shelter').length
      },
      {
        type: 'medical',
        name: 'Medical Facilities',
        description: 'Emergency medical care and treatment',
        icon: 'medical',
        count: mockResources.filter(r => r.type === 'medical').length
      },
      {
        type: 'food',
        name: 'Food Distribution',
        description: 'Food banks and meal distribution centers',
        icon: 'food',
        count: mockResources.filter(r => r.type === 'food').length
      },
      {
        type: 'supplies',
        name: 'Emergency Supplies',
        description: 'Essential supplies and equipment',
        icon: 'supplies',
        count: mockResources.filter(r => r.type === 'supplies').length
      }
    ];

    res.json({
      disaster_id: id,
      resource_types: resourceTypes,
      total_resources: mockResources.length
    });

  } catch (error) {
    logger.error(`Error fetching resource types for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch resource types' });
  }
});

// POST /disasters/:id/resources - Add a new resource
router.post('/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      location_name, 
      lat, 
      lng, 
      type, 
      capacity, 
      contact, 
      services = [] 
    } = req.body;

    // Validation
    if (!name || !location_name || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'location_name', 'type']
      });
    }

    // Get disaster to ensure it exists
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

    // Create resource data
    const resourceData = {
      disaster_id: id,
      name,
      location_name,
      type,
      capacity: capacity || null,
      contact: contact || null,
      services: services,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Add location if coordinates provided
    if (lat && lng) {
      resourceData.location = `POINT(${lng} ${lat})`; // PostGIS format
    }

    const { data, error } = await supabase
      .from('resources')
      .insert([resourceData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Resource created: ${data.id} for disaster ${id} by ${req.user.id}`);

    // Emit real-time update
    req.io.emit('resources_updated', {
      disaster_id: id,
      action: 'create',
      resource: data
    });

    res.status(201).json(data);

  } catch (error) {
    logger.error(`Error creating resource for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// PUT /disasters/:id/resources/:resourceId - Update resource
router.put('/:id/resources/:resourceId', async (req, res) => {
  try {
    const { id, resourceId } = req.params;
    const updates = req.body;

    // Get existing resource
    const { data: existingResource, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .eq('disaster_id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Resource not found' });
      }
      throw fetchError;
    }

    // Update resource
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', resourceId)
      .eq('disaster_id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Resource updated: ${resourceId} for disaster ${id} by ${req.user.id}`);

    // Emit real-time update
    req.io.emit('resources_updated', {
      disaster_id: id,
      action: 'update',
      resource: data
    });

    res.json(data);

  } catch (error) {
    logger.error(`Error updating resource ${req.params.resourceId}:`, error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

module.exports = router;

