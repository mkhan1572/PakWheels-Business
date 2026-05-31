-- ================================================================
-- FILE         : 04_insert_categories.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : INSERT vehicle listing categories
-- RUN ORDER    : Step 4
-- ================================================================

USE pakwheels_db;

INSERT INTO categories (category_name, description) VALUES
('Cars',   'Passenger cars including sedans hatchbacks SUVs and crossovers'),
('Vans',   'Minivans cargo vans and passenger vans'),
('Trucks', 'Pickup trucks double cabins and heavy trucks'),
('Bikes',  'Motorcycles and scooters');
