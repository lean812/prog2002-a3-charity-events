-- =====================================================================
-- PROG2002 Web Development II - Assignment 3
-- Charity Events Management Website
-- Database export script: charityevents_db.sql  (schema + data, single file)
-- DBMS: MySQL 8.x (InnoDB, utf8mb4)
--
-- Assessment 3 changes
--   1. events table gained latitude/longitude columns (external Weather API).
--   2. New registrations table linked to events (one user may register for
--      several events but only once for the same event).
--
-- Run it once in MySQL Workbench / cPanel phpMyAdmin import, or with:
--     mysql -u root -p < charityevents_db.sql
-- =====================================================================

DROP DATABASE IF EXISTS charityevents_db;
CREATE DATABASE charityevents_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE charityevents_db;

-- ---------------------------------------------------------------------
-- Table: organisations  (the charitable organisations hosting events)
-- ---------------------------------------------------------------------
CREATE TABLE organisations (
  org_id        INT AUTO_INCREMENT PRIMARY KEY,
  org_name      VARCHAR(150) NOT NULL,
  mission       TEXT,
  description   TEXT,
  contact_email VARCHAR(120),
  contact_phone VARCHAR(30),
  website       VARCHAR(150),
  address       VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Table: categories  (types of charity events)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(80) NOT NULL,
  description   VARCHAR(255)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Table: events
--   status = 'active' (visible) or 'suspended' (hidden, policy violation)
--   "past" vs "upcoming" is derived at run time from event_date and the
--   current date; it is therefore not stored as a separate status.
--
--   latitude / longitude were added in Assessment 3 so the client pages can
--   request the weather forecast for the event venue from the Open-Meteo API.
-- ---------------------------------------------------------------------
CREATE TABLE events (
  event_id        INT AUTO_INCREMENT PRIMARY KEY,
  event_name      VARCHAR(200) NOT NULL,
  summary         VARCHAR(300),
  full_description TEXT,
  category_id     INT NOT NULL,
  org_id          INT NOT NULL,
  event_date      DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  location_name   VARCHAR(150),
  address         VARCHAR(255),
  city            VARCHAR(80),
  latitude        DECIMAL(10,7),
  longitude       DECIMAL(10,7),
  ticket_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  goal_amount     DECIMAL(12,2),
  raised_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  image_url       VARCHAR(255),
  status          ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_event_org
    FOREIGN KEY (org_id) REFERENCES organisations(org_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

-- Helpful indexes for the Home / Search / Details / Admin queries
CREATE INDEX idx_events_date     ON events(event_date);
CREATE INDEX idx_events_city     ON events(city);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_status   ON events(status);

-- ---------------------------------------------------------------------
-- Table: registrations   (NEW in Assessment 3)
--   Records which event a web user registered for and how many tickets
--   they purchased. There is deliberately no USER table (per the brief),
--   so the contact details of the attendee are stored on each row.
--
--   A user may register for MANY events but only ONCE for the same event,
--   which is enforced by the unique key on (event_id, email).
--   total_amount = num_tickets * the event's ticket price (frozen at sale).
-- ---------------------------------------------------------------------
CREATE TABLE registrations (
  registration_id   INT AUTO_INCREMENT PRIMARY KEY,
  event_id          INT NOT NULL,
  full_name         VARCHAR(120) NOT NULL,
  email             VARCHAR(120) NOT NULL,
  phone             VARCHAR(30),
  registration_date DATE NOT NULL,
  num_tickets       INT NOT NULL DEFAULT 1,
  total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registration_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT uq_event_email
    UNIQUE (event_id, email),
  CONSTRAINT chk_num_tickets
    CHECK (num_tickets BETWEEN 1 AND 10)
) ENGINE = InnoDB;

-- The event detail page sorts registrations "latest purchase first",
-- so an index on (event_id, registration_date) keeps that query fast.
CREATE INDEX idx_reg_event_date ON registrations(event_id, registration_date);

-- =====================================================================
-- Initial data
-- =====================================================================

-- Organisations -------------------------------------------------------
INSERT INTO organisations
  (org_id, org_name, mission, description, contact_email, contact_phone, website, address) VALUES
(1, 'Heart of Liuzhou Foundation',
 'To connect caring people in Liuzhou with local causes through community events that raise funds and awareness for education, health and community welfare.',
 'Heart of Liuzhou Foundation is a registered non-profit organisation that organises fun runs, gala dinners, auctions, concerts and community walks across Liuzhou. Every event raises money and awareness for a specific local cause.',
 'hello@heartofliuzhou.org', '+86 772 2600 100',
 'www.heartofliuzhou.org', 'No. 8 Wenchang Road, Chengzhong District, Liuzhou, Guangxi'),
(2, 'Riverside Community Care',
 'To support vulnerable families and elderly residents living along the Liu River through neighbour-led fundraising and volunteer activities.',
 'Riverside Community Care is a volunteer-run charity focused on neighbourhood welfare, food drives and health outreach in the riverside districts of Liuzhou.',
 'contact@riversidecare.org', '+86 772 2600 200',
 'www.riversidecare.org', 'No. 21 Riverside Avenue, Yufeng District, Liuzhou, Guangxi');

-- Categories ----------------------------------------------------------
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Fun Run',          'Organised running events where participants raise funds through registration and sponsorship.'),
(2, 'Gala Dinner',      'Formal evening dinners with entertainment, held to raise donations for a cause.'),
(3, 'Silent Auction',   'Events where donated goods and experiences are sold to the highest sealed bid.'),
(4, 'Charity Concert',  'Live music and performance events where ticket sales support a charity.'),
(5, 'Community Walk',   'Group walking events that raise awareness and funds for a specific cause.'),
(6, 'Bake Sale',        'Community sales of home-baked goods, with all proceeds donated to charity.');

-- Events --------------------------------------------------------------
-- Coordinates point at the venues in Liuzhou (used by the Weather API).
-- Upcoming + active (shown on the Home page after 2026-10-18)
INSERT INTO events
  (event_id, event_name, summary, full_description, category_id, org_id,
   event_date, start_time, end_time, location_name, address, city,
   latitude, longitude,
   ticket_price, goal_amount, raised_amount, image_url, status) VALUES
(1, 'Spring Community Fun Run',
 'A 5 km family fun run through Wenchang District raising funds for rural school libraries.',
 'Join hundreds of runners for the Spring Community Fun Run. The flat 5 km route is suitable for all ages and abilities, and every registration helps build libraries in rural schools around Liuzhou. The morning includes a warm-up session, water stations along the route, a finisher medal for every participant, and a community picnic at the finish line. Families, teams and first-time runners are all welcome.',
 1, 1, '2026-10-24', '08:00:00', '11:30:00',
 'Liuzhou Sports Center', 'No. 1 Sports Road, Chengzhong District', 'Liuzhou',
 24.3257000, 109.4118000,
 50.00, 40000.00, 12500.00, 'funrun.jpg', 'active'),

(2, 'Annual Charity Gala Dinner',
 'An elegant evening of dinner, live music and guest speakers supporting children''s healthcare.',
 'The Annual Charity Gala Dinner is our flagship fundraising evening. Guests enjoy a three-course dinner, live jazz, a guest speaker from the children''s hospital, and a short programme sharing the stories of families supported this year. All proceeds fund medical equipment and treatment for children in need. Black tie is optional and tables of ten are available for corporate sponsors.',
 2, 1, '2026-11-14', '18:30:00', '22:00:00',
 'Liuzhou International Hotel Grand Ballroom', 'No. 55 Youyi Road', 'Liuzhou',
 24.3147000, 109.4105000,
 380.00, 120000.00, 46800.00, 'gala.jpg', 'active'),

(3, 'Hope Silent Auction',
 'Bid on donated art, dinners, travel and experiences, with all proceeds funding student scholarships.',
 'The Hope Silent Auction brings together over 80 generously donated lots, including artwork, hotel stays, restaurant vouchers, guided tours and unique experiences. Bidders place sealed offers during the evening and the highest bid for each lot is announced at the close. Light refreshments are included and admission is free. Every yuan raised goes directly to scholarships for students from low-income families.',
 3, 1, '2026-11-28', '15:00:00', '19:00:00',
 'Wenchang Cultural Hall', 'No. 12 Wenchang Road', 'Liuzhou',
 24.3266000, 109.4200000,
 0.00, 60000.00, 9300.00, 'auction.jpg', 'active'),

(4, 'Voices for Change Charity Concert',
 'An evening of live performances by local artists raising funds for community mental-health programmes.',
 'Voices for Change is a concert celebrating local talent while supporting mental-health programmes in Liuzhou. The line-up features bands, choirs and solo artists, alongside short talks from people who have benefited from the programmes. Ticket sales and donations fund free counselling sessions and community support groups. Seating is general admission and doors open one hour before the show.',
 4, 1, '2026-12-05', '19:30:00', '22:00:00',
 'Liuzhou Cultural Square Grand Theatre', 'No. 30 Jiefang South Road', 'Liuzhou',
 24.3148000, 109.4020000,
 120.00, 80000.00, 21600.00, 'concert.jpg', 'active'),

(5, 'Winter Warmth Community Walk',
 'A gentle 3 km riverside walk raising funds for winter clothing for elderly residents.',
 'The Winter Warmth Community Walk is a relaxed 3 km walk along the Liu River riverfront. The event brings neighbours together to raise money for warm coats, blankets and heaters for elderly residents in the riverside communities. The walk is wheelchair and pram friendly, hot drinks are provided at the finish, and no fundraising minimum is required beyond registration.',
 5, 2, '2026-12-19', '09:00:00', '11:00:00',
 'Liu River Riverside Park', 'No. 21 Riverside Avenue', 'Liuzhou',
 24.3110000, 109.4280000,
 30.00, 25000.00, 4800.00, 'walk.jpg', 'active'),

(6, 'New Year Charity Bake Sale',
 'Home-baked cakes, breads and treats sold to support neighbourhood food-assistance families.',
 'Start the new year with something sweet for a good cause. Volunteers and local bakeries donate hundreds of home-baked cakes, cookies, breads and seasonal treats, all sold with 100% of proceeds going to neighbourhood food assistance for families facing hardship. Entry is free, coffee and tea are available, and donations of baked goods on the day are very welcome.',
 6, 2, '2027-01-09', '10:00:00', '15:00:00',
 'Yufeng Community Centre', 'No. 9 Yufeng Road', 'Liuzhou',
 24.3010000, 109.4450000,
 0.00, 15000.00, 1200.00, 'bakesale.jpg', 'active'),

(7, 'Moonlight Fun Run',
 'A glowing night-time 5 km fun run with glow sticks and music, supporting flood-relief efforts.',
 'Experience the city after dark at the Moonlight Fun Run. Runners receive a glow pack and LED bib number before setting off on a lit 5 km route with music zones along the way. The event raises funds for local flood-relief and resilience efforts. A safety briefing is held before the start, reflective gear is recommended, and a warm supper waits at the finish line.',
 1, 2, '2027-02-13', '19:00:00', '21:30:00',
 'Liuzhou Sports Center', 'No. 1 Sports Road, Chengzhong District', 'Liuzhou',
 24.3257000, 109.4118000,
 60.00, 45000.00, 3000.00, 'moonrun.jpg', 'active'),

(8, 'Spring Gala for Education',
 'A gala dinner and awards evening celebrating and funding education programmes for rural children.',
 'The Spring Gala for Education combines dinner, entertainment and an awards ceremony honouring outstanding volunteer tutors and students. Funds raised pay for school supplies, tutoring and digital learning equipment for rural classrooms around Liuzhou. The evening includes a raffle and a short documentary about the students and schools supported.',
 2, 1, '2027-03-20', '18:00:00', '21:30:00',
 'Liuzhou International Hotel Grand Ballroom', 'No. 55 Youyi Road', 'Liuzhou',
 24.3147000, 109.4105000,
 350.00, 100000.00, 0.00, 'educationgala.jpg', 'active'),

-- Past events (dates before 2026-10-18; excluded from the Home page)
(9, 'Summer Charity Concert',
 'A summer afternoon concert that funded free summer camps for children.',
 'The Summer Charity Concert brought together local bands for an afternoon of music in the park, raising funds for free summer camps for children who would otherwise have no holiday programmes. The event included food stalls, family activities and a community sing-along.',
 4, 1, '2026-08-15', '16:00:00', '20:00:00',
 'Longtan Park Open Stage', 'No. 43 Longtan Road', 'Liuzhou',
 24.2750000, 109.4320000,
 80.00, 50000.00, 52400.00, 'summerconcert.jpg', 'active'),

(10, 'Riverside Walk for Health',
 'A community walk that funded health check-ups for elderly residents.',
 'The Riverside Walk for Health was a morning community walk that raised funds for free health check-ups and blood-pressure monitoring for elderly residents in the riverside districts. More than 600 walkers took part and the fundraising goal was exceeded.',
 5, 2, '2026-09-12', '08:30:00', '10:30:00',
 'Liu River Riverside Park', 'No. 21 Riverside Avenue', 'Liuzhou',
 24.3110000, 109.4280000,
 25.00, 20000.00, 21800.00, 'healthwalk.jpg', 'active'),

-- Suspended event (upcoming date but hidden from the public pages)
(11, 'Citywide Charity Raffle',
 'This event is suspended pending a policy review and is hidden from the public website.',
 'This raffle has been suspended by the administrator because it did not comply with the event-listing policy. Suspended events must not appear on the Home or Search pages while under review.',
 3, 2, '2026-11-07', '12:00:00', '16:00:00',
 'Yufeng Community Centre', 'No. 9 Yufeng Road', 'Liuzhou',
 24.3010000, 109.4450000,
 20.00, 30000.00, 0.00, 'raffle.jpg', 'suspended');

-- Registrations -------------------------------------------------------
-- 14 purchases spread across several events. Event 8 intentionally has NO
-- registrations so the admin can successfully delete it; events 1 and 2 DO
-- have registrations so deleting them must be blocked (data integrity).
-- Dates are before each event date and demonstrate "latest first" ordering.
INSERT INTO registrations
  (registration_id, event_id, full_name, email, phone,
   registration_date, num_tickets, total_amount) VALUES
-- Event 1 - Spring Community Fun Run ($50 each)
(1,  1, 'Zhang Wei',      'zhang.wei@example.com',   '+86 138 0010 0001', '2026-10-10', 2, 100.00),
(2,  1, 'Chen Lina',      'chen.lina@example.com',   '+86 138 0010 0002', '2026-10-12', 1, 50.00),
(3,  1, 'Huang Jie',      'huang.jie@example.com',   '+86 138 0010 0003', '2026-10-16', 3, 150.00),
-- Event 2 - Annual Charity Gala Dinner ($380 each)
(4,  2, 'Liu Yang',       'liu.yang@example.com',    '+86 139 0020 0001', '2026-10-11', 2, 760.00),
(5,  2, 'Wang Fang',      'wang.fang@example.com',   '+86 139 0020 0002', '2026-10-14', 1, 380.00),
(6,  2, 'Zhou Min',       'zhou.min@example.com',    '+86 139 0020 0003', '2026-10-17', 4, 1520.00),
-- Event 3 - Hope Silent Auction (free entry)
(7,  3, 'Wu Tao',         'wu.tao@example.com',      '+86 137 0030 0001', '2026-10-13', 2, 0.00),
(8,  3, 'Xu Qing',        'xu.qing@example.com',     '+86 137 0030 0002', '2026-10-15', 1, 0.00),
-- Event 4 - Voices for Change Charity Concert ($120 each)
(9,  4, 'Sun Hao',        'sun.hao@example.com',     '+86 136 0040 0001', '2026-10-12', 2, 240.00),
(10, 4, 'Ma Yunxia',      'ma.yunxia@example.com',   '+86 136 0040 0002', '2026-10-17', 3, 360.00),
-- Event 5 - Winter Warmth Community Walk ($30 each)
(11, 5, 'He Jing',        'he.jing@example.com',     '+86 135 0050 0001', '2026-10-16', 2, 60.00),
-- Event 9 - Summer Charity Concert (past, $80 each)
(12, 9, 'Luo Cheng',      'luo.cheng@example.com',   '+86 134 0090 0001', '2026-07-20', 2, 160.00),
(13, 9, 'Gao Lin',        'gao.lin@example.com',     '+86 134 0090 0002', '2026-07-28', 1, 80.00),
-- Event 10 - Riverside Walk for Health (past, $25 each)
(14, 10, 'Deng Xiaoyu',   'deng.xiaoyu@example.com', '+86 133 0100 0001', '2026-09-01', 2, 50.00);

-- =====================================================================
-- Verification
-- =====================================================================
SELECT 'organisations'  AS table_name, COUNT(*) AS rows_count FROM organisations
UNION ALL
SELECT 'categories',    COUNT(*) FROM categories
UNION ALL
SELECT 'events',        COUNT(*) FROM events
UNION ALL
SELECT 'registrations', COUNT(*) FROM registrations;
