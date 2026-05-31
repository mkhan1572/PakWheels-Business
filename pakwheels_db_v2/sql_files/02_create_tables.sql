-- ================================================================
-- FILE         : 02_create_tables.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : CREATE TABLE for all 12 tables in dependency order
--                No JSON columns - all plain simple data types
-- RUN ORDER    : Step 2
-- ================================================================

USE pakwheels_db;


-- ----------------------------------------------------------------
-- TABLE 1 : locations
-- Purpose  : Geographic lookup shared by sellers and vehicles
-- ----------------------------------------------------------------
CREATE TABLE locations (
    location_id   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    city          VARCHAR(100)    NOT NULL,
    state         VARCHAR(100)    NOT NULL,
    country       VARCHAR(80)     NOT NULL DEFAULT 'Pakistan',
    PRIMARY KEY (location_id)
);


-- ----------------------------------------------------------------
-- TABLE 2 : categories
-- Purpose  : Vehicle listing categories  e.g. Cars, Vans, Trucks
-- ----------------------------------------------------------------
CREATE TABLE categories (
    category_id   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(80)     NOT NULL,
    description   VARCHAR(255),
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_cat_name (category_name)
);


-- ----------------------------------------------------------------
-- TABLE 3 : users
-- Purpose  : All registered accounts (admin / seller / buyer)
-- ----------------------------------------------------------------
CREATE TABLE users (
    user_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name          VARCHAR(120)    NOT NULL,
    email         VARCHAR(180)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20),
    role          ENUM('admin','seller','buyer')  NOT NULL DEFAULT 'buyer',
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_email (email)
);


