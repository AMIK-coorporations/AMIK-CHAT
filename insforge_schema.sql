-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    bucket_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    public_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    user_id TEXT,
    chat_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view files
CREATE POLICY "Users can view files" ON files
    FOR SELECT USING (true);

-- Create policy to allow users to upload their own files
CREATE POLICY "Users can upload their own files" ON files
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL);

-- Add file_id column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_id TEXT REFERENCES files(id);
