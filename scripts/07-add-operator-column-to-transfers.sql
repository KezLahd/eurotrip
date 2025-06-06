ALTER TABLE transfers
ADD COLUMN operator TEXT;

-- Update existing data to include an operator for demonstration
UPDATE transfers
SET operator = 'Paris Taxis'
WHERE transfer_name = 'Taxi to Louvre';

-- Update the ferry entry to include the operator from the image
UPDATE transfers
SET operator = 'Hellenic High Speed'
WHERE transfer_name = 'Ferry Athens to Paros';
