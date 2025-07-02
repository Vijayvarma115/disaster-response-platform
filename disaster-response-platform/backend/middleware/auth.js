const logger = require('../utils/logger');

// Mock users for authentication
const mockUsers = {
  'netrunnerX': {
    id: 'netrunnerX',
    role: 'admin',
    name: 'NetRunner X'
  },
  'reliefAdmin': {
    id: 'reliefAdmin',
    role: 'admin',
    name: 'Relief Admin'
  },
  'contributor1': {
    id: 'contributor1',
    role: 'contributor',
    name: 'Contributor One'
  },
  'citizen1': {
    id: 'citizen1',
    role: 'contributor',
    name: 'Citizen One'
  }
};

const authMiddleware = (req, res, next) => {
  // Get user ID from header (in real app, this would be from JWT token)
  const userId = req.headers['x-user-id'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide x-user-id header or Authorization header'
    });
  }

  const user = mockUsers[userId];
  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid user',
      message: 'User not found in system'
    });
  }

  // Add user to request object
  req.user = user;
  
  logger.debug(`Authenticated user: ${user.id} (${user.role})`);
  next();
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole, mockUsers };

