-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 28, 2026 at 12:50 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hotel_management`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `CalculateBookingAmount` (IN `p_room_id` INT, IN `p_check_in_date` DATE, IN `p_check_out_date` DATE, IN `p_check_in_time` TIME, OUT `p_total_amount` DECIMAL(10,2))   BEGIN
    DECLARE v_current_date DATE;
    DECLARE v_current_time TIME;
    DECLARE v_day_count INT DEFAULT 0;
    DECLARE v_night_count INT DEFAULT 0;
    DECLARE v_day_price DECIMAL(10,2);
    DECLARE v_night_price DECIMAL(10,2);
    DECLARE v_is_weekend BOOLEAN;
    DECLARE v_multiplier DECIMAL(3,2);
    
    -- Get room prices
    SELECT base_price_day, base_price_night INTO v_day_price, v_night_price
    FROM rooms WHERE room_id = p_room_id;
    
    SET v_current_date = p_check_in_date;
    
    -- Loop through each day of stay
    WHILE v_current_date < p_check_out_date DO
        -- Check if weekend
        SET v_is_weekend = (DAYOFWEEK(v_current_date) IN (1, 7));
        
        -- Determine multiplier based on day/night and weekend
        IF v_current_date = p_check_in_date THEN
            -- First day: check-in time determines pricing
            IF p_check_in_time < '18:00:00' THEN
                -- Day check-in
                SET v_day_count = v_day_count + 1;
                SET v_multiplier = 1.00;
                IF v_is_weekend THEN SET v_multiplier = v_multiplier * 1.2; END IF;
                SET v_day_count = v_day_count + (v_multiplier - 1);
            ELSE
                -- Night check-in
                SET v_night_count = v_night_count + 1;
                SET v_multiplier = 1.50;
                IF v_is_weekend THEN SET v_multiplier = v_multiplier * 1.2; END IF;
                SET v_night_count = v_night_count + (v_multiplier - 1.5);
            END IF;
        ELSE
            -- Full days: count as one night and one day
            SET v_day_count = v_day_count + 1;
            SET v_night_count = v_night_count + 1;
        END IF;
        
        SET v_current_date = DATE_ADD(v_current_date, INTERVAL 1 DAY);
    END WHILE;
    
    -- Calculate total amount
    SET p_total_amount = (v_day_count * v_day_price) + (v_night_count * v_night_price);
    
    -- Store breakdown in JSON (optional)
    -- You can update the bookings table with this data
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_data`)),
  `new_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_data`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL,
  `booking_reference` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `check_in_time` time NOT NULL,
  `booking_status` enum('confirmed','checked_in','checked_out','cancelled','no_show') DEFAULT 'confirmed',
  `total_nights` int(11) NOT NULL,
  `day_nights_count` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`day_nights_count`)),
  `base_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `booking_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `special_requests` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `id_type` enum('passport','national_id','driving_license') NOT NULL,
  `id_number` varchar(50) NOT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `daily_income_report`
