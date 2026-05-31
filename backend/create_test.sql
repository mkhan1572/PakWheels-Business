DROP TABLE IF EXISTS vehicles;
CREATE TABLE vehicles (
  vehicle_id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  title TEXT,
  brand VARCHAR(255),
  model VARCHAR(255),
  year INT,
  body_type VARCHAR(128),
  color VARCHAR(128),
  fuel_type VARCHAR(128),
  transmission VARCHAR(128),
  engine_cc INT,
  mileage_km INT,
  price DECIMAL(18,2),
  price_currency VARCHAR(16),
  price_note VARCHAR(255),
  city VARCHAR(255),
  image_url TEXT,
  detail_url TEXT,
  scraped_at DATETIME
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SHOW TABLES;
