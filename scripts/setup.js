#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Nexus Platform Development Setup');
console.log('====================================');

// Check if Docker is running
function checkDockerRunning() {
  try {
    execSync('docker info', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Docker Compose is available
function checkDockerCompose() {
  try {
    execSync('docker-compose --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    try {
      execSync('docker compose version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Setup environment files
function setupEnvironmentFiles() {
  console.log('📁 Setting up environment files...');
  
  const services = ['identity-service', 'tenant-service', 'payroll-service'];
  
  services.forEach(service => {
    const envPath = path.join(__dirname, '..', 'services', service, '.env');
    const envExamplePath = path.join(__dirname, '..', 'services', service, '.env.example');
    
    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log(`  ✅ Created .env for ${service}`);
    }
  });
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  // Root dependencies
  console.log('  Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Service dependencies
  const services = ['identity-service', 'tenant-service', 'payroll-service'];
  
  services.forEach(service => {
    console.log(`  Installing dependencies for ${service}...`);
    const servicePath = path.join(__dirname, '..', 'services', service);
    try {
      execSync('npm install', { cwd: servicePath, stdio: 'inherit' });
    } catch (error) {
      console.log(`    ⚠️  Failed to install dependencies for ${service}`);
    }
  });
  
  // Frontend dependencies
  console.log('  Installing frontend dependencies...');
  const frontendPath = path.join(__dirname, '..', 'frontend');
  if (fs.existsSync(frontendPath)) {
    try {
      execSync('npm install', { cwd: frontendPath, stdio: 'inherit' });
    } catch (error) {
      console.log('    ⚠️  Failed to install frontend dependencies');
    }
  }
}

// Main setup function
async function main() {
  try {
    // Check prerequisites
    console.log('🔍 Checking prerequisites...');
    
    if (!checkDockerRunning()) {
      console.log('❌ Docker is not running. Please start Docker Desktop and try again.');
      console.log('   Download from: https://www.docker.com/products/docker-desktop');
      process.exit(1);
    }
    console.log('  ✅ Docker is running');
    
    if (!checkDockerCompose()) {
      console.log('❌ Docker Compose is not available');
      process.exit(1);
    }
    console.log('  ✅ Docker Compose is available');
    
    // Setup environment files
    setupEnvironmentFiles();
    
    // Install dependencies
    installDependencies();
    
    // Start infrastructure services
    console.log('🐳 Starting infrastructure services...');
    execSync('docker-compose up postgres redis rabbitmq -d', { stdio: 'inherit' });
    
    // Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('');
    console.log('🎉 Setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000 (when frontend is ready)');
    console.log('3. API Gateway: http://localhost:8080');
    console.log('4. Identity Service: http://localhost:3001/health');
    console.log('');
    console.log('Useful commands:');
    console.log('- npm run docker:up    # Start all services with Docker');
    console.log('- npm run docker:down  # Stop all Docker services');
    console.log('- npm run dev          # Start all services in development mode');
    console.log('- npm test             # Run tests');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
