-- Create flights table
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

-- Create accomodation table
CREATE TABLE IF NOT EXISTS accomodation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accomodation_name TEXT, -- e.g., "Hotel stay in Paris"
    hotel_city TEXT,
    hotel_name TEXT, -- e.g., "Airport Rydges Sydney"
    hotel_photo_url TEXT,
    hotel_address TEXT,
    date_check_in_local TEXT,
    date_check_in_utc TEXT,
    date_check_out TEXT,
    date_check_out_utc TEXT,
    participants TEXT,
    participant_count TEXT,
    booking_reference TEXT,
    breakfast_included TEXT -- "Y" or null
);

-- Create room_configuration table
CREATE TABLE IF NOT EXISTS room_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accomodation_name TEXT, -- This will link to hotel_name in accomodation table
    room_type TEXT,
    participants TEXT,
    participant_count TEXT,
    booking_reference TEXT -- This will link to booking_reference in accomodation table
);

-- Create transfers table
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
    booking_reference TEXT
);

-- Create car_hires table
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

-- Create activities table
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

-- Seed data for flights
INSERT INTO flights (departure_city, flight_photo_url, arrival_city, departure_time_local, arrive_time_local,
    leave_time_universal, arrive_time_universal, passengers, leave_location, arrive_location,
    airline, booking_reference) VALUES
('London Heathrow (LHR)', '/placeholder.svg?height=400&width=600', 'Paris Charles de Gaulle (CDG)', '10/07/2025 @ 10:00', '10/07/2025 @ 12:00',
 '2025-07-10T08:00:00Z', '2025-07-10T10:00:00Z', 'Alice,Bob', 'London Heathrow (LHR)', 'Paris Charles de Gaulle (CDG)',
 'Air France', 'FLT789'),
('Paris Charles de Gaulle (CDG)', '/placeholder.svg?height=400&width=600', 'Rome Fiumicino (FCO)', '14/07/2025 @ 15:00', '14/07/2025 @ 17:00',
 '2025-07-14T13:00:00Z', '2025-07-14T15:00:00Z', 'Alice,Bob', 'Paris Charles de Gaulle (CDG)', 'Rome Fiumicino (FCO)',
 'Alitalia', 'FLT901');

-- Seed data for accomodation
INSERT INTO accomodation (accomodation_name, hotel_city, hotel_name, hotel_photo_url, hotel_address, date_check_in_local, date_check_in_utc, date_check_out, date_check_out_utc, participants, participant_count, booking_reference, breakfast_included) VALUES
('Hotel stay in Paris', 'Paris', 'Hotel de Ville', '/placeholder.svg?height=400&width=600', '123 Rue de Rivoli, Paris', '10/07/2025 @ 15:00', '2025-07-10T13:00:00Z', '14/07/2025 @ 11:00', '2025-07-14T09:00:00Z', 'Alice,Bob', '2', 'HOTEL123', 'Y'),
('Apartment in Rome', 'Rome', 'Roman Holiday Apartments', '/placeholder.svg?height=400&width=600', 'Via del Corso, Rome', '14/07/2025 @ 16:00', '2025-07-14T14:00:00Z', '20/07/2025 @ 10:00', '2025-07-20T08:00:00Z', 'Alice,Bob', '2', 'APT789', 'N'),
('Hotel stay in Sydney', 'Sydney', 'Airport Rydges Sydney', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-stOXJkp5bdiGjoyrcIY2YzPl6JgLHP.png', 'Sydney Airport, 8 Arrival Ct, Mascot New South Wales 2020', '15/06/2025 @ 05:00', '2025-06-14T19:00:00Z', '16/06/2025 @ 10:00', '2025-06-16T00:00:00Z', 'LJ,SJ,KJ,PE,HJ,GB,OK,SK,CK,NK', '10', 'RYDGES456', 'Y');


-- Seed data for room_configuration (for Airport Rydges Sydney)
INSERT INTO room_configuration (accomodation_name, room_type, participants, participant_count, booking_reference) VALUES
('Airport Rydges Sydney', 'Standard Room', 'LJ,SJ', '2', 'RYDGES456'),
('Airport Rydges Sydney', 'Deluxe Suite', 'KJ,PE', '2', 'RYDGES456'),
('Airport Rydges Sydney', 'Family Room', 'HJ,GB,OK', '3', 'RYDGES456'),
('Airport Rydges Sydney', 'Executive King', 'SK,CK,NK', '3', 'RYDGES456');

-- Seed data for transfers
INSERT INTO transfers (transfer_name, transfer_photo_url, transport_method, departure_location, arrival_location, departure_time_local, arrival_time_local, departure_time_utc, arrival_time_utc, participants, participant_count, booking_reference) VALUES
('Taxi to Louvre', '/placeholder.svg?height=400&width=600', 'Taxi', 'Hotel de Ville, Paris', 'Louvre Museum', '12/07/2025 @ 09:30', '12/07/2025 @ 10:00', '2025-07-12T07:30:00Z', '2025-07-12T08:00:00Z', 'Alice,Bob', '2', 'TRF002');

-- Seed data for car_hires (4 cars with SAME pickup/dropoff details, different drivers/passengers)
INSERT INTO car_hires (car_photo_url, pickup_location, dropoff_location, city_name, pickup_time_local, pickup_time_utc, dropoff_time_local, dropoff_time_utc, driver, passengers, booking_reference) VALUES
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'MB', 'MB,LB,KS,GB', 'CFE66B54'),
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'SJ', 'SJ,LJ,AJ,NW', 'CF60C6AF'),
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'BB', 'BB,HJ,KJ,PE', 'CF1BE3B3'),
('/placeholder.svg?height=400&width=600', 'Parikia Port', 'Paros Airport at AutoUnion Car Rental', 'Paros', '21/06/2025 @ 12:30', '2025-06-21T09:30:00Z', '28/06/2025 @ 12:30', '2025-06-28T09:30:00Z', 'NK', 'NK,CK,SK,OK', 'CF65C511');

-- Seed data for activities
INSERT INTO activities (activity_name, activity_photo_url, additional_details, booking_reference, city, start_time_local, start_time_utc, end_time_local, end_time_utc, participants, participant_count, location) VALUES
('Eiffel Tower Visit', '/placeholder.svg?height=400&width=600', 'Booked tickets online', 'ACT001', 'Paris', '11/07/2025 @ 15:00', '2025-07-11T13:00:00Z', '11/07/2025 @ 17:00', '2025-07-11T15:00:00Z', 'Alice,Bob,Charlie', '3', 'Eiffel Tower, Paris'),
('Colosseum Tour', '/placeholder.svg?height=400&width=600', 'Guided tour', 'ACT003', 'Rome', '15/07/2025 @ 10:00', '2025-07-15T08:00:00Z', '15/07/2025 @ 12:00', '2025-07-15T10:00:00Z', 'Alice,Bob', '2', 'Colosseum, Rome');
