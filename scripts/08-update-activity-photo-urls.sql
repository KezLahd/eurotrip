-- Update Eiffel Tower Visit with a more specific placeholder image
UPDATE activities
SET activity_photo_url = '/placeholder.svg?height=400&width=600'
WHERE activity_name = 'Eiffel Tower Visit';

-- Update Colosseum Tour with a more specific placeholder image
UPDATE activities
SET activity_photo_url = '/placeholder.svg?height=400&width=600'
WHERE activity_name = 'Colosseum Tour';

-- Delete Louvre Museum Tour if it exists
DELETE FROM activities WHERE activity_name = 'Louvre Museum Tour';

-- Add a new activity with a specific image URL for demonstration
INSERT INTO activities (activity_name, activity_photo_url, additional_details, booking_reference, city, start_time_local, start_time_utc, end_time_local, end_time_utc, participants, participant_count, location) VALUES
('Louvre Museum Tour', '/placeholder.svg?height=400&width=600', 'Pre-booked tickets', 'ACT004', 'Paris', '2025-07-12 10:30:00+02', '2025-07-12 08:30:00+00', '2025-07-12 13:00:00+02', '2025-07-12 11:00:00+00', 'Alice,Bob', '2', 'Louvre Museum, Paris');
