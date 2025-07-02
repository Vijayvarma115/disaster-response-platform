const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Mock Gemini API for image verification
const verifyImageWithGemini = async (imageUrl) => {
  // In a real implementation, this would call the Google Gemini API
  // For now, we'll simulate image verification with mock analysis
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock verification results based on image URL patterns
  const verificationResults = {
    authenticity_score: Math.random() * 100, // 0-100 score
    manipulation_detected: Math.random() > 0.8, // 20% chance of manipulation
    disaster_context: Math.random() > 0.3, // 70% chance of disaster context
    confidence: Math.random() * 40 + 60, // 60-100% confidence
    analysis: {
      image_quality: Math.random() > 0.2 ? 'good' : 'poor',
      lighting_consistency: Math.random() > 0.15 ? 'consistent' : 'inconsistent',
      metadata_intact: Math.random() > 0.1 ? true : false,
      reverse_image_search: Math.random() > 0.9 ? 'found_elsewhere' : 'unique'
    }
  };

  // Generate contextual analysis based on mock patterns
  let contextAnalysis = '';
  let verificationStatus = 'verified';

  if (verificationResults.manipulation_detected) {
    contextAnalysis = 'Potential image manipulation detected. Signs of digital alteration found in pixel analysis.';
    verificationStatus = 'flagged';
  } else if (!verificationResults.disaster_context) {
    contextAnalysis = 'Image does not appear to show disaster-related content. May be unrelated to reported incident.';
    verificationStatus = 'unrelated';
  } else if (verificationResults.authenticity_score > 80) {
    contextAnalysis = 'Image appears authentic and shows disaster-related content. High confidence in verification.';
    verificationStatus = 'verified';
  } else if (verificationResults.authenticity_score > 50) {
    contextAnalysis = 'Image shows some signs of authenticity but requires manual review for final verification.';
    verificationStatus = 'pending';
  } else {
    contextAnalysis = 'Low authenticity score. Image may be manipulated or unrelated to disaster context.';
    verificationStatus = 'rejected';
  }

  return {
    ...verificationResults,
    context_analysis: contextAnalysis,
    verification_status: verificationStatus,
    verified_at: new Date().toISOString(),
    verification_method: 'gemini_ai'
  };
};

