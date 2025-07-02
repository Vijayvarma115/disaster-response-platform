-- Database Setup for Disaster Response Coordination Platform
-- This file contains the SQL commands to set up the database schema in Supabase

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table
CREATE TABLE IF NOT EXISTS disasters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS geography type for lat/lng
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    owner_id TEXT NOT NULL,
    audit_trail JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'flagged', 'rejected', 'unrelated')),
    verification_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS geography type for lat/lng
    type TEXT NOT NULL CHECK (type IN ('shelter', 'medical', 'food', 'supplies')),
    capacity INTEGER,
    current_occupancy INTEGER DEFAULT 0,
    contact TEXT,
    services TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cache table for API response caching
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance

-- Geospatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);

-- GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX IF NOT EXISTS disasters_audit_trail_idx ON disasters USING GIN (audit_trail);
CREATE INDEX IF NOT EXISTS reports_verification_data_idx ON reports USING GIN (verification_data);

-- Regular indexes for common queries
CREATE INDEX IF NOT EXISTS disasters_owner_id_idx ON disasters (owner_id);
CREATE INDEX IF NOT EXISTS disasters_created_at_idx ON disasters (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_disaster_id_idx ON reports (disaster_id);
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports (user_id);
CREATE INDEX IF NOT EXISTS reports_verification_status_idx ON reports (verification_status);
CREATE INDEX IF NOT EXISTS resources_disaster_id_idx ON resources (disaster_id);
CREATE INDEX IF NOT EXISTS resources_type_idx ON resources (type);
CREATE INDEX IF NOT EXISTS resources_status_idx ON resources (status);
CREATE INDEX IF NOT EXISTS cache_expires_at_idx ON cache (expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_disasters_updated_at BEFORE UPDATE ON disasters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing

-- Sample disasters
INSERT INTO disasters (title, location_name, location, description, tags, owner_id) VALUES
(
    'NYC Flooding Emergency',
    'Manhattan, NYC',
    ST_SetSRID(ST_Point(-73.9712, 40.7831), 4326)::geography,
    'Heavy flooding in Manhattan due to severe storm. Multiple streets underwater, subway service disrupted.',
    ARRAY['flood', 'emergency', 'urgent'],
    'netrunnerX'
),
(
    'Brooklyn Power Outage',
    'Downtown Brooklyn',
    ST_SetSRID(ST_Point(-73.9442, 40.6892), 4326)::geography,
    'Widespread power outage affecting downtown Brooklyn area. Estimated 50,000 residents without power.',
    ARRAY['power', 'outage', 'infrastructure'],
    'reliefAdmin'
),
(
    'Queens Building Collapse',
    'Flushing, Queens',
    ST_SetSRID(ST_Point(-73.7949, 40.7282), 4326)::geography,
    'Partial building collapse in Flushing. Emergency services on scene, residents evacuated.',
    ARRAY['collapse', 'evacuation', 'critical'],
    'netrunnerX'
);

-- Sample resources
INSERT INTO resources (disaster_id, name, location_name, location, type, capacity, current_occupancy, contact, services, status) VALUES
(
    (SELECT id FROM disasters WHERE title = 'NYC Flooding Emergency' LIMIT 1),
    'Red Cross Emergency Shelter',
    'Manhattan Community Center',
    ST_SetSRID(ST_Point(-73.9851, 40.7589), 4326)::geography,
    'shelter',
    200,
    45,
    '(212) 555-0123',
    ARRAY['food', 'medical', 'clothing'],
    'active'
),
(
    (SELECT id FROM disasters WHERE title = 'NYC Flooding Emergency' LIMIT 1),
    'NYC Emergency Food Bank',
    'Lower East Side',
    ST_SetSRID(ST_Point(-73.9896, 40.7209), 4326)::geography,
    'food',
    500,
    120,
    '(212) 555-0456',
    ARRAY['food', 'water'],
    'active'
),
(
    (SELECT id FROM disasters WHERE title = 'Brooklyn Power Outage' LIMIT 1),
    'Brooklyn Relief Center',
    'Downtown Brooklyn',
    ST_SetSRID(ST_Point(-73.9442, 40.6892), 4326)::geography,
    'shelter',
    150,
    89,
    '(718) 555-0321',
    ARRAY['shelter', 'food', 'clothing'],
    'active'
);

-- Sample reports
INSERT INTO reports (disaster_id, user_id, content, verification_status) VALUES
(
    (SELECT id FROM disasters WHERE title = 'NYC Flooding Emergency' LIMIT 1),
    'citizen1',
    'Water level rising rapidly on 42nd Street. Need immediate assistance for elderly residents on ground floor.',
    'verified'
),
(
    (SELECT id FROM disasters WHERE title = 'Brooklyn Power Outage' LIMIT 1),
    'contributor1',
    'Generator available for emergency use. Located at Brooklyn Heights. Contact for coordination.',
    'verified'
);

-- Create Row Level Security (RLS) policies if needed
-- Note: These are basic examples, adjust based on your security requirements

-- Enable RLS on tables
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- Create policies (these are permissive for the demo, adjust for production)
CREATE POLICY "Allow all operations on disasters" ON disasters FOR ALL USING (true);
CREATE POLICY "Allow all operations on reports" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all operations on resources" ON resources FOR ALL USING (true);
CREATE POLICY "Allow all operations on cache" ON cache FOR ALL USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON disasters TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON resources TO authenticated;
GRANT ALL ON cache TO authenticated;

-- Grant permissions to anonymous users (for public read access if needed)
GRANT SELECT ON disasters TO anon;
GRANT SELECT ON reports TO anon;
GRANT SELECT ON resources TO anon;

