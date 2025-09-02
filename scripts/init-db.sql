-- Initialize Nexus Platform Databases
-- This script creates separate databases for each microservice

-- Create databases
CREATE DATABASE nexus_identity;
CREATE DATABASE nexus_tenant;
CREATE DATABASE nexus_payroll;

-- Create application user
CREATE USER nexus_app WITH PASSWORD 'nexus_app_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nexus_identity TO nexus_app;
GRANT ALL PRIVILEGES ON DATABASE nexus_tenant TO nexus_app;
GRANT ALL PRIVILEGES ON DATABASE nexus_payroll TO nexus_app;

-- Enable extensions for each database
\c nexus_identity;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c nexus_tenant;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c nexus_payroll;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Switch back to default database
\c nexus_dev;
