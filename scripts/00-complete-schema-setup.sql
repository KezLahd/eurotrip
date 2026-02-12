-- Complete Database Schema Setup for Summer Trail Web App
-- This script creates all tables and seeds initial data

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    departure_city TEXT,
    flight_photo_url TEXT,
    arrival_city TEXT,
    departure_time_local TEXT,
    departure_time_utc TEXT,
    arrival_time_local TEXT,
    arrival_time_utc TEXT,
    flight_number TEXT,
    passengers TEXT,
    passenger_count TEXT,
    booking_reference TEXT
);

-- Accommodation table
CREATE TABLE IF NOT EXISTS accomodation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accomodation_name TEXT,
    hotel_city TEXT,
    hotel_name TEXT,
    hotel_photo_url TEXT,
    hotel_address TEXT,
    date_check_in_local TEXT,
    date_check_in_utc TEXT,
    date_check_out TEXT,
    date_check_out_utc TEXT,
    participants TEXT,
    participant_count TEXT,
    booking_reference TEXT,
    breakfast_included TEXT
);

-- Room configuration table
CREATE TABLE IF NOT EXISTS room_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accomodation_name TEXT,
    room_type TEXT,
    participants TEXT,
    participant_count TEXT,
    booking_reference TEXT
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_name TEXT,
    transfer_photo_url TEXT,
    transport_method TEXT,
    departure_location TEXT,
    arrival_location TEXT,
    departure_time_local TEXT,
    departure_time_utc TEXT,
    arrival_time_local TEXT,
    arrival_time_utc TEXT,
    participants TEXT,
    participant_count TEXT,
    booking_reference TEXT,
    operator TEXT
);

-- Car hires table
CREATE TABLE IF NOT EXISTS car_hires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_photo_url TEXT,
    pickup_location TEXT,
    dropoff_location TEXT,
    city_name TEXT,
    pickup_time_local TEXT,
    pickup_time_utc TEXT,
    dropoff_time_local TEXT,
    dropoff_time_utc TEXT,
    driver TEXT,
    passengers TEXT,
    booking_reference TEXT
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name TEXT,
    activity_photo_url TEXT,
    additional_details TEXT,
    booking_reference TEXT,
    city TEXT,
    start_time_local TEXT,
    start_time_utc TEXT,
    end_time_local TEXT,
    end_time_utc TEXT,
    participants TEXT,
    participant_count TEXT,
    location TEXT
);

-- Transport tickets table
CREATE TABLE IF NOT EXISTS transport_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT,
    passenger_name TEXT NOT NULL,
    ticket_number TEXT,
    transfer_name TEXT
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participants_initials TEXT,
    participant_name TEXT NOT NULL,
    participant_photo_url TEXT
);

-- Animations table
CREATE TABLE IF NOT EXISTS animations (
    id SERIAL NOT NULL,
    name TEXT NOT NULL,
    screen_aspect_ratio TEXT NOT NULL,
    url TEXT NOT NULL,
    CONSTRAINT animations_pkey PRIMARY KEY (id),
    CONSTRAINT animations_name_check CHECK (
        name = ANY (ARRAY['initial_load'::TEXT, 'background'::TEXT, 'load_animation'::TEXT])
    ),
    CONSTRAINT animations_screen_aspect_ratio_check CHECK (
        screen_aspect_ratio = ANY (ARRAY['16:9'::TEXT, '9:16'::TEXT])
    )
);

-- ============================================
-- 2. SEED DATA
-- ============================================

-- Seed flights
INSERT INTO flights (departure_city, flight_photo_url, arrival_city, departure_time_local, departure_time_utc, arrival_time_local, arrival_time_utc, passengers, flight_number, booking_reference) VALUES
('London Heathrow (LHR)', '/placeholder.svg?height=400&width=600', 'Paris Charles de Gaulle (CDG)', '10/07/2025 @ 10:00', '2025-07-10T08:00:00Z', '10/07/2025 @ 12:00', '2025-07-10T10:00:00Z', 'Alice,Bob', 'AF123', 'FLT789'),
('Paris Charles de Gaulle (CDG)', '/placeholder.svg?height=400&width=600', 'Rome Fiumicino (FCO)', '14/07/2025 @ 15:00', '2025-07-14T13:00:00Z', '14/07/2025 @ 17:00', '2025-07-14T15:00:00Z', 'Alice,Bob', 'AZ456', 'FLT901');

