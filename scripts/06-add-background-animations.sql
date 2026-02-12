-- Delete existing background animations first to avoid duplicates
DELETE FROM animations WHERE name = 'background';

-- Insert background animations
INSERT INTO animations (name, screen_aspect_ratio, url) VALUES
('background', '16:9', '/placeholder.svg?height=1080&width=1920'),
('background', '9:16', '/placeholder.svg?height=1920&width=1080');
