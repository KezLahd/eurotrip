-- Create transport_tickets table
CREATE TABLE IF NOT EXISTS transport_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT,
    passenger_name TEXT NOT NULL,
    ticket_number TEXT,
    transfer_name TEXT -- ADDED THIS COLUMN
);

-- Seed data for transport_tickets
-- Corrected Bob's entry to link to 'Taxi to Louvre' transfer_name
INSERT INTO transport_tickets (booking_reference, passenger_name, ticket_number, transfer_name) VALUES
('TRF002', 'Alice', 'TKT-PARIS-A1', 'Taxi to Louvre'), -- Linked to the transfer
('TRF002', 'Bob', 'TKT-PARIS-B2', 'Taxi to Louvre'); -- Corrected: now linked to 'Taxi to Louvre'
