-- ================================================================
-- FILE         : 07_insert_sellers.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : INSERT 10 seller profiles (user_id 2 to 11)
-- RUN ORDER    : Step 7
--
-- location_id reference  (from 03_insert_locations.sql):
--   1  = Lahore        2  = Islamabad     3  = Karachi
--   4  = Rawalpindi    5  = Faisalabad    6  = Multan
--   7  = Peshawar      8  = Sargodha
-- ================================================================

USE pakwheels_db;

INSERT INTO sellers (user_id, location_id, business_name, rating, seller_type, verified_status) VALUES
(2,   5, 'Ahmed Traders Faisalabad',     4.50, 'dealer',           1),
(3,   1, 'Lahore Auto Hub',              4.20, 'certified_dealer', 1),
(4,   3, 'Karachi Cars',                 3.90, 'dealer',           1),
(5,   2, 'Pak Premier Autos Islamabad',  4.70, 'certified_dealer', 1),
(6,   2, 'Islamabad Motors',             4.10, 'dealer',           1),
(7,   5, 'Faisal Traders Faisalabad',    3.80, 'individual',       0),
(8,   4, 'Shaheen Autos Rawalpindi',     4.30, 'dealer',           1),
(9,   1, 'Raza Car Point Lahore',        4.00, 'individual',       0),
(10,  6, 'Usman Motors Multan',          4.60, 'dealer',           1),
(11,  3, 'City Auto Mart Karachi',       4.40, 'certified_dealer', 1);
