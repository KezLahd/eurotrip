CREATE TABLE IF NOT EXISTS animations (
  id SERIAL NOT NULL,
  name TEXT NOT NULL,
  screen_aspect_ratio TEXT NOT NULL,
  url TEXT NOT NULL,
  CONSTRAINT animations_pkey PRIMARY KEY (id),
  CONSTRAINT animations_name_check CHECK (
    (
      name = ANY (
        ARRAY[
          'initial_load'::TEXT,
          'background'::TEXT,
          'load_animation'::TEXT
        ]
      )
    )
  ),
  CONSTRAINT animations_screen_aspect_ratio_check CHECK (
    (
      screen_aspect_ratio = ANY (ARRAY['16:9'::TEXT, '9:16'::TEXT])
    )
  )
);

-- Seed data for initial_load animation
INSERT INTO animations (name, screen_aspect_ratio, url) VALUES
('initial_load', '16:9', 'https://assets.mixkit.co/videos/preview/mixkit-abstract-light-tunnel-4501-large.mp4')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  screen_aspect_ratio = EXCLUDED.screen_aspect_ratio,
  url = EXCLUDED.url;
