-- 1. Enable Row Level Security on Database Tables
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

-- 2. Policies for 'decks' Table
CREATE POLICY "Users can only view their own decks"
ON public.decks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
ON public.decks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
ON public.decks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
ON public.decks FOR DELETE
USING (auth.uid() = user_id);

-- 3. Policies for 'sponsors' Table
CREATE POLICY "Users can view their own sponsors"
ON public.sponsors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sponsors"
ON public.sponsors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sponsors"
ON public.sponsors FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sponsors"
ON public.sponsors FOR DELETE
USING (auth.uid() = user_id);

-- 4. Policies for 'generation_history' Table
CREATE POLICY "Users can view their own history"
ON public.generation_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
ON public.generation_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
ON public.generation_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.generation_history FOR DELETE
USING (auth.uid() = user_id);

-- 5. Storage Policies for 'master-decks' Bucket
-- (RLS is already enabled by default on storage.objects)

-- Allow public read access to all files (Needed for backend httpx downloads)
CREATE POLICY "Public Download Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'master-decks');

-- Allow authenticated users to upload files ONLY to their own folder (folder name must match user_id)
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'master-decks' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow authenticated users to update files ONLY in their own folder
CREATE POLICY "Users can update their own folder"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'master-decks' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow authenticated users to delete files ONLY in their own folder
CREATE POLICY "Users can delete their own folder"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'master-decks' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
);