-- ----------------------------------------------------------------
-- TABLE 4 : admins
-- Purpose  : Administrator accounts  (1:1 with users)
--            JSON replaced with simple VARCHAR permission columns
-- ----------------------------------------------------------------
CREATE TABLE admins (
    admin_id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id           INT UNSIGNED    NOT NULL,
    can_manage_users  TINYINT(1)      NOT NULL DEFAULT 0,
    can_manage_listings TINYINT(1)    NOT NULL DEFAULT 0,
    can_view_reports  TINYINT(1)      NOT NULL DEFAULT 0,
    can_manage_settings TINYINT(1)    NOT NULL DEFAULT 0,
    PRIMARY KEY (admin_id),
    UNIQUE KEY uq_admin_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 5 : sellers
-- Purpose  : Seller profiles extending users  (1:1 with users)
-- ----------------------------------------------------------------
CREATE TABLE sellers (
    seller_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED    NOT NULL,
    location_id     INT UNSIGNED,
    business_name   VARCHAR(150),
    rating          DECIMAL(3,2)    NOT NULL DEFAULT 0.00,
    seller_type     ENUM('individual','dealer','certified_dealer')
                    NOT NULL DEFAULT 'individual',
    verified_status TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (seller_id),
    UNIQUE KEY uq_seller_user (user_id),
    FOREIGN KEY (user_id)     REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 6 : vehicles   (Core table — matches backend API & CSV)
-- Purpose  : Every used-car listing scraped from PakWheels
--            Columns align with db_init.py and backend routes.
-- ----------------------------------------------------------------
CREATE TABLE vehicles (
    vehicle_id      BIGINT          NOT NULL AUTO_INCREMENT,
    title           TEXT,
    brand           VARCHAR(255)    NOT NULL,
    model           VARCHAR(255)    NOT NULL,
    year            INT             NOT NULL,
    body_type       VARCHAR(128),
    color           VARCHAR(128),
    fuel_type       VARCHAR(128),
    transmission    VARCHAR(128),
    engine_cc       INT,
    mileage_km      INT             NOT NULL DEFAULT 0,
    price           DECIMAL(18,2)   NOT NULL,
    price_currency  VARCHAR(16)     NOT NULL DEFAULT 'PKR',
    price_note      VARCHAR(255),
    city            VARCHAR(255),
    image_url       TEXT,
    detail_url      TEXT,
    scraped_at      DATETIME,
    status          ENUM('available','sold','featured') NOT NULL DEFAULT 'available',
    category_id     INT UNSIGNED,
    PRIMARY KEY (vehicle_id),
    CONSTRAINT chk_price CHECK (price > 0),
    CONSTRAINT chk_year  CHECK (year > 1980),
    FOREIGN KEY (category_id)  REFERENCES categories(category_id)
        ON DELETE SET NULL  ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 7 : vehicle_images
-- Purpose  : Additional image URLs per vehicle listing
--            is_primary = 1 marks the cover photo
-- ----------------------------------------------------------------
CREATE TABLE vehicle_images (
    image_id    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    vehicle_id  BIGINT          NOT NULL,
    image_url   VARCHAR(400)    NOT NULL,
    is_primary  TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (image_id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 8 : favorites
-- Purpose  : Vehicles saved to a buyer's wishlist
--            One user cannot save the same vehicle twice
-- ----------------------------------------------------------------
CREATE TABLE favorites (
    favorite_id INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED    NOT NULL,
    vehicle_id  BIGINT          NOT NULL,
    PRIMARY KEY (favorite_id),
    UNIQUE KEY uq_fav (user_id, vehicle_id),
    FOREIGN KEY (user_id)    REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 9 : comparisons
-- Purpose  : Side-by-side comparison of up to 3 vehicles per user
--            vehicle_id_3 is optional (NULL allowed)
-- ----------------------------------------------------------------
CREATE TABLE comparisons (
    comparison_id INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    user_id       INT UNSIGNED   NOT NULL,
    vehicle_id_1  BIGINT         NOT NULL,
    vehicle_id_2  BIGINT         NOT NULL,
    vehicle_id_3  BIGINT,
    PRIMARY KEY (comparison_id),
    FOREIGN KEY (user_id)       REFERENCES users(user_id)
        ON DELETE CASCADE   ON UPDATE CASCADE,
    FOREIGN KEY (vehicle_id_1)  REFERENCES vehicles(vehicle_id)
        ON DELETE CASCADE   ON UPDATE CASCADE,
    FOREIGN KEY (vehicle_id_2)  REFERENCES vehicles(vehicle_id)
        ON DELETE CASCADE   ON UPDATE CASCADE,
    FOREIGN KEY (vehicle_id_3)  REFERENCES vehicles(vehicle_id)
        ON DELETE SET NULL  ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 10 : inquiries
-- Purpose  : Buyer messages sent to sellers about a listing
--            user_id is NULL for guest (unregistered) buyers
-- ----------------------------------------------------------------
CREATE TABLE inquiries (
    inquiry_id  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED,
    vehicle_id  BIGINT          NOT NULL,
    seller_id   INT UNSIGNED    NOT NULL,
    message     TEXT            NOT NULL,
    status      ENUM('new','read','replied','closed')  NOT NULL DEFAULT 'new',
    PRIMARY KEY (inquiry_id),
    FOREIGN KEY (user_id)    REFERENCES users(user_id)
        ON DELETE SET NULL  ON UPDATE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
        ON DELETE CASCADE   ON UPDATE CASCADE,
    FOREIGN KEY (seller_id)  REFERENCES sellers(seller_id)
        ON DELETE CASCADE   ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 11 : reviews
-- Purpose  : Buyer star ratings and text reviews for sellers
--            Rating must be between 1 and 5
-- ----------------------------------------------------------------
CREATE TABLE reviews (
    review_id   INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    reviewer_id INT UNSIGNED        NOT NULL,
    seller_id   INT UNSIGNED        NOT NULL,
    rating      TINYINT UNSIGNED    NOT NULL,
    comment     TEXT,
    PRIMARY KEY (review_id),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (seller_id)   REFERENCES sellers(seller_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ----------------------------------------------------------------
-- TABLE 12 : search_logs
-- Purpose  : Logs every search for analytics and trends
--            user_id is NULL for anonymous (guest) searches
-- ----------------------------------------------------------------
CREATE TABLE search_logs (
    log_id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id        INT UNSIGNED,
    query_text     VARCHAR(300),
    results_count  INT UNSIGNED,
    searched_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);
