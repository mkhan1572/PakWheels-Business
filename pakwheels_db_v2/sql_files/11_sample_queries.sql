-- ================================================================
-- FILE         : 11_sample_queries.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : Simple SELECT queries to verify data in every table
-- RUN ORDER    : Step 11  (run last after all data is inserted)
-- ================================================================

USE pakwheels_db;


-- ----------------------------------------------------------------
-- 1. All locations
-- ----------------------------------------------------------------
SELECT location_id, city, state, country
FROM locations
ORDER BY state, city;


-- ----------------------------------------------------------------
-- 2. All categories
-- ----------------------------------------------------------------
SELECT category_id, category_name, description
FROM categories;


-- ----------------------------------------------------------------
-- 3. All users with their role
-- ----------------------------------------------------------------
SELECT user_id, name, email, phone, role, is_active
FROM users
ORDER BY role, name;


-- ----------------------------------------------------------------
-- 4. Admin details
-- ----------------------------------------------------------------
SELECT
    a.admin_id,
    u.name                  AS admin_name,
    u.email,
    a.can_manage_users,
    a.can_manage_listings,
    a.can_view_reports,
    a.can_manage_settings
FROM admins a
JOIN users u ON a.user_id = u.user_id;


-- ----------------------------------------------------------------
-- 5. Sellers with their location and business info
-- ----------------------------------------------------------------
SELECT
    s.seller_id,
    u.name              AS seller_name,
    s.business_name,
    s.seller_type,
    s.rating,
    s.verified_status,
    l.city,
    l.state
FROM sellers s
JOIN users     u ON s.user_id     = u.user_id
LEFT JOIN locations l ON s.location_id = l.location_id
ORDER BY s.rating DESC;


-- ----------------------------------------------------------------
-- 6. All vehicles with city and seller name
-- ----------------------------------------------------------------
SELECT
    v.vehicle_id,
    v.brand,
    v.model,
    v.year,
    v.price,
    v.mileage,
    v.fuel_type,
    v.transmission,
    v.body_type,
    v.engine_cc,
    v.color,
    v.status,
    l.city          AS city,
    u.name          AS seller_name
FROM vehicles v
LEFT JOIN sellers   s ON v.seller_id   = s.seller_id
LEFT JOIN users     u ON s.user_id     = u.user_id
LEFT JOIN locations l ON v.location_id = l.location_id
ORDER BY v.price DESC;


-- ----------------------------------------------------------------
-- 7. Vehicle images
-- ----------------------------------------------------------------
SELECT
    vi.image_id,
    v.brand,
    v.model,
    v.year,
    vi.image_url,
    vi.is_primary
FROM vehicle_images vi
JOIN vehicles v ON vi.vehicle_id = v.vehicle_id
ORDER BY vi.vehicle_id;


-- ----------------------------------------------------------------
-- 8. Buyer favorites with vehicle details
-- ----------------------------------------------------------------
SELECT
    u.name          AS buyer_name,
    v.brand,
    v.model,
    v.year,
    v.price,
    l.city
FROM favorites f
JOIN users     u ON f.user_id     = u.user_id
JOIN vehicles  v ON f.vehicle_id  = v.vehicle_id
LEFT JOIN locations l ON v.location_id = l.location_id
ORDER BY u.name;


-- ----------------------------------------------------------------
-- 9. Comparisons with vehicle names
-- ----------------------------------------------------------------
SELECT
    c.comparison_id,
    u.name          AS buyer_name,
    v1.brand        AS car1_brand,
    v1.model        AS car1_model,
    v2.brand        AS car2_brand,
    v2.model        AS car2_model,
    v3.brand        AS car3_brand,
    v3.model        AS car3_model
FROM comparisons c
LEFT JOIN users     u  ON c.user_id      = u.user_id
LEFT JOIN vehicles  v1 ON c.vehicle_id_1 = v1.vehicle_id
LEFT JOIN vehicles  v2 ON c.vehicle_id_2 = v2.vehicle_id
LEFT JOIN vehicles v3 ON c.vehicle_id_3 = v3.vehicle_id
ORDER BY c.comparison_id;


-- ----------------------------------------------------------------
-- 10. All inquiries with buyer, vehicle, and seller
-- ----------------------------------------------------------------
SELECT
    i.inquiry_id,
    u.name          AS buyer_name,
    v.brand,
    v.model,
    su.name         AS seller_name,
    i.status,
    i.message
FROM inquiries i
LEFT JOIN users    u  ON i.user_id    = u.user_id
LEFT JOIN vehicles v  ON i.vehicle_id = v.vehicle_id
LEFT JOIN sellers  s  ON i.seller_id  = s.seller_id
LEFT JOIN users    su ON s.user_id    = su.user_id
ORDER BY i.inquiry_id;


-- ----------------------------------------------------------------
-- 11. Reviews with buyer and seller names
-- ----------------------------------------------------------------
SELECT
    r.review_id,
    u.name          AS buyer_name,
    su.name         AS seller_name,
    s.business_name,
    r.rating,
    r.comment
FROM reviews r
JOIN users    u  ON r.reviewer_id = u.user_id
JOIN sellers  s  ON r.seller_id   = s.seller_id
JOIN users    su ON s.user_id     = su.user_id
ORDER BY r.rating DESC;


-- ----------------------------------------------------------------
-- 12. Search logs with user name
-- ----------------------------------------------------------------
SELECT
    sl.log_id,
    u.name          AS user_name,
    sl.query_text,
    sl.results_count,
    sl.searched_at
FROM search_logs sl
LEFT JOIN users u ON sl.user_id = u.user_id
ORDER BY sl.searched_at DESC;


-- ----------------------------------------------------------------
-- 13. Total listings per brand
-- ----------------------------------------------------------------
SELECT brand, COUNT(*) AS total_listings
FROM vehicles
GROUP BY brand
ORDER BY total_listings DESC;


-- ----------------------------------------------------------------
-- 14. Total listings per city
-- ----------------------------------------------------------------
SELECT l.city, l.state, COUNT(v.vehicle_id) AS total_listings
FROM locations l
JOIN vehicles v ON l.location_id = v.location_id
GROUP BY l.city, l.state
ORDER BY total_listings DESC;


-- ----------------------------------------------------------------
-- 15. Average price per brand
-- ----------------------------------------------------------------
SELECT brand, ROUND(AVG(price)) AS avg_price_pkr
FROM vehicles
GROUP BY brand
ORDER BY avg_price_pkr DESC;