-- Seed accommodation
INSERT INTO accomodation (accomodation_name, hotel_city, hotel_name, hotel_photo_url, hotel_address, date_check_in_local, date_check_in_utc, date_check_out, date_check_out_utc, participants, participant_count, booking_reference, breakfast_included) VALUES
('Hotel stay in Paris', 'Paris', 'Hotel de Ville', '/placeholder.svg?height=400&width=600', '123 Rue de Rivoli, Paris', '10/07/2025 @ 15:00', '2025-07-10T13:00:00Z', '14/07/2025 @ 11:00', '2025-07-14T09:00:00Z', 'Alice,Bob', '2', 'HOTEL123', 'Y'),
('Apartment in Rome', 'Rome', 'Roman Holiday Apartments', '/placeholder.svg?height=400&width=600', 'Via del Corso, Rome', '14/07/2025 @ 16:00', '2025-07-14T14:00:00Z', '20/07/2025 @ 10:00', '2025-07-20T08:00:00Z', 'Alice,Bob', '2', 'APT789', 'N'),
('Hotel stay in Sydney', 'Sydney', 'Airport Rydges Sydney', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-stOXJkp5bdiGjoyrcIY2YzPl6JgLHP.png', 'Sydney Airport, 8 Arrival Ct, Mascot New South Wales 2020', '15/06/2025 @ 05:00', '2025-06-14T19:00:00Z', '16/06/2025 @ 10:00', '2025-06-16T00:00:00Z', 'LJ,SJ,KJ,PE,HJ,GB,OK,SK,CK,NK', '10', 'RYDGES456', 'Y');

-- Seed room configuration
INSERT INTO room_configuration (accomodation_name, room_type, participants, participant_count, booking_reference) VALUES
('Airport Rydges Sydney', 'Standard Room', 'LJ,SJ', '2', 'RYDGES456'),
('Airport Rydges Sydney', 'Deluxe Suite', 'KJ,PE', '2', 'RYDGES456'),
('Airport Rydges Sydney', 'Family Room', 'HJ,GB,OK', '3', 'RYDGES456'),
('Airport Rydges Sydney', 'Executive King', 'SK,CK,NK', '3', 'RYDGES456');

-- Seed transfers
INSERT INTO transfers (transfer_name, transfer_photo_url, transport_method, departure_location, arrival_location, departure_time_local, departure_time_utc, arrival_time_local, arrival_time_utc, participants, participant_count, booking_reference, operator) VALUES
('Taxi to Louvre', '/placeholder.svg?height=400&width=600', 'Taxi', 'Hotel de Ville, Paris', 'Louvre Museum', '12/07/2025 @ 09:30', '2025-07-12T07:30:00Z', '12/07/2025 @ 10:00', '2025-07-12T08:00:00Z', 'Alice,Bob', '2', 'TRF002', 'Paris Taxis');

-- Seed car hires
INSERT INTO car_hires (car_photo_url, pickup_location, dropoff_location, city_name, pickup_time_local, pickup_time_utc, dropoff_time_local, dropoff_time_utc, driver, passengers, booking_reference) VALUES
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'MB', 'MB,LB,KS,GB', 'CFE66B54'),
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'SJ', 'SJ,LJ,AJ,NW', 'CF60C6AF'),
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'BB', 'BB,HJ,KJ,PE', 'CF1BE3B3'),
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'NK', 'NK,CK,SK,OK', 'CF65C511');

-- Seed activities
INSERT INTO activities (activity_name, activity_photo_url, additional_details, booking_reference, city, start_time_local, start_time_utc, end_time_local, end_time_utc, participants, participant_count, location) VALUES
('Eiffel Tower Visit', '/placeholder.svg?height=400&width=600', 'Booked tickets online', 'ACT001', 'Paris', '11/07/2025 @ 15:00', '2025-07-11T13:00:00Z', '11/07/2025 @ 17:00', '2025-07-11T15:00:00Z', 'Alice,Bob,Charlie', '3', 'Eiffel Tower, Paris'),
('Colosseum Tour', '/placeholder.svg?height=400&width=600', 'Guided tour', 'ACT003', 'Rome', '15/07/2025 @ 10:00', '2025-07-15T08:00:00Z', '15/07/2025 @ 12:00', '2025-07-15T10:00:00Z', 'Alice,Bob', '2', 'Colosseum, Rome'),
('Louvre Museum Tour', '/placeholder.svg?height=400&width=600', 'Pre-booked tickets', 'ACT004', 'Paris', '12/07/2025 @ 10:30', '2025-07-12T08:30:00Z', '12/07/2025 @ 13:00', '2025-07-12T11:00:00Z', 'Alice,Bob', '2', 'Louvre Museum, Paris');

-- Seed transport tickets
INSERT INTO transport_tickets (booking_reference, passenger_name, ticket_number, transfer_name) VALUES
('TRF002', 'Alice', 'TKT-PARIS-A1', 'Taxi to Louvre'),
('TRF002', 'Bob', 'TKT-PARIS-B2', 'Taxi to Louvre');

-- Seed participants
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

-- Seed animations
INSERT INTO animations (name, screen_aspect_ratio, url) VALUES
('initial_load', '16:9', 'https://assets.mixkit.co/videos/preview/mixkit-abstract-light-tunnel-4501-large.mp4'),
('background', '16:9', '/placeholder.svg?height=1080&width=1920'),
('background', '9:16', '/placeholder.svg?height=1920&width=1080')
ON CONFLICT (id) DO NOTHING;
