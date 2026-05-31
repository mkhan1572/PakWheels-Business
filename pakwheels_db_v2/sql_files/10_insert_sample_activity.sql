-- ================================================================
-- FILE         : 10_insert_sample_activity.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : Sample data for favorites, comparisons,
--                inquiries, reviews, and search_logs
-- RUN ORDER    : Step 10
--
-- Buyer user_id reference:
--   12 = Bilal Khan    13 = Sara Ahmed    14 = Zain ul Abideen
--   15 = Hira Baig     16 = Kamran Malik
-- ================================================================

USE pakwheels_db;


-- ----------------------------------------------------------------
-- favorites
-- ----------------------------------------------------------------
INSERT INTO favorites (user_id, vehicle_id) VALUES
(12,  1),
(12,  5),
(12, 10),
(13,  2),
(13,  7),
(13, 18),
(14,  3),
(14, 15),
(14, 20),
(15,  4),
(15,  8),
(15, 30),
(16,  6),
(16, 12),
(16, 25);


-- ----------------------------------------------------------------
-- comparisons
-- vehicle_id_3 is optional so some rows leave it NULL
-- ----------------------------------------------------------------
INSERT INTO comparisons (user_id, vehicle_id_1, vehicle_id_2, vehicle_id_3) VALUES
(12,  1,  5, 10),
(13,  2,  7, NULL),
(14,  3, 15, 20),
(15,  4,  8, NULL),
(16,  6, 12, 25);


-- ----------------------------------------------------------------
-- inquiries
-- user_id = NULL means a guest (not logged in) sent the message
-- ----------------------------------------------------------------
INSERT INTO inquiries (user_id, vehicle_id, seller_id, message, status) VALUES
(12,   1,  1, 'Is this vehicle still available? What is the final price?',            'read'),
(13,   2,  2, 'Can I schedule a test drive this weekend?',                            'replied'),
(14,   5,  5, 'Has this car been in any accidents? Is the price negotiable?',         'new'),
(15,   7,  7, 'What is the full service history of this vehicle?',                    'new'),
(16,  10, 10, 'Can you send more photos of the interior?',                            'replied'),
(NULL,  3,  3, 'I am interested. Please contact me at 0300-1234567.',                 'new'),
(NULL, 15,  5, 'What is the lowest price you can offer for this vehicle?',            'new'),
(12,  20,  10, 'Is the mileage shown accurate? Has it been inspected?',               'new'),
(13,  30,   1, 'Does the price include taxes and registration?',                      'read');


-- ----------------------------------------------------------------
-- reviews
-- Buyers reviewing sellers after a transaction
-- ----------------------------------------------------------------
INSERT INTO reviews (reviewer_id, seller_id, rating, comment) VALUES
(12, 1, 5, 'Excellent service. The car was exactly as described. Highly recommend.'),
(13, 2, 4, 'Good experience. The seller was honest and very helpful.'),
(14, 3, 3, 'Average experience. The car had a few issues not mentioned in the listing.'),
(15, 5, 5, 'Very professional dealer. Fast paperwork and fair pricing.'),
(16, 7, 4, 'Decent seller. A bit slow to respond but the deal went smoothly.'),
(12, 8, 5, 'Smooth transaction. Car was clean and matched the listing perfectly.'),
(13, 10, 4, 'Good dealer. Slightly high price but negotiated well in the end.');


-- ----------------------------------------------------------------
-- search_logs
-- user_id = NULL means an anonymous (guest) search
-- ----------------------------------------------------------------
INSERT INTO search_logs (user_id, query_text, results_count) VALUES
(12,   'Toyota Corolla Lahore',           45),
(13,   'Honda Civic automatic 2020',      12),
(14,   'Suzuki Alto under 2000000',       28),
(15,   'SUV Islamabad diesel',             9),
(16,   'Hybrid cars Karachi',             17),
(NULL, 'used cars Rawalpindi',            63),
(NULL, 'Toyota Prado 2016',               8),
(12,   'hatchback manual transmission',  34),
(13,   'Kia Sportage price',             21),
(NULL, 'cheap cars under 1500000',       52),
(14,   'Honda City 2018',                16),
(15,   'Suzuki Swift Lahore',            24);
