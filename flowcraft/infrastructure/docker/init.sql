-- Initialize FlowCraft database
CREATE DATABASE flowcraft;
\c flowcraft;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC'; 