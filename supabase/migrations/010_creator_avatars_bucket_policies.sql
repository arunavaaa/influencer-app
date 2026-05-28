-- Storage RLS policies for creator-avatars bucket
-- Run this once in: Supabase Dashboard → SQL Editor

-- Allow authenticated users to upload/replace their own avatar
CREATE POLICY "creator_avatars_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update (overwrite) their own avatar
CREATE POLICY "creator_avatars_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone (public) to read avatars (needed to display them)
CREATE POLICY "creator_avatars_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-avatars');
