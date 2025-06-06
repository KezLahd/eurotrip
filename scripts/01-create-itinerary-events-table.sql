CREATE TABLE IF NOT EXISTS itinerary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'flight', 'accommodation', 'transfer', 'activity', 'car_hire'
    description TEXT,
    booking_reference TEXT,
    leave_time_local TIMESTAMPTZ,
    arrive_time_local TIMESTAMPTZ,
    leave_time_universal TIMESTAMPTZ,
    arrive_time_universal TIMESTAMPTZ,
    passengers TEXT[], -- Array of passenger names
    participants TEXT[], -- Array of participant names for activities/transfers
    leave_location TEXT,
    arrive_location TEXT,
    airline TEXT,
    room_number TEXT,
    breakfast_provided BOOLEAN,
    notes TEXT,
    price DECIMAL(10, 2),
    currency TEXT,
    start_date DATE,
    end_date DATE,
    location TEXT, -- General location for activities/accommodations
    company TEXT -- For car hire/transfer companies
);

-- Seed data
INSERT INTO itinerary_events (
    event_type, description, booking_reference, leave_time_local, arrive_time_local,
    leave_time_universal, arrive_time_universal, passengers, leave_location, arrive_location,
    airline, start_date, end_date, location, notes, participants, room_number, breakfast_provided, company
) VALUES
('flight', 'Flight to Paris', 'FLT789', '2025-07-10 10:00:00+02', '2025-07-10 12:00:00+02',
 '2025-07-10 08:00:00+00', '2025-07-10 10:00:00+00', ARRAY['Alice', 'Bob'], 'London Heathrow (LHR)', 'Paris Charles de Gaulle (CDG)',
 'Air France', '2025-07-10', '2025-07-10', 'Paris', 'Check-in 2 hours prior', NULL, NULL, NULL, NULL),

('accommodation', 'Hotel stay in Paris', 'HOTEL123', NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 NULL, '2025-07-10', '2025-07-14', 'Paris', 'Near Eiffel Tower', NULL, 'Room 101', TRUE, NULL),
('accommodation', 'Hotel stay in Paris', 'HOTEL123', NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 NULL, '2025-07-10', '2025-07-14', 'Paris', 'Near Eiffel Tower', NULL, 'Room 102', TRUE, NULL),

('activity', 'Eiffel Tower Visit', 'ACT001', '2025-07-11 15:00:00+02', '2025-07-11 17:00:00+02',
 '2025-07-11 13:00:00+00', '2025-07-11 15:00:00+00', NULL, NULL, NULL,
 NULL, '2025-07-11', '2025-07-11', 'Eiffel Tower, Paris', 'Booked tickets online', ARRAY['Alice', 'Bob', 'Charlie'], NULL, NULL, NULL),

('transfer', 'Taxi to Louvre', 'TRF002', '2025-07-12 09:30:00+02', '2025-07-12 10:00:00+02',
 '2025-07-12 07:30:00+00', '2025-07-12 08:00:00+00', NULL, 'Hotel in Paris', 'Louvre Museum',
 NULL, '2025-07-12', '2025-07-12', 'Paris', 'Meet at hotel lobby', ARRAY['Alice', 'Bob'], NULL, NULL, 'Paris Taxis'),

('car_hire', 'Rental Car Pickup', 'CAR456', '2025-07-14 10:00:00+02', '2025-07-14 10:30:00+02',
 '2025-07-14 08:00:00+00', '2025-07-14 08:30:00+00', NULL, 'Paris CDG Airport', 'Paris CDG Airport',
 NULL, '2025-07-14', '2025-07-20', 'Paris', 'Full tank required on return', NULL, NULL, NULL, 'Europcar'),
('car_hire', 'Rental Car Dropoff', 'CAR456', '2025-07-20 14:00:00+02', '2025-07-20 14:30:00+02',
 '2025-07-20 12:00:00+00', '2025-07-20 12:30:00+00', NULL, 'Rome FCO Airport', 'Rome FCO Airport',
 NULL, '2025-07-20', '2025-07-20', 'Rome', 'Return at Terminal 3', NULL, NULL, NULL, 'Europcar'),

('flight', 'Flight to Rome', 'FLT901', '2025-07-14 15:00:00+02', '2025-07-14 17:00:00+02',
 '2025-07-14 13:00:00+00', '2025-07-14 15:00:00+00', ARRAY['Alice', 'Bob'], 'Paris Charles de Gaulle (CDG)', 'Rome Fiumicino (FCO)',
 'Alitalia', '2025-07-14', '2025-07-14', 'Rome', 'Gate 23', NULL, NULL, NULL, NULL),

('accommodation', 'Apartment in Rome', 'APT789', NULL, NULL, NULL, NULL, NULL, NULL, NULL,
 NULL, '2025-07-14', '2025-07-20', 'Rome', 'Near Colosseum', NULL, 'Main Apartment', FALSE, NULL),

('activity', 'Colosseum Tour', 'ACT003', '2025-07-15 10:00:00+02', '2025-07-15 12:00:00+02',
 '2025-07-15 08:00:00+00', '2025-07-15 10:00:00+00', NULL, NULL, NULL,
 NULL, '2025-07-15', '2025-07-15', 'Colosseum, Rome', 'Guided tour', ARRAY['Alice', 'Bob'], NULL, NULL, NULL);