// POST /disasters/:id/verify-image - Verify image authenticity
router.post('/:id/verify-image', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, report_id } = req.body;

    if (!image_url) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'image_url is required'
      });
    }

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

    // Check cache first
    const cacheKey = `image_verification_${Buffer.from(image_url).toString('base64')}`;
    let verificationResult = await cache.get(cacheKey);

    if (!verificationResult) {
      // Perform image verification with Gemini API
      verificationResult = await verifyImageWithGemini(image_url);
      
      // Cache the result
      await cache.set(cacheKey, verificationResult, 7200); // 2 hours TTL
      
      logger.info(`Image verified for disaster ${id}: ${verificationResult.verification_status}`);
    } else {
      logger.debug(`Using cached image verification for ${image_url}`);
    }

    // If report_id is provided, update the report with verification status
    if (report_id) {
      try {
        const { error: updateError } = await supabase
          .from('reports')
          .update({ 
            verification_status: verificationResult.verification_status,
            verification_data: verificationResult
          })
          .eq('id', report_id)
          .eq('disaster_id', id);

        if (updateError) {
          logger.error(`Error updating report ${report_id} with verification:`, updateError);
        } else {
          logger.info(`Report ${report_id} updated with verification status: ${verificationResult.verification_status}`);
        }
      } catch (updateError) {
        logger.error(`Error updating report verification:`, updateError);
      }
    }

    // Create verification record
    const verificationRecord = {
      disaster_id: id,
      image_url: image_url,
      report_id: report_id || null,
      verification_status: verificationResult.verification_status,
      authenticity_score: verificationResult.authenticity_score,
      confidence: verificationResult.confidence,
      analysis_data: verificationResult,
      verified_by: req.user.id,
      verified_at: verificationResult.verified_at
    };

    // Store verification in database (if we had a verifications table)
    // For now, we'll just return the result

    res.json({
      disaster_id: id,
      image_url: image_url,
      report_id: report_id,
      verification: verificationResult,
      verified_by: req.user.id,
      message: 'Image verification completed'
    });

  } catch (error) {
    logger.error(`Error verifying image for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to verify image' });
  }
});

// GET /disasters/:id/verify-image/batch - Verify multiple images
router.post('/:id/verify-image/batch', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_urls } = req.body;

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'image_urls array is required'
      });
    }

    if (image_urls.length > 10) {
      return res.status(400).json({ 
        error: 'Too many images',
        message: 'Maximum 10 images can be verified at once'
      });
    }

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

    const verificationResults = [];

    // Process each image
    for (const imageUrl of image_urls) {
      try {
        const cacheKey = `image_verification_${Buffer.from(imageUrl).toString('base64')}`;
        let verificationResult = await cache.get(cacheKey);

        if (!verificationResult) {
          verificationResult = await verifyImageWithGemini(imageUrl);
          await cache.set(cacheKey, verificationResult, 7200); // 2 hours TTL
        }

        verificationResults.push({
          image_url: imageUrl,
          verification: verificationResult,
          success: true
        });

      } catch (error) {
        logger.error(`Error verifying image ${imageUrl}:`, error);
        verificationResults.push({
          image_url: imageUrl,
          verification: null,
          success: false,
          error: 'Verification failed'
        });
      }
    }

    const successCount = verificationResults.filter(r => r.success).length;
    const failureCount = verificationResults.length - successCount;

    logger.info(`Batch verification for disaster ${id}: ${successCount} successful, ${failureCount} failed`);

    res.json({
      disaster_id: id,
      total_images: image_urls.length,
      successful_verifications: successCount,
      failed_verifications: failureCount,
      results: verificationResults,
      verified_by: req.user.id,
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error in batch image verification for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to perform batch image verification' });
  }
});

// GET /disasters/:id/verify-image/stats - Get verification statistics
router.get('/:id/verify-image/stats', async (req, res) => {
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

    // In a real implementation, this would query the verifications table
    // For now, we'll return mock statistics
    const mockStats = {
      total_images_verified: Math.floor(Math.random() * 100) + 20,
      verified_count: Math.floor(Math.random() * 60) + 15,
      flagged_count: Math.floor(Math.random() * 10) + 2,
      pending_count: Math.floor(Math.random() * 15) + 3,
      rejected_count: Math.floor(Math.random() * 8) + 1,
      unrelated_count: Math.floor(Math.random() * 5) + 1,
      average_authenticity_score: Math.random() * 30 + 70,
      average_confidence: Math.random() * 20 + 80,
      verification_methods: {
        gemini_ai: Math.floor(Math.random() * 80) + 15,
        manual_review: Math.floor(Math.random() * 20) + 5
      }
    };

    res.json({
      disaster_id: id,
      verification_stats: mockStats,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error fetching verification stats for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch verification statistics' });
  }
});

// GET /disasters/:id/verify-image/flagged - Get flagged images
router.get('/:id/verify-image/flagged', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

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

    // In a real implementation, this would query flagged verifications
    // For now, we'll return mock flagged images
    const mockFlaggedImages = [
      {
        id: 'flagged_1',
        image_url: 'https://example.com/suspicious_flood_image.jpg',
        verification_status: 'flagged',
        authenticity_score: 25.5,
        confidence: 85.2,
        reason: 'Potential digital manipulation detected',
        flagged_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        verified_by: 'system'
      },
      {
        id: 'flagged_2',
        image_url: 'https://example.com/questionable_damage.jpg',
        verification_status: 'flagged',
        authenticity_score: 45.8,
        confidence: 72.1,
        reason: 'Inconsistent lighting patterns',
        flagged_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        verified_by: 'system'
      }
    ];

    res.json({
      disaster_id: id,
      flagged_images: mockFlaggedImages.slice(0, parseInt(limit)),
      count: mockFlaggedImages.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error fetching flagged images for disaster ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch flagged images' });
  }
});

module.exports = router;