-- (See below for the actual view)
--
CREATE TABLE `daily_income_report` (
`date` date
,`total_bookings` bigint(21)
,`total_income` decimal(32,2)
,`payment_method` enum('cash','credit_card','debit_card','online','bank_transfer')
,`transaction_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL,
  `expense_reference` varchar(50) NOT NULL,
  `expense_type` enum('salary','utilities','maintenance','supplies','marketing','tax','insurance','other') NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `vendor_name` varchar(100) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `payment_method` enum('cash','bank_transfer','cheque','credit_card') DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `expense_breakdown`
-- (See below for the actual view)
--
CREATE TABLE `expense_breakdown` (
`expense_type` enum('salary','utilities','maintenance','supplies','marketing','tax','insurance','other')
,`category` varchar(50)
,`total_amount` decimal(32,2)
,`expense_count` bigint(21)
,`month` int(2)
,`year` int(4)
);

-- --------------------------------------------------------

--
-- Table structure for table `maintenance`
--

CREATE TABLE `maintenance` (
  `maintenance_id` int(11) NOT NULL,
  `expense_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `issue_type` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high','emergency') DEFAULT 'medium',
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `completed_date` date DEFAULT NULL,
  `vendor_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `monthly_financial_summary`
-- (See below for the actual view)
--
CREATE TABLE `monthly_financial_summary` (
`year` int(4)
,`month` int(2)
,`total_income` decimal(32,2)
,`total_expenses` decimal(32,2)
,`profit` decimal(33,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `payment_reference` varchar(50) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','credit_card','debit_card','online','bank_transfer') NOT NULL,
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `received_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `price_rules`
--

CREATE TABLE `price_rules` (
  `rule_id` int(11) NOT NULL,
  `room_type` enum('standard','deluxe','suite','presidential') NOT NULL,
  `day_start` time DEFAULT '06:00:00',
  `day_end` time DEFAULT '18:00:00',
  `night_start` time DEFAULT '18:00:00',
  `night_end` time DEFAULT '06:00:00',
  `multiplier_day` decimal(3,2) DEFAULT 1.00,
  `multiplier_night` decimal(3,2) DEFAULT 1.50,
  `weekend_multiplier` decimal(3,2) DEFAULT 1.20,
  `peak_season_multiplier` decimal(3,2) DEFAULT 1.50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `room_number` varchar(10) NOT NULL,
  `room_type` enum('standard','deluxe','suite','presidential') NOT NULL,
  `floor` int(11) NOT NULL,
  `capacity` int(11) NOT NULL,
  `bed_type` enum('single','double','queen','king') NOT NULL,
  `status` enum('available','occupied','maintenance','reserved') DEFAULT 'available',
  `base_price_day` decimal(10,2) NOT NULL,
  `base_price_night` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `room_occupancy_report`
-- (See below for the actual view)
--
CREATE TABLE `room_occupancy_report` (
`room_id` int(11)
,`room_number` varchar(10)
,`room_type` enum('standard','deluxe','suite','presidential')
,`total_bookings` bigint(21)
,`current_occupancy` decimal(22,0)
,`avg_stay_duration` decimal(10,4)
);

-- --------------------------------------------------------

--
-- Table structure for table `salary_payments`
--

CREATE TABLE `salary_payments` (
  `salary_id` int(11) NOT NULL,
  `expense_id` int(11) NOT NULL,
  `employee_name` varchar(100) NOT NULL,
  `employee_role` varchar(50) DEFAULT NULL,
  `month_year` date NOT NULL,
  `base_salary` decimal(10,2) NOT NULL,
  `bonus` decimal(10,2) DEFAULT 0.00,
  `deductions` decimal(10,2) DEFAULT 0.00,
  `net_amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('admin','staff') DEFAULT 'staff',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `email`, `full_name`, `role`, `created_at`, `last_login`, `is_active`) VALUES
(1, 'admin', '$2a$10$231PwFEitFZqMFvD6EU9f.Ezeipv6OW/aVchY3Fwvor/cKZX2dEKi', 'admin@hotel.com', 'System Admin', 'admin', '2026-05-28 10:43:10', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `utilities`
--

CREATE TABLE `utilities` (
  `utility_id` int(11) NOT NULL,
  `expense_id` int(11) NOT NULL,
  `utility_type` enum('electricity','water','gas','internet','waste_management') NOT NULL,
  `meter_reading_start` decimal(10,2) DEFAULT NULL,
  `meter_reading_end` decimal(10,2) DEFAULT NULL,
  `units_consumed` decimal(10,2) DEFAULT NULL,
  `rate_per_unit` decimal(10,2) DEFAULT NULL,
  `bill_period_start` date DEFAULT NULL,
  `bill_period_end` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `daily_income_report`
--
DROP TABLE IF EXISTS `daily_income_report`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `daily_income_report`  AS SELECT cast(`payments`.`payment_date` as date) AS `date`, count(distinct `payments`.`booking_id`) AS `total_bookings`, sum(`payments`.`amount`) AS `total_income`, `payments`.`payment_method` AS `payment_method`, count(0) AS `transaction_count` FROM `payments` WHERE `payments`.`payment_status` = 'completed' GROUP BY cast(`payments`.`payment_date` as date), `payments`.`payment_method` ;

-- --------------------------------------------------------

--
-- Structure for view `expense_breakdown`
--
DROP TABLE IF EXISTS `expense_breakdown`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `expense_breakdown`  AS SELECT `expenses`.`expense_type` AS `expense_type`, `expenses`.`category` AS `category`, sum(`expenses`.`amount`) AS `total_amount`, count(0) AS `expense_count`, month(`expenses`.`expense_date`) AS `month`, year(`expenses`.`expense_date`) AS `year` FROM `expenses` GROUP BY `expenses`.`expense_type`, `expenses`.`category`, year(`expenses`.`expense_date`), month(`expenses`.`expense_date`) ;

-- --------------------------------------------------------

--
-- Structure for view `monthly_financial_summary`
--
DROP TABLE IF EXISTS `monthly_financial_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `monthly_financial_summary`  AS SELECT year(`p`.`payment_date`) AS `year`, month(`p`.`payment_date`) AS `month`, (select coalesce(sum(`payments`.`amount`),0) from `payments` where `payments`.`payment_status` = 'completed' and year(`payments`.`payment_date`) = year(`p`.`payment_date`) and month(`payments`.`payment_date`) = month(`p`.`payment_date`)) AS `total_income`, (select coalesce(sum(`expenses`.`amount`),0) from `expenses` where year(`expenses`.`expense_date`) = year(`p`.`payment_date`) and month(`expenses`.`expense_date`) = month(`p`.`payment_date`)) AS `total_expenses`, (select coalesce(sum(`payments`.`amount`),0) from `payments` where `payments`.`payment_status` = 'completed' and year(`payments`.`payment_date`) = year(`p`.`payment_date`) and month(`payments`.`payment_date`) = month(`p`.`payment_date`)) - (select coalesce(sum(`expenses`.`amount`),0) from `expenses` where year(`expenses`.`expense_date`) = year(`p`.`payment_date`) and month(`expenses`.`expense_date`) = month(`p`.`payment_date`)) AS `profit` FROM `payments` AS `p` GROUP BY year(`p`.`payment_date`), month(`p`.`payment_date`)union select year(`expenses`.`expense_date`) AS `year`,month(`expenses`.`expense_date`) AS `month`,0 AS `total_income`,sum(`expenses`.`amount`) AS `total_expenses`,-sum(`expenses`.`amount`) AS `profit` from `expenses` where !exists(select 1 from `payments` where year(`payments`.`payment_date`) = year(`expenses`.`expense_date`) and month(`payments`.`payment_date`) = month(`expenses`.`expense_date`) limit 1) group by year(`expenses`.`expense_date`),month(`expenses`.`expense_date`)  ;

-- --------------------------------------------------------

--
-- Structure for view `room_occupancy_report`
--
DROP TABLE IF EXISTS `room_occupancy_report`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `room_occupancy_report`  AS SELECT `r`.`room_id` AS `room_id`, `r`.`room_number` AS `room_number`, `r`.`room_type` AS `room_type`, count(`b`.`booking_id`) AS `total_bookings`, sum(case when `b`.`booking_status` in ('confirmed','checked_in') then 1 else 0 end) AS `current_occupancy`, avg(to_days(`b`.`check_out_date`) - to_days(`b`.`check_in_date`)) AS `avg_stay_duration` FROM (`rooms` `r` left join `bookings` `b` on(`r`.`room_id` = `b`.`room_id`)) WHERE `b`.`booking_status` not in ('cancelled','no_show') GROUP BY `r`.`room_id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD UNIQUE KEY `booking_reference` (`booking_reference`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_bookings_dates` (`check_in_date`,`check_out_date`),
  ADD KEY `idx_bookings_status` (`booking_status`),
  ADD KEY `idx_bookings_customer` (`customer_id`),
  ADD KEY `idx_bookings_room` (`room_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `unique_id` (`id_type`,`id_number`),
  ADD KEY `idx_customers_phone` (`phone`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`),
  ADD UNIQUE KEY `expense_reference` (`expense_reference`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_expenses_date` (`expense_date`),
  ADD KEY `idx_expenses_type` (`expense_type`);

--
-- Indexes for table `maintenance`
--
ALTER TABLE `maintenance`
  ADD PRIMARY KEY (`maintenance_id`),
  ADD KEY `expense_id` (`expense_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `payment_reference` (`payment_reference`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `received_by` (`received_by`),
  ADD KEY `idx_payments_date` (`payment_date`),
  ADD KEY `idx_payments_status` (`payment_status`);

--
-- Indexes for table `price_rules`
--
ALTER TABLE `price_rules`
  ADD PRIMARY KEY (`rule_id`),
  ADD UNIQUE KEY `unique_room_type` (`room_type`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `room_number` (`room_number`),
  ADD KEY `idx_rooms_status` (`status`);

--
-- Indexes for table `salary_payments`
--
ALTER TABLE `salary_payments`
  ADD PRIMARY KEY (`salary_id`),
  ADD KEY `expense_id` (`expense_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `utilities`
--
ALTER TABLE `utilities`
  ADD PRIMARY KEY (`utility_id`),
  ADD KEY `expense_id` (`expense_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance`
--
ALTER TABLE `maintenance`
  MODIFY `maintenance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `price_rules`
--
ALTER TABLE `price_rules`
  MODIFY `rule_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `salary_payments`
--
ALTER TABLE `salary_payments`
  MODIFY `salary_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `utilities`
--
ALTER TABLE `utilities`
  MODIFY `utility_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `maintenance`
--
ALTER TABLE `maintenance`
  ADD CONSTRAINT `maintenance_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`expense_id`),
  ADD CONSTRAINT `maintenance_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `salary_payments`
--
ALTER TABLE `salary_payments`
  ADD CONSTRAINT `salary_payments_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`expense_id`);

--
-- Constraints for table `utilities`
--
ALTER TABLE `utilities`
  ADD CONSTRAINT `utilities_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`expense_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
