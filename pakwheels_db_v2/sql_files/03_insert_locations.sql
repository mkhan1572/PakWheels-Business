-- ================================================================
-- FILE         : 03_insert_locations.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : INSERT all 45 cities found in the dataset
-- RUN ORDER    : Step 3
-- ================================================================

USE pakwheels_db;

INSERT INTO locations (city, state, country) VALUES
('Lahore',            'Punjab',             'Pakistan'),
('Islamabad',         'Islamabad Capital',  'Pakistan'),
('Karachi',           'Sindh',              'Pakistan'),
('Rawalpindi',        'Punjab',             'Pakistan'),
('Faisalabad',        'Punjab',             'Pakistan'),
('Multan',            'Punjab',             'Pakistan'),
('Peshawar',          'Khyber Pakhtunkhwa', 'Pakistan'),
('Sargodha',          'Punjab',             'Pakistan'),
('Gujranwala',        'Punjab',             'Pakistan'),
('Sialkot',           'Punjab',             'Pakistan'),
('Hyderabad',         'Sindh',              'Pakistan'),
('Bahawalpur',        'Punjab',             'Pakistan'),
('Quetta',            'Balochistan',        'Pakistan'),
('Abbottabad',        'Khyber Pakhtunkhwa', 'Pakistan'),
('Attock',            'Punjab',             'Pakistan'),
('Bhakkar',           'Punjab',             'Pakistan'),
('Charsadda',         'Khyber Pakhtunkhwa', 'Pakistan'),
('Chichawatni',       'Punjab',             'Pakistan'),
('Dera Ismail Khan',  'Khyber Pakhtunkhwa', 'Pakistan'),
('Gujar Khan',        'Punjab',             'Pakistan'),
('Gujrat',            'Punjab',             'Pakistan'),
('Hafizabad',         'Punjab',             'Pakistan'),
('Jamshoro',          'Sindh',              'Pakistan'),
('Jhang',             'Punjab',             'Pakistan'),
('Kamra',             'Punjab',             'Pakistan'),
('Khanewal',          'Punjab',             'Pakistan'),
('Kharian',           'Punjab',             'Pakistan'),
('Mandi Bahauddin',   'Punjab',             'Pakistan'),
('Mardan',            'Khyber Pakhtunkhwa', 'Pakistan'),
('Mian Channu',       'Punjab',             'Pakistan'),
('Muzaffar Gargh',    'Punjab',             'Pakistan'),
('Okara',             'Punjab',             'Pakistan'),
('Pasrur',            'Punjab',             'Pakistan'),
('Ahmed Pur East',    'Punjab',             'Pakistan'),
('Rawalakot',         'Azad Kashmir',       'Pakistan'),
('Rawat',             'Punjab',             'Pakistan'),
('Sahiwal',           'Punjab',             'Pakistan'),
('Sukkur',            'Sindh',              'Pakistan'),
('Swabi',             'Khyber Pakhtunkhwa', 'Pakistan'),
('Swatmingora',       'Khyber Pakhtunkhwa', 'Pakistan'),
('Takhtbai',          'Khyber Pakhtunkhwa', 'Pakistan'),
('Taxila',            'Punjab',             'Pakistan'),
('Toba Tek Singh',    'Punjab',             'Pakistan'),
('Topi',              'Khyber Pakhtunkhwa', 'Pakistan'),
('Rahim Yar Khan',    'Punjab',             'Pakistan');
