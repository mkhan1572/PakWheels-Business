-- ================================================================
-- FILE         : 05_insert_users.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : INSERT 16 sample users
--                1 admin  |  10 sellers  |  5 buyers
--                password_hash column stores a bcrypt hash
--                Plain text password for all samples: Password123
-- RUN ORDER    : Step 5
-- ================================================================

USE pakwheels_db;

INSERT INTO users (name, email, password_hash, phone, role, is_active) VALUES

-- Admin account (user_id = 1)
('Ali Hassan',         'admin@pakwheels-db.com',    '$2b$12$sampleHashForAdminUserXXXXXXXXXXXXXXXXXXX', '03001000001', 'admin',  1),

-- Seller accounts (user_id = 2 to 11)
('Ahmed Traders',      'ahmed.traders@gmail.com',   '$2b$12$sampleHashForSeller02XXXXXXXXXXXXXXXXXX', '03011000002', 'seller', 1),
('Lahore Auto Hub',    'lahore.autohub@gmail.com',  '$2b$12$sampleHashForSeller03XXXXXXXXXXXXXXXXXX', '03021000003', 'seller', 1),
('Karachi Cars',       'karachi.cars@gmail.com',    '$2b$12$sampleHashForSeller04XXXXXXXXXXXXXXXXXX', '03031000004', 'seller', 1),
('Pak Premier Autos',  'pak.premier@gmail.com',     '$2b$12$sampleHashForSeller05XXXXXXXXXXXXXXXXXX', '03041000005', 'seller', 1),
('Islamabad Motors',   'isb.motors@gmail.com',      '$2b$12$sampleHashForSeller06XXXXXXXXXXXXXXXXXX', '03051000006', 'seller', 1),
('Faisal Traders',     'faisal.traders@gmail.com',  '$2b$12$sampleHashForSeller07XXXXXXXXXXXXXXXXXX', '03061000007', 'seller', 1),
('Shaheen Autos',      'shaheen.autos@gmail.com',   '$2b$12$sampleHashForSeller08XXXXXXXXXXXXXXXXXX', '03071000008', 'seller', 1),
('Raza Car Point',     'raza.carpoint@gmail.com',   '$2b$12$sampleHashForSeller09XXXXXXXXXXXXXXXXXX', '03081000009', 'seller', 1),
('Usman Motors',       'usman.motors@gmail.com',    '$2b$12$sampleHashForSeller10XXXXXXXXXXXXXXXXXX', '03091000010', 'seller', 1),
('City Auto Mart',     'city.automart@gmail.com',   '$2b$12$sampleHashForSeller11XXXXXXXXXXXXXXXXXX', '03101000011', 'seller', 1),

-- Buyer accounts (user_id = 12 to 16)
('Bilal Khan',         'bilal.khan@gmail.com',      '$2b$12$sampleHashForBuyer12XXXXXXXXXXXXXXXXXXX', '03111000012', 'buyer',  1),
('Sara Ahmed',         'sara.ahmed@gmail.com',      '$2b$12$sampleHashForBuyer13XXXXXXXXXXXXXXXXXXX', '03121000013', 'buyer',  1),
('Zain ul Abideen',    'zain.abideen@gmail.com',    '$2b$12$sampleHashForBuyer14XXXXXXXXXXXXXXXXXXX', '03131000014', 'buyer',  1),
('Hira Baig',          'hira.baig@gmail.com',       '$2b$12$sampleHashForBuyer15XXXXXXXXXXXXXXXXXXX', '03141000015', 'buyer',  1),
('Kamran Malik',       'kamran.malik@gmail.com',    '$2b$12$sampleHashForBuyer16XXXXXXXXXXXXXXXXXXX', '03151000016', 'buyer',  1);
