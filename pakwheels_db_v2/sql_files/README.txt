================================================================
  pakwheels_db  —  MySQL Workbench SQL Package
  Vehicle Market Analytics System
================================================================

ABOUT
-----
Complete SQL schema for pakwheels_db built from the PakWheels
used-car dataset. All 12 tables, real data from the CSV, and
simple SELECT queries to verify everything.

No JSON. No views. No stored procedures. No indexes.
Plain CREATE TABLE, INSERT INTO, and SELECT only.


FILES — RUN IN THIS ORDER
--------------------------
01_create_database.sql       Create pakwheels_db
02_create_tables.sql         CREATE all 12 tables
03_insert_locations.sql      45 Pakistani cities
04_insert_categories.sql     4 vehicle categories
05_insert_users.sql          16 users (1 admin, 10 sellers, 5 buyers)
06_insert_admins.sql         1 admin record
07_insert_sellers.sql        10 seller profiles
08_insert_vehicles.sql       497 real listings from the CSV
09_insert_vehicle_images.sql 497 image URLs (one per vehicle)
10_insert_sample_activity.sql favorites, comparisons, inquiries,
                              reviews, search_logs
11_sample_queries.sql        15 SELECT queries (one per table + analytics)


HOW TO RUN IN MYSQL WORKBENCH
------------------------------
1. Open MySQL Workbench and connect to your local server
2. Go to  File > Open SQL Script
3. Open file 01_create_database.sql
4. Click the lightning bolt button to run it
5. Repeat steps 2-4 for each file in order (01 through 11)

ALTERNATIVELY — use db_init.py to load the CSV directly:
  cd backend
  python db_init.py
This creates the database and imports all vehicles from the CSV
in one step (no need to run SQL files 01–09).


12 TABLES IN THE DATABASE
--------------------------
Table               Description
------------------  -----------------------------------------------
locations           Cities / provinces (45 rows)
categories          Vehicle categories: Cars, Vans, Trucks, Bikes
users               All accounts: admin, sellers, buyers
admins              Admin permissions (1:1 with users)
sellers             Seller profiles (1:1 with users)
vehicles            Core table - 497 car listings from CSV
vehicle_images      Additional image URLs per listing
favorites           Vehicles saved by buyers
comparisons         Side-by-side vehicle comparisons (up to 3 cars)
inquiries           Buyer messages to sellers
reviews             Star ratings and text reviews for sellers
search_logs         Search activity log for analytics


VEHICLES TABLE COLUMNS (backend-aligned)
-----------------------------------------
The vehicles table contains ALL columns the backend API queries:
  vehicle_id, title, brand, model, year, body_type, color,
  fuel_type, transmission, engine_cc, mileage_km, price,
  price_currency, price_note, city, image_url, detail_url,
  scraped_at, status, category_id


ADMINS TABLE NOTE
-----------------
The original schema had a JSON column for permissions.
This has been replaced with 4 simple TINYINT columns:
  can_manage_users      (0 or 1)
  can_manage_listings   (0 or 1)
  can_view_reports      (0 or 1)
  can_manage_settings   (0 or 1)


DATA SOURCE
-----------
Vehicle listings: PakWheels used-car dataset (497 rows)
  26 brands   |   45 cities   |   16 body types
  Year range  : 1986 to 2026
  Price range : PKR 260,000 to 55,000,000


HOW TO RUN THE FULL APPLICATION
--------------------------------
Requirements: Python 3.x, MySQL Server running

1. Set up database (choose ONE method):
   Method A — SQL files:  Run 01 through 09 in MySQL Workbench
   Method B — Python:     cd backend && python db_init.py

2. Verify backend/.env has the correct settings:
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=<your password>
   DB_NAME=pakwheels_db

3. Install Python dependencies:
   pip install -r backend/requirements.txt

4. Run the Flask server:
   cd backend && python app.py

5. Open browser:  http://localhost:5000


PROJECT INFO
------------
Course      : Introduction to Database Systems
Institution : Institute of Management Sciences, Peshawar
Authors     : Muddassir Khan, Salman Khan
Instructor  : Ali Hassan
Submission  : May 2026
================================================================
