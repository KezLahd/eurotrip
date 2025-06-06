-- Switch to service_role which has the necessary permissions
SET ROLE service_role;

-- Create the bucket if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'travel-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('travel-images', 'travel-images', true);
  END IF;
END $$;

-- Drop existing policies if they exist
DELETE FROM storage.policies 
WHERE bucket_id = 'travel-images';

-- Create new policies
INSERT INTO storage.policies (name, definition, bucket_id, operation)
VALUES 
  (
    'Allow authenticated users to upload images',
    '(bucket_id = ''travel-images''::text AND (storage.foldername(name))[1] = ''activities''::text)',
    'travel-images',
    'INSERT'
  ),
  (
    'Allow public read access to travel-images',
    '(bucket_id = ''travel-images''::text)',
    'travel-images',
    'SELECT'
  ),
  (
    'Allow authenticated users to update their images',
    '(bucket_id = ''travel-images''::text AND (storage.foldername(name))[1] = ''activities''::text)',
    'travel-images',
    'UPDATE'
  ),
  (
    'Allow authenticated users to delete their images',
    '(bucket_id = ''travel-images''::text AND (storage.foldername(name))[1] = ''activities''::text)',
    'travel-images',
    'DELETE'
  );

-- Switch back to postgres role
SET ROLE postgres; 