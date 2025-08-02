-- Initialize FlowCraft database
-- Database is already created by POSTGRES_DB environment variable

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant all privileges to flowcraft user
GRANT ALL PRIVILEGES ON DATABASE flowcraft TO flowcraft;
GRANT ALL PRIVILEGES ON SCHEMA public TO flowcraft;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flowcraft;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flowcraft;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO flowcraft;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO flowcraft;

-- Set timezone
SET timezone = 'UTC'; 