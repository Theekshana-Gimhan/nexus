// Quick mock backend for integration testing
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for localhost:3004
app.use(cors({
  origin: ['http://localhost:3004', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Mock tenant data
const mockTenants = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Acme Corporation',
    domain: 'acme',
    status: 'active',
    settings: {
      currency: 'LKR',
      maxUsers: 100,
      features: ['basic_features', 'advanced_features']
    },
    createdAt: '2024-01-15T10:00:00Z',
    adminEmail: 'admin@acme.com'
  },
  {
    id: 'a123b456-789c-4012-3def-456789abcdef',
    name: 'TechStart Ltd',
    domain: 'techstart',
    status: 'active',
    settings: {
      currency: 'USD',
      maxUsers: 50,
      features: ['basic_features']
    },
    createdAt: '2024-02-01T14:30:00Z',
    adminEmail: 'admin@techstart.com'
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mock-api-gateway',
    timestamp: new Date().toISOString() 
  });
});

// Mock auth middleware (just check for Bearer token)
const mockAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Mock user context
  req.user = { id: 'mock-user-id', email: 'admin@nexus.lk' };
  req.tenant = { id: 'mock-tenant-id', domain: 'nexus' };
  next();
};

// Get all tenants
app.get('/api/v1/tenants', mockAuth, (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  let filteredTenants = mockTenants;
  
  // Apply search filter
  if (search) {
    filteredTenants = mockTenants.filter(tenant => 
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const total = filteredTenants.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedTenants,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  });
});

// Get single tenant
app.get('/api/v1/tenants/:id', mockAuth, (req, res) => {
  const tenant = mockTenants.find(t => t.id === req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }
  
  res.json({ success: true, data: tenant });
});

// Create tenant
app.post('/api/v1/tenants', mockAuth, (req, res) => {
  const { name, domain, adminEmail, plan = 'basic' } = req.body;
  
  // Basic validation
  if (!name || !domain || !adminEmail) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name, domain, and admin email are required' 
    });
  }
  
  // Check domain uniqueness
  if (mockTenants.find(t => t.domain === domain)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Domain already exists' 
    });
  }
  
  const newTenant = {
    id: 'new-' + Date.now(),
    name,
    domain,
    status: 'active',
    settings: {
      currency: 'LKR',
      maxUsers: plan === 'professional' ? 100 : 25,
      features: plan === 'professional' ? ['basic_features', 'advanced_features'] : ['basic_features']
    },
    createdAt: new Date().toISOString(),
    adminEmail
  };
  
  mockTenants.push(newTenant);
  
  res.status(201).json({ success: true, data: newTenant });
});

// Update tenant
app.put('/api/v1/tenants/:id', mockAuth, (req, res) => {
  const tenantIndex = mockTenants.findIndex(t => t.id === req.params.id);
  if (tenantIndex === -1) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }
  
  const updatedTenant = { ...mockTenants[tenantIndex], ...req.body };
  mockTenants[tenantIndex] = updatedTenant;
  
  res.json({ success: true, data: updatedTenant });
});

// Delete tenant
app.delete('/api/v1/tenants/:id', mockAuth, (req, res) => {
  const tenantIndex = mockTenants.findIndex(t => t.id === req.params.id);
  if (tenantIndex === -1) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }
  
  mockTenants.splice(tenantIndex, 1);
  res.json({ success: true, message: 'Tenant deleted successfully' });
});

// Debug endpoint
app.get('/internal/debug/proxy-tenants', (req, res) => {
  res.json({
    service: 'mock-api-gateway',
    endpoint: '/internal/debug/proxy-tenants',
    tenantCount: mockTenants.length,
    tenants: mockTenants.map(t => ({ id: t.id, name: t.name, domain: t.domain }))
  });
});

const PORT = 3008;
app.listen(PORT, () => {
  console.log(`🚀 Mock API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Tenants API: http://localhost:${PORT}/api/v1/tenants`);
  console.log(`🔍 Debug endpoint: http://localhost:${PORT}/internal/debug/proxy-tenants`);
  console.log(`\n🔑 Use Authorization: Bearer mock-jwt-token`);
});
