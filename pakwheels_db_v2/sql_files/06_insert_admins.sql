-- ================================================================
-- FILE         : 06_insert_admins.sql
-- PROJECT      : Vehicle Market Analytics System
-- DATABASE     : pakwheels_db
-- DESCRIPTION  : INSERT admin record for user_id = 1 (Ali Hassan)
--                Permissions stored as simple 0/1 columns (no JSON)
-- RUN ORDER    : Step 6
-- ================================================================

USE pakwheels_db;

-- user_id 1 = Ali Hassan  (role = admin  in users table)
INSERT INTO admins (user_id, can_manage_users, can_manage_listings, can_view_reports, can_manage_settings) VALUES
(1, 1, 1, 1, 1);
