const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const { requireRole } = require('../middleware/auth');

// GET /disasters - Get all disasters with optional filtering
router.get('/', async (req, res) => {
  try {
    const { tag, owner_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('disasters')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    logger.info(`Retrieved ${data.length} disasters`);
    res.json({
      disasters: data,
      count: data.length,
      filters: { tag, owner_id }
    });

  } catch (error) {
    logger.error('Error fetching disasters:', error);
    res.status(500).json({ error: 'Failed to fetch disasters' });
  }
});

// GET /disasters/:id - Get specific disaster
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw error;
    }

    logger.info(`Retrieved disaster: ${id}`);
    res.json(data);

  } catch (error) {
    logger.error(`Error fetching disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch disaster' });
  }
});

// POST /disasters - Create new disaster
router.post('/', async (req, res) => {
  try {
    const { title, location_name, description, tags = [] } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'description']
      });
    }

    // Create audit trail entry
    const auditEntry = {
      action: 'create',
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

    const disasterData = {
      title,
      location_name,
      description,
      tags,
      owner_id: req.user.id,
      audit_trail: [auditEntry],
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('disasters')
      .insert([disasterData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Disaster created: ${data.id} by ${req.user.id}`);

    // Emit real-time update
    req.io.emit('disaster_updated', {
      action: 'create',
      disaster: data
    });

    res.status(201).json(data);

  } catch (error) {
    logger.error('Error creating disaster:', error);
    res.status(500).json({ error: 'Failed to create disaster' });
  }
});

// PUT /disasters/:id - Update disaster
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location_name, description, tags } = req.body;

    // First, get the existing disaster to check ownership and get current audit trail
    const { data: existingDisaster, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw fetchError;
    }

    // Check ownership or admin role
    if (existingDisaster.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this disaster' });
    }

    // Create new audit trail entry
    const auditEntry = {
      action: 'update',
      user_id: req.user.id,
      timestamp: new Date().toISOString(),
      changes: { title, location_name, description, tags }
    };

    const updatedAuditTrail = [...(existingDisaster.audit_trail || []), auditEntry];

    const updateData = {
      ...(title !== undefined && { title }),
      ...(location_name !== undefined && { location_name }),
      ...(description !== undefined && { description }),
      ...(tags !== undefined && { tags }),
      audit_trail: updatedAuditTrail
    };

    const { data, error } = await supabase
      .from('disasters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Disaster updated: ${id} by ${req.user.id}`);

    // Emit real-time update
    req.io.emit('disaster_updated', {
      action: 'update',
      disaster: data
    });

    res.json(data);

  } catch (error) {
    logger.error(`Error updating disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update disaster' });
  }
});

// DELETE /disasters/:id - Delete disaster
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the existing disaster to check if it exists
    const { data: existingDisaster, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw fetchError;
    }

    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info(`Disaster deleted: ${id} by ${req.user.id}`);

    // Emit real-time update
    req.io.emit('disaster_updated', {
      action: 'delete',
      disaster: { id, ...existingDisaster }
    });

    res.json({ message: 'Disaster deleted successfully', id });

  } catch (error) {
    logger.error(`Error deleting disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete disaster' });
  }
});

module.exports = router;

