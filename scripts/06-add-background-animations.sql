INSERT INTO animations (name, screen_aspect_ratio, url) VALUES
('background', '16:9', '/placeholder.svg?height=1080&width=1920'),
('background', '9:16', '/placeholder.svg?height=1920&width=1080')
ON CONFLICT (name, screen_aspect_ratio) DO UPDATE SET
  url = EXCLUDED.url;
