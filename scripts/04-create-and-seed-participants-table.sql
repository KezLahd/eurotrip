-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participants_initials TEXT,
    participant_name TEXT NOT NULL,
    participant_photo_url TEXT
);

-- Seed data for participants
INSERT INTO participants (participants_initials, participant_name, participant_photo_url) VALUES
('LJ', 'Liam Johnson', '/placeholder.svg?height=100&width=100&text=LJ'),
('SJ', 'Sarah Jones', '/placeholder.svg?height=100&width=100&text=SJ'),
('KJ', 'Kevin Green', '/placeholder.svg?height=100&width=100&text=KJ'),
('PE', 'Patricia Evans', '/placeholder.svg?height=100&width=100&text=PE'),
('CK', 'Chris King', '/placeholder.svg?height=100&width=100&text=CK'),
('NK', 'Nancy Kim', '/placeholder.svg?height=100&width=100&text=NK'),
('OK', 'Oliver Khan', '/placeholder.svg?height=100&width=100&text=OK'),
('SK', 'Sophia Lee', '/placeholder.svg?height=100&width=100&text=SL'),
('GB', 'George Brown', '/placeholder.svg?height=100&width=100&text=GB'),
('HJ', 'Hannah Jones', '/placeholder.svg?height=100&width=100&text=HJ'),
('MB', 'Michael Brown', '/placeholder.svg?height=100&width=100&text=MB'),
('LB', 'Laura Bell', '/placeholder.svg?height=100&width=100&text=LB'),
('KS', 'Karen Smith', '/placeholder.svg?height=100&width=100&text=KS'),
('AJ', 'Andrew Jones', '/placeholder.svg?height=100&width=100&text=AJ'),
('NW', 'Nicole White', '/placeholder.svg?height=100&width=100&text=NW'),
('BB', 'Ben Baker', '/placeholder.svg?height=100&width=100&text=BB'),
('AL', 'Alice', '/placeholder.svg?height=100&width=100&text=AL'),
('BO', 'Bob', '/placeholder.svg?height=100&width=100&text=BO'),
('CH', 'Charlie', '/placeholder.svg?height=100&width=100&text=CH');
