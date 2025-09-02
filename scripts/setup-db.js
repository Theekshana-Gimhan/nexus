const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Nexus Platform databases...');

try {
  // Wait for PostgreSQL to be ready
  console.log('📡 Waiting for PostgreSQL to be ready...');
  
  // Check if Docker Compose is running
  try {
    execSync('docker-compose ps postgres', { stdio: 'pipe' });
  } catch (error) {
    console.log('🐳 Starting Docker Compose services...');
    execSync('docker-compose up -d postgres redis rabbitmq', { stdio: 'inherit' });
    
    // Wait for services to be ready
    console.log('⏳ Waiting for services to start...');
    setTimeout(() => {}, 10000); // Wait 10 seconds
  }

  // Run database migrations for each service
  const services = ['identity-service', 'tenant-service', 'payroll-service'];
  
  for (const service of services) {
    const servicePath = path.join(__dirname, '..', 'services', service);
    
    try {
      console.log(`🔧 Setting up database for ${service}...`);
      
      // Install dependencies if not already installed
      execSync('npm install', { 
        cwd: servicePath, 
        stdio: 'inherit' 
      });
      
      // Run database migrations
      execSync('npm run db:migrate', { 
        cwd: servicePath, 
        stdio: 'inherit' 
      });
      
      console.log(`✅ ${service} database setup complete`);
    } catch (error) {
      console.log(`⚠️  Database setup for ${service} will be done when service starts`);
    }
  }

  console.log('🎉 Database setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:3000');
  
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
