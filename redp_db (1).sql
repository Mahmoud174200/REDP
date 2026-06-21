-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 21, 2026 at 11:51 AM
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
-- Database: `redp_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_conversations`
--

CREATE TABLE `ai_conversations` (
  `id` char(36) NOT NULL,
  `company_id` char(36) DEFAULT NULL,
  `conversation_id` char(36) DEFAULT NULL,
  `session_id` varchar(255) NOT NULL,
  `context_summary` text DEFAULT NULL,
  `tokens_used` int(11) NOT NULL DEFAULT 0,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_predictions`
--

CREATE TABLE `ai_predictions` (
  `id` char(36) NOT NULL,
  `company_id` char(36) DEFAULT NULL,
  `model_name` varchar(255) NOT NULL,
  `entity_type` varchar(255) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `prediction_score` decimal(5,2) NOT NULL,
  `prediction_output` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`prediction_output`)),
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `lead_id` char(36) DEFAULT NULL,
  `booking_date` date DEFAULT NULL,
  `booking_time` time DEFAULT NULL,
  `booking_type` varchar(255) DEFAULT NULL,
  `remind_email` tinyint(1) NOT NULL DEFAULT 1,
  `remind_sms` tinyint(1) NOT NULL DEFAULT 0,
  `remind_whatsapp` tinyint(1) NOT NULL DEFAULT 0,
  `email_sent` tinyint(1) NOT NULL DEFAULT 0,
  `sms_sent` tinyint(1) NOT NULL DEFAULT 0,
  `whatsapp_sent` tinyint(1) NOT NULL DEFAULT 0,
  `type` varchar(255) NOT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `user_id`, `lead_id`, `booking_date`, `booking_time`, `booking_type`, `remind_email`, `remind_sms`, `remind_whatsapp`, `email_sent`, `sms_sent`, `whatsapp_sent`, `type`, `scheduled_at`, `status`, `created_at`, `updated_at`) VALUES
('546c2a3b-c410-4799-8a83-b15c3425db32', '3d4270b4-ae06-4aae-bb84-04c294e5c038', NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0, 'QC_Inspection', '2026-06-19 05:39:00', 'pending', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('af3409a4-9d70-491d-9914-668e7a31dafd', '3d4270b4-ae06-4aae-bb84-04c294e5c038', NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0, 'QC_Inspection', '2026-06-19 05:39:00', 'pending', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('da19a9ec-8fd0-4406-88c9-07caabbf3b35', 'a9250aee-0119-4a17-a237-259e4fe83abb', NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0, 'QC_Inspection', '2026-06-19 05:36:05', 'pending', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('daa0a101-2179-43c0-b9fc-63d2bb416027', 'a9250aee-0119-4a17-a237-259e4fe83abb', NULL, NULL, NULL, NULL, 1, 0, 0, 0, 0, 0, 'QC_Inspection', '2026-06-19 05:36:05', 'pending', '2026-06-14 05:36:05', '2026-06-14 05:36:05');

-- --------------------------------------------------------

--
-- Table structure for table `approval_actions`
--

CREATE TABLE `approval_actions` (
  `id` char(36) NOT NULL,
  `instance_id` char(36) NOT NULL,
  `step_id` char(36) NOT NULL,
  `actor_id` char(36) NOT NULL,
  `action` enum('approve','reject','escalate','comment','return') NOT NULL DEFAULT 'approve',
  `comment` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `acted_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval_conditions`
--

CREATE TABLE `approval_conditions` (
  `id` char(36) NOT NULL,
  `step_id` char(36) NOT NULL,
  `field` varchar(100) NOT NULL,
  `operator` enum('eq','neq','gt','lt','gte','lte','in','not_in','contains') NOT NULL DEFAULT 'eq',
  `value` varchar(255) NOT NULL,
  `logic` enum('and','or') NOT NULL DEFAULT 'and',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval_instances`
--

CREATE TABLE `approval_instances` (
  `id` char(36) NOT NULL,
  `workflow_id` char(36) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `current_step_id` char(36) DEFAULT NULL,
  `status` enum('pending','approved','rejected','escalated','cancelled','expired') NOT NULL DEFAULT 'pending',
  `requested_by` char(36) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval_steps`
--

CREATE TABLE `approval_steps` (
  `id` char(36) NOT NULL,
  `workflow_id` char(36) NOT NULL,
  `step_order` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('sequential','parallel','conditional') NOT NULL DEFAULT 'sequential',
  `approver_type` enum('user','role','position','department_head','direct_manager') NOT NULL DEFAULT 'user',
  `approver_id` char(36) DEFAULT NULL,
  `required_approvals` int(11) NOT NULL DEFAULT 1,
  `conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`conditions`)),
  `auto_approve` tinyint(1) NOT NULL DEFAULT 0,
  `timeout_hours` int(11) DEFAULT NULL,
  `escalation_to` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval_workflows`
--

CREATE TABLE `approval_workflows` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `company_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `auto_approve_conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`auto_approve_conditions`)),
  `timeout_hours` int(11) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(255) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `device_type` varchar(255) DEFAULT NULL,
  `browser` varchar(255) DEFAULT NULL,
  `geo_location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`geo_location`)),
  `session_id` varchar(255) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('000a3bce-7e30-4abb-8e90-04e500656105', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"632ff47c-41fc-4bca-8201-c1ad90b20859\"}', NULL, '{\"id\":\"632ff47c-41fc-4bca-8201-c1ad90b20859\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"a7b51a7b-f896-4ba7-94f1-b7ef103c13f9\",\"floor_id\":\"176d9d3a-0aff-4517-80d2-0b0aae5ffae4\",\"unit_number\":\"LPC-102\",\"floor\":1,\"type\":\"duplex\",\"area\":210,\"net_area\":198,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"lagoon\",\"orientation\":\"north_west\",\"building\":\"Lagoon Pavilion C\",\"price\":7200000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('00d48bef-5f81-4b83-88af-fd334b3f92dc', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"a5294f26-aada-41ee-ac93-e0c2413764ee\"}', NULL, '{\"id\":\"a5294f26-aada-41ee-ac93-e0c2413764ee\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"d7ee4704-73dd-4e8c-b0f7-984dace9fc62\",\"unit_number\":\"CRB-101\",\"floor\":1,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":4570000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('01968f7e-25bc-46f7-86c0-3c3498d1ef55', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1782025360602\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 04:02:42', '2026-06-21 04:02:42'),
('021eea32-dc00-468f-a621-6bf168f0ee78', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781425849871\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:30:52', '2026-06-14 05:30:52'),
('027c22a4-2dae-4a05-9f1a-b1496c88de35', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427010607\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:11', '2026-06-14 05:50:11'),
('0369df6e-d2ef-4506-865b-27b4a0889e75', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426289623\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:10', '2026-06-14 05:38:10'),
('045be048-cb8f-4f8b-8b9d-66338bb62f1f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"6b120e06-9e09-4d2f-8a98-cc4706210c25\"}', NULL, '{\"id\":\"6b120e06-9e09-4d2f-8a98-cc4706210c25\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"5cd0b0d0-e376-4c45-b39f-5f70be786605\",\"unit_number\":\"CRB-402\",\"floor\":4,\"type\":\"penthouse\",\"area\":270,\"net_area\":258,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Creek Residence B\",\"price\":9300000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('05a1c80a-7d5b-4ca5-a6a0-af36377eaba2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426118277\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:19', '2026-06-14 05:35:19'),
('073cb1d5-b43e-4b01-a4e6-206b84bc8cae', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"736553b0-2792-4533-8ba5-42f01e432fd9\"}', NULL, '{\"id\":\"736553b0-2792-4533-8ba5-42f01e432fd9\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"665c3e6b-1ed4-48f6-8c20-c8377563294e\",\"unit_number\":\"B-301\",\"floor\":3,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5550000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('07f88134-7aa1-42c3-96cf-6af8600aae3e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422647779\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:28', '2026-06-14 04:37:28'),
('0802bbcd-f9d1-4743-a78c-2c12e4305169', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"8e94fe6a-ba98-44b6-a34f-74b9d0629f5e\"}', NULL, '{\"id\":\"8e94fe6a-ba98-44b6-a34f-74b9d0629f5e\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"2cc26949-c15c-4458-b1f3-4e01153093f8\",\"unit_number\":\"A-303\",\"floor\":3,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5850000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('080ee2a2-3a6e-49de-b853-fa483c8320ff', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426280168\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:01', '2026-06-14 05:38:01'),
('08b143ce-e4ce-41ea-bef7-d14e1c541fbf', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781510635964\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-15 05:04:02', '2026-06-15 05:04:02'),
('08ddfec1-bc78-4278-83da-6fdc203b8e65', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426319435\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:40', '2026-06-14 05:38:40'),
('09a24dd4-5080-47da-b63e-6f5b820e3adc', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427184019\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:53:05', '2026-06-14 05:53:05'),
('09d243e9-2957-46f1-a8e2-eb9b4e2bceb7', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1782030815987\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 05:33:51', '2026-06-21 05:33:51'),
('0a24a654-7987-4f49-a602-d8df7ccd82c4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426290889\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:12', '2026-06-14 05:38:12'),
('0b3c95f2-cade-4944-9f8a-8c6e918f953f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'CONTRACT_AUTO_GENERATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"contract_number\":\"REDP-CTR-2026-0006\",\"unit_id\":\"24508d2a-c9a0-41ea-8423-b2ca1d247865\",\"total_amount\":\"5000000.00\",\"installments\":12}', NULL, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('0b713e2b-46bc-47e5-bb6f-42f4ee7dd079', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427179913\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:53:01', '2026-06-14 05:53:01'),
('0b728dd8-71bc-4ee4-9f66-134eb7a60efb', '43209f55-b7a8-411a-a789-a81d697b741d', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174654510\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:21', '2026-06-11 07:44:21'),
('0bc46876-4b86-4cdd-ae50-b6c7c138d86a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422616811\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:57', '2026-06-14 04:36:57'),
('0c5ff266-b138-456a-bb6c-3661b946384c', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-11 08:42:26', '2026-06-11 08:42:26'),
('0cc8f982-bbd0-4f92-b82a-5e3bf399c8b8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426246611\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:37:28', '2026-06-14 05:37:28'),
('0d19b896-11b5-442b-954e-89dda565cfd0', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174625356\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:43:55', '2026-06-11 07:43:55'),
('0d1c81dc-2ec7-46b1-ae2e-d11304de1b86', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426995020\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:59', '2026-06-14 05:49:59'),
('0d3e9c71-f873-4a7b-9197-bff25efacbbb', '43209f55-b7a8-411a-a789-a81d697b741d', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174654511\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:24', '2026-06-11 07:44:24'),
('0f5a9fca-f4d0-4dd9-ad1a-4b41306cd8b5', '3d4270b4-ae06-4aae-bb84-04c294e5c038', 'CONTRACT_AUTO_GENERATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"contract_number\":\"REDP-CTR-2026-0008\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\",\"total_amount\":\"6200000.00\",\"installments\":12}', NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('0f95b6f4-ee57-4325-99da-b2f3c7e9846f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-21 05:31:58', '2026-06-21 05:31:58'),
('107a93a8-c966-4dca-9de7-e46f15a68058', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427012419\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:13', '2026-06-14 05:50:13'),
('10eafcaf-760b-45e7-baf0-df9ca0a3b0b3', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"224ede51-de5c-4711-8115-1d1e14d908ba\"}', NULL, '{\"id\":\"224ede51-de5c-4711-8115-1d1e14d908ba\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"4b400fd2-362f-4cec-9657-3759aa9078ac\",\"floor_id\":\"7d756082-bfea-4cc8-a86c-1964aff041e0\",\"unit_number\":\"C-202\",\"floor\":2,\"type\":\"penthouse\",\"area\":300,\"net_area\":285,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building C\",\"price\":10000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:38\",\"created_at\":\"2026-06-21 09:47:38\"}', '2026-06-21 06:47:38', '2026-06-21 06:47:38'),
('1119f7d4-f8dd-4d46-b3bb-37d7a6fcbc14', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"57403bbc-9b71-4b61-857a-86c9a545af53\"}', NULL, '{\"id\":\"57403bbc-9b71-4b61-857a-86c9a545af53\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"a7b51a7b-f896-4ba7-94f1-b7ef103c13f9\",\"floor_id\":\"fa582a2b-0ffb-49cb-8536-32db03a4db8e\",\"unit_number\":\"LPC-201\",\"floor\":2,\"type\":\"duplex\",\"area\":210,\"net_area\":198,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"lagoon\",\"orientation\":\"north_west\",\"building\":\"Lagoon Pavilion C\",\"price\":7000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('113a1e55-b99d-42d6-afad-757c3ff72668', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e4ba642f-76f8-45bd-b38e-8d809c656262\"}', NULL, '{\"id\":\"e4ba642f-76f8-45bd-b38e-8d809c656262\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"446e2ad9-60fe-45f6-a632-67946cf5f66d\",\"unit_number\":\"A-203\",\"floor\":2,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5550000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('115270dc-62fb-41dd-bcc2-94deb24aa1a3', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9ebfbead-fdb1-4aba-875a-207f7e47d451\"}', NULL, '{\"id\":\"9ebfbead-fdb1-4aba-875a-207f7e47d451\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"13270b89-cb08-44d9-b892-d3adc7ff1ff8\",\"unit_number\":\"CRA-202\",\"floor\":2,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence A\",\"price\":4940000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('11f1da5c-dab0-413a-8776-d109eafc0250', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"65f97b21-48b4-4624-b6a3-c8ac158c45dd\"}', NULL, '{\"id\":\"65f97b21-48b4-4624-b6a3-c8ac158c45dd\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"c134bce6-34b5-4788-9f8e-60d0777f94ef\",\"unit_number\":\"B-201\",\"floor\":2,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('11fd8e4f-9aac-4713-b5f7-c7e770f9bdcb', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781420515357\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:02:01', '2026-06-14 04:02:01'),
('121ead7b-ebfb-4f0b-b7cb-28d956595763', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e42faa03-0eee-4212-a753-91c4126c8561\"}', NULL, '{\"id\":\"e42faa03-0eee-4212-a753-91c4126c8561\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"dbca067c-c922-4a74-b17d-a60128586827\",\"unit_number\":\"A-304\",\"floor\":3,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":6000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('136fccce-4573-498a-8c68-e20dcba6e78c', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e0043436-a03c-478c-8b9e-19be57c1516d\"}', NULL, '{\"id\":\"e0043436-a03c-478c-8b9e-19be57c1516d\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"665c3e6b-1ed4-48f6-8c20-c8377563294e\",\"unit_number\":\"B-303\",\"floor\":3,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5850000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('13859137-745a-4f53-b03f-50ef3fe33a2a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425797347\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:59', '2026-06-14 05:29:59'),
('13d345fd-40bc-46b6-ab9d-1803e3a456ac', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f463c20e-de17-4e6c-9aa0-be3b89419d68\"}', NULL, '{\"id\":\"f463c20e-de17-4e6c-9aa0-be3b89419d68\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"d9e7ce7d-2e83-45a0-8401-7f6b8a1d396b\",\"unit_number\":\"B-101\",\"floor\":1,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":4950000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('13f1f9ff-14da-4339-a109-966e4df617a6', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-21 04:28:01', '2026-06-21 04:28:01'),
('13f96688-e23f-4186-8cbc-816d8ad36eb4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781420515357\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:01:58', '2026-06-14 04:01:58'),
('14809800-4c64-43a1-939f-e6ac366dcafa', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"47e16f8f-2123-43f1-9f12-419198e3e291\"}', NULL, '{\"id\":\"47e16f8f-2123-43f1-9f12-419198e3e291\",\"project_id\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\",\"building_id\":\"fd85cbce-1008-46f2-a51b-b27844f967c5\",\"floor_id\":\"60edc1c1-378d-4f47-9bdb-abb9271a3f82\",\"unit_number\":\"T-01\",\"floor\":0,\"type\":\"apartment\",\"area\":120,\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":1,\"price\":2500000,\"finishing_type\":\"fully_finished\",\"view_type\":null,\"building\":\"TEST\",\"status\":\"available\",\"phase\":\"Phase 1\",\"updated_at\":\"2026-06-17 07:43:44\",\"created_at\":\"2026-06-17 07:43:44\"}', '2026-06-17 04:43:44', '2026-06-17 04:43:44'),
('154d4593-26ed-420c-917a-2917e632c4ae', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"667e5a93-29a6-4185-89c9-52738dbcf81d\"}', NULL, '{\"id\":\"667e5a93-29a6-4185-89c9-52738dbcf81d\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"4b400fd2-362f-4cec-9657-3759aa9078ac\",\"floor_id\":\"27d64253-f5bf-44fa-abdf-86b39236cfb0\",\"unit_number\":\"C-102\",\"floor\":1,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7800000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:38\",\"created_at\":\"2026-06-21 09:47:38\"}', '2026-06-21 06:47:38', '2026-06-21 06:47:38'),
('16f975f8-239c-4380-9d2d-57103c90e086', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423025002\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:45', '2026-06-14 04:43:45'),
('1755ee1d-64ea-4786-84fc-f36e1dfe3f52', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423023023\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:43', '2026-06-14 04:43:43'),
('1827e315-b6cc-446f-b973-c5561085b816', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426995020\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:00', '2026-06-14 05:50:00'),
('1913abfc-e140-4a4c-a73f-b8cec12b3a0a', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-21 04:15:43', '2026-06-21 04:15:43'),
('19b95073-4020-40e1-88fc-e7a139210e39', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"5b0e7522-0335-4e90-9484-048db1df843f\"}', NULL, '{\"id\":\"5b0e7522-0335-4e90-9484-048db1df843f\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6a32ae9d-efca-4649-807b-f73e41ce294f\",\"unit_number\":\"B-004\",\"floor\":0,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5100000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('1a15a78b-2605-403d-856b-2b0b0c47cd2f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"8352fd4d-6a07-4278-91e1-0a6323117cc6\"}', NULL, '{\"id\":\"8352fd4d-6a07-4278-91e1-0a6323117cc6\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"d9e7ce7d-2e83-45a0-8401-7f6b8a1d396b\",\"unit_number\":\"B-102\",\"floor\":1,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('1bbac11f-dcd7-4797-858b-321569b7d46f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422643845\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:25', '2026-06-14 04:37:25'),
('1cee3c36-1edb-4669-8072-9dd9c968f81a', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"73efa6d4-3b03-415c-97c1-edcb3583435d\"}', NULL, '{\"id\":\"73efa6d4-3b03-415c-97c1-edcb3583435d\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"c3336fa8-2eac-44ca-b366-a408c19f84f6\",\"unit_number\":\"A-401\",\"floor\":4,\"type\":\"penthouse\",\"area\":270,\"net_area\":255,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building A\",\"price\":9500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('1d0cac11-4fb3-42f6-a59b-d9d8a8982a00', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427181760\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:53:03', '2026-06-14 05:53:03'),
('1d3ef9ff-b1ff-4246-a759-021b280ca842', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"a2928c9a-3a19-4b6f-b4fa-3e60098a2c63\"}', NULL, '{\"id\":\"a2928c9a-3a19-4b6f-b4fa-3e60098a2c63\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"a7b51a7b-f896-4ba7-94f1-b7ef103c13f9\",\"floor_id\":\"fa582a2b-0ffb-49cb-8536-32db03a4db8e\",\"unit_number\":\"LPC-202\",\"floor\":2,\"type\":\"duplex\",\"area\":210,\"net_area\":198,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"lagoon\",\"orientation\":\"north_west\",\"building\":\"Lagoon Pavilion C\",\"price\":7200000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('1d503dcb-ec7b-4af5-9115-4b05145509f9', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422649978\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:31', '2026-06-14 04:37:31'),
('1d544ccd-2269-46e1-9572-7844d2290370', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426189484\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:30', '2026-06-14 05:36:30'),
('1d85caca-5c0f-4108-bdae-60a82f053bf1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426869460\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:47:53', '2026-06-14 05:47:53'),
('1d983b64-bfee-444f-94bd-0fc64c164e79', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"PUT\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\\/a1ff33da-84eb-45f3-8cf8-4bc64f560332\\/transfer\",\"route_params\":{\"id\":\"a1ff33da-84eb-45f3-8cf8-4bc64f560332\"},\"query_params\":[],\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:48:49', '2026-06-14 05:48:49');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('1d9b293a-5834-424c-b2c6-b549d08b8752', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1782025360275\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 04:02:40', '2026-06-21 04:02:40'),
('1ddae646-093d-4e94-898e-843af25b9f0b', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"a5db8df9-1f18-45ed-ba01-74a1d9c68edd\"}', NULL, '{\"id\":\"a5db8df9-1f18-45ed-ba01-74a1d9c68edd\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"48bfbaf9-a478-414b-8c85-4ab2e5327191\",\"unit_number\":\"B-401\",\"floor\":4,\"type\":\"penthouse\",\"area\":270,\"net_area\":255,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building B\",\"price\":9500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('1e07acfb-25dc-429e-bdc5-4737f8ad9cda', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175544522\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:06', '2026-06-11 07:59:06'),
('1ec85fa3-2396-4b65-87f9-9c345cffdf61', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426761016\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:46:05', '2026-06-14 05:46:05'),
('1fe98faa-410a-405a-a21c-ce1cfdb76dfe', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426246932\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:37:29', '2026-06-14 05:37:29'),
('20aee221-44b3-48b9-96b4-274e98ce5103', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-11 07:46:17', '2026-06-11 07:46:17'),
('219fb393-f78b-4d39-b9b0-6e07d736f9e8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426246611\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:37:28', '2026-06-14 05:37:28'),
('2326aa25-1510-46f8-9df9-22794d85e1f4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-21 04:02:31', '2026-06-21 04:02:31'),
('2443c31a-9992-412e-9c64-798dba719061', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"20fc1edd-dce8-4835-9ddf-fd513a8a4bdb\"}', NULL, '{\"id\":\"20fc1edd-dce8-4835-9ddf-fd513a8a4bdb\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ac971739-c8e1-4322-8a97-fb312be28dfd\",\"floor_id\":\"ae5cd80a-97af-44f4-aca6-627d1be0ae5d\",\"unit_number\":\"C-202\",\"floor\":2,\"type\":\"penthouse\",\"area\":300,\"net_area\":285,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building C\",\"price\":10000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('2450d2eb-9c32-4093-82c3-8a19e04ff2cc', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426286081\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:07', '2026-06-14 05:38:07'),
('25794574-286c-41f1-a64d-611623340375', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\\/units\",\"route_params\":{\"projectId\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\"},\"query_params\":{\"status\":\"all\",\"type\":\"all\",\"_t\":\"1781423010129\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:31', '2026-06-14 04:43:31'),
('25c52c79-4aae-4b45-a91d-06dad71e7cea', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426125724\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:26', '2026-06-14 05:35:26'),
('260bb03d-5322-4d95-85bb-0e9faf260924', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427042420\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:48', '2026-06-14 05:50:48'),
('260f745f-4a65-4026-ae2a-dd9d9cd0e04b', '43209f55-b7a8-411a-a789-a81d697b741d', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781174654511\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:23', '2026-06-11 07:44:23'),
('269cb7cb-c704-41a3-ba01-7930cdcc7aaf', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"80c705f2-5a0e-4d30-aac0-b12a8e3c708c\"}', NULL, '{\"id\":\"80c705f2-5a0e-4d30-aac0-b12a8e3c708c\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"87e91f7f-8707-4b57-809d-9b0d9afebb86\",\"unit_number\":\"A-003\",\"floor\":0,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":4950000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('272c8c13-f780-450a-a80f-83cbfab2027d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426119230\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:20', '2026-06-14 05:35:20'),
('28c6a845-ef5e-4951-a11a-c236516a7cc1', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e890775e-76e2-4b9b-b1c1-2999a3b3ab94\"}', NULL, '{\"id\":\"e890775e-76e2-4b9b-b1c1-2999a3b3ab94\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"a3b72eef-aa4e-49f9-9ee5-e39bad335f1c\",\"unit_number\":\"A-203\",\"floor\":2,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5550000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('2913e5fe-b5ab-4116-bd5a-85d9e0264350', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f45b74c1-9016-4875-8807-f573e5636d62\"}', NULL, '{\"id\":\"f45b74c1-9016-4875-8807-f573e5636d62\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"668a2039-8201-445c-b717-fd7d4b561955\",\"unit_number\":\"CRB-302\",\"floor\":3,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence B\",\"price\":5190000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('291c8342-8e8d-42b3-8415-802f13817887', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422596507\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:49', '2026-06-14 04:36:49'),
('2948b4cb-8a66-4345-bcd7-081479db176f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422603135\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:53', '2026-06-14 04:36:53'),
('29d95380-e10e-4706-b69b-8633e6e33e1b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426964926\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:26', '2026-06-14 05:49:26'),
('2a8de2d8-07ef-4771-adfd-25dacec8a147', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'curl/8.19.0', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-21 04:21:08', '2026-06-21 04:21:08'),
('2ba54ec5-745d-4d46-a285-59feba7e99df', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427011717\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:13', '2026-06-14 05:50:13'),
('2bbc8835-d09f-4d68-b09a-34bfe2cecfb2', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"3f15daf8-da59-447f-b4f2-7633aa995e27\"}', NULL, '{\"id\":\"3f15daf8-da59-447f-b4f2-7633aa995e27\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"69973069-2741-47ff-87cd-87df4d15e53f\",\"unit_number\":\"CRB-203\",\"floor\":2,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":5060000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('2d4f90e5-927f-4707-958e-c8f8b3ad7bb2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422648901\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:29', '2026-06-14 04:37:29'),
('2eb8449a-2054-4fce-b189-8a05ed467236', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"942c61ab-40b0-4039-aa4a-c5d14289822d\"}', NULL, '{\"id\":\"942c61ab-40b0-4039-aa4a-c5d14289822d\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"a994e9f7-a97f-4ebf-a638-15cc9f343729\",\"unit_number\":\"CRA-301\",\"floor\":3,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":5070000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('309b6cec-c9ef-45c7-b610-c6888424f6c6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426286582\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:08', '2026-06-14 05:38:08'),
('30adc655-ce97-4666-ada1-0b1b926a3ed4', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175539088\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:00', '2026-06-11 07:59:00'),
('30c72bb5-e63a-424b-a52b-322724a54c76', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"company_sales_leader@redp.com\"}', NULL, NULL, '2026-06-11 07:58:59', '2026-06-11 07:58:59'),
('30faf52c-8f46-454e-9857-a61fad59d087', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422603135\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:53', '2026-06-14 04:36:53'),
('328d2298-411a-44cb-8d5f-36f9c272a28c', '43209f55-b7a8-411a-a789-a81d697b741d', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174654511\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:24', '2026-06-11 07:44:24'),
('32c2273d-226e-4aad-aa72-9ec425fb3c2a', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"5654b3df-2ad6-47dd-820b-1b4a58eca4a4\"}', NULL, '{\"id\":\"5654b3df-2ad6-47dd-820b-1b4a58eca4a4\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"a994e9f7-a97f-4ebf-a638-15cc9f343729\",\"unit_number\":\"CRA-303\",\"floor\":3,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":5310000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('33e09d0a-31d6-4669-835f-3d3e438941cf', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f9312b5c-db0e-4ee8-9314-b3129080d5cf\"}', NULL, '{\"id\":\"f9312b5c-db0e-4ee8-9314-b3129080d5cf\",\"project_id\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\",\"building_id\":\"fd85cbce-1008-46f2-a51b-b27844f967c5\",\"floor_id\":\"60edc1c1-378d-4f47-9bdb-abb9271a3f82\",\"unit_number\":\"T-04\",\"floor\":0,\"type\":\"apartment\",\"area\":120,\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":1,\"price\":2500000,\"finishing_type\":\"fully_finished\",\"view_type\":null,\"building\":\"TEST\",\"status\":\"available\",\"phase\":\"Phase 1\",\"updated_at\":\"2026-06-17 07:43:44\",\"created_at\":\"2026-06-17 07:43:44\"}', '2026-06-17 04:43:44', '2026-06-17 04:43:44'),
('33e8b461-86cc-4b98-b0fe-37b068fe4cb6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422645127\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:26', '2026-06-14 04:37:26'),
('3425b54d-4973-408f-8097-872673ceea20', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426188736\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:29', '2026-06-14 05:36:29'),
('35105748-6969-481a-86bf-3cc95f9275b2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426291239\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:12', '2026-06-14 05:38:12'),
('3543401d-7f63-4289-adb7-e180a8a3ff9b', '3d4270b4-ae06-4aae-bb84-04c294e5c038', 'HANDOVER_AUTO_SCHEDULE', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"reservation_id\":\"11fe74b8-9950-4c22-9460-7f684eac2d98\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\"}', NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('35d659d4-b8dc-4fdb-8653-632784a79ca5', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781420515660\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:01:59', '2026-06-14 04:01:59'),
('3649e76d-0b8e-497d-b6da-c527bc0d1fa4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423025265\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:46', '2026-06-14 04:43:46'),
('36550389-2f02-49b4-85f0-317d57303e93', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-21 04:23:17', '2026-06-21 04:23:17'),
('37ca8626-a649-495b-bf2a-3db155c7dec2', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9b4355dd-8445-4c93-96f6-8d10520d6996\"}', NULL, '{\"id\":\"9b4355dd-8445-4c93-96f6-8d10520d6996\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"c134bce6-34b5-4788-9f8e-60d0777f94ef\",\"unit_number\":\"B-203\",\"floor\":2,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5550000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('38145cd3-e0ab-4f03-97f3-903b81b93224', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c450ce03-ba42-4f24-ae43-8652d486ba04\"}', NULL, '{\"id\":\"c450ce03-ba42-4f24-ae43-8652d486ba04\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6423e97d-9a77-4b48-9196-2d005b094f2b\",\"unit_number\":\"B-104\",\"floor\":1,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5400000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('394da9d6-75e5-454f-a333-747c889de3fe', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426340371\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:39:01', '2026-06-14 05:39:01'),
('3962c83e-c899-4fb1-86ea-3229e93e69de', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"cd16b6a6-b60e-4c49-884d-2de5cf7a9944\"}', NULL, '{\"id\":\"cd16b6a6-b60e-4c49-884d-2de5cf7a9944\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"431dbfac-3727-4c97-9c4d-fb94631cd7a5\",\"unit_number\":\"B-402\",\"floor\":4,\"type\":\"penthouse\",\"area\":300,\"net_area\":285,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building B\",\"price\":10000000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('3a0f5372-e69c-42e6-971d-c4e87c4d8dea', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427178484\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:53:00', '2026-06-14 05:53:00'),
('3b1515fc-8927-46b9-af6e-1770f6771235', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426341794\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:39:02', '2026-06-14 05:39:02'),
('3b3c050f-ad2e-4da6-967e-d84c8e3e43f0', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"b33a7a92-ef82-439c-a31b-e78aa5099cee\"}', NULL, '{\"id\":\"b33a7a92-ef82-439c-a31b-e78aa5099cee\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6423e97d-9a77-4b48-9196-2d005b094f2b\",\"unit_number\":\"B-101\",\"floor\":1,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":4950000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('3b83ebaa-0b21-4f00-b7e1-ee8f2eb7c0d2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426995020\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:01', '2026-06-14 05:50:01'),
('3c09dd5f-891c-4511-b1b5-71977b58e48b', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"37db1f6b-c584-4ec2-9d35-16433e3a2da4\"}', NULL, '{\"id\":\"37db1f6b-c584-4ec2-9d35-16433e3a2da4\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"d9e7ce7d-2e83-45a0-8401-7f6b8a1d396b\",\"unit_number\":\"B-104\",\"floor\":1,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5400000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('3c7b1dfc-f4c1-48f8-b026-6f63bed50151', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"83f9df1f-c9a3-4ed5-842b-26e7368adaa8\"}', NULL, '{\"id\":\"83f9df1f-c9a3-4ed5-842b-26e7368adaa8\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6423e97d-9a77-4b48-9196-2d005b094f2b\",\"unit_number\":\"B-103\",\"floor\":1,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('3ca9086d-6aa8-4a0d-8d2a-5e9d4f512b01', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422596207\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:52', '2026-06-14 04:36:52'),
('3ce298ea-245e-463d-9b47-0a366a41e3c2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422646861\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:28', '2026-06-14 04:37:28'),
('3f3e7a80-bae2-40e0-9413-31ab85f5358e', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f82e1b23-2bd7-4d35-9084-7115b379fdf4\"}', NULL, '{\"id\":\"f82e1b23-2bd7-4d35-9084-7115b379fdf4\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"55b7fde8-9587-48f2-813a-2bef94d6e466\",\"unit_number\":\"B-203\",\"floor\":2,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5550000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('3f712328-17fc-47c6-84d3-d852dae834d6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422603135\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:55', '2026-06-14 04:36:55'),
('41421aa1-8505-40bd-b51e-ae99c3656533', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"POST\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/bookings\",\"route_params\":[],\"query_params\":[],\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('41afa420-5b41-44da-9274-651a640c8759', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426344133\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:39:04', '2026-06-14 05:39:04'),
('41be0ad8-af82-40df-ad52-43aab8b4842a', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"4e970f5d-ab2c-4c5d-af60-7e227efdc651\"}', NULL, '{\"id\":\"4e970f5d-ab2c-4c5d-af60-7e227efdc651\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"b8c257e5-69b2-453c-85e3-05f491ae56e0\",\"floor_id\":\"9847b683-b9dd-4c7f-9c3c-405a76996fcd\",\"unit_number\":\"CHP-002\",\"floor\":0,\"type\":\"commercial\",\"area\":160,\"net_area\":148,\"finishing_type\":\"fully_finished\",\"bedrooms\":null,\"bathrooms\":1,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"street\",\"orientation\":\"east\",\"building\":\"Clubhouse Pavilion E\",\"price\":7100000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Retail & commercial shop space in the top-right commercial promenade. Ideal for caf\\u00e9s, boutiques, or high-end services.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('41f7bfe2-11e9-4415-becd-bde100606695', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f81fd0b9-fa8d-410a-b8d6-2dccb2d1065f\"}', NULL, '{\"id\":\"f81fd0b9-fa8d-410a-b8d6-2dccb2d1065f\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"dbca067c-c922-4a74-b17d-a60128586827\",\"unit_number\":\"A-302\",\"floor\":3,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5700000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('42171a3c-dbda-4c73-a51d-5994411d67d8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426279068\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:00', '2026-06-14 05:38:00'),
('425ae479-df79-46a1-bf72-324475f724a1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427180677\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:53:02', '2026-06-14 05:53:02'),
('428cc31c-4697-4480-b4c5-1fdd7993c90d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422992409\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:14', '2026-06-14 04:43:14'),
('4298f415-69d4-46c2-97b8-9dbbbc0dfbc2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426185456\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:26', '2026-06-14 05:36:26'),
('42ee8e23-5475-450c-b2cc-740c243bb718', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9a3e0c4f-3603-4d8c-9e25-b2c0852d9467\"}', NULL, '{\"id\":\"9a3e0c4f-3603-4d8c-9e25-b2c0852d9467\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"87e91f7f-8707-4b57-809d-9b0d9afebb86\",\"unit_number\":\"A-002\",\"floor\":0,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":4800000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('431bd26c-d5f6-4923-828b-bca6c53f0243', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"faf4eedf-7e64-4781-bee9-bfb754f57e33\"}', NULL, '{\"id\":\"faf4eedf-7e64-4781-bee9-bfb754f57e33\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"a7b51a7b-f896-4ba7-94f1-b7ef103c13f9\",\"floor_id\":\"d9acd2a6-63dd-4509-b12d-212976f6cb88\",\"unit_number\":\"LPC-001\",\"floor\":0,\"type\":\"duplex\",\"area\":210,\"net_area\":198,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"lagoon\",\"orientation\":\"north_west\",\"building\":\"Lagoon Pavilion C\",\"price\":7000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('4416fb97-c0f0-4d02-b300-2bf9f4fd069a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422596207\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:51', '2026-06-14 04:36:51'),
('4550008c-ddcd-4f92-be30-5bd043e19bb9', '43209f55-b7a8-411a-a789-a81d697b741d', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781174654511\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:25', '2026-06-11 07:44:25'),
('4793106a-e27a-401b-8d37-5479dacbcaf0', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-14 04:01:42', '2026-06-14 04:01:42'),
('47ba089f-7049-404b-a288-34ae4c7982aa', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-15 05:02:56', '2026-06-15 05:02:56'),
('47fa62f2-ceba-4a00-b675-0dab72f24253', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"5b317e19-bda2-48ce-81c2-c37f911eec85\"}', NULL, '{\"id\":\"5b317e19-bda2-48ce-81c2-c37f911eec85\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"87e91f7f-8707-4b57-809d-9b0d9afebb86\",\"unit_number\":\"A-001\",\"floor\":0,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":4650000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('490b8921-ba6b-45ca-923d-db34c053454c', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f919e3ef-0fe2-45e4-9bd2-3d4ab7f19431\"}', NULL, '{\"id\":\"f919e3ef-0fe2-45e4-9bd2-3d4ab7f19431\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"c021af24-4f2a-426c-8482-2ca444961eaa\",\"unit_number\":\"A-102\",\"floor\":1,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('49dd1375-beff-47e7-87e3-a75302fec04e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\\/units\",\"route_params\":{\"projectId\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\"},\"query_params\":{\"status\":\"all\",\"type\":\"all\",\"_t\":\"1781427013263\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:15', '2026-06-14 05:50:15'),
('49df2745-17d3-47ae-bc25-d3ccda46c5cc', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422603135\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:53', '2026-06-14 04:36:53'),
('4a002722-0d4c-454e-af74-492b6ee3b170', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'UNIT_RESERVE', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"unit_id\":\"24508d2a-c9a0-41ea-8423-b2ca1d247865\",\"reservation_id\":\"f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e\",\"eoi_amount\":50000}', NULL, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('4ab324d6-c206-4349-956c-1cc2019ad421', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"7c009cde-6af3-4b17-bd82-8414417a9df5\"}', NULL, '{\"id\":\"7c009cde-6af3-4b17-bd82-8414417a9df5\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"446e2ad9-60fe-45f6-a632-67946cf5f66d\",\"unit_number\":\"A-202\",\"floor\":2,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5400000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('4ab696b3-a090-4e9d-99ce-92a5ca45c611', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"ffbc8aac-5f26-4b38-809f-e9d48219377f\"}', NULL, '{\"id\":\"ffbc8aac-5f26-4b38-809f-e9d48219377f\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"733ded42-bbd1-4ac3-ad16-1daeb5524a4e\",\"unit_number\":\"A-101\",\"floor\":1,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":4950000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('4bb91d1e-b829-47ec-bd5e-8131d3215930', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426761016\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:46:03', '2026-06-14 05:46:03'),
('4c007aac-0432-4bb3-9b6f-e7e9ed06f4cb', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426317411\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:38', '2026-06-14 05:38:38'),
('4c03eb15-3f4f-4d9b-b97e-6861d4817fd4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781510635964\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-15 05:03:59', '2026-06-15 05:03:59'),
('4c6fce6c-e1d3-4675-a9a3-45d756cbde87', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426869460\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:47:53', '2026-06-14 05:47:53'),
('4cd03f13-247b-42b0-a240-424e19498c19', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423023340\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:44', '2026-06-14 04:43:44'),
('4d2c674e-3b17-4a5a-b978-285c195e9f57', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426290077\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:11', '2026-06-14 05:38:11'),
('4d2e2cc3-5d7f-428a-befc-561df8fd9679', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-11 08:32:45', '2026-06-11 08:32:45'),
('4d36b9ef-1406-4af8-ab1d-cf268e0b98c5', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426287566\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:09', '2026-06-14 05:38:09'),
('4dd541e1-1132-49e7-9423-beab5faa6021', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9f7bc787-8508-47ee-bce2-5f51d3deac54\"}', NULL, '{\"id\":\"9f7bc787-8508-47ee-bce2-5f51d3deac54\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"66811d50-0cf3-46b5-b55e-e233c0cb5f69\",\"unit_number\":\"CRA-003\",\"floor\":0,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":4560000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('4df389f0-fed1-4964-b7a9-d4a8e8c1b466', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"60434cb8-eddd-44a8-bc29-54f81934c864\"}', NULL, '{\"id\":\"60434cb8-eddd-44a8-bc29-54f81934c864\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"af1d3873-1486-4715-8952-417df54c9987\",\"unit_number\":\"CRB-003\",\"floor\":0,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":4560000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('4e7ad55b-e0a9-4203-b61e-264183fff848', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"bc06e603-eca7-496d-a6e3-ff18b6ca22b7\"}', NULL, '{\"id\":\"bc06e603-eca7-496d-a6e3-ff18b6ca22b7\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"4b400fd2-362f-4cec-9657-3759aa9078ac\",\"floor_id\":\"7d756082-bfea-4cc8-a86c-1964aff041e0\",\"unit_number\":\"C-201\",\"floor\":2,\"type\":\"penthouse\",\"area\":270,\"net_area\":255,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building C\",\"price\":9500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:38\",\"created_at\":\"2026-06-21 09:47:38\"}', '2026-06-21 06:47:38', '2026-06-21 06:47:38'),
('4f2e552b-6321-485a-bd95-acdadd43ea57', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781174625669\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:43:55', '2026-06-11 07:43:55'),
('4fb6b86a-2c6c-42b6-b2ec-0e94af39792d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422643845\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:25', '2026-06-14 04:37:25'),
('506abb54-a455-4035-8ba3-7ceec030b4cf', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781427042727\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:47', '2026-06-14 05:50:47'),
('50c227d9-9a72-44b9-8275-664f8608403d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426869460\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:47:57', '2026-06-14 05:47:57'),
('510a8757-0d14-47a8-9cc1-c4de47e575ef', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"160d9c47-1368-44a8-9261-8b614bd4019c\"}', NULL, '{\"id\":\"160d9c47-1368-44a8-9261-8b614bd4019c\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"431dbfac-3727-4c97-9c4d-fb94631cd7a5\",\"unit_number\":\"B-401\",\"floor\":4,\"type\":\"penthouse\",\"area\":270,\"net_area\":255,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building B\",\"price\":9500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('510cdd90-f2f3-4379-8034-fe6bb2f3cca6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425796801\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:58', '2026-06-14 05:29:58'),
('51420430-e353-4ab6-a691-6238d920e6cc', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426279068\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:00', '2026-06-14 05:38:00'),
('51ade3e2-fddb-42cb-8806-3568cd730a96', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422992409\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:14', '2026-06-14 04:43:14'),
('51d85888-1d93-4335-a317-c13fc1c2c383', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426761016\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:46:05', '2026-06-14 05:46:05'),
('527c844b-cf7c-4135-8f42-24a986ef63ab', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781510635964\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-15 05:04:01', '2026-06-15 05:04:01'),
('53d0662c-37a6-4e01-a55d-853090e81543', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"a22d1f7d-ccf5-4880-b7b4-e34f76d9f2df\"}', NULL, '{\"id\":\"a22d1f7d-ccf5-4880-b7b4-e34f76d9f2df\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"4b400fd2-362f-4cec-9657-3759aa9078ac\",\"floor_id\":\"da1f51e9-3ba5-43e0-87a0-ee185afb61c4\",\"unit_number\":\"C-002\",\"floor\":0,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7800000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:38\",\"created_at\":\"2026-06-21 09:47:38\"}', '2026-06-21 06:47:38', '2026-06-21 06:47:38'),
('543ee24e-b3b8-45c5-b379-8041cd8545fc', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422992409\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:15', '2026-06-14 04:43:15'),
('547cf544-d248-41de-890f-40441a12b44a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427167308\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:48', '2026-06-14 05:52:48'),
('54e6514c-49d8-4da7-9d0f-23dc0349aabf', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1782030815987\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 05:33:49', '2026-06-21 05:33:49'),
('5561dc5c-beed-4036-a47d-ef1866b9012d', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"60346cf8-2f78-439d-993a-33375742d5ff\"}', NULL, '{\"id\":\"60346cf8-2f78-439d-993a-33375742d5ff\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"a3b72eef-aa4e-49f9-9ee5-e39bad335f1c\",\"unit_number\":\"A-204\",\"floor\":2,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5700000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('55da87b4-5040-4e9b-81bd-6ffe34a971c4', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"4e75758c-2c9f-4cfd-ae9e-9c0967496355\"}', NULL, '{\"id\":\"4e75758c-2c9f-4cfd-ae9e-9c0967496355\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"733ded42-bbd1-4ac3-ad16-1daeb5524a4e\",\"unit_number\":\"A-104\",\"floor\":1,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5400000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('56897af5-8da0-4966-80e7-e6e2bca3b0ba', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'CONTRACT_AUTO_GENERATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"contract_number\":\"REDP-CTR-2026-0005\",\"unit_id\":\"24508d2a-c9a0-41ea-8423-b2ca1d247865\",\"total_amount\":\"5000000.00\",\"installments\":12}', NULL, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('56cc2207-ff30-49f2-b64f-ab87fe82491d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422603135\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:55', '2026-06-14 04:36:55'),
('56f78acb-9a52-4b0a-9084-84593ed34d7d', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781174625356\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:43:59', '2026-06-11 07:43:59'),
('572a6f6e-440a-4961-af9e-69bb197b8cc2', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"ad3cfae7-403c-412e-b56f-5523549116a2\"}', NULL, '{\"id\":\"ad3cfae7-403c-412e-b56f-5523549116a2\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6a32ae9d-efca-4649-807b-f73e41ce294f\",\"unit_number\":\"B-002\",\"floor\":0,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":4800000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('572f7052-673d-4e8a-8df6-949189b87786', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426995020\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:58', '2026-06-14 05:49:58'),
('592d0ebf-c7b8-41ef-b9c3-e48ea54a57d3', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423023980\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:44', '2026-06-14 04:43:44'),
('5baf4f82-82bb-4d96-86bf-8934da90f4db', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"4a82cc67-8cf4-422f-bafa-2007137f4845\"}', NULL, '{\"id\":\"4a82cc67-8cf4-422f-bafa-2007137f4845\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"2cc26949-c15c-4458-b1f3-4e01153093f8\",\"unit_number\":\"A-304\",\"floor\":3,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":6000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('5c501bc6-32da-43db-9bb3-bdd9f79b74e7', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781510635964\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-15 05:04:01', '2026-06-15 05:04:01'),
('5c6603a5-bbe9-4b3f-a09e-5e6740d74ec1', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"412db759-9d87-4fa9-8a3a-135aceea63a8\"}', NULL, '{\"id\":\"412db759-9d87-4fa9-8a3a-135aceea63a8\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"665c3e6b-1ed4-48f6-8c20-c8377563294e\",\"unit_number\":\"B-302\",\"floor\":3,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5700000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('5c848bb0-7a18-44cf-b0cc-f55aa26875e1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781420515357\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:02:00', '2026-06-14 04:02:00'),
('5ce8b0ca-174b-4107-a808-1ed0dfb328bc', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e0f309aa-b80c-4af9-b62e-3191bb00dba7\"}', NULL, '{\"id\":\"e0f309aa-b80c-4af9-b62e-3191bb00dba7\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"b8c257e5-69b2-453c-85e3-05f491ae56e0\",\"floor_id\":\"c09cb47b-8ad2-4447-a392-7d59c3e32a98\",\"unit_number\":\"CHP-101\",\"floor\":1,\"type\":\"commercial\",\"area\":120,\"net_area\":108,\"finishing_type\":\"fully_finished\",\"bedrooms\":null,\"bathrooms\":1,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"street\",\"orientation\":\"east\",\"building\":\"Clubhouse Pavilion E\",\"price\":6300000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Retail & commercial shop space in the top-right commercial promenade. Ideal for caf\\u00e9s, boutiques, or high-end services.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('5d33d66c-9523-47e5-aacf-d0904ef2909a', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9dc22d53-7e5d-4de5-b988-6c21d123b00b\"}', NULL, '{\"id\":\"9dc22d53-7e5d-4de5-b988-6c21d123b00b\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ac971739-c8e1-4322-8a97-fb312be28dfd\",\"floor_id\":\"7d87ddf6-00d1-4951-bf3b-c339d773f581\",\"unit_number\":\"C-101\",\"floor\":1,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('5d68402e-4445-4525-98f6-f59ce14efedf', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"fcb1c7f9-d147-4560-a18e-61d398b78496\"}', NULL, '{\"id\":\"fcb1c7f9-d147-4560-a18e-61d398b78496\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"a3b72eef-aa4e-49f9-9ee5-e39bad335f1c\",\"unit_number\":\"A-201\",\"floor\":2,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('5eaa1d2a-b33e-42e0-8bf2-d37ec63a6d2f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"5aee3d69-e771-48d1-a881-fa3004342eb7\"}', NULL, '{\"id\":\"5aee3d69-e771-48d1-a881-fa3004342eb7\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5d293ce0-3449-4ff5-ba1e-75c889f2570e\",\"unit_number\":\"B-302\",\"floor\":3,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5700000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('5ead376f-2f92-43d8-95b1-14fc4fc4ef34', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425785994\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:49', '2026-06-14 05:29:49'),
('5fa3e675-736c-48a9-9308-4fccd20808db', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-21 04:03:37', '2026-06-21 04:03:37'),
('5fdce3f5-b267-4013-b59d-beedfd0900cb', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426119498\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:20', '2026-06-14 05:35:20'),
('60278661-1641-4c25-ad48-e4b8aab8385e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426281850\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:04', '2026-06-14 05:38:04'),
('6121db54-b423-4011-b02c-0e5f23df61a6', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"3a5e0d6a-249b-49b2-b6a8-886c8c4d4db1\"}', NULL, '{\"id\":\"3a5e0d6a-249b-49b2-b6a8-886c8c4d4db1\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"446e2ad9-60fe-45f6-a632-67946cf5f66d\",\"unit_number\":\"A-201\",\"floor\":2,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('612c8f30-9184-4339-bc23-a135d4aec4cd', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\\/units\",\"route_params\":{\"projectId\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\"},\"query_params\":{\"status\":\"all\",\"type\":\"all\",\"_t\":\"1781427168950\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:52', '2026-06-14 05:52:52'),
('623b4f33-185e-46bf-8b71-d353d179df38', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425792991\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:54', '2026-06-14 05:29:54'),
('6285c57d-11ac-4705-8bbd-9bf7ce286be8', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"b37ca6d9-3770-42c6-ac90-e4319e72388b\"}', NULL, '{\"id\":\"b37ca6d9-3770-42c6-ac90-e4319e72388b\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"4b400fd2-362f-4cec-9657-3759aa9078ac\",\"floor_id\":\"27d64253-f5bf-44fa-abdf-86b39236cfb0\",\"unit_number\":\"C-101\",\"floor\":1,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:38\",\"created_at\":\"2026-06-21 09:47:38\"}', '2026-06-21 06:47:38', '2026-06-21 06:47:38'),
('6342baaa-4e8e-4f5c-a050-8e052cb86c3a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426246611\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:37:30', '2026-06-14 05:37:30'),
('636dcc57-830a-41f8-8b7e-6f6721821675', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"8f958ca4-b63e-4968-8b1a-36cae1e0df09\"}', NULL, '{\"id\":\"8f958ca4-b63e-4968-8b1a-36cae1e0df09\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"668a2039-8201-445c-b717-fd7d4b561955\",\"unit_number\":\"CRB-301\",\"floor\":3,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":5070000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('636f226e-d2df-465d-8b39-48aabe7b85a8', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"3303f7a3-0592-4e25-9e2e-ab25751b74c7\"}', NULL, '{\"id\":\"3303f7a3-0592-4e25-9e2e-ab25751b74c7\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"55b7fde8-9587-48f2-813a-2bef94d6e466\",\"unit_number\":\"B-201\",\"floor\":2,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('649006d1-4e13-40dc-a26b-e131625b4d86', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422992409\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:14', '2026-06-14 04:43:14'),
('65054aac-1642-42d1-9565-62149ad4176e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425789740\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:51', '2026-06-14 05:29:51'),
('65169441-ef6c-4b2c-9a05-ab65da7e1653', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"PUT\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\\/a1ff33da-76fc-491e-9ae4-1b55ca1a5e42\\/assign\",\"route_params\":{\"id\":\"a1ff33da-76fc-491e-9ae4-1b55ca1a5e42\"},\"query_params\":[],\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:34', '2026-06-14 05:38:34'),
('66b02dae-5d77-4c48-834f-5ad62ff87abd', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-17 04:29:12', '2026-06-17 04:29:12'),
('66c3478f-ce07-42f9-a5a5-7ee41ed33647', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426285183\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:06', '2026-06-14 05:38:06'),
('670c0290-baaf-4921-ac33-167b0127fad9', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422596207\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:51', '2026-06-14 04:36:51'),
('67449f12-1306-42a0-b722-b4a52da0e6a9', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426344991\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:39:05', '2026-06-14 05:39:05'),
('676d4a57-d853-4567-9cda-3386c2787fc2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426188453\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:29', '2026-06-14 05:36:29'),
('677232f8-121d-4306-aba2-2fb79c6f2346', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422618693\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:59', '2026-06-14 04:36:59'),
('687a50a6-bf97-4007-94cf-67b1a8931a5f', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175542209\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:03', '2026-06-11 07:59:03'),
('68d487b2-f149-4d2a-a3cc-9c06e30e2650', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9740d928-e547-49f5-908b-684e535005d7\"}', NULL, '{\"id\":\"9740d928-e547-49f5-908b-684e535005d7\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"446e2ad9-60fe-45f6-a632-67946cf5f66d\",\"unit_number\":\"A-204\",\"floor\":2,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5700000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('69b4b9e8-ca48-4e04-a089-e615fa35578a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"afb85a79-bd9f-4b16-ae88-afa9ec5da248\"}', NULL, '{\"id\":\"afb85a79-bd9f-4b16-ae88-afa9ec5da248\",\"project_id\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\",\"building_id\":\"fd85cbce-1008-46f2-a51b-b27844f967c5\",\"floor_id\":\"60edc1c1-378d-4f47-9bdb-abb9271a3f82\",\"unit_number\":\"T-03\",\"floor\":0,\"type\":\"apartment\",\"area\":120,\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":1,\"price\":2500000,\"finishing_type\":\"fully_finished\",\"view_type\":null,\"building\":\"TEST\",\"status\":\"available\",\"phase\":\"Phase 1\",\"updated_at\":\"2026-06-17 07:43:44\",\"created_at\":\"2026-06-17 07:43:44\"}', '2026-06-17 04:43:44', '2026-06-17 04:43:44'),
('6b635369-9f17-4f61-b63b-f8fbafcfa463', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174625356\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:43:53', '2026-06-11 07:43:53'),
('6c74e97b-ebee-4e0a-aca3-fb1ff6a53538', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426281850\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:05', '2026-06-14 05:38:05'),
('6ce376f0-052c-4241-bc56-7245cd66d4bb', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'UNIT_UPDATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"52501a91-21e6-46b0-bd5b-304e93171d0b\"}', '{\"layout_image_url\":null}', '{\"layout_image_url\":\"projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\\/units\\/2181lyHAZCHk5y0DgPH5gwSwpcIGKYFJn7mZSeXh.jpg\"}', '2026-06-17 04:30:18', '2026-06-17 04:30:18'),
('6cf430d0-789a-442b-b2d4-f628841167ab', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"fc4464a9-40ad-4b08-911c-b4e39e0513ab\"}', NULL, '{\"id\":\"fc4464a9-40ad-4b08-911c-b4e39e0513ab\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"55b7fde8-9587-48f2-813a-2bef94d6e466\",\"unit_number\":\"B-204\",\"floor\":2,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5700000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('6d420546-219a-465c-add9-b09f19d3d9da', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"3e139b3e-ca76-4cb6-b619-996d7a6f6c6b\"}', NULL, '{\"id\":\"3e139b3e-ca76-4cb6-b619-996d7a6f6c6b\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"48bfbaf9-a478-414b-8c85-4ab2e5327191\",\"unit_number\":\"B-402\",\"floor\":4,\"type\":\"penthouse\",\"area\":300,\"net_area\":285,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building B\",\"price\":10000000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('6e3bda54-81e0-45a1-90e0-422776ca535c', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"8a9a9ab2-47cf-4c50-a15c-244a92e38f08\"}', NULL, '{\"id\":\"8a9a9ab2-47cf-4c50-a15c-244a92e38f08\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"4b400fd2-362f-4cec-9657-3759aa9078ac\",\"floor_id\":\"da1f51e9-3ba5-43e0-87a0-ee185afb61c4\",\"unit_number\":\"C-001\",\"floor\":0,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:38\",\"created_at\":\"2026-06-21 09:47:38\"}', '2026-06-21 06:47:38', '2026-06-21 06:47:38'),
('6e7d1e9c-7257-4ccd-9d0b-446d624b3cc8', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"b9fb8377-112a-4efa-88db-c0c4d34ce6c3\"}', NULL, '{\"id\":\"b9fb8377-112a-4efa-88db-c0c4d34ce6c3\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"c021af24-4f2a-426c-8482-2ca444961eaa\",\"unit_number\":\"A-101\",\"floor\":1,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":4950000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('6f584d9a-beab-4869-846d-bc460467c9b1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426127867\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:28', '2026-06-14 05:35:28'),
('710e7200-f9e5-4778-86a8-8d06f801a5c7', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"72c06fcc-9608-47d0-bdd0-14fb83ffd141\"}', NULL, '{\"id\":\"72c06fcc-9608-47d0-bdd0-14fb83ffd141\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"13270b89-cb08-44d9-b892-d3adc7ff1ff8\",\"unit_number\":\"CRA-201\",\"floor\":2,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":4820000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('72363cea-778a-4d72-9a13-75c71924b781', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f3c5b053-a108-4368-a611-60e81b4dcc50\"}', NULL, '{\"id\":\"f3c5b053-a108-4368-a611-60e81b4dcc50\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"87e91f7f-8707-4b57-809d-9b0d9afebb86\",\"unit_number\":\"A-004\",\"floor\":0,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('7253e708-99ec-44cc-bad3-5a783f195e06', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781420515357\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:01:58', '2026-06-14 04:01:58'),
('748e3281-5277-4550-a893-2f71995bea13', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'LEAD_ASSIGN_COMPANY_SALES', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"lead_id\":\"a1ff33da-76fc-491e-9ae4-1b55ca1a5e42\"}', NULL, NULL, '2026-06-14 05:38:34', '2026-06-14 05:38:34'),
('74ea4ed6-4134-4eb3-afab-3bbbf49745a6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422649203\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:30', '2026-06-14 04:37:30'),
('7504749d-9c35-41a3-9736-d6781164d530', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423022307\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:43', '2026-06-14 04:43:43'),
('7531dbef-8b1b-40bb-949a-1a860debe338', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"7154f5e9-96b4-428b-aaa7-fc7bcb3231b4\"}', NULL, '{\"id\":\"7154f5e9-96b4-428b-aaa7-fc7bcb3231b4\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5dd62f31-5809-4aa5-b225-d1083f02c521\",\"unit_number\":\"B-002\",\"floor\":0,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":4800000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('759c1d2a-17ad-4ef8-af70-566edfff06d7', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e599daf0-c312-452a-9185-a4226455a9e3\"}', NULL, '{\"id\":\"e599daf0-c312-452a-9185-a4226455a9e3\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"d7ee4704-73dd-4e8c-b0f7-984dace9fc62\",\"unit_number\":\"CRB-102\",\"floor\":1,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence B\",\"price\":4690000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('759da7aa-feb1-40b2-8dbb-3be972619026', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"fad6734b-d60f-4a89-a4e0-536bb8aa84fe\"}', NULL, '{\"id\":\"fad6734b-d60f-4a89-a4e0-536bb8aa84fe\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ecbf54eb-f203-401f-83a2-25b7fd3a0db9\",\"floor_id\":\"fd28dcef-95f8-44a7-82f3-ddd7ab9ae953\",\"unit_number\":\"WTH-102\",\"floor\":1,\"type\":\"villa\",\"area\":240,\"net_area\":228,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":4,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"West Townhouse Block D\",\"price\":11500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('761f483e-c2f6-44b8-bc42-6869d3215404', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1782025360275\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 04:02:41', '2026-06-21 04:02:41'),
('763d40af-ee12-417a-8848-6c083184fb6a', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175540975\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:02', '2026-06-11 07:59:02'),
('7802968a-17b0-4e29-b850-50fc1904d729', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'HANDOVER_AUTO_SCHEDULE', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"reservation_id\":\"f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e\",\"unit_id\":\"24508d2a-c9a0-41ea-8423-b2ca1d247865\"}', NULL, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('7872a4e9-eb55-4af1-ae69-4f2a3a0abed5', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175540352\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:01', '2026-06-11 07:59:01'),
('789b519b-e828-4b67-8ecc-832129ebd94a', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"26bb8c1a-526f-4fe7-9cd2-bdc1ad012e46\"}', NULL, '{\"id\":\"26bb8c1a-526f-4fe7-9cd2-bdc1ad012e46\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"69973069-2741-47ff-87cd-87df4d15e53f\",\"unit_number\":\"CRB-201\",\"floor\":2,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":4820000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('7959410d-d5f2-4729-99d5-fcff1c70593b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426342645\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:39:03', '2026-06-14 05:39:03'),
('7964a39d-3d20-4831-a67c-8c3c7adbc742', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425849566\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:30:52', '2026-06-14 05:30:52'),
('7a59c5b3-7292-42a2-ba28-fe63dcf1c14a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427010607\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:12', '2026-06-14 05:50:12'),
('7a967c9a-63c1-4d5d-9c2a-8771bbf17a62', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"2b801330-9ba8-47cd-b4cd-3e15ba814e88\"}', NULL, '{\"id\":\"2b801330-9ba8-47cd-b4cd-3e15ba814e88\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"5cd0b0d0-e376-4c45-b39f-5f70be786605\",\"unit_number\":\"CRB-401\",\"floor\":4,\"type\":\"penthouse\",\"area\":250,\"net_area\":238,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Creek Residence B\",\"price\":8900000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('7bc29371-f1df-4472-bf28-1edf9aa91df9', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422646443\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:27', '2026-06-14 04:37:27'),
('7c711a0d-bd0d-457d-bd99-5d78f3324fa6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426965478\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:27', '2026-06-14 05:49:27'),
('7d16f9c3-9fe0-4fb4-9c88-a9806ab4befa', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"5fd52bc9-ba89-45b5-8cad-ccde957df4e3\"}', NULL, '{\"id\":\"5fd52bc9-ba89-45b5-8cad-ccde957df4e3\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"c3336fa8-2eac-44ca-b366-a408c19f84f6\",\"unit_number\":\"A-402\",\"floor\":4,\"type\":\"penthouse\",\"area\":300,\"net_area\":285,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building A\",\"price\":10000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('7d402267-84d1-4b43-a2e0-deb481a7d209', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422617610\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:58', '2026-06-14 04:36:58'),
('7e25b7e2-1b09-4ecc-972e-0cf7ead97634', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427182200\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:53:04', '2026-06-14 05:53:04'),
('7e56b509-9b0c-4b98-847d-d4175c1d56c2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423008010\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:29', '2026-06-14 04:43:29'),
('7e76f5b4-17a3-4c33-9bef-1a8f57f1eba9', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426869460\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:47:55', '2026-06-14 05:47:55');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('7f353b98-7eec-4cdd-ab89-f1bae3eca959', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427165890\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:47', '2026-06-14 05:52:47'),
('7fd4e3e8-b2d3-4110-ad28-d059b6fa1ef6', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"99064d0c-60fe-40d9-ad48-0ceeb24cad2b\"}', NULL, '{\"id\":\"99064d0c-60fe-40d9-ad48-0ceeb24cad2b\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"f137e3e3-df4f-40c7-9bbf-892ff231230b\",\"unit_number\":\"A-001\",\"floor\":0,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":4650000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('806472d3-14f4-41d9-a642-ce1d756ae58e', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"6d7f2c76-d5bd-4c71-adbf-4e1ec1733d3a\"}', NULL, '{\"id\":\"6d7f2c76-d5bd-4c71-adbf-4e1ec1733d3a\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"733ded42-bbd1-4ac3-ad16-1daeb5524a4e\",\"unit_number\":\"A-102\",\"floor\":1,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('81a974b1-4b50-4ad5-a977-82d8fe4b425f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1782025360275\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 04:02:43', '2026-06-21 04:02:43'),
('8281b2fa-d30e-4100-a7c1-c3272ba39d3c', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"3dfec198-c70e-4d3b-960d-676ab1438744\"}', NULL, '{\"id\":\"3dfec198-c70e-4d3b-960d-676ab1438744\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5d293ce0-3449-4ff5-ba1e-75c889f2570e\",\"unit_number\":\"B-304\",\"floor\":3,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":6000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('837b1ae7-5314-420c-8078-e01d826aa868', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781425849566\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:30:51', '2026-06-14 05:30:51'),
('83b50d08-f0cf-4102-9244-2eff23f3ae15', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1782025360275\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 04:02:41', '2026-06-21 04:02:41'),
('84c2b76a-ecb6-4930-9a7e-74a665930c21', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426189770\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:30', '2026-06-14 05:36:30'),
('84d81921-931d-415e-a999-74e901736b83', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427168040\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:49', '2026-06-14 05:52:49'),
('85580992-b7d9-49b5-a15a-90e5bedab6ab', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426761016\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:46:03', '2026-06-14 05:46:03'),
('85e0c45f-3f5f-4ce8-84ca-4590c3fe4e8c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426127078\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:28', '2026-06-14 05:35:28'),
('88295eab-e3e7-452f-bc39-967592921341', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"8bb06d6e-9345-4cf3-938f-8f4dd68691b4\"}', NULL, '{\"id\":\"8bb06d6e-9345-4cf3-938f-8f4dd68691b4\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"c021af24-4f2a-426c-8482-2ca444961eaa\",\"unit_number\":\"A-103\",\"floor\":1,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('884fedf0-87fb-4b50-91af-ce3a0801d64a', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175546515\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:07', '2026-06-11 07:59:07'),
('88df1b5d-5e44-4894-bbf8-28be1bfd12b7', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425785994\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:48', '2026-06-14 05:29:48'),
('891161f4-05a0-4826-b1a1-43a2a9fefc5b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426246611\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:37:28', '2026-06-14 05:37:28'),
('8964576a-74e6-41a4-8744-da5d2533b1fa', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422617891\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:58', '2026-06-14 04:36:58'),
('8a409283-697c-4dec-b23d-44518c3aa26b', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175541732\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:03', '2026-06-11 07:59:03'),
('8c3dfad8-f124-4f53-907e-c09fe1288b12', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426130231\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:31', '2026-06-14 05:35:31'),
('8c5dcf95-3aee-4f7a-807a-56090d7ff54e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427174502\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:56', '2026-06-14 05:52:56'),
('8cc7054a-d087-47f7-801e-bcfb20882b16', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"4e5bca42-e792-4aa0-831d-2377ce356ed2\"}', NULL, '{\"id\":\"4e5bca42-e792-4aa0-831d-2377ce356ed2\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"bb6633d8-ec28-4406-bd0e-296b76f7b248\",\"unit_number\":\"A-402\",\"floor\":4,\"type\":\"penthouse\",\"area\":300,\"net_area\":285,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building A\",\"price\":10000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('8d19f2fa-822e-4812-989b-a9f821cd8c39', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423021285\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:42', '2026-06-14 04:43:42'),
('8d8d7d33-6698-413f-b550-d0c53f365868', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423021927\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:43', '2026-06-14 04:43:43'),
('8d9c1c09-f20f-4f30-83d5-17da026de550', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426761016\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:46:05', '2026-06-14 05:46:05'),
('8dc8874f-34e2-4ddf-bfd9-ae89904a5f29', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423020964\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:41', '2026-06-14 04:43:41'),
('8de761c6-6158-4a2b-8274-30291d38136f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425793562\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:55', '2026-06-14 05:29:55'),
('8e1ea26b-19f6-447b-b4d2-dd37e451c444', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"781de370-ef3f-41e7-82ae-a338000a8670\"}', NULL, '{\"id\":\"781de370-ef3f-41e7-82ae-a338000a8670\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"66811d50-0cf3-46b5-b55e-e233c0cb5f69\",\"unit_number\":\"CRA-001\",\"floor\":0,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":4320000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('8e36c752-8ef4-4444-a0fd-104a680f6cdb', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423020077\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:40', '2026-06-14 04:43:40'),
('8e8fe43d-78f9-433d-b35a-901cee46a050', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1782025360275\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 04:02:44', '2026-06-21 04:02:44'),
('8f74216d-ef8b-4fa8-90fa-fe4bea82e252', '3d4270b4-ae06-4aae-bb84-04c294e5c038', 'HANDOVER_AUTO_SCHEDULE', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"reservation_id\":\"11fe74b8-9950-4c22-9460-7f684eac2d98\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\"}', NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('8fc048e0-6a9d-489a-ab7c-3267b14b7d60', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425795464\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:57', '2026-06-14 05:29:57'),
('8fce1c4c-8d36-4ce3-8a38-36592cb9c6b2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426183915\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:24', '2026-06-14 05:36:24'),
('90b8c4a3-6e9f-4695-8518-4eda0d22f47e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-14 05:47:39', '2026-06-14 05:47:39'),
('9120a7da-a7af-41ba-bb9d-6021cae2e800', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"efd3d68b-a57e-4dde-bf19-9d46c1af5435\"}', NULL, '{\"id\":\"efd3d68b-a57e-4dde-bf19-9d46c1af5435\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"c134bce6-34b5-4788-9f8e-60d0777f94ef\",\"unit_number\":\"B-204\",\"floor\":2,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5700000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('922bdc75-484a-4f4d-b94a-333e8eb15713', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"68b9012c-7091-40f0-b402-4c7e6212a7d4\"}', NULL, '{\"id\":\"68b9012c-7091-40f0-b402-4c7e6212a7d4\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6423e97d-9a77-4b48-9196-2d005b094f2b\",\"unit_number\":\"B-102\",\"floor\":1,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('9241101e-b672-4e8f-9bff-6c1542bf4f8c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426246611\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:37:29', '2026-06-14 05:37:29'),
('92f997e9-3cb0-4bdd-9505-354aa2a58a42', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\\/units\",\"route_params\":{\"projectId\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\"},\"query_params\":{\"status\":\"all\",\"type\":\"all\",\"_t\":\"1781426120209\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:21', '2026-06-14 05:35:21'),
('93a7b2f2-1891-4d7a-b933-bf09cbac0049', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\\/units\",\"route_params\":{\"projectId\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\"},\"query_params\":{\"status\":\"all\",\"type\":\"all\",\"_t\":\"1781426281371\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:03', '2026-06-14 05:38:03'),
('94cfa3d8-7075-4b67-a6e9-74331bad1a5c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426995329\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:59', '2026-06-14 05:49:59'),
('94d79b8c-2b42-43c4-9271-02baa84fbf48', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c8e821c4-63d5-474e-ba4b-32e4d213e73d\"}', NULL, '{\"id\":\"c8e821c4-63d5-474e-ba4b-32e4d213e73d\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ac971739-c8e1-4322-8a97-fb312be28dfd\",\"floor_id\":\"c872cc9c-e9e9-4d1d-8fa5-c830babfd164\",\"unit_number\":\"C-002\",\"floor\":0,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7800000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('951c23fd-cfcd-4835-a30a-9076745fb5d1', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781174625356\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:43:54', '2026-06-11 07:43:54'),
('95c3a74c-92ee-4fb9-ac55-6156b9c5a54e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781510636272\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-15 05:04:00', '2026-06-15 05:04:00'),
('95e8e30c-340d-4993-801d-5723be4c8f98', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426995020\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:58', '2026-06-14 05:49:58'),
('95f1a9fd-101d-4f18-b4e7-925fdaa53a17', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174625356\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:43:57', '2026-06-11 07:43:57'),
('9645d9f6-cee0-4e6f-adc2-fbf6397fb124', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"6c7939b4-ecc1-42c6-bd06-be19025973ae\"}', NULL, '{\"id\":\"6c7939b4-ecc1-42c6-bd06-be19025973ae\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ac971739-c8e1-4322-8a97-fb312be28dfd\",\"floor_id\":\"c872cc9c-e9e9-4d1d-8fa5-c830babfd164\",\"unit_number\":\"C-001\",\"floor\":0,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('9687c761-d0d4-4d48-b6b3-bda76745d23e', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"ff937f3a-cdd0-4c7c-ad96-cd193f00cab0\"}', NULL, '{\"id\":\"ff937f3a-cdd0-4c7c-ad96-cd193f00cab0\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"af1d3873-1486-4715-8952-417df54c9987\",\"unit_number\":\"CRB-001\",\"floor\":0,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":4320000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('970f1680-803b-4781-bf38-a87bda187585', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"bddcb069-5df5-489e-b9bb-0eb287f7ff5e\"}', NULL, '{\"id\":\"bddcb069-5df5-489e-b9bb-0eb287f7ff5e\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"af1d3873-1486-4715-8952-417df54c9987\",\"unit_number\":\"CRB-002\",\"floor\":0,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence B\",\"price\":4440000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('973e40fd-c02a-4849-a8ce-6cc37037b8a3', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1782030816301\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 05:33:44', '2026-06-21 05:33:44'),
('97458654-6f18-4e8b-b378-81d289e54cd4', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"532d5267-2e10-4da8-9946-d3a6ecf43743\"}', NULL, '{\"id\":\"532d5267-2e10-4da8-9946-d3a6ecf43743\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"b8c257e5-69b2-453c-85e3-05f491ae56e0\",\"floor_id\":\"9847b683-b9dd-4c7f-9c3c-405a76996fcd\",\"unit_number\":\"CHP-001\",\"floor\":0,\"type\":\"commercial\",\"area\":120,\"net_area\":108,\"finishing_type\":\"fully_finished\",\"bedrooms\":null,\"bathrooms\":1,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"street\",\"orientation\":\"east\",\"building\":\"Clubhouse Pavilion E\",\"price\":6300000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Retail & commercial shop space in the top-right commercial promenade. Ideal for caf\\u00e9s, boutiques, or high-end services.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('98281038-ea27-463f-987d-4be32704333c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426128973\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:29', '2026-06-14 05:35:29'),
('9854633e-6dbd-4617-979d-ce4b2aa67b9b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426929646\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:48:51', '2026-06-14 05:48:51'),
('9864b63d-0891-4421-8d0b-b65bb1f59a40', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423009363\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:30', '2026-06-14 04:43:30'),
('988556c4-feec-4f55-9715-9277441cf36f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422992719\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:14', '2026-06-14 04:43:14'),
('9983e563-201b-4348-823f-426a84c59819', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"5d49207e-0c0a-44ae-9dda-55e7405cbc3f\"}', NULL, '{\"id\":\"5d49207e-0c0a-44ae-9dda-55e7405cbc3f\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"f137e3e3-df4f-40c7-9bbf-892ff231230b\",\"unit_number\":\"A-003\",\"floor\":0,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":4950000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('9988771c-3ccd-4bff-be6d-c1b3ad48a704', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426995020\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:00', '2026-06-14 05:50:00'),
('9a89414f-4cab-4166-8df2-6ec76b4bd630', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425788772\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:50', '2026-06-14 05:29:50'),
('9b724839-8670-4046-9dd9-92c40bec18c8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422618981\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:00', '2026-06-14 04:37:00'),
('9b8574e3-359e-4b55-87be-b3969cee888f', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175546826\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:08', '2026-06-11 07:59:08'),
('9baaa076-cd68-4fbd-8c15-1560263481ea', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\",\"route_params\":{\"projectId\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\"},\"query_params\":{\"_t\":\"1781427005952\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:06', '2026-06-14 05:50:06'),
('9c4900a2-97c5-4859-9f28-30acea247b98', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1782025360275\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 04:02:43', '2026-06-21 04:02:43');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('9c50114d-c5ba-42f4-b4bd-3fcc240b8136', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1782030815987\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 05:33:48', '2026-06-21 05:33:48'),
('9d7ff025-c74f-4990-9a8b-cb406dc3f526', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e27e1723-4875-4b49-b0fa-39a1e71daf70\"}', NULL, '{\"id\":\"e27e1723-4875-4b49-b0fa-39a1e71daf70\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ecbf54eb-f203-401f-83a2-25b7fd3a0db9\",\"floor_id\":\"4a53322c-d2fc-464c-997c-e7cb9c14a262\",\"unit_number\":\"WTH-002\",\"floor\":0,\"type\":\"villa\",\"area\":240,\"net_area\":228,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":4,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"West Townhouse Block D\",\"price\":11500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('9da074b4-b2de-473b-9fe8-dc7c5b18d5f6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426932490\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:48:54', '2026-06-14 05:48:54'),
('9e2334a5-7498-4a1e-965a-7dc256f151e4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425849566\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:30:51', '2026-06-14 05:30:51'),
('9eaba80c-6853-4077-b620-d07481f5fb19', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"finance_officer@redp.com\"}', NULL, NULL, '2026-06-14 06:20:53', '2026-06-14 06:20:53'),
('9f5da3a6-0777-4a20-a828-d66b62e17bef', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'HANDOVER_AUTO_SCHEDULE', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"reservation_id\":\"f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e\",\"unit_id\":\"24508d2a-c9a0-41ea-8423-b2ca1d247865\"}', NULL, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('9f66d84d-4b87-4627-a651-a0551c025228', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175543039\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:04', '2026-06-11 07:59:04'),
('a1138f4d-3a78-4efe-8281-3ed7fc082079', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"ed91caab-46de-4b6a-8120-c314bf0179e2\"}', NULL, '{\"id\":\"ed91caab-46de-4b6a-8120-c314bf0179e2\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"668a2039-8201-445c-b717-fd7d4b561955\",\"unit_number\":\"CRB-303\",\"floor\":3,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":5310000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('a1b7812a-7881-4a79-a51f-8b51425364e6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426183915\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:25', '2026-06-14 05:36:25'),
('a1ff33da-7ce7-4f7a-a8f9-47c02a5eb7ce', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-76fc-491e-9ae4-1b55ca1a5e42', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Mohamed\",\"last_name\":\"Nabil\",\"email\":\"mohamed.nabil@gmail.com\",\"phone\":\"+201201112223\",\"national_id\":\"29501011234567\",\"status\":\"new\",\"lead_score\":85,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"tele_sales_agent_id\":\"43209f55-b7a8-411a-a789-a81d697b741d\",\"current_tier\":\"tier_1\",\"kyc_status\":\"verified\",\"facial_match_score\":96.5,\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"id\":\"a1ff33da-76fc-491e-9ae4-1b55ca1a5e42\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-7f1b-4c49-aca8-11aa4ad82a17', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-7dff-4a8d-bdc4-a98e808caa87', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Sherif\",\"last_name\":\"Kamal\",\"email\":\"sherif.kamal@yahoo.com\",\"phone\":\"+201509998887\",\"national_id\":\"29202021234567\",\"status\":\"interested\",\"lead_score\":92,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"tele_sales_agent_id\":\"43209f55-b7a8-411a-a789-a81d697b741d\",\"current_tier\":\"tier_1\",\"kyc_status\":\"pending\",\"facial_match_score\":84.2,\"source\":\"google\",\"campaign_id\":\"a1ff33da-7048-4675-ac18-54f2de6448bc\",\"id\":\"a1ff33da-7dff-4a8d-bdc4-a98e808caa87\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-8118-4230-bcd5-0a96ae05ad76', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-801b-4b58-a249-a1e547cb6455', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Yasmine\",\"last_name\":\"Fouad\",\"email\":\"yasmine.f@outlook.com\",\"phone\":\"+201007776665\",\"national_id\":\"29803031234567\",\"status\":\"negotiation\",\"lead_score\":78,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"current_tier\":\"tier_2\",\"kyc_status\":\"none\",\"source\":\"broker\",\"broker_id\":\"a1ff33da-7418-4a4e-a2de-8433f35bc7b9\",\"id\":\"a1ff33da-801b-4b58-a249-a1e547cb6455\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-82b5-4595-9a56-2be7f1ecc8b3', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-81e5-4d98-a14b-a0f0b68a778c', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Karim\",\"last_name\":\"Saeed\",\"email\":\"karim.saeed@gmail.com\",\"phone\":\"+201103332221\",\"national_id\":\"29004041234567\",\"status\":\"reserved\",\"lead_score\":98,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":98.9,\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"id\":\"a1ff33da-81e5-4d98-a14b-a0f0b68a778c\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-842d-4958-8eed-f4b23c875f33', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-836e-4be7-a0ef-5f3176acce02', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Tarek\",\"last_name\":\"Mansour\",\"email\":\"tarek@gmail.com\",\"phone\":\"+201000000010\",\"national_id\":\"29607209184845\",\"status\":\"new\",\"lead_score\":65,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"broker_id\":null,\"id\":\"a1ff33da-836e-4be7-a0ef-5f3176acce02\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-8603-4649-a86d-f3d745a6ba7e', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-84eb-45f3-8cf8-4bc64f560332', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Salma\",\"last_name\":\"Ahmed\",\"email\":\"salma@yahoo.com\",\"phone\":\"+201000000011\",\"national_id\":\"29205246259384\",\"status\":\"contacted\",\"lead_score\":72,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"pending\",\"facial_match_score\":null,\"source\":\"google\",\"campaign_id\":\"a1ff33da-7048-4675-ac18-54f2de6448bc\",\"broker_id\":null,\"id\":\"a1ff33da-84eb-45f3-8cf8-4bc64f560332\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-879e-48fd-b581-48e24dd92e90', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-86d0-46d9-aa1f-f32bb9e68e5d', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Omar\",\"last_name\":\"Hassan\",\"email\":\"omar@gmail.com\",\"phone\":\"+201000000012\",\"national_id\":\"29108254184508\",\"status\":\"interested\",\"lead_score\":88,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"97.80\",\"source\":\"direct\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-86d0-46d9-aa1f-f32bb9e68e5d\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-8915-4335-a8a3-e8a3f6faacde', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-885c-4d27-9d85-621cf9cc7d93', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Rania\",\"last_name\":\"Kamal\",\"email\":\"rania@outlook.com\",\"phone\":\"+201000000013\",\"national_id\":\"29404275761143\",\"status\":\"visit_scheduled\",\"lead_score\":90,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"89.33\",\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"broker_id\":null,\"id\":\"a1ff33da-885c-4d27-9d85-621cf9cc7d93\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-8aa8-41db-ab0a-958ddeb6ad61', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-89d8-4c0c-a2eb-18201c59dd5c', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Mustafa\",\"last_name\":\"Kamel\",\"email\":\"mustafa@gmail.com\",\"phone\":\"+201000000014\",\"national_id\":\"29309116094987\",\"status\":\"negotiation\",\"lead_score\":79,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"google\",\"campaign_id\":\"a1ff33da-7048-4675-ac18-54f2de6448bc\",\"broker_id\":null,\"id\":\"a1ff33da-89d8-4c0c-a2eb-18201c59dd5c\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-8c95-43ba-b002-9063cf01520a', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-8b7e-4fd6-a5bc-89d7eddb8102', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Noha\",\"last_name\":\"Fawzy\",\"email\":\"noha@gmail.com\",\"phone\":\"+201000000015\",\"national_id\":\"29207165100124\",\"status\":\"reserved\",\"lead_score\":95,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"97.24\",\"source\":\"direct\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-8b7e-4fd6-a5bc-89d7eddb8102\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-8e3a-4ac0-afc4-f1ff202cb24b', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-8d71-4a6c-a1a2-3ca12b6e0fa0', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Aly\",\"last_name\":\"Nasser\",\"email\":\"aly@company.com\",\"phone\":\"+201000000016\",\"national_id\":\"29102257100806\",\"status\":\"new\",\"lead_score\":55,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"tiktok\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-8d71-4a6c-a1a2-3ca12b6e0fa0\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-8fb6-49b9-961c-687ed53f62ab', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-8eee-49e9-a17f-cba02cd0578b', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Khaled\",\"last_name\":\"Mostafa\",\"email\":\"khaled@gmail.com\",\"phone\":\"+201000000017\",\"national_id\":\"29606235818596\",\"status\":\"contacted\",\"lead_score\":62,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"pending\",\"facial_match_score\":null,\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"broker_id\":null,\"id\":\"a1ff33da-8eee-49e9-a17f-cba02cd0578b\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9145-4258-8970-c1ed9fe8bf7a', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-907a-4dfe-be7e-370202ce28f4', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Ghada\",\"last_name\":\"Adel\",\"email\":\"ghada@gmail.com\",\"phone\":\"+201000000018\",\"national_id\":\"29301242067501\",\"status\":\"interested\",\"lead_score\":80,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"99.69\",\"source\":\"google\",\"campaign_id\":\"a1ff33da-7048-4675-ac18-54f2de6448bc\",\"broker_id\":null,\"id\":\"a1ff33da-907a-4dfe-be7e-370202ce28f4\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9312-4934-983b-8f5f59ad89b3', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-921f-4104-b1a7-20d3f0a706c2', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Mona\",\"last_name\":\"Zaki\",\"email\":\"mona@gmail.com\",\"phone\":\"+201000000019\",\"national_id\":\"29406272096309\",\"status\":\"visit_scheduled\",\"lead_score\":85,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"91.55\",\"source\":\"direct\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-921f-4104-b1a7-20d3f0a706c2\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-94a9-4a5e-94d3-76ca0dbda212', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-93da-40f6-9c90-af0ffe683137', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Sameh\",\"last_name\":\"Hussein\",\"email\":\"sameh@gmail.com\",\"phone\":\"+201000000020\",\"national_id\":\"29804212786077\",\"status\":\"negotiation\",\"lead_score\":74,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"broker_id\":null,\"id\":\"a1ff33da-93da-40f6-9c90-af0ffe683137\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9613-4ade-a468-cd552d9996bb', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-955d-4fa8-b007-c92d19ef8bb9', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Radwa\",\"last_name\":\"Sherif\",\"email\":\"radwa@gmail.com\",\"phone\":\"+201000000021\",\"national_id\":\"29401275702945\",\"status\":\"reserved\",\"lead_score\":78,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"94.96\",\"source\":\"broker\",\"campaign_id\":null,\"broker_id\":\"a1ff33da-7418-4a4e-a2de-8433f35bc7b9\",\"id\":\"a1ff33da-955d-4fa8-b007-c92d19ef8bb9\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9771-471a-af40-1a7998d34c04', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-96bb-4a95-a53a-a50ec096b539', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Ziad\",\"last_name\":\"Nabil\",\"email\":\"ziad@gmail.com\",\"phone\":\"+201000000022\",\"national_id\":\"29404281924819\",\"status\":\"new\",\"lead_score\":40,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"tiktok\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-96bb-4a95-a53a-a50ec096b539\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9951-46bf-9d0e-f2aecab944f5', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-982f-417a-a0ee-8fd1264e8e58', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Heba\",\"last_name\":\"Magdy\",\"email\":\"heba@gmail.com\",\"phone\":\"+201000000023\",\"national_id\":\"29007166093445\",\"status\":\"contacted\",\"lead_score\":68,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"google\",\"campaign_id\":\"a1ff33da-7048-4675-ac18-54f2de6448bc\",\"broker_id\":null,\"id\":\"a1ff33da-982f-417a-a0ee-8fd1264e8e58\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9add-4321-a56a-9964efe1c0a3', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-9a1c-4417-899f-c62bf1a7ce85', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Dina\",\"last_name\":\"Samir\",\"email\":\"dina@gmail.com\",\"phone\":\"+201000000024\",\"national_id\":\"29106253492898\",\"status\":\"interested\",\"lead_score\":83,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"93.19\",\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"broker_id\":null,\"id\":\"a1ff33da-9a1c-4417-899f-c62bf1a7ce85\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9c44-4c00-8b19-703323322ce1', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-9b8f-4be7-86e0-f231200914d3', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Hoda\",\"last_name\":\"Mostafa\",\"email\":\"hoda@gmail.com\",\"phone\":\"+201000000025\",\"national_id\":\"29203257752787\",\"status\":\"visit_scheduled\",\"lead_score\":87,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"verified\",\"facial_match_score\":\"86.42\",\"source\":\"direct\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-9b8f-4be7-86e0-f231200914d3\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-9e38-4aab-9392-81291f8c1598', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-9d51-4acc-9ebc-28c000e7dd57', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Ibrahim\",\"last_name\":\"Saad\",\"email\":\"ibrahim@gmail.com\",\"phone\":\"+201000000026\",\"national_id\":\"29701173681739\",\"status\":\"negotiation\",\"lead_score\":77,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"google\",\"campaign_id\":\"a1ff33da-7048-4675-ac18-54f2de6448bc\",\"broker_id\":null,\"id\":\"a1ff33da-9d51-4acc-9ebc-28c000e7dd57\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-a022-4a95-a031-f65d757f377a', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-9f40-40a2-8f1e-f15eb0245638', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Osama\",\"last_name\":\"Anwar\",\"email\":\"osama@gmail.com\",\"phone\":\"+201000000027\",\"national_id\":\"29006236282153\",\"status\":\"new\",\"lead_score\":50,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"facebook\",\"campaign_id\":\"a1ff33da-6cb8-43c1-887d-fc853753ba84\",\"broker_id\":null,\"id\":\"a1ff33da-9f40-40a2-8f1e-f15eb0245638\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-a1d8-486a-befd-d66dd74310b3', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-a10e-41ab-98b1-2db52615d363', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Farida\",\"last_name\":\"Saeed\",\"email\":\"farida@gmail.com\",\"phone\":\"+201000000028\",\"national_id\":\"29707134774139\",\"status\":\"contacted\",\"lead_score\":60,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"none\",\"facial_match_score\":null,\"source\":\"direct\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-a10e-41ab-98b1-2db52615d363\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-a397-4911-9ad7-9655dd0444df', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', 'a1ff33da-a2a7-4277-854e-333f7fe82eae', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"first_name\":\"Hany\",\"last_name\":\"Fouad\",\"email\":\"hany@gmail.com\",\"phone\":\"+201000000029\",\"national_id\":\"29409195113123\",\"status\":\"interested\",\"lead_score\":70,\"assigned_sales_agent_id\":\"c9283383-625d-4fff-bb05-fff7447f4d89\",\"kyc_status\":\"pending\",\"facial_match_score\":null,\"source\":\"tiktok\",\"campaign_id\":null,\"broker_id\":null,\"id\":\"a1ff33da-a2a7-4277-854e-333f7fe82eae\",\"tenant_id\":null,\"updated_at\":\"2026-06-11 10:43:06\",\"created_at\":\"2026-06-11 10:43:06\"}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a1ff33da-ae7d-4892-81cb-2d3d4149855f', NULL, 'CONTRACT_CREATE', 'App\\Models\\Contract', '61259272-f613-4338-aaf0-714a3e1754cd', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"contract_number\":\"REDP-CTR-2026-0001\",\"unit_id\":\"52501a91-21e6-46b0-bd5b-304e93171d0b\",\"client_id\":\"1007c1fe-171a-46ff-a2c5-9f94e5b7f142\",\"total_amount\":4500000,\"paid_amount\":1500000,\"type\":\"installment\",\"status\":\"active\",\"signed_at\":\"2026-03-11 10:43:07\",\"notes\":\"Primary residence installment contract.\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-b2e6-4d9b-a6bf-2a06b73015e9', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '2dbd725e-a5ed-407d-8745-637beed76088', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"2dbd725e-a5ed-407d-8745-637beed76088\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"paid\",\"due_date\":\"2026-02-11 10:43:07\",\"paid_at\":\"2026-02-13 10:43:07\",\"installment_number\":1,\"gateway\":\"stripe\",\"transaction_reference\":\"TXN-n6QhUs8b\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-b467-4c4a-bf10-0f5771df997b', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'ac1fcfcd-65e2-4950-b4d5-2a575b9b866d', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"ac1fcfcd-65e2-4950-b4d5-2a575b9b866d\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"paid\",\"due_date\":\"2026-03-11 10:43:07\",\"paid_at\":\"2026-03-13 10:43:07\",\"installment_number\":2,\"gateway\":\"stripe\",\"transaction_reference\":\"TXN-c3kL0v67\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-b71c-479c-b714-6d368d96d357', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'f09406be-3f64-4a69-a771-a3841d615f19', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"f09406be-3f64-4a69-a771-a3841d615f19\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"paid\",\"due_date\":\"2026-04-11 10:43:07\",\"paid_at\":\"2026-04-13 10:43:07\",\"installment_number\":3,\"gateway\":\"stripe\",\"transaction_reference\":\"TXN-vXjWT1n4\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-b92c-4dfc-bf21-287eb2be1263', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'd81ca4c8-399d-47dc-ac64-8e61d067b59d', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"d81ca4c8-399d-47dc-ac64-8e61d067b59d\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"paid\",\"due_date\":\"2026-05-11 10:43:07\",\"paid_at\":\"2026-05-13 10:43:07\",\"installment_number\":4,\"gateway\":\"stripe\",\"transaction_reference\":\"TXN-3gnTMliE\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-bacc-44c1-a990-218f10c02159', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '9e2ea89a-dc4d-4d52-9ba7-796918ac6991', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"9e2ea89a-dc4d-4d52-9ba7-796918ac6991\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2026-06-11 10:43:07\",\"paid_at\":null,\"installment_number\":5,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-bd02-4e32-841e-4c3cb21c85c1', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '221235d5-b74f-4c4a-ab61-905a8b965107', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"221235d5-b74f-4c4a-ab61-905a8b965107\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2026-07-11 10:43:07\",\"paid_at\":null,\"installment_number\":6,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-bee1-404b-b66f-4d8de4ef5484', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'f6aa7db1-c25e-43a1-b3c5-fa1486aaf7b2', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"f6aa7db1-c25e-43a1-b3c5-fa1486aaf7b2\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2026-08-11 10:43:07\",\"paid_at\":null,\"installment_number\":7,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-c082-407a-9276-f14a1c4f25a8', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '24ed993f-0834-4f35-a7af-371aaa502b2e', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"24ed993f-0834-4f35-a7af-371aaa502b2e\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2026-09-11 10:43:07\",\"paid_at\":null,\"installment_number\":8,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-c244-4987-baab-dce69c9aab4e', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'bc4fc42f-7419-4fa2-b88c-65aeaa17afa6', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"bc4fc42f-7419-4fa2-b88c-65aeaa17afa6\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2026-10-11 10:43:07\",\"paid_at\":null,\"installment_number\":9,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-c412-4dee-a909-8c21e7f13568', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '55634abb-c8c4-4560-ab64-afcfd7f90fb7', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"55634abb-c8c4-4560-ab64-afcfd7f90fb7\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2026-11-11 10:43:07\",\"paid_at\":null,\"installment_number\":10,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-c5f1-43ba-b8b9-67869a382d92', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '65ca9a60-ea22-44e5-ac8a-66841e00389e', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"65ca9a60-ea22-44e5-ac8a-66841e00389e\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2026-12-11 10:43:07\",\"paid_at\":null,\"installment_number\":11,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-c7b7-487d-a9bf-70957c599620', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '9c800e7f-cc6c-450e-876f-fb1e96dae174', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"9c800e7f-cc6c-450e-876f-fb1e96dae174\",\"contract_id\":\"61259272-f613-4338-aaf0-714a3e1754cd\",\"payment_plan_id\":\"c6830b51-9d0d-474f-8dd2-805355605496\",\"amount\":250000,\"status\":\"pending\",\"due_date\":\"2027-01-11 10:43:07\",\"paid_at\":null,\"installment_number\":12,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-c955-4907-a30b-a05436c0e632', NULL, 'CONTRACT_CREATE', 'App\\Models\\Contract', '14778e06-822f-42e9-bdfc-858f68b4ef0a', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"contract_number\":\"REDP-CTR-2026-0002\",\"unit_id\":\"da06d389-2d30-4a57-b5f0-ab28b289ae19\",\"client_id\":\"a79c826c-e7d8-477d-951e-5f737b5f264d\",\"total_amount\":8900000,\"paid_amount\":387500,\"type\":\"installment\",\"status\":\"active\",\"signed_at\":\"2026-04-11 10:43:07\",\"notes\":\"Restructured property contract.\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-cc00-4b69-a423-2eaa04b2a902', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '5ded228a-72c7-4955-9a95-56155653a405', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"5ded228a-72c7-4955-9a95-56155653a405\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"paid\",\"due_date\":\"2026-04-11 10:43:07\",\"paid_at\":\"2026-04-16 10:43:07\",\"installment_number\":1,\"gateway\":\"fawry\",\"transaction_reference\":\"TXN-mFwM6qtW\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-cdeb-4cb6-b201-e89eddfabee8', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '0d39a756-1095-4623-85d7-735bf328bac8', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"0d39a756-1095-4623-85d7-735bf328bac8\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-05-11 10:43:07\",\"paid_at\":null,\"installment_number\":2,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-cf88-44bc-b154-b9f6a53b6a14', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '6e833e24-62ed-4412-b3be-c0d8a4e413ae', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"6e833e24-62ed-4412-b3be-c0d8a4e413ae\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-06-11 10:43:07\",\"paid_at\":null,\"installment_number\":3,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-d111-4d3e-9774-a30c1ffb29d9', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '342d6dba-547b-4f66-a373-0a663616d692', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"342d6dba-547b-4f66-a373-0a663616d692\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-07-11 10:43:07\",\"paid_at\":null,\"installment_number\":4,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-d283-41e1-ba8a-a49787e5d7ef', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '1af5b940-93ad-41c0-8a2e-cc0b72cbbd60', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"1af5b940-93ad-41c0-8a2e-cc0b72cbbd60\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-08-11 10:43:07\",\"paid_at\":null,\"installment_number\":5,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-d41d-4d49-847c-952d3bb741cf', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'f8d09ac2-57d6-4c48-9b17-dc86137913a1', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"f8d09ac2-57d6-4c48-9b17-dc86137913a1\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-09-11 10:43:07\",\"paid_at\":null,\"installment_number\":6,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-d5fb-407d-a784-632b3500f497', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '3c8de358-a1a7-4a6a-9da6-86f8ee452416', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"3c8de358-a1a7-4a6a-9da6-86f8ee452416\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-10-11 10:43:07\",\"paid_at\":null,\"installment_number\":7,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-d796-4146-8ae6-cd8ca1b7919e', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '16c9411c-b19f-4872-be9b-13b6812ed04a', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"16c9411c-b19f-4872-be9b-13b6812ed04a\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-11-11 10:43:07\",\"paid_at\":null,\"installment_number\":8,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-dc29-4a89-ae98-94180b96789a', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'e21a873e-25cf-4d0a-8ec2-c1bb522bc1d5', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"e21a873e-25cf-4d0a-8ec2-c1bb522bc1d5\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2026-12-11 10:43:07\",\"paid_at\":null,\"installment_number\":9,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-de69-4a3d-aeaa-e0743c6c3865', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '82c6eded-2d50-45cd-9dc5-3b85545e31bb', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"82c6eded-2d50-45cd-9dc5-3b85545e31bb\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-01-11 10:43:07\",\"paid_at\":null,\"installment_number\":10,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('a1ff33da-dfdd-4f51-b742-aca0c3dd1b92', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '7b62aa78-bb4c-4242-9da0-f1b20b93d475', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"7b62aa78-bb4c-4242-9da0-f1b20b93d475\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-02-11 10:43:07\",\"paid_at\":null,\"installment_number\":11,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-e183-4f8f-9af4-d43b6d178ad3', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'daa9ad91-e54c-49fd-b271-596456bc4ab4', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"daa9ad91-e54c-49fd-b271-596456bc4ab4\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-03-11 10:43:07\",\"paid_at\":null,\"installment_number\":12,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-e340-4bf0-945e-313f9ccadb7e', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '6247bcce-ae81-44f7-9040-982a4cdad76d', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"6247bcce-ae81-44f7-9040-982a4cdad76d\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-04-11 10:43:07\",\"paid_at\":null,\"installment_number\":13,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-e4ed-4b35-97f3-70171f89c79d', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '9595402b-c402-467d-9ffe-db2cd35414c9', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"9595402b-c402-467d-9ffe-db2cd35414c9\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-05-11 10:43:07\",\"paid_at\":null,\"installment_number\":14,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-e725-4c1e-ba6f-27ff14dfda04', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '6b46d19c-5b7a-40d9-82a4-9353bb927c2f', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"6b46d19c-5b7a-40d9-82a4-9353bb927c2f\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-06-11 10:43:07\",\"paid_at\":null,\"installment_number\":15,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-e8d0-40f9-8ad8-31b933ff6ccb', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'c62a605e-cd10-4f27-b2d2-a2b4e1a72906', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"c62a605e-cd10-4f27-b2d2-a2b4e1a72906\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-07-11 10:43:07\",\"paid_at\":null,\"installment_number\":16,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-ea71-4b98-bab2-ce71881ab89a', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'c34ae508-f219-475b-a02f-e305d11bf5b6', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"c34ae508-f219-475b-a02f-e305d11bf5b6\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-08-11 10:43:07\",\"paid_at\":null,\"installment_number\":17,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-ec4d-4a51-a215-bb21e66a08c6', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '542fb464-ccc4-45d4-b60b-03034c426640', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"542fb464-ccc4-45d4-b60b-03034c426640\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-09-11 10:43:07\",\"paid_at\":null,\"installment_number\":18,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-ee23-488b-855e-f8c5f1018451', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '71c8b47c-ee09-4267-b526-61f9adfaa25f', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"71c8b47c-ee09-4267-b526-61f9adfaa25f\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-10-11 10:43:07\",\"paid_at\":null,\"installment_number\":19,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-ef8e-4dd6-ba51-68f9fff7641c', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '57fd4786-62a3-4133-8ab4-f314fecdc21a', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"57fd4786-62a3-4133-8ab4-f314fecdc21a\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-11-11 10:43:07\",\"paid_at\":null,\"installment_number\":20,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-f0e8-4b91-b4a6-e9dd5af43501', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', 'a1f4e3d2-a72a-4425-8e40-842bc90d7617', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"a1f4e3d2-a72a-4425-8e40-842bc90d7617\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2027-12-11 10:43:07\",\"paid_at\":null,\"installment_number\":21,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-f22b-4ca2-af0f-91fecb117624', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '8f917b75-720d-4c89-9a2b-674dc05af3b8', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"8f917b75-720d-4c89-9a2b-674dc05af3b8\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2028-01-11 10:43:07\",\"paid_at\":null,\"installment_number\":22,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-f3b5-478d-b4a3-9ead3c4c5f80', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '28852cde-25b7-4d9b-95ce-ca52448e1fee', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"28852cde-25b7-4d9b-95ce-ca52448e1fee\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2028-02-11 10:43:07\",\"paid_at\":null,\"installment_number\":23,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-f599-41ea-af70-40dc9a3bcb0d', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '69d42891-5cb8-46f1-b7b9-52355131070d', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"69d42891-5cb8-46f1-b7b9-52355131070d\",\"contract_id\":\"14778e06-822f-42e9-bdfc-858f68b4ef0a\",\"payment_plan_id\":\"73795f45-a5e7-49ab-a428-d27072aa4fac\",\"amount\":354687.5,\"status\":\"pending\",\"due_date\":\"2028-03-11 10:43:07\",\"paid_at\":null,\"installment_number\":24,\"gateway\":null,\"transaction_reference\":null,\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-f76c-457b-8c9d-1b4645a605b8', NULL, 'CONTRACT_CREATE', 'App\\Models\\Contract', 'cf8a4ad3-b09f-4428-83c5-5b260b5a744d', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"cf8a4ad3-b09f-4428-83c5-5b260b5a744d\",\"contract_number\":\"REDP-CTR-2026-0003\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\",\"client_id\":\"1007c1fe-171a-46ff-a2c5-9f94e5b7f142\",\"total_amount\":6800000,\"paid_amount\":6800000,\"type\":\"sale\",\"status\":\"completed\",\"signed_at\":\"2025-12-11 10:43:07\",\"notes\":\"Cash sale contract - fully completed.\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-fa53-4822-bcc6-af15d2a03af2', NULL, 'PAYMENT_CREATE', 'App\\Models\\Payment', '908b8d63-6806-4911-aab2-c8dfd198863f', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"908b8d63-6806-4911-aab2-c8dfd198863f\",\"contract_id\":\"cf8a4ad3-b09f-4428-83c5-5b260b5a744d\",\"payment_plan_id\":\"86204124-ac8c-4073-b275-8b5e8bbbdeed\",\"amount\":6800000,\"status\":\"paid\",\"due_date\":\"2025-12-11 10:43:07\",\"paid_at\":\"2025-12-11 10:43:07\",\"installment_number\":0,\"gateway\":\"bank_transfer\",\"transaction_reference\":\"TXN-NrdzkC6x\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1ff33da-fbde-4e63-9dac-dfb9e6c59aef', NULL, 'CONTRACT_CREATE', 'App\\Models\\Contract', '702aa6a2-829a-41cd-ac08-f3399959bd16', '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"702aa6a2-829a-41cd-ac08-f3399959bd16\",\"contract_number\":\"REDP-CTR-2026-0004\",\"unit_id\":\"52501a91-21e6-46b0-bd5b-304e93171d0b\",\"client_id\":\"a79c826c-e7d8-477d-951e-5f737b5f264d\",\"total_amount\":2980000,\"paid_amount\":50000,\"type\":\"installment\",\"status\":\"pending_signature\",\"signed_at\":null,\"notes\":\"Awaiting client digital signature.\",\"updated_at\":\"2026-06-11 10:43:07\",\"created_at\":\"2026-06-11 10:43:07\"}', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a2050f60-0f69-42c8-8338-5b15e5a4f1df', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'CONTRACT_CREATE', 'App\\Models\\Contract', '94a19816-6f6a-415b-8c2d-042eae7a298d', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"contract_number\":\"REDP-CTR-2026-0005\",\"reservation_id\":\"f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e\",\"unit_id\":\"24508d2a-c9a0-41ea-8423-b2ca1d247865\",\"client_id\":\"a9250aee-0119-4a17-a237-259e4fe83abb\",\"total_amount\":\"5000000.00\",\"paid_amount\":\"50000.00\",\"type\":\"installment\",\"status\":\"draft\",\"notes\":\"Auto-generated from reservation confirmation.\",\"updated_at\":\"2026-06-14 08:36:04\",\"created_at\":\"2026-06-14 08:36:04\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-acbf-4556-9b9c-4a7385e88a67', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'a4758608-1ead-4cca-9d34-8ec3807150f9', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"a4758608-1ead-4cca-9d34-8ec3807150f9\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2026-09-14 08:36:05\",\"installment_number\":1,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-ae2e-4c71-83aa-9688df8e2243', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'aa03735f-2810-48f2-abd9-576e70d79922', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"aa03735f-2810-48f2-abd9-576e70d79922\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2026-12-14 08:36:05\",\"installment_number\":2,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-afc7-40a6-8957-9f254718d1e8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '61ae774d-2678-4546-954e-6d8a4107539a', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"61ae774d-2678-4546-954e-6d8a4107539a\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-03-14 08:36:05\",\"installment_number\":3,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-b176-4615-a38b-86fb6f6a8666', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'a72090e4-b34a-4fe2-adbf-7e5e4e15a8dc', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"a72090e4-b34a-4fe2-adbf-7e5e4e15a8dc\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-06-14 08:36:05\",\"installment_number\":4,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-b302-4452-81f8-4373d5695fe0', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '717d1684-0b46-40ed-a055-aa7d087b4427', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"717d1684-0b46-40ed-a055-aa7d087b4427\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-09-14 08:36:05\",\"installment_number\":5,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-b4cd-4bf4-9d0f-618108f299d3', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '6aa64c14-888f-4078-80a8-60a1e406cd32', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"6aa64c14-888f-4078-80a8-60a1e406cd32\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-12-14 08:36:05\",\"installment_number\":6,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-b696-4c81-8c53-fba52921b99b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'e2337cde-5828-4f1e-bc0a-620f13a7bb2b', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"e2337cde-5828-4f1e-bc0a-620f13a7bb2b\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-03-14 08:36:05\",\"installment_number\":7,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-b8d0-473f-ad3e-c23cbc360386', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '98d6df02-0a54-4371-8b1f-3107eeb5b807', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"98d6df02-0a54-4371-8b1f-3107eeb5b807\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-06-14 08:36:05\",\"installment_number\":8,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-ba47-4bdf-9022-0c78e75f64ca', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'ad9fdf79-145b-4481-a410-02ad6ced7040', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"ad9fdf79-145b-4481-a410-02ad6ced7040\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-09-14 08:36:05\",\"installment_number\":9,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-bbe7-4994-b828-dfbe19849a2e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'ad5e72be-9d20-425a-bcbd-98328302427e', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"ad5e72be-9d20-425a-bcbd-98328302427e\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-12-14 08:36:05\",\"installment_number\":10,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-bd76-4f6e-8c39-0aaa8049d5ec', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'ced39c5c-a33c-4e14-9975-f1215ecd6922', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"ced39c5c-a33c-4e14-9975-f1215ecd6922\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2029-03-14 08:36:05\",\"installment_number\":11,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-bf27-4ea6-8acd-e243d9c5c0b6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '51be5090-9bcb-449b-8058-4fb8228ea916', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"51be5090-9bcb-449b-8058-4fb8228ea916\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2029-06-14 08:36:05\",\"installment_number\":12,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-c0ad-4f8a-b7bf-f903d7e16ec8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '85b4836c-204e-4ab4-bc54-f76c805168b0', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"85b4836c-204e-4ab4-bc54-f76c805168b0\",\"contract_id\":\"94a19816-6f6a-415b-8c2d-042eae7a298d\",\"payment_plan_id\":\"7754163c-3000-4c6b-9ff7-b7bd4df52976\",\"amount\":\"50000.00\",\"status\":\"paid\",\"paid_at\":\"2026-06-14 08:36:05\",\"due_date\":\"2026-06-14 08:36:05\",\"installment_number\":0,\"gateway\":\"eoi_deposit\",\"transaction_reference\":\"EOI-f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e\",\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-ccb0-48a1-88fa-9db2bd96e403', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'CONTRACT_CREATE', 'App\\Models\\Contract', 'd34f7657-5152-4430-946e-9a594854ba44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"contract_number\":\"REDP-CTR-2026-0006\",\"reservation_id\":\"f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e\",\"unit_id\":\"24508d2a-c9a0-41ea-8423-b2ca1d247865\",\"client_id\":\"a9250aee-0119-4a17-a237-259e4fe83abb\",\"total_amount\":\"5000000.00\",\"paid_amount\":\"50000.00\",\"type\":\"installment\",\"status\":\"draft\",\"notes\":\"Auto-generated from reservation confirmation.\",\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-cf50-4d8f-afcf-3d53d17a02a5', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '4c647cf4-03d9-4249-87ec-d00c1d83065a', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"4c647cf4-03d9-4249-87ec-d00c1d83065a\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2026-09-14 08:36:05\",\"installment_number\":1,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-d0f6-4de2-b689-57b33bf134f3', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'cad43d06-d5b0-49c0-9ca4-2cb97c4270f2', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"cad43d06-d5b0-49c0-9ca4-2cb97c4270f2\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2026-12-14 08:36:05\",\"installment_number\":2,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-d28c-4696-9a85-39f3a52379b1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '6bbce114-64d0-4816-8790-4cd1ea5d139f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"6bbce114-64d0-4816-8790-4cd1ea5d139f\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-03-14 08:36:05\",\"installment_number\":3,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-d423-455a-b557-6a6d27b3bf4b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '01c15d4c-b0c2-4ade-b3a8-a24f58273f41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"01c15d4c-b0c2-4ade-b3a8-a24f58273f41\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-06-14 08:36:05\",\"installment_number\":4,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-d581-4e94-bb08-578e729146e6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '5aaf38a2-2340-406b-9c83-a7654c319aec', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"5aaf38a2-2340-406b-9c83-a7654c319aec\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-09-14 08:36:05\",\"installment_number\":5,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-d6d4-4d8b-84ae-d6cd87c14639', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '29525037-287b-44dd-a366-34106c62f296', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"29525037-287b-44dd-a366-34106c62f296\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2027-12-14 08:36:05\",\"installment_number\":6,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-d874-4559-88dd-87a065a60b85', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '0b59e551-bccf-4d85-b547-1fc72910ed3b', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"0b59e551-bccf-4d85-b547-1fc72910ed3b\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-03-14 08:36:05\",\"installment_number\":7,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-d9e4-42ce-aeaa-54e02a997edd', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'ed7827e0-89e9-483d-99ed-381862bdda84', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"ed7827e0-89e9-483d-99ed-381862bdda84\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-06-14 08:36:05\",\"installment_number\":8,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-db49-4bd9-8c06-5ef79f43a1a1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '024fa7c4-ee8e-49f7-8233-c7a73146fada', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"024fa7c4-ee8e-49f7-8233-c7a73146fada\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-09-14 08:36:05\",\"installment_number\":9,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-dc7e-4aca-a545-c058a4fcdbfa', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'f4cc27ec-e16f-43c3-bbe4-8b2c4d89f639', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"f4cc27ec-e16f-43c3-bbe4-8b2c4d89f639\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2028-12-14 08:36:05\",\"installment_number\":10,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-ddab-4fa7-bf6e-8d98fdda6d01', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '77e555f6-b724-4357-bf2b-0cd52fe5ae3d', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"77e555f6-b724-4357-bf2b-0cd52fe5ae3d\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2029-03-14 08:36:05\",\"installment_number\":11,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-def3-4752-9735-3a5d3225b895', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'f60cf9d4-1221-465c-a3a6-e9490b77d858', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"f60cf9d4-1221-465c-a3a6-e9490b77d858\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":412500,\"status\":\"pending\",\"due_date\":\"2029-06-14 08:36:05\",\"installment_number\":12,\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2050f60-e035-4124-b7bc-e0e1157e865e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'de76fbdd-7016-4a37-9c10-44212b29318a', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"de76fbdd-7016-4a37-9c10-44212b29318a\",\"contract_id\":\"d34f7657-5152-4430-946e-9a594854ba44\",\"payment_plan_id\":\"d042fafa-d503-46fe-95d2-4c737e4ae824\",\"amount\":\"50000.00\",\"status\":\"paid\",\"paid_at\":\"2026-06-14 08:36:05\",\"due_date\":\"2026-06-14 08:36:05\",\"installment_number\":0,\"gateway\":\"eoi_deposit\",\"transaction_reference\":\"EOI-f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e\",\"updated_at\":\"2026-06-14 08:36:05\",\"created_at\":\"2026-06-14 08:36:05\"}', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a2051043-e065-4afa-8ac3-9c95b7b38fa8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'LEAD_UPDATE', 'App\\Models\\Lead', 'a1ff33da-76fc-491e-9ae4-1b55ca1a5e42', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"UPDATE\",\"message\":\"Lead was updated.\"}', '{\"company_sales_agent_id\":null,\"current_tier\":\"tier_1\"}', '{\"company_sales_agent_id\":\"a9250aee-0119-4a17-a237-259e4fe83abb\",\"current_tier\":\"tier_3\"}', '2026-06-14 05:38:34', '2026-06-14 05:38:34'),
('a205106b-6bc2-459d-8531-9d1fb0c6e9e4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'LEAD_UPDATE', 'App\\Models\\Lead', 'a1ff33da-76fc-491e-9ae4-1b55ca1a5e42', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"UPDATE\",\"message\":\"Lead was updated.\"}', '{\"status\":\"new\"}', '{\"status\":\"reserved\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-7885-4b85-8677-40f252adb82f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'CONTRACT_CREATE', 'App\\Models\\Contract', '38396c28-eeaa-4c46-957a-08c102f463ec', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"contract_number\":\"REDP-CTR-2026-0007\",\"reservation_id\":\"11fe74b8-9950-4c22-9460-7f684eac2d98\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\",\"client_id\":\"3d4270b4-ae06-4aae-bb84-04c294e5c038\",\"total_amount\":\"6200000.00\",\"paid_amount\":\"50000.00\",\"type\":\"installment\",\"status\":\"draft\",\"notes\":\"Auto-generated from reservation confirmation.\",\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-7c2c-45c2-bec5-340683f904f8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '66853418-b25f-4484-ad6b-2c41f802e8bd', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"66853418-b25f-4484-ad6b-2c41f802e8bd\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2026-09-14 08:39:00\",\"installment_number\":1,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-7df3-4223-aae0-fe5fa9e8bb3d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '94c41017-7bde-416f-9726-f8aa2147c017', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"94c41017-7bde-416f-9726-f8aa2147c017\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2026-12-14 08:39:00\",\"installment_number\":2,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-7f8b-4066-b10c-d2b7049cc462', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'd1ba904f-20dc-4160-84f1-d4357018e15f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"d1ba904f-20dc-4160-84f1-d4357018e15f\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-03-14 08:39:00\",\"installment_number\":3,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-8157-409a-8d26-89c5b80f6bac', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '906e59eb-9089-417b-8e59-c86aa3b456cf', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"906e59eb-9089-417b-8e59-c86aa3b456cf\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-06-14 08:39:00\",\"installment_number\":4,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-832b-4c57-b7ac-3105fa6d46af', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'd446b82a-9f1b-4cfb-97ba-ea53ada17a81', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"d446b82a-9f1b-4cfb-97ba-ea53ada17a81\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-09-14 08:39:00\",\"installment_number\":5,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-8536-40f4-a431-e30379a6a505', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '58ce4882-0fc0-46a0-abe4-6156ceaf2064', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"58ce4882-0fc0-46a0-abe4-6156ceaf2064\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-12-14 08:39:00\",\"installment_number\":6,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-8748-4a50-875d-36b3893e0fee', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '543f4d1e-05e7-44d3-aa22-bff3f2b77b4a', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"543f4d1e-05e7-44d3-aa22-bff3f2b77b4a\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-03-14 08:39:00\",\"installment_number\":7,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-8942-43d3-9367-02c67fc065f6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '29c2bfa0-7c65-4921-b280-1949d5901488', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"29c2bfa0-7c65-4921-b280-1949d5901488\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-06-14 08:39:00\",\"installment_number\":8,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-8ad7-4ae4-9460-bfde219454fc', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '2110bbe7-2a3a-4444-85ee-b01735e403b1', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"2110bbe7-2a3a-4444-85ee-b01735e403b1\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-09-14 08:39:00\",\"installment_number\":9,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('a205106b-8ce7-430e-9864-6291795e59b7', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '52fe0613-457f-49cd-9390-6da0bb1d2238', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"52fe0613-457f-49cd-9390-6da0bb1d2238\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-12-14 08:39:00\",\"installment_number\":10,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-8eb9-49d0-a54d-6d04edfaaf80', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '1198fbab-3aa0-4f54-8f65-ddfb2b19860d', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"1198fbab-3aa0-4f54-8f65-ddfb2b19860d\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2029-03-14 08:39:00\",\"installment_number\":11,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-9090-4c44-a813-5b943022edef', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'fdce9c78-2f00-451f-b4d1-807468e9d38c', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"fdce9c78-2f00-451f-b4d1-807468e9d38c\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2029-06-14 08:39:00\",\"installment_number\":12,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-9264-453d-a584-0954edeb987d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '65628173-41e7-4be7-b96d-50a1fd7cdb41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"65628173-41e7-4be7-b96d-50a1fd7cdb41\",\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"payment_plan_id\":\"da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3\",\"amount\":\"50000.00\",\"status\":\"paid\",\"paid_at\":\"2026-06-14 08:39:00\",\"due_date\":\"2026-06-14 08:39:00\",\"installment_number\":0,\"gateway\":\"eoi_deposit\",\"transaction_reference\":\"EOI-11fe74b8-9950-4c22-9460-7f684eac2d98\",\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-9b21-4752-aca2-adafe356cd3a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'CONTRACT_CREATE', 'App\\Models\\Contract', '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Contract\",\"action\":\"CREATE\",\"message\":\"Contract was created.\"}', NULL, '{\"id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"contract_number\":\"REDP-CTR-2026-0008\",\"reservation_id\":\"11fe74b8-9950-4c22-9460-7f684eac2d98\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\",\"client_id\":\"3d4270b4-ae06-4aae-bb84-04c294e5c038\",\"total_amount\":\"6200000.00\",\"paid_amount\":\"50000.00\",\"type\":\"installment\",\"status\":\"draft\",\"notes\":\"Auto-generated from reservation confirmation.\",\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-9e98-4072-b377-c75d74e4aaeb', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'b160fd3f-f449-4673-aeb4-204700324b5e', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"b160fd3f-f449-4673-aeb4-204700324b5e\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2026-09-14 08:39:00\",\"installment_number\":1,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-a051-43ca-bcdd-f4159f3a36db', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '18980714-312f-4bb4-bcb2-377d2f14a916', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"18980714-312f-4bb4-bcb2-377d2f14a916\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2026-12-14 08:39:00\",\"installment_number\":2,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-a2b9-48b3-8c8b-c51085cb2c6f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '07298918-c33c-42ee-a5d4-498abf64ef99', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"07298918-c33c-42ee-a5d4-498abf64ef99\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-03-14 08:39:00\",\"installment_number\":3,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-a4cf-442a-9a71-1050c7440610', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '58f7debb-164e-4f0f-9d70-cd300fc1583f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"58f7debb-164e-4f0f-9d70-cd300fc1583f\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-06-14 08:39:00\",\"installment_number\":4,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-a6f4-40a3-9279-4b9f8324fe5b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '72045b27-5f65-4378-9ea1-87fbe0a57c6b', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"72045b27-5f65-4378-9ea1-87fbe0a57c6b\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-09-14 08:39:00\",\"installment_number\":5,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-a936-4d93-a5c0-0966eb1f3f7b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '80545bbd-e3c6-430a-a5f5-0354bc8f152b', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"80545bbd-e3c6-430a-a5f5-0354bc8f152b\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2027-12-14 08:39:00\",\"installment_number\":6,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-ab5e-43ea-bdbd-74a6b1135a65', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'e9b8e928-5648-4841-bed4-c3e10fe8dd86', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"e9b8e928-5648-4841-bed4-c3e10fe8dd86\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-03-14 08:39:00\",\"installment_number\":7,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-ad52-4562-b9f7-494a9a91448c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '9557fd4d-90e5-414a-8a5a-93505ef72e2d', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"9557fd4d-90e5-414a-8a5a-93505ef72e2d\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-06-14 08:39:00\",\"installment_number\":8,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-afaa-45eb-b3b4-05445c07dd1b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'c6b0e289-d724-4e41-8958-b7a2ff3b0868', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"c6b0e289-d724-4e41-8958-b7a2ff3b0868\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-09-14 08:39:00\",\"installment_number\":9,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-b133-48c1-98ad-a3263027e4da', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', '2f934f2a-7a64-4613-a5bb-07f57a9cf243', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"2f934f2a-7a64-4613-a5bb-07f57a9cf243\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2028-12-14 08:39:00\",\"installment_number\":10,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-b339-44d7-963c-3b15cf06ebdc', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'bc3c9fe5-6cb7-4032-ac3c-7974a9c4d3d5', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"bc3c9fe5-6cb7-4032-ac3c-7974a9c4d3d5\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2029-03-14 08:39:00\",\"installment_number\":11,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-b50e-4038-918d-3a3a3c3ff747', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'e2cbdd74-178e-4657-b0ab-783322a256b3', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"e2cbdd74-178e-4657-b0ab-783322a256b3\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":512500,\"status\":\"pending\",\"due_date\":\"2029-06-14 08:39:00\",\"installment_number\":12,\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a205106b-b6c2-4731-8da6-deaa13d6f259', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'PAYMENT_CREATE', 'App\\Models\\Payment', 'a442d159-ab50-4331-b82f-bd388c3c8dd0', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"CREATE\",\"message\":\"Payment was created.\"}', NULL, '{\"id\":\"a442d159-ab50-4331-b82f-bd388c3c8dd0\",\"contract_id\":\"0c0ba5c9-e0c4-494a-a093-6314ebd3cb46\",\"payment_plan_id\":\"09586de2-3a40-4a81-9db5-bbd46149d02a\",\"amount\":\"50000.00\",\"status\":\"paid\",\"paid_at\":\"2026-06-14 08:39:00\",\"due_date\":\"2026-06-14 08:39:00\",\"installment_number\":0,\"gateway\":\"eoi_deposit\",\"transaction_reference\":\"EOI-11fe74b8-9950-4c22-9460-7f684eac2d98\",\"updated_at\":\"2026-06-14 08:39:00\",\"created_at\":\"2026-06-14 08:39:00\"}', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a20513ee-de90-4662-a7d8-2508c355f37a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'LEAD_UPDATE', 'App\\Models\\Lead', 'a1ff33da-84eb-45f3-8cf8-4bc64f560332', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"UPDATE\",\"message\":\"Lead was updated.\"}', '{\"current_tier\":\"tier_1\"}', '{\"current_tier\":\"tier_3\"}', '2026-06-14 05:48:49', '2026-06-14 05:48:49'),
('a2051f71-11df-434b-8c57-4a4c03de584d', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', 'PAYMENT_UPDATE', 'App\\Models\\Payment', '0d39a756-1095-4623-85d7-735bf328bac8', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"UPDATE\",\"message\":\"Payment was updated.\"}', '{\"penalty_amount\":\"0.00\"}', '{\"penalty_amount\":35468.75}', '2026-06-14 06:21:00', '2026-06-14 06:21:00'),
('a2051f71-1690-49aa-ac2b-2ea5decc5322', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', 'PAYMENT_UPDATE', 'App\\Models\\Payment', '6e833e24-62ed-4412-b3be-c0d8a4e413ae', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"UPDATE\",\"message\":\"Payment was updated.\"}', '{\"penalty_amount\":\"0.00\"}', '{\"penalty_amount\":35468.75}', '2026-06-14 06:21:00', '2026-06-14 06:21:00'),
('a2051f71-18c3-48a6-ae89-d26044befd72', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', 'PAYMENT_UPDATE', 'App\\Models\\Payment', '9e2ea89a-dc4d-4d52-9ba7-796918ac6991', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Payment\",\"action\":\"UPDATE\",\"message\":\"Payment was updated.\"}', '{\"penalty_amount\":\"0.00\"}', '{\"penalty_amount\":25000}', '2026-06-14 06:21:00', '2026-06-14 06:21:00'),
('a2054a3e-6a27-4080-820a-766ca900915d', NULL, 'LEAD_CREATE', 'App\\Models\\Lead', '7f873cb1-6a33-4577-aee8-0c662817944e', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity\":\"Lead\",\"action\":\"CREATE\",\"message\":\"Lead was created.\"}', NULL, '{\"id\":\"7f873cb1-6a33-4577-aee8-0c662817944e\",\"first_name\":\"John\",\"last_name\":\"Doe\",\"email\":\"john@mv-eoi.com\",\"phone\":\"+201200334455\",\"national_id\":\"29810101234567\",\"status\":\"new\",\"source\":\"website_eoi\",\"interested_project_id\":\"02f41010-d223-46c6-90f3-2cb42fbd4d76\",\"tenant_id\":null,\"updated_at\":\"2026-06-14 11:20:41\",\"created_at\":\"2026-06-14 11:20:41\"}', '2026-06-14 08:20:41', '2026-06-14 08:20:41'),
('a26c335f-ac5b-4a29-a67d-35c666f108e5', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426184810\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:26', '2026-06-14 05:36:26'),
('a42173d5-b1fe-4c3c-96a6-0fe4e7fde516', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c5543dbb-67b2-4431-8488-da291dd04b31\"}', NULL, '{\"id\":\"c5543dbb-67b2-4431-8488-da291dd04b31\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ac971739-c8e1-4322-8a97-fb312be28dfd\",\"floor_id\":\"ae5cd80a-97af-44f4-aca6-627d1be0ae5d\",\"unit_number\":\"C-201\",\"floor\":2,\"type\":\"penthouse\",\"area\":270,\"net_area\":255,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building C\",\"price\":9500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('a44bfaf9-e3aa-4662-8411-67cb6e7b2d58', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422601784\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:54', '2026-06-14 04:36:54'),
('a5408a0b-2bb0-45ec-a9db-efd8e0006e28', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426929646\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:48:52', '2026-06-14 05:48:52'),
('a5d5484f-a7b9-4dbb-97d6-2ab76c02e67b', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"b8ae6192-5d76-493c-942c-3828594d4c7b\"}', NULL, '{\"id\":\"b8ae6192-5d76-493c-942c-3828594d4c7b\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"f137e3e3-df4f-40c7-9bbf-892ff231230b\",\"unit_number\":\"A-002\",\"floor\":0,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":4800000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('a5f61755-c2cf-4b29-a6e0-b996bd86c19c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425790842\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:52', '2026-06-14 05:29:52'),
('a7992489-364d-426e-bcdf-06930a6c9367', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781510635964\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-15 05:03:59', '2026-06-15 05:03:59'),
('a7c77e28-383f-4964-9a01-2a0c0acefba4', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"6ee3e2e5-c2ca-43a9-81e4-168efba3b076\"}', NULL, '{\"id\":\"6ee3e2e5-c2ca-43a9-81e4-168efba3b076\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"13270b89-cb08-44d9-b892-d3adc7ff1ff8\",\"unit_number\":\"CRA-203\",\"floor\":2,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":5060000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('a7cdbd9e-7df3-450b-8a71-92e9e32c6221', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"b5299c0f-90ff-4ab7-ab09-49ea174984c2\"}', NULL, '{\"id\":\"b5299c0f-90ff-4ab7-ab09-49ea174984c2\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"b8c257e5-69b2-453c-85e3-05f491ae56e0\",\"floor_id\":\"c09cb47b-8ad2-4447-a392-7d59c3e32a98\",\"unit_number\":\"CHP-102\",\"floor\":1,\"type\":\"commercial\",\"area\":160,\"net_area\":148,\"finishing_type\":\"fully_finished\",\"bedrooms\":null,\"bathrooms\":1,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"street\",\"orientation\":\"east\",\"building\":\"Clubhouse Pavilion E\",\"price\":7100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Retail & commercial shop space in the top-right commercial promenade. Ideal for caf\\u00e9s, boutiques, or high-end services.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('a890e973-0c48-412b-aa38-fd5f725dcf3f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"542edfe3-2c4e-4d85-b227-0ddcaf9f3051\"}', NULL, '{\"id\":\"542edfe3-2c4e-4d85-b227-0ddcaf9f3051\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"733ded42-bbd1-4ac3-ad16-1daeb5524a4e\",\"unit_number\":\"A-103\",\"floor\":1,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('a9afd01f-966f-4722-a852-c60d6a40e2a7', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c8fbd281-19b4-4d7c-a91e-4cb62dce7d04\"}', NULL, '{\"id\":\"c8fbd281-19b4-4d7c-a91e-4cb62dce7d04\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5dd62f31-5809-4aa5-b225-d1083f02c521\",\"unit_number\":\"B-001\",\"floor\":0,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":4650000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('ab785ee0-b926-4f24-b666-0635061bba17', '2c1843b9-b367-493d-a8c2-b6d208f55d39', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"handover@redp.com\"}', NULL, NULL, '2026-06-14 06:23:40', '2026-06-14 06:23:40'),
('ae0815c0-9022-42fb-98c1-e910ebe5a7b1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422603135\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:55', '2026-06-14 04:36:55'),
('aee2d837-f6a4-4f3f-a838-409778e8f7cf', '43209f55-b7a8-411a-a789-a81d697b741d', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"tele_sales@redp.com\"}', NULL, NULL, '2026-06-11 07:44:14', '2026-06-11 07:44:14'),
('afbe9d55-0bd4-4ade-b9eb-860a0785d00f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"7bf991ea-e190-4846-acb1-5dca0febeb55\"}', NULL, '{\"id\":\"7bf991ea-e190-4846-acb1-5dca0febeb55\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5d293ce0-3449-4ff5-ba1e-75c889f2570e\",\"unit_number\":\"B-303\",\"floor\":3,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5850000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('b1ef160c-245b-43a7-9b30-b091e32e64d1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426246611\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:37:29', '2026-06-14 05:37:29'),
('b245f4d7-f809-4560-9b15-cc8cccd64638', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781420515357\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:02:00', '2026-06-14 04:02:00'),
('b3ffb735-8824-46fc-88d0-48ae1a3df336', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"d0512669-d040-4803-bffd-62fe3e2238c0\"}', NULL, '{\"id\":\"d0512669-d040-4803-bffd-62fe3e2238c0\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"c134bce6-34b5-4788-9f8e-60d0777f94ef\",\"unit_number\":\"B-202\",\"floor\":2,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5400000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('b5211e48-fd4a-4f2e-8508-b87ab97dd385', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426131213\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:32', '2026-06-14 05:35:32'),
('b525605e-2754-4173-bc1e-b267ce95132f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"66aceba9-4b5e-4dd7-b5be-15de6869eb23\"}', NULL, '{\"id\":\"66aceba9-4b5e-4dd7-b5be-15de6869eb23\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ac971739-c8e1-4322-8a97-fb312be28dfd\",\"floor_id\":\"7d87ddf6-00d1-4951-bf3b-c339d773f581\",\"unit_number\":\"C-102\",\"floor\":1,\"type\":\"duplex\",\"area\":210,\"net_area\":195,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south_west\",\"building\":\"Building C\",\"price\":7800000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('b5cd8827-78ba-43ff-a24f-7c65801a20f4', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'TIER_TRANSITION', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"lead_id\":\"a1ff33da-84eb-45f3-8cf8-4bc64f560332\",\"from_tier\":\"tier_1\",\"to_tier\":\"tier_3\",\"transfer_notes\":null}', NULL, NULL, '2026-06-14 05:48:49', '2026-06-14 05:48:49'),
('b69416c8-d735-4f45-9c76-09d6181e2faf', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"a37a15d3-1c3c-432f-9b27-d769ef858421\"}', NULL, '{\"id\":\"a37a15d3-1c3c-432f-9b27-d769ef858421\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"a7b51a7b-f896-4ba7-94f1-b7ef103c13f9\",\"floor_id\":\"d9acd2a6-63dd-4509-b12d-212976f6cb88\",\"unit_number\":\"LPC-002\",\"floor\":0,\"type\":\"duplex\",\"area\":210,\"net_area\":198,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"lagoon\",\"orientation\":\"north_west\",\"building\":\"Lagoon Pavilion C\",\"price\":7200000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('b74aa4d5-abd4-42f1-96cf-0bc1de77722f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427174502\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:56', '2026-06-14 05:52:56'),
('b75fe7d4-71d4-43fd-be53-9a14e28898c8', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"022b7b56-ddf2-4223-a09c-e804b79715c0\"}', NULL, '{\"id\":\"022b7b56-ddf2-4223-a09c-e804b79715c0\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"a3b72eef-aa4e-49f9-9ee5-e39bad335f1c\",\"unit_number\":\"A-202\",\"floor\":2,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5400000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('b784d5e1-4074-4a5f-908a-d68cb81e42a5', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c8c6c0e6-60d7-4b42-bc26-64facbfa418b\"}', NULL, '{\"id\":\"c8c6c0e6-60d7-4b42-bc26-64facbfa418b\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"2cc26949-c15c-4458-b1f3-4e01153093f8\",\"unit_number\":\"A-302\",\"floor\":3,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5700000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('b79c16a6-3e86-413f-ab0e-a2e5cf11e112', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"af7bb2b9-2473-4dcd-ae55-1d72ac63f518\"}', NULL, '{\"id\":\"af7bb2b9-2473-4dcd-ae55-1d72ac63f518\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"55b7fde8-9587-48f2-813a-2bef94d6e466\",\"unit_number\":\"B-202\",\"floor\":2,\"type\":\"apartment\",\"area\":170,\"net_area\":155,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5400000,\"status\":\"sold\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('b7b220f7-515f-4dbc-8412-923490e05079', '3d4270b4-ae06-4aae-bb84-04c294e5c038', 'CONTRACT_AUTO_GENERATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"contract_id\":\"38396c28-eeaa-4c46-957a-08c102f463ec\",\"contract_number\":\"REDP-CTR-2026-0007\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\",\"total_amount\":\"6200000.00\",\"installments\":12}', NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('b9714815-c8d1-4584-8fa9-779a29f592af', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'BOOKING_EXECUTED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"lead_id\":\"a1ff33da-76fc-491e-9ae4-1b55ca1a5e42\",\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\",\"reservation_id\":\"11fe74b8-9950-4c22-9460-7f684eac2d98\",\"notes\":null}', NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('ba68c387-0ec6-409d-b309-c7596166d3f6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426761333\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:46:04', '2026-06-14 05:46:04'),
('bab94db9-60ab-4f0b-bc3d-bd956b9c2560', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781427042420\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:46', '2026-06-14 05:50:46'),
('bacc7bcb-2903-4184-9e09-b3243b5ee85f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426186223\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:27', '2026-06-14 05:36:27'),
('bbade291-8c06-4c00-98f3-f52d53f3a339', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426318589\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:39', '2026-06-14 05:38:39'),
('bc203ede-3929-4c1f-9933-0f538e50b559', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\\/fe29317c-5e3a-4342-a747-6f16c09cd4ea\\/units\",\"route_params\":{\"projectId\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\"},\"query_params\":{\"status\":\"all\",\"type\":\"all\",\"_t\":\"1781426966571\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:28', '2026-06-14 05:49:28'),
('be6f3fb7-0ae4-420b-a766-1b198b6a38db', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426284466\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:06', '2026-06-14 05:38:06');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('bec6224c-26d5-46f5-be78-a81e1ece3d42', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426869460\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:47:54', '2026-06-14 05:47:54'),
('bfd361db-11e0-41ee-8842-c7978b3d8059', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"6d263358-65c1-48c1-b931-2d392e239055\"}', NULL, '{\"id\":\"6d263358-65c1-48c1-b931-2d392e239055\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"6be51f66-d328-4339-ba39-b35903e9f197\",\"unit_number\":\"CRA-401\",\"floor\":4,\"type\":\"penthouse\",\"area\":250,\"net_area\":238,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Creek Residence A\",\"price\":8900000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('bfdc70da-3755-411f-84e3-d55b195eaa42', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423020077\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:41', '2026-06-14 04:43:41'),
('c043477c-a2b1-4b20-aea6-4480d48cc3dd', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425794861\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:56', '2026-06-14 05:29:56'),
('c1548beb-f458-478b-a6fe-7ee028062b63', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426129264\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:30', '2026-06-14 05:35:30'),
('c1934ada-b75d-4a12-beff-b90cc7f7563b', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174625356\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:01', '2026-06-11 07:44:01'),
('c1e415cd-93be-42d9-b414-90c303e03779', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427042420\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:49', '2026-06-14 05:50:49'),
('c1eac2ff-aa3c-42bc-99c4-eb32662e02e5', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"2a0431c5-34b3-4f94-838d-cdd9dc3d4dcd\"}', NULL, '{\"id\":\"2a0431c5-34b3-4f94-838d-cdd9dc3d4dcd\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"ffbce676-338e-46e7-bd99-a82f0ec4501b\",\"unit_number\":\"CRA-103\",\"floor\":1,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":4810000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('c1ec13f8-8129-48b6-b6fd-a56929bc9de3', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422616467\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:57', '2026-06-14 04:36:57'),
('c2c03e17-449a-408d-a222-587a0e776dc1', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"32c2b460-fdbe-4806-8d39-0c8075aee2f2\"}', NULL, '{\"id\":\"32c2b460-fdbe-4806-8d39-0c8075aee2f2\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"6be51f66-d328-4339-ba39-b35903e9f197\",\"unit_number\":\"CRA-402\",\"floor\":4,\"type\":\"penthouse\",\"area\":270,\"net_area\":258,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Creek Residence A\",\"price\":9300000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('c30c461b-c788-4d54-a2eb-6c7983579695', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427165890\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:48', '2026-06-14 05:52:48'),
('c340ff76-7f50-4584-8ad2-00be483fdc81', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426128239\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:29', '2026-06-14 05:35:29'),
('c3e185e7-3f10-42f8-9a20-c04462e9f74b', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"eb4ee662-3943-4707-8bb3-3bfb0fd4013c\"}', NULL, '{\"id\":\"eb4ee662-3943-4707-8bb3-3bfb0fd4013c\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ecbf54eb-f203-401f-83a2-25b7fd3a0db9\",\"floor_id\":\"fd28dcef-95f8-44a7-82f3-ddd7ab9ae953\",\"unit_number\":\"WTH-101\",\"floor\":1,\"type\":\"villa\",\"area\":240,\"net_area\":228,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":4,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"West Townhouse Block D\",\"price\":11000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('c47a5874-baff-4af0-b283-f4a1c44c4e5f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"a1e3d4d0-4711-4ce5-a8e3-2b395c9111df\"}', NULL, '{\"id\":\"a1e3d4d0-4711-4ce5-a8e3-2b395c9111df\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"2cc26949-c15c-4458-b1f3-4e01153093f8\",\"unit_number\":\"A-301\",\"floor\":3,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5550000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('c48bbabb-7241-4c4a-9f70-25642372b53f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427176035\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:57', '2026-06-14 05:52:57'),
('c4f3cf7b-83db-4cfa-91ee-7963fc82c89b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426316175\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:37', '2026-06-14 05:38:37'),
('c7c6ce60-1ffa-42b0-933d-babfa5f11b28', '43209f55-b7a8-411a-a789-a81d697b741d', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781174654510\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:20', '2026-06-11 07:44:20'),
('c8f137d8-5faa-477c-af9a-3655652fffba', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1782030815987\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 05:33:39', '2026-06-21 05:33:39'),
('c9eb0f3f-ddcd-4eb2-8076-be3fa9e25a9e', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"tele_sales_head@redp.com\"}', NULL, NULL, '2026-06-11 07:43:45', '2026-06-11 07:43:45'),
('cab388c3-da6e-42b9-a4f2-5e10b4a4a16b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423008010\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:29', '2026-06-14 04:43:29'),
('cb726eb2-99e6-402e-9527-a0214764988d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422596207\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:48', '2026-06-14 04:36:48'),
('cc0e2d5e-8d3a-47a1-bb10-55312a366610', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426187339\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:28', '2026-06-14 05:36:28'),
('cc6094b9-a71a-4838-acb6-ba2591af2bb6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781425849566\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:30:52', '2026-06-14 05:30:52'),
('cccd533c-77c8-482d-ad04-8eb948e4394a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422648091\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:29', '2026-06-14 04:37:29'),
('cda5ea7b-ea7f-443b-8cb6-374dce29aafa', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-11 08:29:15', '2026-06-11 08:29:15'),
('ce1dbe48-ca3f-41e4-ad40-c104e66048a9', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c5be702d-bb60-456b-86d2-55d6a7384ad5\"}', NULL, '{\"id\":\"c5be702d-bb60-456b-86d2-55d6a7384ad5\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"dbca067c-c922-4a74-b17d-a60128586827\",\"unit_number\":\"A-301\",\"floor\":3,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5550000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('cefc4036-3036-41b4-b1b7-6413ffe64fe3', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422620070\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:01', '2026-06-14 04:37:01'),
('cf1c465c-499f-4551-9f39-2af150b02769', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175543335\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:04', '2026-06-11 07:59:04'),
('d1078d21-9303-4d43-b941-cb2d6b11f57a', '43209f55-b7a8-411a-a789-a81d697b741d', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"tele_sales\",\"tier_level\":1,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781174654817\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:44:25', '2026-06-11 07:44:25'),
('d29b55f4-c471-4114-b5d1-d21213959b22', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426315373\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:36', '2026-06-14 05:38:36'),
('d3251e98-6ab6-49d4-84f0-8e3f6d9b59f6', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"04d159da-e54d-41f6-a3d5-52b2acaf1fa8\"}', NULL, '{\"id\":\"04d159da-e54d-41f6-a3d5-52b2acaf1fa8\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"d7ee4704-73dd-4e8c-b0f7-984dace9fc62\",\"unit_number\":\"CRB-103\",\"floor\":1,\"type\":\"apartment\",\"area\":180,\"net_area\":168,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence B\",\"price\":4810000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('d562a273-be36-45c7-b63a-291c8af7b779', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426963391\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:24', '2026-06-14 05:49:24'),
('d5b6a9ea-5deb-490f-be7f-26a58c194f9e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425849566\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:30:51', '2026-06-14 05:30:51'),
('d64de006-64e6-4808-9bb8-9d936a013bc2', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426288161\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:10', '2026-06-14 05:38:10'),
('d6ebbd6d-2c25-4e72-9480-a358ecdd3ae1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422596207\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:48', '2026-06-14 04:36:48'),
('d757c5da-becf-4e76-bb3a-8657c1d66363', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-11 07:49:26', '2026-06-11 07:49:26'),
('d7b5b16d-7c52-4aca-a0d8-11788808a6de', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426125724\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:27', '2026-06-14 05:35:27'),
('d932707c-01d2-4546-9c04-13b7b0798b38', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426129935\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:30', '2026-06-14 05:35:30'),
('da41f8b6-4e34-45fc-8819-dc489c0ff18b', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781427042420\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:49', '2026-06-14 05:50:49'),
('da6602d8-239c-4a7b-b9c3-af8407dc7a82', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"6c36121f-56b3-4dba-9ea9-8d8a694b5da9\"}', NULL, '{\"id\":\"6c36121f-56b3-4dba-9ea9-8d8a694b5da9\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"ecbf54eb-f203-401f-83a2-25b7fd3a0db9\",\"floor_id\":\"4a53322c-d2fc-464c-997c-e7cb9c14a262\",\"unit_number\":\"WTH-001\",\"floor\":0,\"type\":\"villa\",\"area\":240,\"net_area\":228,\"finishing_type\":\"fully_finished\",\"bedrooms\":4,\"bathrooms\":4,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"West Townhouse Block D\",\"price\":11000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('da7be3a6-0cc4-4439-b8d3-7682f89e8782', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425849566\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:30:52', '2026-06-14 05:30:52'),
('db2b8e5f-2408-465f-a375-dcfb9086aa8d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426343406\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:39:04', '2026-06-14 05:39:04'),
('dc5e1313-5cbd-4a3c-b446-5067a5e7a59f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422614701\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:56', '2026-06-14 04:36:56'),
('dd0d0312-759d-4629-a099-5dcbe45ee991', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"15bf1a04-d7b9-42be-b8ac-3b18b0939e90\"}', NULL, '{\"id\":\"15bf1a04-d7b9-42be-b8ac-3b18b0939e90\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"ffbce676-338e-46e7-bd99-a82f0ec4501b\",\"unit_number\":\"CRA-101\",\"floor\":1,\"type\":\"apartment\",\"area\":150,\"net_area\":138,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"south\",\"building\":\"Creek Residence A\",\"price\":4570000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('de816599-1585-41f2-84ac-6196fc9da048', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"ed2e0b6a-9590-4a27-b6fe-e612fbf69507\"}', NULL, '{\"id\":\"ed2e0b6a-9590-4a27-b6fe-e612fbf69507\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"02881ad3-f92c-46fc-86eb-d5a4a5333489\",\"floor_id\":\"69973069-2741-47ff-87cd-87df4d15e53f\",\"unit_number\":\"CRB-202\",\"floor\":2,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence B\",\"price\":4940000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('df4a7c21-66f5-48e0-9452-0f228faf55e2', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175544154\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:06', '2026-06-11 07:59:06'),
('e0637ec4-d2aa-4779-af05-6c04b194be6e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422645596\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:26', '2026-06-14 04:37:26'),
('e08b8577-9256-4f63-82ad-6f8dc6021fce', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"cb5f7c51-b4ab-4a1d-8f85-c9237a5309d0\"}', NULL, '{\"id\":\"cb5f7c51-b4ab-4a1d-8f85-c9237a5309d0\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"a7b51a7b-f896-4ba7-94f1-b7ef103c13f9\",\"floor_id\":\"176d9d3a-0aff-4517-80d2-0b0aae5ffae4\",\"unit_number\":\"LPC-101\",\"floor\":1,\"type\":\"duplex\",\"area\":210,\"net_area\":198,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"lagoon\",\"orientation\":\"north_west\",\"building\":\"Lagoon Pavilion C\",\"price\":7000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('e09793f0-3041-4a93-99ea-12f5735ce319', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426761016\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:46:04', '2026-06-14 05:46:04'),
('e134d1c9-50b1-46ab-be29-87de06477f28', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426314233\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:35', '2026-06-14 05:38:35'),
('e42f0bfd-edd5-4d96-8560-4b5e83b6a932', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426280535\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:38:01', '2026-06-14 05:38:01'),
('e47d2002-2732-4de1-803b-60e5fbb1861d', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-14 06:26:51', '2026-06-14 06:26:51'),
('e60fdb37-b09e-4c85-9121-5ff17c273f73', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422650267\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:31', '2026-06-14 04:37:31'),
('e654572e-b3b3-4b9c-805a-2abfb48a27c5', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"a5805fce-6b19-4623-9a69-1efa02954d7a\"}', NULL, '{\"id\":\"a5805fce-6b19-4623-9a69-1efa02954d7a\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"665c3e6b-1ed4-48f6-8c20-c8377563294e\",\"unit_number\":\"B-304\",\"floor\":3,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":6000000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('e698b351-c7c9-4ade-8c35-c61ece82766a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"admin@redp.com\"}', NULL, NULL, '2026-06-11 08:31:32', '2026-06-11 08:31:32'),
('e8e5ce3a-022b-4410-abe3-47d5436024b1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1782030815987\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 05:33:41', '2026-06-21 05:33:41'),
('e969de80-3e91-487f-97ce-f708a8a920c6', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"e7252744-9058-464f-8e88-55946c6d446d\"}', NULL, '{\"id\":\"e7252744-9058-464f-8e88-55946c6d446d\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"837971fc-4f4a-4979-8701-7db962965e4a\",\"floor_id\":\"bb6633d8-ec28-4406-bd0e-296b76f7b248\",\"unit_number\":\"A-401\",\"floor\":4,\"type\":\"penthouse\",\"area\":270,\"net_area\":255,\"finishing_type\":\"super_lux\",\"bedrooms\":4,\"bathrooms\":3,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":true,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north_east\",\"building\":\"Building A\",\"price\":9500000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('ea054feb-aa83-4aea-82c6-a4a54781c034', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426126717\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:27', '2026-06-14 05:35:27'),
('ea111f37-4633-479d-9090-a708fe78f20f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781426869773\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:47:55', '2026-06-14 05:47:55'),
('eb0cd2d0-a2c9-43d1-a7b1-11375384c3fe', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"7b87eb86-ec33-475e-8f19-4ebe1bb5e3d1\"}', NULL, '{\"id\":\"7b87eb86-ec33-475e-8f19-4ebe1bb5e3d1\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"a994e9f7-a97f-4ebf-a638-15cc9f343729\",\"unit_number\":\"CRA-302\",\"floor\":3,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence A\",\"price\":5190000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `device_type`, `browser`, `geo_location`, `session_id`, `details`, `old_values`, `new_values`, `created_at`, `updated_at`) VALUES
('eb4eccfb-27eb-4ac5-94bc-a37c1f14fcbf', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427042420\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:45', '2026-06-14 05:50:45'),
('eb58aad1-4abb-4435-8931-9c7796b7ed6c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781425791592\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:29:53', '2026-06-14 05:29:53'),
('eb89233d-12fc-4069-a227-0aae76c7ae37', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9f7ccdc7-493e-4d00-872c-753742ab8292\"}', NULL, '{\"id\":\"9f7ccdc7-493e-4d00-872c-753742ab8292\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6a32ae9d-efca-4649-807b-f73e41ce294f\",\"unit_number\":\"B-001\",\"floor\":0,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":4650000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('ec4a1e09-521a-4c33-bcd3-2ce1aa31107e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422603437\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:54', '2026-06-14 04:36:54'),
('ec826c1a-2028-439a-bfb4-f1c23d95fd78', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"de0d3bf2-d57d-4572-ba91-f2529393c938\"}', NULL, '{\"id\":\"de0d3bf2-d57d-4572-ba91-f2529393c938\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"66811d50-0cf3-46b5-b55e-e233c0cb5f69\",\"unit_number\":\"CRA-002\",\"floor\":0,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence A\",\"price\":4440000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('ecfffc52-3b78-4cdb-9bc2-d85707d79f83', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\\/02f41010-d223-46c6-90f3-2cb42fbd4d76\",\"route_params\":{\"projectId\":\"02f41010-d223-46c6-90f3-2cb42fbd4d76\"},\"query_params\":{\"_t\":\"1781427053379\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:54', '2026-06-14 05:50:54'),
('ed8775ca-70d0-4ee5-ba72-abfe4d82ac7c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422992409\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:15', '2026-06-14 04:43:15'),
('edd0e504-3061-4d3b-b821-24ae6a07c533', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427042420\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:50:45', '2026-06-14 05:50:45'),
('ee344937-bb9a-43c7-a0cf-5258ffa5df7c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/transactions\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426187627\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:28', '2026-06-14 05:36:28'),
('ee9dcb30-3480-4cea-aa6d-80cd6a4a6f68', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"client@redp.com\"}', NULL, NULL, '2026-06-11 08:36:33', '2026-06-11 08:36:33'),
('eee52ed4-636f-4c44-abde-36d42b2cd5a5', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"9bda3ccc-59e7-4469-be93-e5f769652aa7\"}', NULL, '{\"id\":\"9bda3ccc-59e7-4469-be93-e5f769652aa7\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5d293ce0-3449-4ff5-ba1e-75c889f2570e\",\"unit_number\":\"B-301\",\"floor\":3,\"type\":\"apartment\",\"area\":155,\"net_area\":140,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5550000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('ef3baa64-154f-4340-9f9c-d547b495ebd5', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426869460\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:47:56', '2026-06-14 05:47:56'),
('efa82950-5e41-41ae-b444-28f132f1f51f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427183497\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:53:05', '2026-06-14 05:53:05'),
('f0a61ef7-494d-434f-bf6d-1a7cbe929aa0', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"6348748e-e60e-44a7-b894-a9db3e64decd\"}', NULL, '{\"id\":\"6348748e-e60e-44a7-b894-a9db3e64decd\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"c021af24-4f2a-426c-8482-2ca444961eaa\",\"unit_number\":\"A-104\",\"floor\":1,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5400000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('f0da00a3-f00e-422a-915f-1cc2166fcaa5', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1782030815987\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-21 05:33:42', '2026-06-21 05:33:42'),
('f24304ae-ccd1-4bf1-a823-8e74fcc33160', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"b389414b-7216-49d4-b890-af1d1a2c70b4\"}', NULL, '{\"id\":\"b389414b-7216-49d4-b890-af1d1a2c70b4\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"f137e3e3-df4f-40c7-9bbf-892ff231230b\",\"unit_number\":\"A-004\",\"floor\":0,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building A\",\"price\":5100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('f35d8587-c1e5-4f12-9b24-6a4c0068622c', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"813bb138-ec40-4d12-9047-f89b19d953a9\"}', NULL, '{\"id\":\"813bb138-ec40-4d12-9047-f89b19d953a9\",\"project_id\":\"fe29317c-5e3a-4342-a747-6f16c09cd4ea\",\"building_id\":\"fd85cbce-1008-46f2-a51b-b27844f967c5\",\"floor_id\":\"60edc1c1-378d-4f47-9bdb-abb9271a3f82\",\"unit_number\":\"T-02\",\"floor\":0,\"type\":\"apartment\",\"area\":120,\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":1,\"price\":2500000,\"finishing_type\":\"fully_finished\",\"view_type\":null,\"building\":\"TEST\",\"status\":\"available\",\"phase\":\"Phase 1\",\"updated_at\":\"2026-06-17 07:43:44\",\"created_at\":\"2026-06-17 07:43:44\"}', '2026-06-17 04:43:44', '2026-06-17 04:43:44'),
('f54f7486-c46b-48ee-b2af-cc98310d0010', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422992409\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:15', '2026-06-14 04:43:15'),
('f5597ad4-cce7-4b8d-8888-6e5c51612b68', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781510635964\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-15 05:03:58', '2026-06-15 05:03:58'),
('f5dd35a6-68a9-49da-88d5-74d4fd327fc3', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"af183414-554f-4836-94df-f9e697f64c78\"}', NULL, '{\"id\":\"af183414-554f-4836-94df-f9e697f64c78\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5dd62f31-5809-4aa5-b225-d1083f02c521\",\"unit_number\":\"B-004\",\"floor\":0,\"type\":\"apartment\",\"area\":200,\"net_area\":185,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"pool\",\"orientation\":\"north\",\"building\":\"Building B\",\"price\":5100000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('f7fe701e-f348-4326-bd37-493b96d577a1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781420515357\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:01:59', '2026-06-14 04:01:59'),
('f81268c1-aa60-4bda-b3ce-e154f6e3592f', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"f6bd8056-64f3-4bec-b409-701a68e97443\"}', NULL, '{\"id\":\"f6bd8056-64f3-4bec-b409-701a68e97443\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"5dd62f31-5809-4aa5-b225-d1083f02c521\",\"unit_number\":\"B-003\",\"floor\":0,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":4950000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('f885d3a2-31f7-4caa-951e-12ec21461fce', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427177736\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:59', '2026-06-14 05:52:59'),
('f88c21fe-5327-4683-937b-07b02e4b21e1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422601784\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:52', '2026-06-14 04:36:52'),
('f901211b-a90a-4b5f-a83e-65b74f8f2c1f', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/projects\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423009132\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:30', '2026-06-14 04:43:30'),
('fac8aa4f-8c13-49f7-8744-33247a595a9d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422612728\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:56', '2026-06-14 04:36:56'),
('fad19458-3093-4e09-a5e6-a38eb5d90eab', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/units\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426186568\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:36:27', '2026-06-14 05:36:27'),
('fb3fad0c-adb5-476e-8b8b-178f49c4daa8', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/reservations\",\"route_params\":[],\"query_params\":{\"_t\":\"1781423024319\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:43:45', '2026-06-14 04:43:45'),
('fb418b93-ee7e-47c4-aff5-e740a8c3855e', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"ec84ee12-9bbc-4041-a738-ff8e462d0699\"}', NULL, '{\"id\":\"ec84ee12-9bbc-4041-a738-ff8e462d0699\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"83a8bf29-35d7-48b6-ac49-c0d58afefee0\",\"floor_id\":\"dbca067c-c922-4a74-b17d-a60128586827\",\"unit_number\":\"A-303\",\"floor\":3,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building A\",\"price\":5850000,\"status\":\"reserved\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('fb6b754b-b3a1-4970-8d94-1ad02fad8927', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', 'USER_LOGIN', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"email\":\"finance_officer@redp.com\"}', NULL, NULL, '2026-06-11 08:20:24', '2026-06-11 08:20:24'),
('fb97e6cc-ac1c-4d79-b4e7-1eb1a18dbff6', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/tele\\/leads\",\"route_params\":[],\"query_params\":{\"page\":\"1\",\"per_page\":\"10\",\"_t\":\"1781422596207\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:36:49', '2026-06-14 04:36:49'),
('fbddaca3-2b0e-4ab2-9f06-26f179f60399', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426118277\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:19', '2026-06-14 05:35:19'),
('fbddb475-278c-4c20-bdfb-d17b5bfb534a', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781422619798\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 04:37:00', '2026-06-14 04:37:00'),
('fd7c2838-9834-4dfe-9594-e7a9c55c0f9e', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/leads\",\"route_params\":[],\"query_params\":{\"_t\":\"1781427176809\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:52:58', '2026-06-14 05:52:58'),
('fddf283f-d258-4fd0-8485-1413462be53e', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c67c08a8-5704-49c5-a985-42a913d02a35\"}', NULL, '{\"id\":\"c67c08a8-5704-49c5-a985-42a913d02a35\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"f0713152-0469-4515-bf9d-23a24b008e43\",\"floor_id\":\"6a32ae9d-efca-4649-807b-f73e41ce294f\",\"unit_number\":\"B-003\",\"floor\":0,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":true,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":4950000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:47:37\",\"created_at\":\"2026-06-21 09:47:37\"}', '2026-06-21 06:47:37', '2026-06-21 06:47:37'),
('fe2cb924-7bdb-462d-aae1-5821de16dd1b', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"company_sales\",\"tier_level\":3,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781175539088\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-11 07:59:00', '2026-06-11 07:59:00'),
('fead56fa-4163-4316-9f2d-350e5f9dd2d0', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"c71ddba9-1b27-4fdf-8817-df8925d84114\"}', NULL, '{\"id\":\"c71ddba9-1b27-4fdf-8817-df8925d84114\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"92b43d1f-7d6f-4733-a987-9bd633247ef8\",\"floor_id\":\"d9e7ce7d-2e83-45a0-8401-7f6b8a1d396b\",\"unit_number\":\"B-103\",\"floor\":1,\"type\":\"apartment\",\"area\":185,\"net_area\":170,\"finishing_type\":\"super_lux\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":12,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"garden\",\"orientation\":\"south\",\"building\":\"Building B\",\"price\":5250000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"updated_at\":\"2026-06-21 09:49:03\",\"created_at\":\"2026-06-21 09:49:03\"}', '2026-06-21 06:49:03', '2026-06-21 06:49:03'),
('ff646c6b-eda1-466c-a037-9ecda778c7b1', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/broker\\/dashboard\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426963391\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:49:25', '2026-06-14 05:49:25'),
('ffa3f25f-e2dd-4808-bba8-8826ed446821', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'DATA_ACCESS', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'Desktop', 'Chrome', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"role\":\"admin\",\"tier_level\":99,\"method\":\"GET\",\"endpoint\":\"api\\/v1\\/sales\\/company\\/payout-requests\",\"route_params\":[],\"query_params\":{\"_t\":\"1781426130915\"},\"user_agent\":\"Mozilla\\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\\/537.36 (KHTML, like Gecko) Chrome\\/148.0.0.0 Safari\\/537.36\"}', NULL, NULL, '2026-06-14 05:35:31', '2026-06-14 05:35:31'),
('ffacae1c-59e0-4686-9988-99ae6356b2b5', NULL, 'UNIT_CREATED', NULL, NULL, '127.0.0.1', 'Symfony', 'Desktop', 'Unknown', '{\"lat\":30.0444,\"lng\":31.2357,\"city\":\"Cairo\",\"country\":\"Egypt\"}', NULL, '{\"entity_type\":\"App\\\\Models\\\\Unit\",\"entity_id\":\"2e83c120-0645-4591-988b-2938fedb6f47\"}', NULL, '{\"id\":\"2e83c120-0645-4591-988b-2938fedb6f47\",\"project_id\":\"623f1780-4ed7-4db4-a558-2e65e5238431\",\"building_id\":\"cab546d7-31d7-42a1-af46-7611e2c4c430\",\"floor_id\":\"ffbce676-338e-46e7-bd99-a82f0ec4501b\",\"unit_number\":\"CRA-102\",\"floor\":1,\"type\":\"apartment\",\"area\":165,\"net_area\":153,\"finishing_type\":\"fully_finished\",\"bedrooms\":3,\"bathrooms\":2,\"living_rooms\":2,\"kitchen_count\":1,\"balcony_count\":2,\"balcony_area\":10,\"has_maid_room\":false,\"has_storage\":true,\"has_private_garden\":false,\"has_private_parking\":true,\"view_type\":\"creek\",\"orientation\":\"north\",\"building\":\"Creek Residence A\",\"price\":4690000,\"status\":\"available\",\"phase\":\"Phase 1\",\"handover_status\":\"pending\",\"layout_description\":\"Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.\",\"updated_at\":\"2026-06-21 09:51:22\",\"created_at\":\"2026-06-21 09:51:22\"}', '2026-06-21 06:51:22', '2026-06-21 06:51:22');

-- --------------------------------------------------------

--
-- Table structure for table `boq_items`
--

CREATE TABLE `boq_items` (
  `id` char(36) NOT NULL,
  `phase_id` char(36) NOT NULL,
  `item_code` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `planned_quantity` decimal(15,2) NOT NULL,
  `actual_quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `unit_price` decimal(15,2) NOT NULL,
  `total_price` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  `company_id` char(36) NOT NULL,
  `country_id` char(36) DEFAULT NULL,
  `region_id` char(36) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `manager_id` char(36) DEFAULT NULL,
  `latitude` varchar(20) DEFAULT NULL,
  `longitude` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `code`, `company_id`, `country_id`, `region_id`, `address`, `city`, `phone`, `email`, `manager_id`, `latitude`, `longitude`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('327a4ec5-8b24-4913-bf44-b8268b1e4518', 'New Cairo HQ Branch', 'BR-NC', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', 'c319385f-c790-4288-b1c8-810e248edbbd', 'd68587ee-b316-4f60-9bbe-be1cb122bb0d', 'North 90th Street', 'New Cairo', '+20100200300', 'branch.nc@redp.com', NULL, NULL, NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `brokers`
--

CREATE TABLE `brokers` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `agency_name` varchar(255) NOT NULL,
  `agent_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `license_no` varchar(50) DEFAULT NULL,
  `status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
  `referral_code` varchar(32) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brokers`
--

INSERT INTO `brokers` (`id`, `tenant_id`, `user_id`, `agency_name`, `agent_name`, `email`, `phone`, `license_no`, `status`, `referral_code`, `created_at`, `updated_at`, `deleted_at`) VALUES
('a1ff33da-713e-4b3e-88c6-df06c3b1b24a', NULL, 'd577b47e-9a96-40e1-a6b0-0f298daeaba0', 'RE/MAX Real Estate Brokerage', 'John Owner', 'broker_owner@redp.com', '+201005555577', 'LIC-99001', 'active', 'REMAXOWN', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-7354-4bdf-b1aa-7b8e14e15692', NULL, '2277599e-6e5b-4be2-bfdc-55e6bfee4ea2', 'RE/MAX Real Estate Brokerage', 'Hany Leader', 'broker_team_leader@redp.com', '+201005555578', 'LIC-99002', 'active', 'REMAXLEAD', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-7418-4a4e-a2de-8433f35bc7b9', NULL, 'c28da1ab-30f8-4250-b8b2-98b76b646de1', 'RE/MAX Real Estate Brokerage', 'Ahmed Agent', 'broker@redp.com', '+201005555555', 'LIC-88291', 'active', 'REMAX2026', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-7524-46ca-9bd4-6883a231e061', NULL, '3f01955c-1764-4cb3-951e-fd540a0bc506', 'Freelance Brokerage', 'Youssef Freelancer', 'freelance_broker@redp.com', '+201005555579', 'LIC-77766', 'active', 'FREE2026', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-75c7-45d7-acff-d67e401d27da', NULL, NULL, 'Coldwell Banker', 'Omar Hassan', 'coldwell@redp.com', '+201101234567', 'LIC-99381', 'active', 'COLD2026', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `account_id` char(36) NOT NULL,
  `fiscal_year` int(11) NOT NULL,
  `period` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `spent_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','closed') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `buildings`
--

CREATE TABLE `buildings` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_ar` varchar(255) DEFAULT NULL,
  `type` enum('apartment_building','villa','duplex_building','townhouse','commercial','mixed_use') NOT NULL DEFAULT 'apartment_building',
  `total_floors` int(11) NOT NULL DEFAULT 1,
  `has_basement` tinyint(1) NOT NULL DEFAULT 0,
  `basement_floors` int(11) NOT NULL DEFAULT 0,
  `has_roof_floor` tinyint(1) NOT NULL DEFAULT 0,
  `has_elevator` tinyint(1) NOT NULL DEFAULT 0,
  `elevator_count` int(11) NOT NULL DEFAULT 0,
  `staircase_count` int(11) NOT NULL DEFAULT 1,
  `building_footprint_area` decimal(12,2) DEFAULT NULL,
  `total_built_area` decimal(12,2) DEFAULT NULL,
  `lobby_area` decimal(10,2) DEFAULT NULL,
  `common_area_per_floor` decimal(10,2) DEFAULT NULL,
  `parking_type` enum('none','basement','ground','multi_level','outdoor') NOT NULL DEFAULT 'none',
  `parking_capacity` int(11) NOT NULL DEFAULT 0,
  `status` enum('planned','under_construction','completed') NOT NULL DEFAULT 'planned',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `buildings`
--

INSERT INTO `buildings` (`id`, `project_id`, `name`, `name_ar`, `type`, `total_floors`, `has_basement`, `basement_floors`, `has_roof_floor`, `has_elevator`, `elevator_count`, `staircase_count`, `building_footprint_area`, `total_built_area`, `lobby_area`, `common_area_per_floor`, `parking_type`, `parking_capacity`, `status`, `sort_order`, `notes`, `created_at`, `updated_at`) VALUES
('02881ad3-f92c-46fc-86eb-d5a4a5333489', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Creek Residence B', 'مبنى قنال ب', 'apartment_building', 5, 1, 1, 1, 1, 1, 2, 1200.00, 7200.00, 80.00, 150.00, 'basement', 30, 'under_construction', 2, 'Central waterfront building facing the main canal walkways with integrated ground-floor lobbies.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Lagoon Pavilion C', 'جناح البحيرة ج', 'duplex_building', 3, 0, 0, 1, 0, 0, 1, 800.00, 2400.00, 40.00, 80.00, 'outdoor', 12, 'planned', 3, 'Premium duplex blocks arranged in the circular East Lagoon zone, centered around the main concentric lake.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('b8c257e5-69b2-453c-85e3-05f491ae56e0', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Clubhouse Pavilion E', 'جناح النادي والخدمات هـ', 'mixed_use', 2, 0, 0, 0, 1, 1, 2, 1500.00, 3000.00, 100.00, 200.00, 'outdoor', 40, 'completed', 5, 'The compound Clubhouse and commercial retail strip located in the entry pavilion at the top right of the master plan.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('cab546d7-31d7-42a1-af46-7611e2c4c430', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Creek Residence A', 'مبنى قنال أ', 'apartment_building', 5, 1, 1, 1, 1, 1, 2, 1200.00, 7200.00, 80.00, 150.00, 'basement', 30, 'under_construction', 1, 'Situated along the curved central creek, offering stunning direct waterfront views and premium promenade access.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('ecbf54eb-f203-401f-83a2-25b7fd3a0db9', '623f1780-4ed7-4db4-a558-2e65e5238431', 'West Townhouse Block D', 'تاون هاوس غرب د', 'townhouse', 2, 0, 0, 1, 0, 0, 1, 600.00, 1200.00, 0.00, 0.00, 'ground', 8, 'planned', 4, 'Linear row townhouses located in the quiet west boundary with private green backyards.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('fd85cbce-1008-46f2-a51b-b27844f967c5', 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', 'TEST', 'TEST', 'apartment_building', 5, 1, 1, 1, 1, 1, 3, 10.00, 10.00, 10.00, 10.00, 'basement', 20, 'planned', 1, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:22');

-- --------------------------------------------------------

--
-- Table structure for table `building_floors`
--

CREATE TABLE `building_floors` (
  `id` char(36) NOT NULL,
  `building_id` char(36) NOT NULL,
  `floor_number` int(11) NOT NULL,
  `floor_label` varchar(255) DEFAULT NULL,
  `floor_type` enum('basement','ground','mezzanine','typical','roof','penthouse') NOT NULL DEFAULT 'typical',
  `gross_area` decimal(10,2) DEFAULT NULL,
  `common_area` decimal(10,2) DEFAULT NULL,
  `net_usable_area` decimal(10,2) DEFAULT NULL,
  `units_count` int(11) NOT NULL DEFAULT 0,
  `ceiling_height` decimal(4,2) NOT NULL DEFAULT 2.80,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `building_floors`
--

INSERT INTO `building_floors` (`id`, `building_id`, `floor_number`, `floor_label`, `floor_type`, `gross_area`, `common_area`, `net_usable_area`, `units_count`, `ceiling_height`, `notes`, `created_at`, `updated_at`) VALUES
('13270b89-cb08-44d9-b892-d3adc7ff1ff8', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 2, 'الدور الثاني', 'typical', 1200.00, 150.00, 1050.00, 3, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('176d9d3a-0aff-4517-80d2-0b0aae5ffae4', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', 1, 'الدور الأول', 'typical', 800.00, 80.00, 720.00, 2, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('28ecd3a4-cac8-40f6-9c77-a7a5543908f4', 'fd85cbce-1008-46f2-a51b-b27844f967c5', 4, 'الدور الرابع', 'typical', 10.00, 10.00, NULL, 0, 2.80, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:22'),
('4a53322c-d2fc-464c-997c-e7cb9c14a262', 'ecbf54eb-f203-401f-83a2-25b7fd3a0db9', 0, 'الدور الأرضي', 'ground', 600.00, 0.00, 600.00, 2, 3.20, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('54ae803d-f338-41c9-a00c-edeed5fead23', 'fd85cbce-1008-46f2-a51b-b27844f967c5', 1, 'الدور الأول', 'typical', 10.00, 10.00, NULL, 0, 2.80, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:22'),
('5b9c5a04-f876-438f-aa63-abfe1744c2e9', 'fd85cbce-1008-46f2-a51b-b27844f967c5', 5, 'السطح', 'roof', 10.00, NULL, NULL, 0, 0.00, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:22'),
('5cd0b0d0-e376-4c45-b39f-5f70be786605', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 4, 'الدور الرابع', 'penthouse', 1200.00, 150.00, 1050.00, 2, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('60edc1c1-378d-4f47-9bdb-abb9271a3f82', 'fd85cbce-1008-46f2-a51b-b27844f967c5', 0, 'الدور الأرضي', 'ground', 10.00, 10.00, NULL, 4, 3.20, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:44'),
('661ccd66-7784-4a17-97c6-f96abddde7aa', 'fd85cbce-1008-46f2-a51b-b27844f967c5', 2, 'الدور الثاني', 'typical', 10.00, 10.00, NULL, 0, 2.80, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:22'),
('66811d50-0cf3-46b5-b55e-e233c0cb5f69', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 0, 'الدور الأرضي', 'ground', 1200.00, 150.00, 1050.00, 3, 3.20, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('668a2039-8201-445c-b717-fd7d4b561955', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 3, 'الدور الثالث', 'typical', 1200.00, 150.00, 1050.00, 3, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('69973069-2741-47ff-87cd-87df4d15e53f', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 2, 'الدور الثاني', 'typical', 1200.00, 150.00, 1050.00, 3, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('6be51f66-d328-4339-ba39-b35903e9f197', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 4, 'الدور الرابع', 'penthouse', 1200.00, 150.00, 1050.00, 2, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('9847b683-b9dd-4c7f-9c3c-405a76996fcd', 'b8c257e5-69b2-453c-85e3-05f491ae56e0', 0, 'الدور الأرضي', 'ground', 1500.00, 200.00, 1300.00, 2, 3.20, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('a994e9f7-a97f-4ebf-a638-15cc9f343729', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 3, 'الدور الثالث', 'typical', 1200.00, 150.00, 1050.00, 3, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('af1d3873-1486-4715-8952-417df54c9987', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 0, 'الدور الأرضي', 'ground', 1200.00, 150.00, 1050.00, 3, 3.20, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('b43367ab-edc6-4d10-97f8-a6cbf5028bab', 'fd85cbce-1008-46f2-a51b-b27844f967c5', 3, 'الدور الثالث', 'typical', 10.00, 10.00, NULL, 0, 2.80, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:22'),
('c09cb47b-8ad2-4447-a392-7d59c3e32a98', 'b8c257e5-69b2-453c-85e3-05f491ae56e0', 1, 'الدور الأول', 'typical', 1500.00, 200.00, 1300.00, 2, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('d27a1c7c-20aa-4ef4-b3ea-277107934d0c', 'fd85cbce-1008-46f2-a51b-b27844f967c5', -1, 'بدروم 1', 'basement', 10.00, NULL, NULL, 0, 3.00, NULL, '2026-06-17 04:43:22', '2026-06-17 04:43:22'),
('d7ee4704-73dd-4e8c-b0f7-984dace9fc62', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 1, 'الدور الأول', 'typical', 1200.00, 150.00, 1050.00, 3, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('d9acd2a6-63dd-4509-b12d-212976f6cb88', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', 0, 'الدور الأرضي', 'ground', 800.00, 80.00, 720.00, 2, 3.20, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('fa582a2b-0ffb-49cb-8536-32db03a4db8e', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', 2, 'الدور الثاني', 'penthouse', 800.00, 80.00, 720.00, 2, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('fd28dcef-95f8-44a7-82f3-ddd7ab9ae953', 'ecbf54eb-f203-401f-83a2-25b7fd3a0db9', 1, 'الدور الأول', 'penthouse', 600.00, 0.00, 600.00, 2, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('ffbce676-338e-46e7-bd99-a82f0ec4501b', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 1, 'الدور الأول', 'typical', 1200.00, 150.00, 1050.00, 3, 2.80, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `call_logs`
--

CREATE TABLE `call_logs` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `call_sid` varchar(255) NOT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `duration_seconds` int(11) NOT NULL DEFAULT 0,
  `recording_url` varchar(512) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `call_logs`
--

INSERT INTO `call_logs` (`id`, `lead_id`, `call_sid`, `direction`, `duration_seconds`, `recording_url`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('986a49c9-f0fa-4597-a911-c54efe87d67d', 'a1ff33da-76fc-491e-9ae4-1b55ca1a5e42', 'CAAYOV5orTdX0f3HPSsMHdVbccntQ6vRCZ', 'outbound', 184, 'https://s3.amazonaws.com/redp-voip/recordings/call_184s.mp3', 'completed', '2026-06-11 07:43:07', '2026-06-11 07:43:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `source` enum('facebook','google','tiktok','direct','referral') NOT NULL,
  `utm_source` varchar(255) DEFAULT NULL,
  `utm_medium` varchar(255) DEFAULT NULL,
  `utm_campaign` varchar(255) DEFAULT NULL,
  `budget` decimal(10,2) NOT NULL DEFAULT 0.00,
  `leads_count` int(11) NOT NULL DEFAULT 0,
  `roi_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaigns`
--

INSERT INTO `campaigns` (`id`, `name`, `source`, `utm_source`, `utm_medium`, `utm_campaign`, `budget`, `leads_count`, `roi_percentage`, `created_at`, `updated_at`, `deleted_at`) VALUES
('a1ff33da-6cb8-43c1-887d-fc853753ba84', 'Q2 Luxury Penthouses FB Ads', 'facebook', 'facebook_ads', 'cpc', 'luxury_penthouses_2026', 45000.00, 320, 320.00, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-7048-4675-ac18-54f2de6448bc', 'New Administrative Capital Search', 'google', 'google_search', 'cpc', 'admin_capital_commercial', 75000.00, 540, 480.00, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cancellations`
--

CREATE TABLE `cancellations` (
  `id` char(36) NOT NULL,
  `contract_id` char(36) NOT NULL,
  `refund_amount` decimal(15,2) NOT NULL,
  `penalty_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `capa_actions`
--

CREATE TABLE `capa_actions` (
  `id` char(36) NOT NULL,
  `ncr_id` char(36) NOT NULL,
  `action_plan` text NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('pending','implemented','verified') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chart_of_accounts`
--

CREATE TABLE `chart_of_accounts` (
  `id` char(36) NOT NULL,
  `company_id` char(36) DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('asset','liability','equity','revenue','expense') NOT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `is_reconciled` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chart_of_accounts`
--

INSERT INTO `chart_of_accounts` (`id`, `company_id`, `code`, `name`, `type`, `parent_id`, `is_reconciled`, `status`, `created_at`, `updated_at`) VALUES
('a1ff414a-931c-4a59-bcde-00129897cfb3', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '11000', 'Cash & Bank Gateway', 'asset', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9655-4d2c-a69b-535c50f4accf', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '12000', 'Accounts Receivable', 'asset', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9845-4a17-8572-20958721d432', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '13000', 'Inventory - Units Under Construction', 'asset', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-991e-471d-b49d-2f1e49c5054a', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '21000', 'Accounts Payable', 'liability', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-99f3-4a22-b175-cb8df9e0520f', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '22000', 'Unearned Deferred Revenue', 'liability', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9ac1-4e69-9114-c88b34db7db6', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '31000', 'Paid-in Capital', 'equity', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9ba7-401e-b685-9133e13d26d0', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '32000', 'Retained Earnings', 'equity', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9c6f-4737-851a-cf2ec12fb9b3', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '41000', 'Realized Real Estate Revenue', 'revenue', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9d46-43f3-9b72-7a813a732b26', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '42000', 'Cancellation & Penalty Revenue', 'revenue', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9e1a-4862-914d-8fef34e5ad7d', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '51000', 'Cost of Goods Sold (COGS)', 'expense', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9eea-43c6-a6ec-ed659c59e9d9', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '52000', 'Marketing & Broker Commission Expense', 'expense', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41'),
('a1ff414a-9fbf-48ef-95d2-ee6b2a211f3b', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '53000', 'Administrative Expense', 'expense', NULL, 0, 'active', '2026-06-11 08:20:41', '2026-06-11 08:20:41');

-- --------------------------------------------------------

--
-- Table structure for table `client_journey_logs`
--

CREATE TABLE `client_journey_logs` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `stage` enum('lead_created','tele_sales_contact','meeting_scheduled','transferred_to_broker','broker_presentation','escalated_to_sales','booking_initiated','transaction_complete') NOT NULL,
  `actor_user_id` char(36) NOT NULL,
  `actor_role` varchar(50) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client_journey_logs`
--

INSERT INTO `client_journey_logs` (`id`, `lead_id`, `stage`, `actor_user_id`, `actor_role`, `metadata`, `created_at`) VALUES
('6317cc7d-4691-4fed-81f1-90119089f3c7', 'a1ff33da-76fc-491e-9ae4-1b55ca1a5e42', 'booking_initiated', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'admin', '{\"unit_id\":\"961e4c37-d65e-4516-ac27-6a01e240b679\",\"reservation_id\":\"11fe74b8-9950-4c22-9460-7f684eac2d98\",\"eoi_amount\":50000,\"holding_days\":7}', '2026-06-14 05:39:00'),
('ab2efcd1-54f9-4dfc-b7f1-bf220a39f2c9', 'a1ff33da-84eb-45f3-8cf8-4bc64f560332', 'escalated_to_sales', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'admin', '{\"from_tier\":\"tier_1\",\"to_tier\":\"tier_3\",\"notes\":null}', '2026-06-14 05:48:49');

-- --------------------------------------------------------

--
-- Table structure for table `client_presentations`
--

CREATE TABLE `client_presentations` (
  `id` char(36) NOT NULL,
  `broker_user_id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `unit_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`unit_ids`)),
  `presentation_notes` text DEFAULT NULL,
  `outcome` enum('pending','interested','declined','escalated_to_sales') NOT NULL DEFAULT 'pending',
  `escalated_to_user_id` char(36) DEFAULT NULL,
  `presented_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `collections_queue`
--

CREATE TABLE `collections_queue` (
  `id` char(36) NOT NULL,
  `contract_id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `aging_bucket` varchar(255) NOT NULL,
  `outstanding_amount` decimal(15,2) NOT NULL,
  `promise_to_pay_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `collections_queue`
--

INSERT INTO `collections_queue` (`id`, `contract_id`, `client_id`, `aging_bucket`, `outstanding_amount`, `promise_to_pay_date`, `status`, `notes`, `created_at`, `updated_at`) VALUES
('53fd6ad4-e6a9-498b-94ce-87f296e05bd7', '14778e06-822f-42e9-bdfc-858f68b4ef0a', 'a79c826c-e7d8-477d-951e-5f737b5f264d', '60_days', 354687.50, NULL, 'active', 'Payment overdue. Automated SMS notification and phone outreach launched.', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('6f5b0334-9401-4883-95c0-f351207f7cfd', '61259272-f613-4338-aaf0-714a3e1754cd', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', '30_days', 250000.00, '2026-06-21', 'promised', 'Customer requested a short extension due to transaction delays.', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `commissions`
--

CREATE TABLE `commissions` (
  `id` char(36) NOT NULL,
  `broker_id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `unit_id` char(36) DEFAULT NULL COMMENT 'Loose-link to Finance domain units table — no foreign key',
  `rate_percent` decimal(4,2) NOT NULL DEFAULT 0.00,
  `gross_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','approved','paid') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commissions`
--

INSERT INTO `commissions` (`id`, `broker_id`, `lead_id`, `unit_id`, `rate_percent`, `gross_amount`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('11bad83c-c7ef-4e9e-a7c7-5976d217c907', 'a1ff33da-7524-46ca-9bd4-6883a231e061', 'a1ff33da-801b-4b58-a249-a1e547cb6455', '961e4c37-d65e-4516-ac27-6a01e240b679', 3.50, 217000.00, 'approved', '2026-06-11 07:43:07', '2026-06-11 07:43:07', NULL),
('a1ff33da-a9ae-4bc5-bc70-d6650ef98b1a', 'a1ff33da-7418-4a4e-a2de-8433f35bc7b9', 'a1ff33da-801b-4b58-a249-a1e547cb6455', 'da06d389-2d30-4a57-b5f0-ab28b289ae19', 2.50, 222500.00, 'pending', '2026-06-11 07:43:07', '2026-06-11 07:43:07', NULL),
('a1ff33da-ab56-4518-94b9-9b07d1014731', 'a1ff33da-75c7-45d7-acff-d67e401d27da', 'a1ff33da-81e5-4d98-a14b-a0f0b68a778c', '52501a91-21e6-46b0-bd5b-304e93171d0b', 3.00, 135000.00, 'approved', '2026-06-11 07:43:07', '2026-06-11 07:43:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `commission_calculations`
--

CREATE TABLE `commission_calculations` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `payment_id` char(36) NOT NULL,
  `contract_id` char(36) NOT NULL,
  `rule_id` char(36) NOT NULL,
  `payout_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `broker_id` char(36) DEFAULT NULL,
  `deal_amount` decimal(15,2) NOT NULL,
  `calculated_percentage` decimal(5,2) NOT NULL,
  `calculated_amount` decimal(15,2) NOT NULL,
  `status` enum('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commission_calculations`
--

INSERT INTO `commission_calculations` (`id`, `company_id`, `payment_id`, `contract_id`, `rule_id`, `payout_id`, `user_id`, `broker_id`, `deal_amount`, `calculated_percentage`, `calculated_amount`, `status`, `created_at`, `updated_at`) VALUES
('1697f93d-c29a-427d-a732-0d624cfcf8b2', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '0d39a756-1095-4623-85d7-735bf328bac8', '14778e06-822f-42e9-bdfc-858f68b4ef0a', '1464926e-169a-48e0-90b7-6141fef51a07', NULL, 'aa5e20f9-2c85-45c2-88f3-007073d5474e', NULL, 8900000.00, 0.20, 17800.00, 'pending', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('417df14d-b073-4ac3-89b5-0e2309f4c1f4', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '0d39a756-1095-4623-85d7-735bf328bac8', '14778e06-822f-42e9-bdfc-858f68b4ef0a', '553c9fba-b196-4521-8266-248246876cb3', NULL, '58ca5eb2-3238-49e9-9d6e-aa05be4cc297', NULL, 8900000.00, 1.50, 133500.00, 'approved', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('70b815b6-ff28-4aeb-bec7-5fca2a2cd91f', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '0d39a756-1095-4623-85d7-735bf328bac8', '14778e06-822f-42e9-bdfc-858f68b4ef0a', '1464926e-169a-48e0-90b7-6141fef51a07', NULL, '0963fcbd-ab27-4a17-8a7c-7b915202c400', NULL, 8900000.00, 0.10, 8900.00, 'approved', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('928bcc8a-ebfa-40b2-86b0-74377e792937', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '221235d5-b74f-4c4a-ab61-905a8b965107', '61259272-f613-4338-aaf0-714a3e1754cd', '553c9fba-b196-4521-8266-248246876cb3', NULL, '42bb96f2-c7b9-453b-8410-c235dc409d21', NULL, 4500000.00, 0.50, 22500.00, 'paid', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('dcf6a14e-a463-421c-861c-81be0ba5a9cb', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '221235d5-b74f-4c4a-ab61-905a8b965107', '61259272-f613-4338-aaf0-714a3e1754cd', '1464926e-169a-48e0-90b7-6141fef51a07', NULL, '43209f55-b7a8-411a-a789-a81d697b741d', NULL, 4500000.00, 0.50, 22500.00, 'approved', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `commission_payouts`
--

CREATE TABLE `commission_payouts` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `payout_number` varchar(255) NOT NULL,
  `recipient_type` enum('user','broker') NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `broker_id` char(36) DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('pending_approval','approved','rejected','paid') NOT NULL DEFAULT 'pending_approval',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commission_payout_requests`
--

CREATE TABLE `commission_payout_requests` (
  `id` char(36) NOT NULL,
  `broker_id` char(36) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `invoice_path` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending_review',
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commission_rules`
--

CREATE TABLE `commission_rules` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `project_id` char(36) DEFAULT NULL,
  `unit_type` varchar(255) DEFAULT NULL,
  `tier_type` enum('tier_1','tier_2','tier_3','broker','sales_agent','manager','director') NOT NULL,
  `min_deal_size` decimal(15,2) NOT NULL DEFAULT 0.00,
  `max_deal_size` decimal(15,2) NOT NULL DEFAULT 999999999.00,
  `commission_percentage` decimal(5,2) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commission_rules`
--

INSERT INTO `commission_rules` (`id`, `tenant_id`, `company_id`, `title`, `project_id`, `unit_type`, `tier_type`, `min_deal_size`, `max_deal_size`, `commission_percentage`, `status`, `created_at`, `updated_at`) VALUES
('0cd88ce7-529d-4069-b8d4-ed7e1ec4486c', NULL, '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', 'Broker Standard Commission Rule', NULL, NULL, 'tier_2', 0.00, 999999999.00, 2.50, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('1464926e-169a-48e0-90b7-6141fef51a07', NULL, '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', 'TeleSales Standard Commission Rule', NULL, NULL, 'tier_1', 0.00, 999999999.00, 0.50, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('553c9fba-b196-4521-8266-248246876cb3', NULL, '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', 'Company Sales Standard Commission Rule', NULL, NULL, 'tier_3', 0.00, 999999999.00, 1.50, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `communication_channels`
--

CREATE TABLE `communication_channels` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('whatsapp','sms','email','facebook','telegram') NOT NULL DEFAULT 'sms',
  `provider` varchar(50) NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `status` enum('active','inactive','error') NOT NULL DEFAULT 'active',
  `company_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `legal_name` varchar(255) DEFAULT NULL,
  `registration_number` varchar(255) DEFAULT NULL,
  `tax_id` varchar(255) DEFAULT NULL,
  `type` enum('holding','subsidiary','branch_company') NOT NULL DEFAULT 'subsidiary',
  `parent_company_id` char(36) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country_id` char(36) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `tenant_id`, `name`, `legal_name`, `registration_number`, `tax_id`, `type`, `parent_company_id`, `logo_url`, `address`, `city`, `country_id`, `phone`, `email`, `website`, `status`, `settings`, `created_at`, `updated_at`, `deleted_at`) VALUES
('029daefc-0a0e-4a51-9185-073650011517', NULL, 'RE/MAX Real Estate Brokerage', 'RE/MAX SAE', 'REG-999999', 'TAX-999999', 'subsidiary', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, 'Zamalek', 'Cairo', 'c319385f-c790-4288-b1c8-810e248edbbd', '+20288887777', 'remax@redp-broker.com', NULL, 'active', NULL, '2026-06-11 07:43:00', '2026-06-11 07:43:00', NULL),
('5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, 'REDP Holding', 'REDP Holding SAE', 'REG-111111', 'TAX-222222', 'holding', NULL, NULL, 'Corporate Hub, Smart Village', 'Giza', 'c319385f-c790-4288-b1c8-810e248edbbd', '+20235391000', 'corporate@redp.com', 'https://redp.com', 'active', '[]', '2026-06-11 07:42:59', '2026-06-11 07:42:59', NULL),
('a9645afb-fbd9-4108-aded-a5efac694f76', NULL, 'REDP Development', 'REDP Real Estate Development SAE', 'REG-333333', 'TAX-444444', 'subsidiary', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, 'Cairo Festival City Business Park', 'Cairo', 'c319385f-c790-4288-b1c8-810e248edbbd', '+2022345678', 'dev@redp.com', 'https://dev.redp.com', 'active', '[]', '2026-06-11 07:42:59', '2026-06-11 07:42:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `company_groups`
--

CREATE TABLE `company_groups` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_group_id` char(36) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_groups`
--

INSERT INTO `company_groups` (`id`, `name`, `description`, `parent_group_id`, `status`, `created_at`, `updated_at`) VALUES
('0a98c6b7-a977-40da-bdf0-d524f6175ad4', 'REDP Holding Group', 'Real Estate Digital Platform Holding Group', NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59');

-- --------------------------------------------------------

--
-- Table structure for table `company_group_members`
--

CREATE TABLE `company_group_members` (
  `id` char(36) NOT NULL,
  `company_group_id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `construction_milestones`
--

CREATE TABLE `construction_milestones` (
  `id` char(36) NOT NULL,
  `phase_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `progress_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','delayed','completed') NOT NULL DEFAULT 'pending',
  `due_date` date NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

CREATE TABLE `contracts` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `contract_number` varchar(255) NOT NULL,
  `reservation_id` char(36) DEFAULT NULL,
  `unit_id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `type` varchar(255) NOT NULL DEFAULT 'installment',
  `document_path` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `signed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `withdrawal_status` varchar(255) NOT NULL DEFAULT 'none'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `tenant_id`, `contract_number`, `reservation_id`, `unit_id`, `client_id`, `total_amount`, `paid_amount`, `type`, `document_path`, `status`, `notes`, `signed_at`, `created_at`, `updated_at`, `withdrawal_status`) VALUES
('0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', NULL, 'REDP-CTR-2026-0008', '11fe74b8-9950-4c22-9460-7f684eac2d98', '961e4c37-d65e-4516-ac27-6a01e240b679', '3d4270b4-ae06-4aae-bb84-04c294e5c038', 6200000.00, 50000.00, 'installment', NULL, 'draft', 'Auto-generated from reservation confirmation.', NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00', 'none'),
('14778e06-822f-42e9-bdfc-858f68b4ef0a', NULL, 'REDP-CTR-2026-0002', NULL, 'da06d389-2d30-4a57-b5f0-ab28b289ae19', 'a79c826c-e7d8-477d-951e-5f737b5f264d', 8900000.00, 387500.00, 'installment', NULL, 'active', 'Restructured property contract.', '2026-04-11 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07', 'none'),
('38396c28-eeaa-4c46-957a-08c102f463ec', NULL, 'REDP-CTR-2026-0007', '11fe74b8-9950-4c22-9460-7f684eac2d98', '961e4c37-d65e-4516-ac27-6a01e240b679', '3d4270b4-ae06-4aae-bb84-04c294e5c038', 6200000.00, 50000.00, 'installment', NULL, 'draft', 'Auto-generated from reservation confirmation.', NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00', 'none'),
('61259272-f613-4338-aaf0-714a3e1754cd', NULL, 'REDP-CTR-2026-0001', NULL, '52501a91-21e6-46b0-bd5b-304e93171d0b', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 4500000.00, 1500000.00, 'installment', NULL, 'active', 'Primary residence installment contract.', '2026-03-11 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07', 'none'),
('702aa6a2-829a-41cd-ac08-f3399959bd16', NULL, 'REDP-CTR-2026-0004', NULL, '52501a91-21e6-46b0-bd5b-304e93171d0b', 'a79c826c-e7d8-477d-951e-5f737b5f264d', 2980000.00, 50000.00, 'installment', NULL, 'pending_signature', 'Awaiting client digital signature.', NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07', 'none'),
('94a19816-6f6a-415b-8c2d-042eae7a298d', NULL, 'REDP-CTR-2026-0005', 'f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e', '24508d2a-c9a0-41ea-8423-b2ca1d247865', 'a9250aee-0119-4a17-a237-259e4fe83abb', 5000000.00, 50000.00, 'installment', NULL, 'draft', 'Auto-generated from reservation confirmation.', NULL, '2026-06-14 05:36:04', '2026-06-14 05:36:04', 'none'),
('cf8a4ad3-b09f-4428-83c5-5b260b5a744d', NULL, 'REDP-CTR-2026-0003', NULL, '961e4c37-d65e-4516-ac27-6a01e240b679', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 6800000.00, 6800000.00, 'sale', NULL, 'completed', 'Cash sale contract - fully completed.', '2025-12-11 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07', 'none'),
('d34f7657-5152-4430-946e-9a594854ba44', NULL, 'REDP-CTR-2026-0006', 'f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e', '24508d2a-c9a0-41ea-8423-b2ca1d247865', 'a9250aee-0119-4a17-a237-259e4fe83abb', 5000000.00, 50000.00, 'installment', NULL, 'draft', 'Auto-generated from reservation confirmation.', NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05', 'none');

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `channel_id` char(36) NOT NULL,
  `lead_id` char(36) DEFAULT NULL,
  `customer_phone` varchar(50) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `assigned_agent_id` char(36) DEFAULT NULL,
  `status` enum('open','pending','closed') NOT NULL DEFAULT 'open',
  `last_message_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cost_centers`
--

CREATE TABLE `cost_centers` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `court_sessions`
--

CREATE TABLE `court_sessions` (
  `id` char(36) NOT NULL,
  `case_id` char(36) NOT NULL,
  `session_date` datetime NOT NULL,
  `hall_number` varchar(255) DEFAULT NULL,
  `judge_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('scheduled','attended','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
  `postponed_to` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` char(36) NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_layouts`
--

CREATE TABLE `dashboard_layouts` (
  `id` char(36) NOT NULL,
  `role_type` varchar(255) NOT NULL,
  `widgets` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`widgets`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `defects_snags`
--

CREATE TABLE `defects_snags` (
  `id` char(36) NOT NULL,
  `unit_id` char(36) NOT NULL,
  `description` text NOT NULL,
  `severity` varchar(255) NOT NULL DEFAULT 'medium',
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `defects_snags`
--

INSERT INTO `defects_snags` (`id`, `unit_id`, `description`, `severity`, `status`, `created_at`, `updated_at`) VALUES
('b34b21e9-1800-44b8-90df-5ac53fe72c9b', 'da06d389-2d30-4a57-b5f0-ab28b289ae19', 'Wall plaster painting scratch in second bedroom.', 'low', 'resolved', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('d8adaa78-7a13-465d-a957-9f6cdef33232', '52501a91-21e6-46b0-bd5b-304e93171d0b', 'Living room power outlet on east column has no current flow.', 'high', 'pending', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `delegations`
--

CREATE TABLE `delegations` (
  `id` char(36) NOT NULL,
  `delegator_id` char(36) NOT NULL,
  `delegate_id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `type` enum('full','approval_only','view_only') NOT NULL DEFAULT 'full',
  `reason` text DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  `branch_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `parent_department_id` char(36) DEFAULT NULL,
  `head_id` char(36) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `code`, `branch_id`, `company_id`, `parent_department_id`, `head_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
('1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', 'Operations & Construction', 'DEP-OPS', '327a4ec5-8b24-4913-bf44-b8268b1e4518', 'a9645afb-fbd9-4108-aded-a5efac694f76', NULL, NULL, NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59'),
('65a99eb0-acc2-4153-bb85-99fe86200d27', 'Financial Operations Center', 'DEP-FI', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, NULL, NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59'),
('683c5080-ba34-4d70-8adc-3198e3de2b92', 'Commercial Sales Division', 'DEP-SL', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, NULL, NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59'),
('8614cb63-069a-4d87-a299-25f50f8e878c', 'Executive Board Office', 'DEP-EX', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, NULL, NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59'),
('ed671359-3bdf-4d38-b15d-0218ada62413', 'Legal Affairs', 'DEP-LEG', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, NULL, NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `ocr_content` longtext DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'indexed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_hierarchy`
--

CREATE TABLE `employee_hierarchy` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `branch_id` char(36) DEFAULT NULL,
  `department_id` char(36) DEFAULT NULL,
  `team_id` char(36) DEFAULT NULL,
  `position_id` char(36) DEFAULT NULL,
  `direct_manager_id` char(36) DEFAULT NULL,
  `indirect_manager_id` char(36) DEFAULT NULL,
  `matrix_manager_id` char(36) DEFAULT NULL,
  `employee_number` varchar(30) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `termination_date` date DEFAULT NULL,
  `status` enum('active','inactive','on_leave','terminated','probation') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_hierarchy`
--

INSERT INTO `employee_hierarchy` (`id`, `user_id`, `company_id`, `branch_id`, `department_id`, `team_id`, `position_id`, `direct_manager_id`, `indirect_manager_id`, `matrix_manager_id`, `employee_number`, `hire_date`, `termination_date`, `status`, `created_at`, `updated_at`) VALUES
('10a5f65c-e98f-4767-95df-2e98d2362220', '2a99bf51-533d-4db1-b3d7-77d3e86c5420', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, NULL, 'EMP-0003', '2023-05-10', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('1c102192-48cd-4ab4-86e8-ba7aed09de7f', '2277599e-6e5b-4be2-bfdc-55e6bfee4ea2', '029daefc-0a0e-4a51-9185-073650011517', NULL, NULL, NULL, '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', 'd577b47e-9a96-40e1-a6b0-0f298daeaba0', NULL, NULL, 'EMP-BR02', '2024-01-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('3cf72a0f-d922-44ae-b389-172139bb6870', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '65a99eb0-acc2-4153-bb85-99fe86200d27', NULL, '46ef4bc9-ac4d-4e7b-9127-7f01acfe535e', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, NULL, 'EMP-0006', '2023-04-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('4cec55e5-214f-4033-9af1-fa3cd9b3c074', '772173d6-8540-48be-94b2-ec6add839726', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', 'ed671359-3bdf-4d38-b15d-0218ada62413', NULL, '46ef4bc9-ac4d-4e7b-9127-7f01acfe535e', 'a9250aee-0119-4a17-a237-259e4fe83abb', NULL, NULL, 'EMP-0010', '2023-08-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('6b1db3a6-5bbe-4df4-a1dd-e870c25846c4', 'd577b47e-9a96-40e1-a6b0-0f298daeaba0', '029daefc-0a0e-4a51-9185-073650011517', NULL, NULL, NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', 'a9250aee-0119-4a17-a237-259e4fe83abb', NULL, NULL, 'EMP-BR01', '2024-01-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('6e7e81a3-d750-415a-bb8f-9e44bf199986', '79a050f1-eccd-4405-be25-114a05846a2a', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, NULL, 'EMP-0007', '2023-06-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('8a162d0b-f593-4d40-a6b6-c3eb4ab1f3a1', '3011029c-f330-4717-8317-d1eda62e0751', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', 'ed671359-3bdf-4d38-b15d-0218ada62413', NULL, '6181bb64-f7d2-46f6-a73f-c89d55a124d0', '772173d6-8540-48be-94b2-ec6add839726', 'a9250aee-0119-4a17-a237-259e4fe83abb', NULL, 'EMP-0011', '2024-04-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a5302b95-53cf-45e9-b2ef-99fa52a04633', 'a3938d5c-9265-4bb7-af85-035bcd4b973b', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', NULL, '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', '79a050f1-eccd-4405-be25-114a05846a2a', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, 'EMP-0009', '2023-09-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a839b95d-0327-4a42-a043-bf2cdb116353', '58ca5eb2-3238-49e9-9d6e-aa05be4cc297', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', '6679695c-6dcd-4edf-9b47-9ff27b42da4d', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', '42bb96f2-c7b9-453b-8410-c235dc409d21', '2a99bf51-533d-4db1-b3d7-77d3e86c5420', NULL, 'EMP-0015', '2024-01-10', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('b32811c2-4b2f-4a1e-b6fe-beee7c47f775', '43209f55-b7a8-411a-a789-a81d697b741d', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', 'a32dc8f7-defc-4d82-8d19-87ad724632af', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'aa5e20f9-2c85-45c2-88f3-007073d5474e', '0963fcbd-ab27-4a17-8a7c-7b915202c400', NULL, 'EMP-0005', '2024-03-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('c57f7728-df85-4e37-b2e2-08b4feebd2c7', 'aa5e20f9-2c85-45c2-88f3-007073d5474e', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', 'a32dc8f7-defc-4d82-8d19-87ad724632af', '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', '0963fcbd-ab27-4a17-8a7c-7b915202c400', '2a99bf51-533d-4db1-b3d7-77d3e86c5420', NULL, 'EMP-0013', '2024-03-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('cd21c437-9e2a-4f00-ae3b-f3b1b0afd7f9', '42bb96f2-c7b9-453b-8410-c235dc409d21', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', '6679695c-6dcd-4edf-9b47-9ff27b42da4d', '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', '2a99bf51-533d-4db1-b3d7-77d3e86c5420', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, 'EMP-0014', '2024-01-10', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('d0348cd8-0932-41ef-a0d7-b95962b1b753', 'd8824246-5965-47b1-a61f-cb5e844b5ab0', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', '2ab360c5-a3b2-416e-84e2-7a44502b5d13', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', '79a050f1-eccd-4405-be25-114a05846a2a', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, 'EMP-0008', '2024-02-15', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('d31478bd-c015-46e4-aaed-390cc59313d7', 'c28da1ab-30f8-4250-b8b2-98b76b646de1', '029daefc-0a0e-4a51-9185-073650011517', NULL, NULL, NULL, '6181bb64-f7d2-46f6-a73f-c89d55a124d0', '2277599e-6e5b-4be2-bfdc-55e6bfee4ea2', NULL, NULL, 'EMP-BR03', '2024-01-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('dad28f29-4363-4c63-bc12-4c8df2bdfad9', 'a9250aee-0119-4a17-a237-259e4fe83abb', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '8614cb63-069a-4d87-a299-25f50f8e878c', NULL, '47a8660f-f28d-4b3a-a3a2-898acc68287d', NULL, NULL, NULL, 'EMP-0001', '2023-01-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('e3608c1d-f6e0-4b21-8577-0004e6adfe6c', '0963fcbd-ab27-4a17-8a7c-7b915202c400', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', '2a99bf51-533d-4db1-b3d7-77d3e86c5420', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, 'EMP-0016', '2024-03-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('e7ffebcf-d803-4c17-aca1-5edccfb02e7f', '2c1843b9-b367-493d-a8c2-b6d208f55d39', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', '2ab360c5-a3b2-416e-84e2-7a44502b5d13', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', '79a050f1-eccd-4405-be25-114a05846a2a', '597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, 'EMP-0012', '2024-05-01', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('efa94a4f-f9f6-4474-b311-9689aaec2ac5', 'c9283383-625d-4fff-bb05-fff7447f4d89', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', '6679695c-6dcd-4edf-9b47-9ff27b42da4d', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', '42bb96f2-c7b9-453b-8410-c235dc409d21', '2a99bf51-533d-4db1-b3d7-77d3e86c5420', NULL, 'EMP-0004', '2024-01-10', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('f7f8755c-29d7-4495-a977-849e7664b443', '597fea87-4b92-4b52-bcca-c67a3c3e5625', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '8614cb63-069a-4d87-a299-25f50f8e878c', NULL, '5bd1ab62-797e-4206-986a-b68622e07955', 'a9250aee-0119-4a17-a237-259e4fe83abb', NULL, NULL, 'EMP-0002', '2023-02-15', NULL, 'active', '2026-06-11 07:43:06', '2026-06-11 07:43:06');

-- --------------------------------------------------------

--
-- Table structure for table `enterprise_countries`
--

CREATE TABLE `enterprise_countries` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(3) NOT NULL,
  `phone_code` varchar(10) DEFAULT NULL,
  `currency_code` varchar(3) DEFAULT NULL,
  `timezone` varchar(50) NOT NULL DEFAULT 'UTC',
  `flag_emoji` varchar(10) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enterprise_countries`
--

INSERT INTO `enterprise_countries` (`id`, `name`, `code`, `phone_code`, `currency_code`, `timezone`, `flag_emoji`, `status`, `created_at`, `updated_at`) VALUES
('c319385f-c790-4288-b1c8-810e248edbbd', 'Egypt', 'EG', '+20', 'EGP', 'Africa/Cairo', '🇪🇬', 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59');

-- --------------------------------------------------------

--
-- Table structure for table `enterprise_roles`
--

CREATE TABLE `enterprise_roles` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_role_id` char(36) DEFAULT NULL,
  `company_id` char(36) DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `level` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enterprise_roles`
--

INSERT INTO `enterprise_roles` (`id`, `name`, `display_name`, `description`, `parent_role_id`, `company_id`, `is_system`, `level`, `status`, `created_at`, `updated_at`) VALUES
('03ab1bb6-b6da-475d-8bd2-d1c891032914', 'tele_sales', 'Tele-Sales Rep', 'Outreach calling agent logs contacts and schedules meetings', NULL, NULL, 1, 1, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('0e7d515f-7828-498d-a59b-43b2a3ff445b', 'customer_service', 'Customer Service & Support', 'Handles resident service requests, logs tickets, and tracks compliance', NULL, NULL, 1, 2, 'active', '2026-06-16 08:35:24', '2026-06-16 08:35:24'),
('196af811-9d7d-4023-b00d-77c0d2c53d13', 'finance_officer', 'Financial Officer', 'Manages invoicing, collections, penalties, and bookkeeping ledger', NULL, NULL, 1, 3, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('51564f8d-ce5e-4081-a904-df55f9629a5c', 'accountant', 'Financial Accountant', 'Reviews contract billing and payment transactions', NULL, NULL, 1, 3, 'active', '2026-06-16 08:35:24', '2026-06-16 08:35:24'),
('586484db-a17f-499a-91ab-82f4ea5ad45b', 'delivery_engineer', 'Property Delivery Engineer', 'Handles unit inspections, handovers, and site punch-lists', NULL, NULL, 1, 2, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('72674634-79a8-4b74-a122-d2e59d59d0e5', 'homeowner', 'Homeowner / Client Portal', 'Homeowner portal access to review contracts and property status details', NULL, NULL, 1, 1, 'active', '2026-06-16 08:35:24', '2026-06-16 08:35:24'),
('964f5ce5-6fda-4b40-82e4-0be181c10904', 'sales_manager', 'Sales Manager', 'Oversees sales operations, pipelines, and allocations', NULL, NULL, 1, 4, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a72f6c85-0657-44dd-87d0-753d42daf271', 'admin', 'System Administrator', 'System administrator access to configure and manage settings', NULL, NULL, 1, 90, 'active', '2026-06-16 08:35:24', '2026-06-16 08:35:24'),
('c931593e-0abb-42f2-871a-517a32cec24e', 'super_admin', 'Super Administrator', 'Full administrative access bypasses all authorization checks', NULL, NULL, 1, 100, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', 'handover_team', 'Handover & QC Engineer', 'Conducts inspections, coordinates handovers, and tracks site defect lists', NULL, NULL, 1, 2, 'active', '2026-06-16 08:35:24', '2026-06-16 08:35:24'),
('d8708d76-aebd-4c8c-9c95-afc8a21447f0', 'sales_agent', 'Sales Agent', 'Manages assigned leads and customer relations', '964f5ce5-6fda-4b40-82e4-0be181c10904', NULL, 1, 2, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('d8d45eb0-95ea-4797-860f-d188a34d1c61', 'maintenance_manager', 'Facilities Operations Manager', 'Manages maintenance requests, contractors, and technician assignment', NULL, NULL, 1, 3, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'sales_team', 'Sales Team Representative', 'Manages lead records, reservations, and customer pipeline accounts', 'a72f6c85-0657-44dd-87d0-753d42daf271', NULL, 1, 2, 'active', '2026-06-16 08:35:24', '2026-06-16 08:35:24'),
('f2ff44b8-0327-4195-953f-2961fb06a4af', 'broker', 'External Real Estate Broker', 'External broker access to register leads and review compound plans', NULL, NULL, 1, 1, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('f5c3ea95-a458-4b8d-8b4e-e0323f26a175', 'handover_officer', 'Apartment Handover Officer', 'Coordinates unit inspections, manages handover timelines, and logs defects', NULL, NULL, 1, 2, 'active', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `eoi_queue`
--

CREATE TABLE `eoi_queue` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL COMMENT 'Loose-link to Finance domain projects table',
  `queue_number` int(11) DEFAULT NULL,
  `priority_score` decimal(16,6) NOT NULL COMMENT 'microtime(true) value for millisecond precision ordering',
  `status` enum('pending','confirmed','expired','cancelled') NOT NULL DEFAULT 'pending',
  `eoi_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `eoi_queue`
--

INSERT INTO `eoi_queue` (`id`, `lead_id`, `project_id`, `queue_number`, `priority_score`, `status`, `eoi_amount`, `notes`, `created_at`, `updated_at`, `deleted_at`) VALUES
('535a4c09-6d76-4e05-804d-06ab38b3d8aa', '7f873cb1-6a33-4577-aee8-0c662817944e', '02f41010-d223-46c6-90f3-2cb42fbd4d76', 1, 1781436041.432300, 'pending', 50000.00, 'Website EOI payment for unit number 24-C', '2026-06-14 08:20:41', '2026-06-14 08:20:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `eoi_reservations`
--

CREATE TABLE `eoi_reservations` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL COMMENT 'Loose-link to projects table',
  `unit_id` char(36) DEFAULT NULL COMMENT 'Optional unit reference',
  `client_name` varchar(255) NOT NULL,
  `client_email` varchar(255) NOT NULL,
  `client_phone` varchar(255) NOT NULL,
  `client_location` enum('inside_egypt','outside_egypt') NOT NULL,
  `payment_method` enum('cash','bank_transfer','cheque','international_bank_transfer','instapay') NOT NULL,
  `payment_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `receipt_path` varchar(255) NOT NULL COMMENT 'Uploaded payment receipt file path',
  `passport_path` varchar(255) DEFAULT NULL,
  `status` enum('pending_review','approved','rejected') NOT NULL DEFAULT 'pending_review',
  `order_number` varchar(255) DEFAULT NULL COMMENT 'Generated on approval: EOI-YYYY-NNNNNN',
  `queue_number` int(11) DEFAULT NULL COMMENT 'Per-project sequential queue position',
  `reviewer_id` char(36) DEFAULT NULL COMMENT 'Accountant who reviewed',
  `review_notes` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exchange_rates`
--

CREATE TABLE `exchange_rates` (
  `id` char(36) NOT NULL,
  `from_currency_id` char(36) NOT NULL,
  `to_currency_id` char(36) NOT NULL,
  `rate` decimal(12,6) NOT NULL,
  `last_updated_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `family_members`
--

CREATE TABLE `family_members` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `relationship` varchar(255) NOT NULL,
  `national_id` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `general_ledger`
--

CREATE TABLE `general_ledger` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `account_id` char(36) NOT NULL,
  `fiscal_year` int(11) NOT NULL,
  `period` int(11) NOT NULL,
  `opening_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `debit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `closing_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `goods_receipts`
--

CREATE TABLE `goods_receipts` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `purchase_order_id` char(36) NOT NULL,
  `received_by` char(36) NOT NULL,
  `received_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','verified','disputed') NOT NULL DEFAULT 'draft',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interactions`
--

CREATE TABLE `interactions` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `type` enum('call','whatsapp','meeting','email') NOT NULL,
  `notes` text DEFAULT NULL,
  `follow_up_date` timestamp NULL DEFAULT NULL,
  `logged_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `interactions`
--

INSERT INTO `interactions` (`id`, `lead_id`, `type`, `notes`, `follow_up_date`, `logged_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
('851322c7-6691-46c9-8602-11f1bc5a65c3', 'a1ff33da-7dff-4a8d-bdc4-a98e808caa87', 'call', 'Customer inquired about commercial pricing structure in the Administrative Capital. Warm lead.', '2026-06-13 07:43:06', 'c9283383-625d-4fff-bb05-fff7447f4d89', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('ac130835-4c89-422a-be1a-f3eb155a2ec9', 'a1ff33da-801b-4b58-a249-a1e547cb6455', 'meeting', 'Face-to-face walkthrough. Client expressed strong interest in Patio Luxury Compound.', '2026-06-16 07:43:06', 'c9283383-625d-4fff-bb05-fff7447f4d89', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `entry_number` varchar(255) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `entry_date` date NOT NULL,
  `status` enum('draft','posted','cancelled') NOT NULL DEFAULT 'draft',
  `created_by` char(36) NOT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `posted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_lines`
--

CREATE TABLE `journal_lines` (
  `id` char(36) NOT NULL,
  `journal_entry_id` char(36) NOT NULL,
  `account_id` char(36) NOT NULL,
  `debit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `cost_center_id` char(36) DEFAULT NULL,
  `profit_center_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kpi_metrics`
--

CREATE TABLE `kpi_metrics` (
  `id` char(36) NOT NULL,
  `company_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `target_value` decimal(15,2) DEFAULT NULL,
  `period` varchar(20) NOT NULL,
  `calculated_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `national_id` varchar(30) DEFAULT NULL,
  `passport_no` varchar(30) DEFAULT NULL,
  `status` enum('new','contacted','interested','visit_scheduled','negotiation','reserved','contracted') NOT NULL DEFAULT 'new',
  `lead_score` int(11) NOT NULL DEFAULT 0,
  `is_vip` tinyint(1) NOT NULL DEFAULT 0,
  `budget` decimal(15,2) DEFAULT NULL,
  `payment_method` varchar(255) NOT NULL DEFAULT 'installment',
  `interested_project_id` char(36) DEFAULT NULL,
  `assigned_sales_agent_id` char(36) DEFAULT NULL,
  `tele_sales_agent_id` char(36) DEFAULT NULL,
  `company_sales_agent_id` char(36) DEFAULT NULL,
  `current_tier` enum('tier_1','tier_2','tier_3') NOT NULL DEFAULT 'tier_1',
  `kyc_status` varchar(255) NOT NULL DEFAULT 'none',
  `national_id_front_path` varchar(255) DEFAULT NULL,
  `national_id_back_path` varchar(255) DEFAULT NULL,
  `passport_path` varchar(255) DEFAULT NULL,
  `selfie_path` varchar(255) DEFAULT NULL,
  `facial_match_score` decimal(5,2) DEFAULT NULL,
  `source` varchar(255) NOT NULL DEFAULT 'direct',
  `campaign_id` char(36) DEFAULT NULL,
  `broker_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `tenant_id`, `first_name`, `last_name`, `email`, `phone`, `national_id`, `passport_no`, `status`, `lead_score`, `is_vip`, `budget`, `payment_method`, `interested_project_id`, `assigned_sales_agent_id`, `tele_sales_agent_id`, `company_sales_agent_id`, `current_tier`, `kyc_status`, `national_id_front_path`, `national_id_back_path`, `passport_path`, `selfie_path`, `facial_match_score`, `source`, `campaign_id`, `broker_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('7f873cb1-6a33-4577-aee8-0c662817944e', NULL, 'John', 'Doe', 'john@mv-eoi.com', '+201200334455', '29810101234567', NULL, 'new', 0, 0, NULL, 'installment', '02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'website_eoi', NULL, NULL, '2026-06-14 08:20:41', '2026-06-14 08:20:41', NULL),
('a1ff33da-76fc-491e-9ae4-1b55ca1a5e42', NULL, 'Mohamed', 'Nabil', 'mohamed.nabil@gmail.com', '+201201112223', '29501011234567', NULL, 'reserved', 85, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', '43209f55-b7a8-411a-a789-a81d697b741d', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'tier_3', 'verified', NULL, NULL, NULL, NULL, 96.50, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-14 05:39:00', NULL),
('a1ff33da-7dff-4a8d-bdc4-a98e808caa87', NULL, 'Sherif', 'Kamal', 'sherif.kamal@yahoo.com', '+201509998887', '29202021234567', NULL, 'interested', 92, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', '43209f55-b7a8-411a-a789-a81d697b741d', NULL, 'tier_1', 'pending', NULL, NULL, NULL, NULL, 84.20, 'google', 'a1ff33da-7048-4675-ac18-54f2de6448bc', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-801b-4b58-a249-a1e547cb6455', NULL, 'Yasmine', 'Fouad', 'yasmine.f@outlook.com', '+201007776665', '29803031234567', NULL, 'negotiation', 78, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_2', 'none', NULL, NULL, NULL, NULL, NULL, 'broker', NULL, 'a1ff33da-7418-4a4e-a2de-8433f35bc7b9', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-81e5-4d98-a14b-a0f0b68a778c', NULL, 'Karim', 'Saeed', 'karim.saeed@gmail.com', '+201103332221', '29004041234567', NULL, 'reserved', 98, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 98.90, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-836e-4be7-a0ef-5f3176acce02', NULL, 'Tarek', 'Mansour', 'tarek@gmail.com', '+201000000010', '29607209184845', NULL, 'new', 65, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-84eb-45f3-8cf8-4bc64f560332', NULL, 'Salma', 'Ahmed', 'salma@yahoo.com', '+201000000011', '29205246259384', NULL, 'contacted', 72, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_3', 'pending', NULL, NULL, NULL, NULL, NULL, 'google', 'a1ff33da-7048-4675-ac18-54f2de6448bc', NULL, '2026-06-11 07:43:06', '2026-06-14 05:48:49', NULL),
('a1ff33da-86d0-46d9-aa1f-f32bb9e68e5d', NULL, 'Omar', 'Hassan', 'omar@gmail.com', '+201000000012', '29108254184508', NULL, 'interested', 88, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 97.80, 'direct', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-885c-4d27-9d85-621cf9cc7d93', NULL, 'Rania', 'Kamal', 'rania@outlook.com', '+201000000013', '29404275761143', NULL, 'visit_scheduled', 90, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 89.33, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-89d8-4c0c-a2eb-18201c59dd5c', NULL, 'Mustafa', 'Kamel', 'mustafa@gmail.com', '+201000000014', '29309116094987', NULL, 'negotiation', 79, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'google', 'a1ff33da-7048-4675-ac18-54f2de6448bc', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-8b7e-4fd6-a5bc-89d7eddb8102', NULL, 'Noha', 'Fawzy', 'noha@gmail.com', '+201000000015', '29207165100124', NULL, 'reserved', 95, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 97.24, 'direct', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-8d71-4a6c-a1a2-3ca12b6e0fa0', NULL, 'Aly', 'Nasser', 'aly@company.com', '+201000000016', '29102257100806', NULL, 'new', 55, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'tiktok', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-8eee-49e9-a17f-cba02cd0578b', NULL, 'Khaled', 'Mostafa', 'khaled@gmail.com', '+201000000017', '29606235818596', NULL, 'contacted', 62, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'pending', NULL, NULL, NULL, NULL, NULL, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-907a-4dfe-be7e-370202ce28f4', NULL, 'Ghada', 'Adel', 'ghada@gmail.com', '+201000000018', '29301242067501', NULL, 'interested', 80, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 99.69, 'google', 'a1ff33da-7048-4675-ac18-54f2de6448bc', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-921f-4104-b1a7-20d3f0a706c2', NULL, 'Mona', 'Zaki', 'mona@gmail.com', '+201000000019', '29406272096309', NULL, 'visit_scheduled', 85, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 91.55, 'direct', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-93da-40f6-9c90-af0ffe683137', NULL, 'Sameh', 'Hussein', 'sameh@gmail.com', '+201000000020', '29804212786077', NULL, 'negotiation', 74, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-955d-4fa8-b007-c92d19ef8bb9', NULL, 'Radwa', 'Sherif', 'radwa@gmail.com', '+201000000021', '29401275702945', NULL, 'reserved', 78, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 94.96, 'broker', NULL, 'a1ff33da-7418-4a4e-a2de-8433f35bc7b9', '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-96bb-4a95-a53a-a50ec096b539', NULL, 'Ziad', 'Nabil', 'ziad@gmail.com', '+201000000022', '29404281924819', NULL, 'new', 40, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'tiktok', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-982f-417a-a0ee-8fd1264e8e58', NULL, 'Heba', 'Magdy', 'heba@gmail.com', '+201000000023', '29007166093445', NULL, 'contacted', 68, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'google', 'a1ff33da-7048-4675-ac18-54f2de6448bc', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-9a1c-4417-899f-c62bf1a7ce85', NULL, 'Dina', 'Samir', 'dina@gmail.com', '+201000000024', '29106253492898', NULL, 'interested', 83, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 93.19, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-9b8f-4be7-86e0-f231200914d3', NULL, 'Hoda', 'Mostafa', 'hoda@gmail.com', '+201000000025', '29203257752787', NULL, 'visit_scheduled', 87, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'verified', NULL, NULL, NULL, NULL, 86.42, 'direct', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-9d51-4acc-9ebc-28c000e7dd57', NULL, 'Ibrahim', 'Saad', 'ibrahim@gmail.com', '+201000000026', '29701173681739', NULL, 'negotiation', 77, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'google', 'a1ff33da-7048-4675-ac18-54f2de6448bc', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-9f40-40a2-8f1e-f15eb0245638', NULL, 'Osama', 'Anwar', 'osama@gmail.com', '+201000000027', '29006236282153', NULL, 'new', 50, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'facebook', 'a1ff33da-6cb8-43c1-887d-fc853753ba84', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-a10e-41ab-98b1-2db52615d363', NULL, 'Farida', 'Saeed', 'farida@gmail.com', '+201000000028', '29707134774139', NULL, 'contacted', 60, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'none', NULL, NULL, NULL, NULL, NULL, 'direct', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL),
('a1ff33da-a2a7-4277-854e-333f7fe82eae', NULL, 'Hany', 'Fouad', 'hany@gmail.com', '+201000000029', '29409195113123', NULL, 'interested', 70, 0, NULL, 'installment', NULL, 'c9283383-625d-4fff-bb05-fff7447f4d89', NULL, NULL, 'tier_1', 'pending', NULL, NULL, NULL, NULL, NULL, 'tiktok', NULL, NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lead_locks`
--

CREATE TABLE `lead_locks` (
  `id` char(36) NOT NULL,
  `broker_id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `national_id` varchar(30) DEFAULT NULL,
  `locked_until` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('active','expired','released') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `legal_actions`
--

CREATE TABLE `legal_actions` (
  `id` char(36) NOT NULL,
  `case_id` char(36) NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `due_date` date DEFAULT NULL,
  `completed_at` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `legal_cases`
--

CREATE TABLE `legal_cases` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `case_number` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `company_id` char(36) DEFAULT NULL,
  `type` enum('litigation','arbitration','dispute','consultation') NOT NULL DEFAULT 'litigation',
  `status` enum('open','investigation','litigation','resolved','closed','archived') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `jurisdiction` varchar(255) DEFAULT NULL,
  `court_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `claim_amount` decimal(15,2) DEFAULT NULL,
  `legal_fees` decimal(15,2) DEFAULT NULL,
  `assigned_lawyer_id` char(36) DEFAULT NULL,
  `opened_at` date NOT NULL,
  `closed_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `legal_documents`
--

CREATE TABLE `legal_documents` (
  `id` char(36) NOT NULL,
  `case_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `legal_parties`
--

CREATE TABLE `legal_parties` (
  `id` char(36) NOT NULL,
  `case_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('plaintiff','defendant','claimant','respondent','witness','expert') NOT NULL DEFAULT 'plaintiff',
  `role` enum('internal','external') NOT NULL DEFAULT 'external',
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_tickets`
--

CREATE TABLE `maintenance_tickets` (
  `id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `unit_id` char(36) NOT NULL,
  `category` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'open',
  `priority` varchar(255) NOT NULL DEFAULT 'medium',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `maintenance_tickets`
--

INSERT INTO `maintenance_tickets` (`id`, `client_id`, `unit_id`, `category`, `title`, `description`, `status`, `priority`, `created_at`, `updated_at`) VALUES
('5c1e5431-8feb-422b-b38c-28dba58ca6d3', 'a79c826c-e7d8-477d-951e-5f737b5f264d', 'da06d389-2d30-4a57-b5f0-ab28b289ae19', 'Electrical', 'Main circuit breaker keeps tripping', 'AC unit start-up causes circuit break in main electrical board.', 'assigned', 'critical', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('ebeb9d62-22e0-47bb-96b0-7a0e4de15f1f', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', '52501a91-21e6-46b0-bd5b-304e93171d0b', 'Plumbing', 'Water leakage in master bathroom', 'Master bathroom floor tiles show moisture and wall dampness.', 'open', 'high', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` char(36) NOT NULL,
  `conversation_id` char(36) NOT NULL,
  `direction` enum('inbound','outbound') NOT NULL DEFAULT 'inbound',
  `sender_type` enum('customer','agent','system') NOT NULL DEFAULT 'customer',
  `sender_id` char(36) DEFAULT NULL,
  `message_type` enum('text','image','document','location','audio') NOT NULL DEFAULT 'text',
  `content` text NOT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `status` enum('sending','sent','delivered','read','failed') NOT NULL DEFAULT 'sent',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_templates`
--

CREATE TABLE `message_templates` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `channel_type` enum('whatsapp','sms','email') NOT NULL DEFAULT 'sms',
  `language` varchar(10) NOT NULL DEFAULT 'en',
  `content` text NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  `company_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_06_01_000001_create_users_table', 1),
(2, '2026_06_01_000002_create_projects_table', 1),
(3, '2026_06_01_000003_create_units_table', 1),
(4, '2026_06_01_000004_create_reservations_table', 1),
(5, '2026_06_01_000005_create_contracts_table', 1),
(6, '2026_06_01_000006_create_payment_plans_table', 1),
(7, '2026_06_01_000007_create_payments_table', 1),
(8, '2026_06_01_000008_create_brokers_table', 1),
(9, '2026_06_01_000010_create_leads_table', 1),
(10, '2026_06_01_000011_create_interactions_table', 1),
(11, '2026_06_01_000012_create_call_logs_table', 1),
(12, '2026_06_01_000013_create_campaigns_table', 1),
(13, '2026_06_01_000014_create_maintenance_tickets_table', 1),
(14, '2026_06_01_000015_create_appointments_table', 1),
(15, '2026_06_01_000016_create_audit_logs_table', 1),
(16, '2026_06_01_000017_create_documents_table', 1),
(17, '2026_06_01_000018_create_notifications_table', 1),
(18, '2026_06_01_000019_create_rescheduling_requests_table', 1),
(19, '2026_06_01_000020_create_collections_queue_table', 1),
(20, '2026_06_01_000021_create_cancellations_table', 1),
(21, '2026_06_01_000022_create_defects_snags_table', 1),
(22, '2026_06_01_000023_create_warranties_table', 1),
(23, '2026_06_01_000024_create_vendors_table', 1),
(24, '2026_06_01_000025_create_workflow_templates_table', 1),
(25, '2026_06_01_000026_create_eoi_queue_table', 1),
(26, '2026_06_01_000027_create_lead_locks_table', 1),
(27, '2026_06_01_000028_create_commissions_table', 1),
(28, '2026_06_02_000001_create_system_configs_table', 1),
(29, '2026_06_02_061525_create_personal_access_tokens_table', 1),
(30, '2026_06_02_100001_add_rbac_sales_tiers', 1),
(31, '2026_06_02_100002_add_budget_fields_to_leads', 1),
(32, '2026_06_03_123203_create_cache_table', 1),
(33, '2026_06_03_130000_add_penalty_to_payments_table', 1),
(34, '2026_06_04_000001_create_countries_enterprise_table', 1),
(35, '2026_06_04_000002_create_companies_table_enterprise', 1),
(36, '2026_06_04_000003_create_company_groups_table', 1),
(37, '2026_06_04_000004_create_regions_table', 1),
(38, '2026_06_04_000005_create_branches_table', 1),
(39, '2026_06_04_000006_create_departments_table', 1),
(40, '2026_06_04_000007_create_teams_table_enterprise', 1),
(41, '2026_06_04_000008_create_positions_table', 1),
(42, '2026_06_04_000009_create_employee_hierarchy_table', 1),
(43, '2026_06_04_000010_create_delegations_table', 1),
(44, '2026_06_04_000011_add_org_fields_to_users_table', 1),
(45, '2026_06_04_000012_create_rbac_engine_tables', 1),
(46, '2026_06_04_000013_create_approval_engine_tables', 1),
(47, '2026_06_04_000014_create_legal_module_tables', 1),
(48, '2026_06_04_000015_create_task_management_tables', 1),
(49, '2026_06_04_000016_create_omnichannel_tables', 1),
(50, '2026_06_04_000017_update_audit_logs_table', 1),
(51, '2026_06_04_000018_create_accounting_tables', 1),
(52, '2026_06_04_000019_create_procurement_tables', 1),
(53, '2026_06_04_000020_create_commission_engine_tables', 1),
(54, '2026_06_04_000021_create_ai_layer_tables', 1),
(55, '2026_06_04_000022_create_data_platform_tables', 1),
(56, '2026_06_04_000023_create_multi_tenant_tables', 1),
(57, '2026_06_04_000024_add_tenant_id_to_existing_tables', 1),
(58, '2026_06_04_000025_create_globalization_tables', 1),
(59, '2026_06_04_000026_create_construction_tables', 1),
(60, '2026_06_04_000027_create_quality_tables', 1),
(61, '2026_06_08_000001_create_homeowner_portal_tables', 1),
(62, '2026_06_09_000001_create_project_payment_plans_table', 1),
(63, '2026_06_09_100000_add_broker_and_receipt_to_reservations', 1),
(64, '2026_06_09_100001_create_commission_payout_requests_table', 1),
(65, '2026_06_14_100001_create_eoi_reservations_table', 2),
(66, '2026_06_14_100002_add_is_vip_to_leads_table', 2),
(67, '2026_06_15_000001_update_appointments_table_for_reminders', 2),
(68, '2026_06_15_000002_add_release_management_fields_to_units_and_projects', 2),
(69, '2026_06_15_000003_add_missing_unit_detail_columns', 2),
(70, '2026_06_15_000004_add_images_to_projects_and_units', 3),
(71, '2026_06_15_100000_add_tripo_3d_fields_to_project_media', 4),
(72, '2026_06_15_102744_create_jobs_table', 4),
(73, '2026_06_15_102854_create_failed_jobs_table', 4),
(74, '2026_06_15_120000_add_tripo_3d_fields_to_units', 4),
(75, '2026_06_16_100000_add_penalty_and_paid_amount_fields_to_payments_and_plans', 4),
(76, '2026_06_16_110000_add_withdrawal_status_to_contracts_table', 5),
(77, '2026_06_16_140000_add_handover_fields_and_family_photo', 6),
(78, '2026_06_16_000001_create_buildings_table', 7),
(79, '2026_06_16_000002_create_building_floors_table', 7),
(80, '2026_06_16_000003_create_project_amenities_table', 7),
(81, '2026_06_16_000004_add_master_plan_fields_to_projects', 7),
(82, '2026_06_16_000005_add_building_fields_to_units', 7),
(83, '2026_06_17_163530_add_instapay_and_passport_to_eoi_reservations_table', 8),
(84, '2026_06_17_175555_make_notifications_user_id_nullable_and_add_lead_id', 8);

-- --------------------------------------------------------

--
-- Table structure for table `ncr_reports`
--

CREATE TABLE `ncr_reports` (
  `id` char(36) NOT NULL,
  `inspection_id` char(36) NOT NULL,
  `description` text NOT NULL,
  `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('open','under_review','resolved') NOT NULL DEFAULT 'open',
  `assigned_engineer_id` char(36) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `lead_id` char(36) DEFAULT NULL,
  `channel` varchar(255) NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `contract_id` char(36) NOT NULL,
  `payment_plan_id` char(36) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `penalty_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `penalty_waived` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `transaction_reference` varchar(255) DEFAULT NULL,
  `gateway` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `installment_number` int(11) NOT NULL DEFAULT 0,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `tenant_id`, `contract_id`, `payment_plan_id`, `amount`, `paid_amount`, `penalty_amount`, `penalty_waived`, `status`, `transaction_reference`, `gateway`, `due_date`, `installment_number`, `paid_at`, `created_at`, `updated_at`) VALUES
('01c15d4c-b0c2-4ade-b3a8-a24f58273f41', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-06-14', 4, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('024fa7c4-ee8e-49f7-8233-c7a73146fada', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-09-14', 9, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('07298918-c33c-42ee-a5d4-498abf64ef99', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-03-14', 3, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('0b59e551-bccf-4d85-b547-1fc72910ed3b', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-03-14', 7, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('0d39a756-1095-4623-85d7-735bf328bac8', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 35468.75, 0, 'pending', NULL, NULL, '2026-05-11', 2, NULL, '2026-06-11 07:43:07', '2026-06-14 06:21:00'),
('1198fbab-3aa0-4f54-8f65-ddfb2b19860d', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-03-14', 11, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('16c9411c-b19f-4872-be9b-13b6812ed04a', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-11-11', 8, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('18980714-312f-4bb4-bcb2-377d2f14a916', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-12-14', 2, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('1af5b940-93ad-41c0-8a2e-cc0b72cbbd60', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-08-11', 5, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('2110bbe7-2a3a-4444-85ee-b01735e403b1', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-09-14', 9, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('221235d5-b74f-4c4a-ab61-905a8b965107', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-07-11', 6, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('24ed993f-0834-4f35-a7af-371aaa502b2e', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-09-11', 8, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('28852cde-25b7-4d9b-95ce-ca52448e1fee', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-02-11', 23, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('29525037-287b-44dd-a366-34106c62f296', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-12-14', 6, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('29c2bfa0-7c65-4921-b280-1949d5901488', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-06-14', 8, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('2dbd725e-a5ed-407d-8745-637beed76088', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 250000.00, 0.00, 0, 'paid', 'TXN-n6QhUs8b', 'stripe', '2026-02-11', 1, '2026-02-13 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('2f934f2a-7a64-4613-a5bb-07f57a9cf243', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-12-14', 10, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('342d6dba-547b-4f66-a373-0a663616d692', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-07-11', 4, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('3c8de358-a1a7-4a6a-9da6-86f8ee452416', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-10-11', 7, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('4c647cf4-03d9-4249-87ec-d00c1d83065a', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-09-14', 1, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('51be5090-9bcb-449b-8058-4fb8228ea916', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-06-14', 12, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('52fe0613-457f-49cd-9390-6da0bb1d2238', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-12-14', 10, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('542fb464-ccc4-45d4-b60b-03034c426640', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-09-11', 18, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('543f4d1e-05e7-44d3-aa22-bff3f2b77b4a', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-03-14', 7, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('55634abb-c8c4-4560-ab64-afcfd7f90fb7', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-11-11', 10, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('57fd4786-62a3-4133-8ab4-f314fecdc21a', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-11-11', 20, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('58ce4882-0fc0-46a0-abe4-6156ceaf2064', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-12-14', 6, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('58f7debb-164e-4f0f-9d70-cd300fc1583f', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-06-14', 4, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('5aaf38a2-2340-406b-9c83-a7654c319aec', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-09-14', 5, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('5ded228a-72c7-4955-9a95-56155653a405', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 354687.50, 0.00, 0, 'paid', 'TXN-mFwM6qtW', 'fawry', '2026-04-11', 1, '2026-04-16 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('61ae774d-2678-4546-954e-6d8a4107539a', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-03-14', 3, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('6247bcce-ae81-44f7-9040-982a4cdad76d', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-04-11', 13, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('65628173-41e7-4be7-b96d-50a1fd7cdb41', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 50000.00, 50000.00, 0.00, 0, 'paid', 'EOI-11fe74b8-9950-4c22-9460-7f684eac2d98', 'eoi_deposit', '2026-06-14', 0, '2026-06-14 05:39:00', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('65ca9a60-ea22-44e5-ac8a-66841e00389e', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-12-11', 11, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('66853418-b25f-4484-ad6b-2c41f802e8bd', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-09-14', 1, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('69d42891-5cb8-46f1-b7b9-52355131070d', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-03-11', 24, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('6aa64c14-888f-4078-80a8-60a1e406cd32', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-12-14', 6, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('6b46d19c-5b7a-40d9-82a4-9353bb927c2f', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-06-11', 15, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('6bbce114-64d0-4816-8790-4cd1ea5d139f', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-03-14', 3, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('6e833e24-62ed-4412-b3be-c0d8a4e413ae', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 35468.75, 0, 'pending', NULL, NULL, '2026-06-11', 3, NULL, '2026-06-11 07:43:07', '2026-06-14 06:21:00'),
('717d1684-0b46-40ed-a055-aa7d087b4427', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-09-14', 5, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('71c8b47c-ee09-4267-b526-61f9adfaa25f', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-10-11', 19, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('72045b27-5f65-4378-9ea1-87fbe0a57c6b', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-09-14', 5, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('77e555f6-b724-4357-bf2b-0cd52fe5ae3d', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-03-14', 11, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('7b62aa78-bb4c-4242-9da0-f1b20b93d475', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-02-11', 11, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('80545bbd-e3c6-430a-a5f5-0354bc8f152b', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-12-14', 6, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('82c6eded-2d50-45cd-9dc5-3b85545e31bb', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-01-11', 10, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('85b4836c-204e-4ab4-bc54-f76c805168b0', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 50000.00, 50000.00, 0.00, 0, 'paid', 'EOI-f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e', 'eoi_deposit', '2026-06-14', 0, '2026-06-14 05:36:05', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('8f917b75-720d-4c89-9a2b-674dc05af3b8', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-01-11', 22, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('906e59eb-9089-417b-8e59-c86aa3b456cf', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-06-14', 4, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('908b8d63-6806-4911-aab2-c8dfd198863f', NULL, 'cf8a4ad3-b09f-4428-83c5-5b260b5a744d', '86204124-ac8c-4073-b275-8b5e8bbbdeed', 6800000.00, 6800000.00, 0.00, 0, 'paid', 'TXN-NrdzkC6x', 'bank_transfer', '2025-12-11', 0, '2025-12-11 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('94c41017-7bde-416f-9726-f8aa2147c017', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-12-14', 2, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('9557fd4d-90e5-414a-8a5a-93505ef72e2d', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-06-14', 8, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('9595402b-c402-467d-9ffe-db2cd35414c9', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-05-11', 14, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('98d6df02-0a54-4371-8b1f-3107eeb5b807', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-06-14', 8, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('9c800e7f-cc6c-450e-876f-fb1e96dae174', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-01-11', 12, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('9e2ea89a-dc4d-4d52-9ba7-796918ac6991', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 25000.00, 0, 'pending', NULL, NULL, '2026-06-11', 5, NULL, '2026-06-11 07:43:07', '2026-06-14 06:21:00'),
('a1f4e3d2-a72a-4425-8e40-842bc90d7617', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-12-11', 21, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a442d159-ab50-4331-b82f-bd388c3c8dd0', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 50000.00, 50000.00, 0.00, 0, 'paid', 'EOI-11fe74b8-9950-4c22-9460-7f684eac2d98', 'eoi_deposit', '2026-06-14', 0, '2026-06-14 05:39:00', '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('a4758608-1ead-4cca-9d34-8ec3807150f9', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-09-14', 1, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('a72090e4-b34a-4fe2-adbf-7e5e4e15a8dc', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-06-14', 4, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('aa03735f-2810-48f2-abd9-576e70d79922', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-12-14', 2, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('ac1fcfcd-65e2-4950-b4d5-2a575b9b866d', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 250000.00, 0.00, 0, 'paid', 'TXN-c3kL0v67', 'stripe', '2026-03-11', 2, '2026-03-13 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('ad5e72be-9d20-425a-bcbd-98328302427e', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-12-14', 10, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('ad9fdf79-145b-4481-a410-02ad6ced7040', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-09-14', 9, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('b160fd3f-f449-4673-aeb4-204700324b5e', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-09-14', 1, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('bc3c9fe5-6cb7-4032-ac3c-7974a9c4d3d5', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-03-14', 11, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('bc4fc42f-7419-4fa2-b88c-65aeaa17afa6', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-10-11', 9, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c34ae508-f219-475b-a02f-e305d11bf5b6', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-08-11', 17, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c62a605e-cd10-4f27-b2d2-a2b4e1a72906', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-07-11', 16, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c6b0e289-d724-4e41-8958-b7a2ff3b0868', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-09-14', 9, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('cad43d06-d5b0-49c0-9ca4-2cb97c4270f2', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-12-14', 2, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('ced39c5c-a33c-4e14-9975-f1215ecd6922', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-03-14', 11, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('d1ba904f-20dc-4160-84f1-d4357018e15f', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-03-14', 3, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('d446b82a-9f1b-4cfb-97ba-ea53ada17a81', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-09-14', 5, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('d81ca4c8-399d-47dc-ac64-8e61d067b59d', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 250000.00, 0.00, 0, 'paid', 'TXN-3gnTMliE', 'stripe', '2026-05-11', 4, '2026-05-13 07:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('daa9ad91-e54c-49fd-b271-596456bc4ab4', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2027-03-11', 12, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('de76fbdd-7016-4a37-9c10-44212b29318a', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 50000.00, 50000.00, 0.00, 0, 'paid', 'EOI-f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e', 'eoi_deposit', '2026-06-14', 0, '2026-06-14 05:36:05', '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('e21a873e-25cf-4d0a-8ec2-c1bb522bc1d5', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-12-11', 9, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('e2337cde-5828-4f1e-bc0a-620f13a7bb2b', NULL, '94a19816-6f6a-415b-8c2d-042eae7a298d', '7754163c-3000-4c6b-9ff7-b7bd4df52976', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-03-14', 7, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('e2cbdd74-178e-4657-b0ab-783322a256b3', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-06-14', 12, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('e9b8e928-5648-4841-bed4-c3e10fe8dd86', NULL, '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', '09586de2-3a40-4a81-9db5-bbd46149d02a', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-03-14', 7, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('ed7827e0-89e9-483d-99ed-381862bdda84', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-06-14', 8, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('f09406be-3f64-4a69-a771-a3841d615f19', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 250000.00, 0.00, 0, 'paid', 'TXN-vXjWT1n4', 'stripe', '2026-04-11', 3, '2026-04-13 08:43:07', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('f4cc27ec-e16f-43c3-bbe4-8b2c4d89f639', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2028-12-14', 10, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('f60cf9d4-1221-465c-a3a6-e9490b77d858', NULL, 'd34f7657-5152-4430-946e-9a594854ba44', 'd042fafa-d503-46fe-95d2-4c737e4ae824', 412500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-06-14', 12, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('f6aa7db1-c25e-43a1-b3c5-fa1486aaf7b2', NULL, '61259272-f613-4338-aaf0-714a3e1754cd', 'c6830b51-9d0d-474f-8dd2-805355605496', 250000.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-08-11', 7, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('f8d09ac2-57d6-4c48-9b17-dc86137913a1', NULL, '14778e06-822f-42e9-bdfc-858f68b4ef0a', '73795f45-a5e7-49ab-a428-d27072aa4fac', 354687.50, 0.00, 0.00, 0, 'pending', NULL, NULL, '2026-09-11', 6, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('fdce9c78-2f00-451f-b4d1-807468e9d38c', NULL, '38396c28-eeaa-4c46-957a-08c102f463ec', 'da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', 512500.00, 0.00, 0.00, 0, 'pending', NULL, NULL, '2029-06-14', 12, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00');

-- --------------------------------------------------------

--
-- Table structure for table `payment_plans`
--

CREATE TABLE `payment_plans` (
  `id` char(36) NOT NULL,
  `contract_id` char(36) NOT NULL,
  `total_installments` int(11) NOT NULL,
  `unpaid_installments` int(11) NOT NULL,
  `monthly_amount` decimal(15,2) NOT NULL,
  `start_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `penalty_rate` decimal(5,2) DEFAULT NULL,
  `penalty_enabled` tinyint(1) DEFAULT NULL,
  `grace_period_days` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_plans`
--

INSERT INTO `payment_plans` (`id`, `contract_id`, `total_installments`, `unpaid_installments`, `monthly_amount`, `start_date`, `status`, `penalty_rate`, `penalty_enabled`, `grace_period_days`, `created_at`, `updated_at`) VALUES
('09586de2-3a40-4a81-9db5-bbd46149d02a', '0c0ba5c9-e0c4-494a-a093-6314ebd3cb46', 12, 12, 512500.00, '2026-07-14', 'active', NULL, NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('73795f45-a5e7-49ab-a428-d27072aa4fac', '14778e06-822f-42e9-bdfc-858f68b4ef0a', 24, 23, 354687.50, '2026-04-11', 'active', NULL, NULL, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('7754163c-3000-4c6b-9ff7-b7bd4df52976', '94a19816-6f6a-415b-8c2d-042eae7a298d', 12, 12, 412500.00, '2026-07-14', 'active', NULL, NULL, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('86204124-ac8c-4073-b275-8b5e8bbbdeed', 'cf8a4ad3-b09f-4428-83c5-5b260b5a744d', 1, 0, 6800000.00, '2025-12-11', 'completed', NULL, NULL, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c6830b51-9d0d-474f-8dd2-805355605496', '61259272-f613-4338-aaf0-714a3e1754cd', 12, 8, 250000.00, '2026-03-11', 'active', NULL, NULL, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('d042fafa-d503-46fe-95d2-4c737e4ae824', 'd34f7657-5152-4430-946e-9a594854ba44', 12, 12, 412500.00, '2026-07-14', 'active', NULL, NULL, NULL, '2026-06-14 05:36:05', '2026-06-14 05:36:05'),
('da77bf9d-3cf7-4467-b0f0-8ba6a4d003a3', '38396c28-eeaa-4c46-957a-08c102f463ec', 12, 12, 512500.00, '2026-07-14', 'active', NULL, NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `module` varchar(50) NOT NULL,
  `group_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `display_name`, `description`, `module`, `group_name`, `created_at`, `updated_at`) VALUES
('0130b888-c22b-4c1b-9cb0-235a1db955b8', 'payment.waive_penalty', 'Waive Payment Penalties', NULL, 'payments', 'Finance & Payments', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('12e15806-3829-4721-bee4-d29ce6205930', 'legal.create', 'Register Legal Cases', NULL, 'legal', 'Legal Module', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('1c533319-564a-47db-986a-fe51b2c3c06f', 'org.create_branch', 'Create Org Branches', NULL, 'organization', 'Enterprise Settings', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('20111728-d066-4f9e-a0c9-1579ee72c90c', 'user.impersonate', 'Impersonate User', NULL, 'users', 'User Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('2210b6a6-802b-404d-9961-3556f88399dc', 'payment.create', 'Record Payments', NULL, 'payments', 'Finance & Payments', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('272e554d-4130-470d-ad54-642d320c3d19', 'report.export', 'Export Business Reports', NULL, 'reports', 'Reports & Analytics', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('339105bf-3983-4dcd-a86d-7fd4dcabe773', 'broker.commissions', 'Manage Broker Commissions', NULL, 'brokers', 'Broker Relations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('342a0a19-6fea-4929-a58d-bcbc9a697cbb', 'accounting.view', 'View General Ledgers', NULL, 'accounting', 'ERP Finance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('378a8556-8f56-4456-8080-a99474eab992', 'accounting.create_entry', 'Record Journal Entries', NULL, 'accounting', 'ERP Finance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('39ce4a79-ee8d-4dfc-95d9-8746ca7c5e1e', 'contract.approve', 'Approve Contracts', NULL, 'contracts', 'Contract Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('39dabdd7-5fc0-4aa1-a532-4b657210037b', 'project.view', 'View Projects', NULL, 'projects', 'Project Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('3ac24233-6222-40c6-9843-51d54a7ab4ca', 'report.schedule', 'Schedule Reports Delivery', NULL, 'reports', 'Reports & Analytics', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('3c636035-5813-440e-8e7a-03db28c544b0', 'contract.edit', 'Edit Contracts', NULL, 'contracts', 'Contract Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('3c7f405e-1f32-4b9d-ae82-1ee03a05e927', 'audit.view', 'View Security Audit Logs', NULL, 'audit', 'Reports & Analytics', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('453e9fdc-308b-4a49-b8df-f93d7f15a1d9', 'payment.export', 'Export Financial Reports', NULL, 'payments', 'Finance & Payments', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('479c0e9a-33c2-49de-a5df-11abc1df4ce8', 'settings.edit', 'Edit System Settings', NULL, 'settings', 'System Administration', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('49cf90b7-e7f1-44b2-9d34-7ae0e8aa7d11', 'audit.clear', 'Truncate Audit Logs', NULL, 'audit', 'Reports & Analytics', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('4cd2f7de-d9d6-4c47-9914-6cfc5d2fccee', 'approval.reject', 'Reject Requests', NULL, 'approvals', 'Workflow Engines', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('4e944ed6-ce1e-40c8-a2ba-03db75a1e7bc', 'payment.refund', 'Refund Payments', NULL, 'payments', 'Finance & Payments', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('50943080-0b5c-46c9-bb63-0ec6b7ec9b7f', 'contract.sign', 'Sign Contracts', NULL, 'contracts', 'Contract Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('50d38d4c-a1b9-42f8-a34f-3e9b5adf3ee8', 'legal.view', 'View Legal Cases', NULL, 'legal', 'Legal Module', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('51bd0fbe-c958-434b-acdd-5747eaa8c3a2', 'lead.bulk_action', 'Bulk Lead Actions', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('557ec0d8-82f0-439e-98ff-5c2067fce498', 'user.create', 'Create Users', NULL, 'users', 'User Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('56f2515a-cfae-4c4e-a7ff-ba16ff613f3a', 'lead.delete', 'Delete Leads', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('57556296-d1b0-4e80-9475-8372ae449636', 'accounting.approve_entry', 'Approve Journal Entries', NULL, 'accounting', 'ERP Finance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('59082fb1-89c1-4373-af49-870195090ecf', 'ticket.create', 'Create Maintenance Tickets', NULL, 'maintenance', 'Operations & Maintenance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('5ed02b9a-59d5-4801-9b35-b1ceedbfba0d', 'settings.view', 'View System Settings', NULL, 'settings', 'System Administration', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('67455d13-6089-487c-a4f2-1c32e8cb06b5', 'broker.edit', 'Edit Broker Details', NULL, 'brokers', 'Broker Relations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('6977cc94-5484-4ac5-bf58-0d9bf33c9050', 'unit.block', 'Block/Unblock Units', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('6adcab5c-ff8b-4de3-9c2d-164dda92172a', 'ticket.dispatch', 'Dispatch Field Technicians', NULL, 'maintenance', 'Operations & Maintenance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('6ca01840-5780-4e37-8da0-9896f83b807e', 'procurement.receive_goods', 'Receive Purchased Goods', NULL, 'procurement', 'ERP Operations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('70779b5c-695a-4274-8b30-7d37ee7ddfb8', 'approval.approve', 'Approve Requests', NULL, 'approvals', 'Workflow Engines', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('722566ad-50a9-4965-b4fd-055b29806226', 'ticket.view', 'View Maintenance Tickets', NULL, 'maintenance', 'Operations & Maintenance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('7afda72e-3332-491a-92bf-2c3c83c57be8', 'contract.view', 'View Contracts', NULL, 'contracts', 'Contract Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('842a471d-a7a5-476e-9146-01a14af5e2c7', 'settings.system_health', 'Monitor System Health', NULL, 'settings', 'System Administration', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('84388928-ad7c-4d26-94bc-df5dbb3ea10c', 'ticket.edit', 'Edit Maintenance Tickets', NULL, 'maintenance', 'Operations & Maintenance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('859d2785-e42a-4f4a-8353-aba2facfa2dc', 'broker.delete', 'Remove Brokers', NULL, 'brokers', 'Broker Relations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('89b27555-a05a-40d7-a63b-61e4a0930aeb', 'unit.edit', 'Edit Units', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('929c5684-218b-410f-a8c1-d1804641821f', 'hr.attendance', 'Manage Leaves & Attendance', NULL, 'hr', 'ERP Human Resources', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('94634fa8-e42b-4b72-8a09-117f13376f1c', 'unit.change_price', 'Modify Unit Pricing', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('94e83cb3-c06c-49f0-be29-245ca2e5af51', 'accounting.close_period', 'Close Financial Periods', NULL, 'accounting', 'ERP Finance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('9cc208cf-91f8-4246-a8cf-1aaaf8e72d24', 'legal.schedule_court', 'Schedule Court Hearings', NULL, 'legal', 'Legal Module', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('9cc87c79-6763-4bc2-956b-9df27d0955e0', 'user.delete', 'Delete Users', NULL, 'users', 'User Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('9cecb5e8-0f44-4e5a-a949-6f0397ab61a8', 'payment.approve', 'Approve Payments', NULL, 'payments', 'Finance & Payments', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('9eca95ac-9c7a-43a3-9111-44d3330c1aa7', 'lead.create', 'Create Leads', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('9f180aea-12e6-43dd-a18c-96afb3889702', 'user.change_role', 'Modify User Roles', NULL, 'users', 'User Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a1c23c11-452f-4f8a-b06b-2cf35fd7ced5', 'org.create_department', 'Create Org Departments', NULL, 'organization', 'Enterprise Settings', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a54871ca-f5f3-410b-ac77-f7312fb90252', 'contract.download', 'Download Contracts PDF', NULL, 'contracts', 'Contract Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a6d1d58f-be03-46c0-a649-7cb3b2bb34fb', 'audit.export', 'Export Audit Logs', NULL, 'audit', 'Reports & Analytics', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a745312d-a453-4389-8712-a6ae448a8afd', 'procurement.approve_po', 'Approve Purchase Orders', NULL, 'procurement', 'ERP Operations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a8424c4a-e1c3-4d87-9a5d-15ca0418332e', 'user.view', 'View User Directory', NULL, 'users', 'User Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('a9fefdd0-50a4-489d-ab5a-85ad49416515', 'procurement.create_pr', 'Create Purchase Requests', NULL, 'procurement', 'ERP Operations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('ab9ecece-2c19-467e-9a8c-3d37b1d8a163', 'lead.view', 'View Leads', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('ad33b473-0127-4497-a966-dcb531e309cb', 'report.view', 'View Business Reports', NULL, 'reports', 'Reports & Analytics', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('b3e52e2a-b2f1-43e9-a2b7-2a1e4161facb', 'user.edit', 'Edit Users', NULL, 'users', 'User Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('b523e872-b7d4-4bfb-9ab4-aaad7d1a7f6c', 'approval.view', 'View Approval Requests', NULL, 'approvals', 'Workflow Engines', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('b678ed50-c2f9-4b76-b22d-20e1ae979c1f', 'procurement.view', 'View Purchase Orders', NULL, 'procurement', 'ERP Operations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('b74ed248-d9a0-4f7f-9ee0-fa86760ce9dd', 'hr.view', 'View HR Dashboard', NULL, 'hr', 'ERP Human Resources', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('b9345d64-b438-4783-a391-5e3f765069de', 'contract.create', 'Create Contracts', NULL, 'contracts', 'Contract Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('bf09e556-903c-47c1-9510-3ac007d9409d', 'lead.import', 'Import Leads Data', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c0f75a20-0603-4062-9acc-eb223c66e876', 'broker.create', 'Register Brokers', NULL, 'brokers', 'Broker Relations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c50887d2-aa75-4c40-97c7-fa1a75e734db', 'broker.view', 'View Brokers', NULL, 'brokers', 'Broker Relations', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c57d690f-0b61-439b-aae5-1740885db72c', 'project.create', 'Create Projects', NULL, 'projects', 'Project Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c5b507f9-2f4f-4743-ac4c-9223dd4bfe73', 'ticket.assign', 'Assign Tickets to Contractor', NULL, 'maintenance', 'Operations & Maintenance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('c7287f7a-0ad7-4067-9182-2383104765f8', 'hr.manage_employees', 'Manage Employee Hierarchy', NULL, 'hr', 'ERP Human Resources', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('cd57ac38-b23b-492b-b37b-f8835ea808fc', 'unit.delete', 'Delete Units', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('cdd89d7a-b545-40b7-bef2-5373aa58581d', 'project.edit', 'Edit Projects', NULL, 'projects', 'Project Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('ceb76c00-2d2e-4144-a619-000ad8f5c30a', 'unit.view', 'View Units Inventory', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('d0925afa-b353-44af-9956-3b55a7ff5d03', 'project.delete', 'Delete Projects', NULL, 'projects', 'Project Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('d3a75870-8c45-48bf-bc6a-638d4af48a8c', 'approval.create_workflow', 'Design Approval Workflows', NULL, 'approvals', 'Workflow Engines', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('d6036823-836d-4dd2-b5fc-f9f95becd73d', 'org.view', 'View Organization Structure', NULL, 'organization', 'Enterprise Settings', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('dcdcb754-ffb0-4389-9212-c58a3f9424bf', 'lead.export', 'Export Leads Data', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('df4061e8-b07c-4213-b43d-89138cc1e6f0', 'legal.edit', 'Update Legal Cases', NULL, 'legal', 'Legal Module', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('e23c7d64-b75d-4c32-9525-341d064c05b1', 'unit.change_status', 'Update Unit Status', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('e711c4fe-f28f-4a92-a73f-8660d2819532', 'unit.create', 'Create Units', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('e75fa48d-d854-443b-ba53-f9e7cd3a70e4', 'unit.reserve', 'Reserve Units', NULL, 'units', 'Inventory Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('efe93f7b-2305-499f-b81b-11c8bdc0ecf7', 'ticket.close', 'Close Maintenance Tickets', NULL, 'maintenance', 'Operations & Maintenance', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('f0960c91-6e9f-445f-bd2b-5a0900d50b7e', 'hr.payroll', 'Run Payroll Calculations', NULL, 'hr', 'ERP Human Resources', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('f61a4d43-cfb0-4351-8542-88efe258fce0', 'org.edit', 'Edit Organization details', NULL, 'organization', 'Enterprise Settings', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('f8a176e3-ee44-48ef-89ad-c418c79f2ffc', 'lead.edit', 'Edit Leads', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('f8e8ec82-234b-43d3-8d8b-edfe7eb8f06a', 'lead.assign', 'Assign Leads', NULL, 'leads', 'Lead Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('fa08e30f-7f13-4753-bc8e-77bd2e68b087', 'payment.view', 'View Payments', NULL, 'payments', 'Finance & Payments', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('fa51d7de-3390-43f3-9369-7b94daf464dd', 'contract.cancel', 'Cancel Contracts', NULL, 'contracts', 'Contract Management', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `permission_templates`
--

CREATE TABLE `permission_templates` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` char(36) NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', '0963fcbd-ab27-4a17-8a7c-7b915202c400', 'redp_token', '3fb028aaad20e17e9a1c7c7ef9a0c575777835bc97fe94ab36ee18d516a69a08', '[\"*\"]', '2026-06-11 07:44:01', NULL, '2026-06-11 07:43:45', '2026-06-11 07:44:01'),
(2, 'App\\Models\\User', '43209f55-b7a8-411a-a789-a81d697b741d', 'redp_token', 'cf54a6b601da7f9676bfbe97a197a7821d42671e882653c316d1d09a0ecd90c5', '[\"*\"]', '2026-06-11 07:44:25', NULL, '2026-06-11 07:44:14', '2026-06-11 07:44:25'),
(3, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', 'dee572e0ca397e019186b47eb75c8a7022c0bccce6cdc835bda6b34d8eb17617', '[\"*\"]', '2026-06-11 07:58:33', NULL, '2026-06-11 07:46:17', '2026-06-11 07:58:33'),
(4, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '86a41e0e91776957eb25434d6ba1660c5611e3cac68353b1a3ac588c81b7bc2a', '[\"*\"]', '2026-06-11 07:56:30', NULL, '2026-06-11 07:49:26', '2026-06-11 07:56:30'),
(5, 'App\\Models\\User', '42bb96f2-c7b9-453b-8410-c235dc409d21', 'redp_token', 'cdcd04f229ed01d801a517eca78038326f903b41c0e963997b26c509af725d25', '[\"*\"]', '2026-06-11 07:59:08', NULL, '2026-06-11 07:58:58', '2026-06-11 07:59:08'),
(6, 'App\\Models\\User', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', 'redp_token', '2234102f1c5f4cb94d33ed6aae48c4974b97d317f69bc626c7e1ca273fb72ec5', '[\"*\"]', '2026-06-11 08:20:42', NULL, '2026-06-11 08:20:24', '2026-06-11 08:20:42'),
(7, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '3a09d02ede1c1cf89cf82ee12b7b348219a5b62a0ca3d46561f31b7c7acad191', '[\"*\"]', '2026-06-11 08:30:03', NULL, '2026-06-11 08:29:15', '2026-06-11 08:30:03'),
(8, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '303eea4daf1635b4cabc1c6216d389d4fc0be9a4f4caf70dbf563a3e8955c912', '[\"*\"]', '2026-06-11 08:32:00', NULL, '2026-06-11 08:31:32', '2026-06-11 08:32:00'),
(9, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', '2cfb1276b07c61175a375e22a49b29f49bc60d4e3f02455c8803a50818aa0dcc', '[\"*\"]', '2026-06-11 08:33:24', NULL, '2026-06-11 08:32:45', '2026-06-11 08:33:24'),
(10, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', '9a5b59e93baf38d66fc590a21f91e7a57bef67c1edf11af116b4975843262755', '[\"*\"]', '2026-06-11 08:48:42', NULL, '2026-06-11 08:36:33', '2026-06-11 08:48:42'),
(11, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', 'ce2fe6eb328642470854d93edcec1c5c01e77acd3350f2edf3cc46b409efa546', '[\"*\"]', '2026-06-11 08:46:11', NULL, '2026-06-11 08:42:26', '2026-06-11 08:46:11'),
(12, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '1797840f59fa8d1fca33bc25f41de54b82c82fd060538f1c17c9005780fe96bb', '[\"*\"]', '2026-06-14 05:46:05', NULL, '2026-06-14 04:01:42', '2026-06-14 05:46:05'),
(13, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '53d7145259b676e943273509f743e5e949a9a3b1b32c0ac753978dc330afddbf', '[\"*\"]', '2026-06-14 05:53:05', NULL, '2026-06-14 05:47:39', '2026-06-14 05:53:05'),
(14, 'App\\Models\\User', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', 'redp_token', 'd029a6725c7b3090b1a893f51349ac3da7471cda9601fe8cf5f53c4d998b513b', '[\"*\"]', '2026-06-14 06:23:25', NULL, '2026-06-14 06:20:53', '2026-06-14 06:23:25'),
(15, 'App\\Models\\User', '2c1843b9-b367-493d-a8c2-b6d208f55d39', 'redp_token', '59536cf02fcdf8c3a4ea98340c3bb6d7edb7d4f9df8b2d381b8edd9f44f3add6', '[\"*\"]', '2026-06-14 06:24:13', NULL, '2026-06-14 06:23:40', '2026-06-14 06:24:13'),
(16, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', '2e21a41fd879985b0baba85cec83ca0bf89635814c3d54426d0b7172cff4ddd9', '[\"*\"]', '2026-06-14 06:26:54', NULL, '2026-06-14 06:26:51', '2026-06-14 06:26:54'),
(17, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '4633d31dcc423afb88a789b6be80b9e01476e47f0590166c7eb893b755a9c362', '[\"*\"]', '2026-06-15 09:36:35', NULL, '2026-06-15 05:02:55', '2026-06-15 09:36:35'),
(18, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '6479eabe8a36ea9882968b56fc90602a55978a51829d8ce6f77ff1e3bce24ee3', '[\"*\"]', '2026-06-17 05:20:41', NULL, '2026-06-17 04:29:11', '2026-06-17 05:20:41'),
(19, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', 'c79add87236209fc2efd7c8e903647e482dde12d535a7aa3389cff20011ad066', '[\"*\"]', '2026-06-21 04:03:03', NULL, '2026-06-21 04:02:29', '2026-06-21 04:03:03'),
(20, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', 'c06913968ca7beab084daa5b18534cada8a4368cc4e183ae9988b53c61b7d1a3', '[\"*\"]', '2026-06-21 04:27:46', NULL, '2026-06-21 04:03:37', '2026-06-21 04:27:46'),
(21, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', 'a14df48ca7a14c79745ae318639b00c24709621cba9d435491d7260b346252eb', '[\"*\"]', '2026-06-21 04:16:00', NULL, '2026-06-21 04:15:43', '2026-06-21 04:16:00'),
(22, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', 'c3bfd92eb29116b5cd15ba6d795addf24d88a4ef4aff5ccf556a2b5f30002d7e', '[\"*\"]', '2026-06-21 04:21:24', NULL, '2026-06-21 04:21:08', '2026-06-21 04:21:24'),
(23, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', 'cbd3284441c66d103b26b2652d1d5c1d4ab602b788c2b50a6e1ae5ff94191389', '[\"*\"]', '2026-06-21 04:26:00', NULL, '2026-06-21 04:23:17', '2026-06-21 04:26:00'),
(24, 'App\\Models\\User', '1007c1fe-171a-46ff-a2c5-9f94e5b7f142', 'redp_token', '60dc9636898a41d7d92b1380ee05e4d47a86a45cd498801b902b88c14cdda05b', '[\"*\"]', '2026-06-21 06:50:28', NULL, '2026-06-21 04:28:01', '2026-06-21 06:50:28'),
(25, 'App\\Models\\User', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'redp_token', '492e4140532abd73d48c4d51ffb4b58fa36827270b1be6aad92fafc6f8d3cfb0', '[\"*\"]', '2026-06-21 06:47:50', NULL, '2026-06-21 05:31:58', '2026-06-21 06:47:50');

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  `company_id` char(36) NOT NULL,
  `department_id` char(36) DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 5,
  `min_salary` decimal(14,2) DEFAULT NULL,
  `max_salary` decimal(14,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `responsibilities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`responsibilities`)),
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`id`, `title`, `code`, `company_id`, `department_id`, `level`, `min_salary`, `max_salary`, `description`, `responsibilities`, `status`, `created_at`, `updated_at`) VALUES
('2f75d065-abe8-4074-a62a-bebcf7626a3f', 'Department Head', 'POS-DH', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, 3, NULL, NULL, NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('46ef4bc9-ac4d-4e7b-9127-7f01acfe535e', 'Senior Officer', 'POS-SO', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, 5, NULL, NULL, NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('47a8660f-f28d-4b3a-a3a2-898acc68287d', 'Chief Executive Officer (CEO)', 'POS-CEO', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '8614cb63-069a-4d87-a299-25f50f8e878c', 1, NULL, NULL, NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('5bd1ab62-797e-4206-986a-b68622e07955', 'Executive Director', 'POS-ED', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '8614cb63-069a-4d87-a299-25f50f8e878c', 2, NULL, NULL, NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'Officer Specialist', 'POS-OF', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, 6, NULL, NULL, NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', 'Team Leader', 'POS-TL', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, 4, NULL, NULL, NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00');

-- --------------------------------------------------------

--
-- Table structure for table `profit_centers`
--

CREATE TABLE `profit_centers` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `total_units` int(11) NOT NULL DEFAULT 0,
  `status` varchar(255) NOT NULL DEFAULT 'planning',
  `land_area` decimal(12,2) DEFAULT NULL,
  `land_area_unit` enum('sqm','feddan','acre') NOT NULL DEFAULT 'sqm',
  `building_ratio` decimal(5,2) DEFAULT NULL,
  `max_height_allowed` decimal(6,2) DEFAULT NULL,
  `max_floors_allowed` int(11) DEFAULT NULL,
  `total_buildings_count` int(11) NOT NULL DEFAULT 0,
  `total_built_area` decimal(14,2) DEFAULT NULL,
  `total_green_area` decimal(12,2) DEFAULT NULL,
  `total_roads_area` decimal(12,2) DEFAULT NULL,
  `total_parking_spaces` decimal(8,0) DEFAULT NULL,
  `infrastructure_notes` text DEFAULT NULL,
  `density_per_feddan` decimal(8,2) DEFAULT NULL,
  `master_plan_status` enum('draft','review','approved') NOT NULL DEFAULT 'draft',
  `project_type` enum('residential','commercial','mixed_use','resort') NOT NULL DEFAULT 'residential',
  `image_url` varchar(255) DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `released_phases` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `tenant_id`, `name`, `location`, `total_units`, `status`, `land_area`, `land_area_unit`, `building_ratio`, `max_height_allowed`, `max_floors_allowed`, `total_buildings_count`, `total_built_area`, `total_green_area`, `total_roads_area`, `total_parking_spaces`, `infrastructure_notes`, `density_per_feddan`, `master_plan_status`, `project_type`, `image_url`, `delivery_date`, `created_at`, `updated_at`, `released_phases`) VALUES
('02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, 'Uptown Residence', '6th of October City, Egypt', 80, 'planning', NULL, 'sqm', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'draft', 'residential', 'projects/02f41010-d223-46c6-90f3-2cb42fbd4d76/dud4WA0ov2gM94fFM7Fq4ohBCwqiB4ZTExIJWy1m.jpg', '2028-06-30', '2026-06-11 07:43:06', '2026-06-15 05:19:21', NULL),
('623f1780-4ed7-4db4-a558-2e65e5238431', NULL, 'Creekview', 'New Cairo', 42, 'active', 45000.00, 'sqm', 20.00, 18.00, 5, 5, 21000.00, 18000.00, 10500.00, 180, 'Central concentric lagoon filtration system, smart waste disposal channels, premium creek-side promenade lighting, CCTV monitoring, underground parking access, and solar energy grids for common areas.', 3.36, 'approved', 'residential', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/F4pHrf0uqE5915Z2FqeNxxSk3Ie1ypukgTcXVrum.png', '2028-12-31', '2026-06-21 05:55:17', '2026-06-21 06:51:22', NULL),
('fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, 'Patio Luxury Compound', 'New Cairo, Egypt', 13, 'construction', 50.00, 'sqm', 40.00, 36.00, 10, 1, 10.00, 20.00, 10.00, 10, NULL, 756.00, 'approved', 'resort', NULL, '2027-12-31', '2026-06-11 07:43:06', '2026-06-17 04:43:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_amenities`
--

CREATE TABLE `project_amenities` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_ar` varchar(255) DEFAULT NULL,
  `type` enum('swimming_pool','gym','garden','playground','mosque','commercial_area','security_room','clubhouse','walking_track','parking_lot','water_feature','sports_court','barbecue_area','kids_area','generator_room','water_tanks','electrical_room','guard_house','other') NOT NULL DEFAULT 'other',
  `area` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_amenities`
--

INSERT INTO `project_amenities` (`id`, `project_id`, `name`, `name_ar`, `type`, `area`, `quantity`, `description`, `created_at`, `updated_at`) VALUES
('15f5cb5d-533e-4e15-81d7-2325f043ed83', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Creek Walk Promenade & Parks', 'ممشى القنال والحدائق المائية', 'walking_track', 4500.00, 1, 'Waterfront boardwalk featuring pedestrian pathways, seating decks, and green parks lining the central creek.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('277fb383-125b-4b2a-bc00-ca895fddafc1', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Clubhouse & Dining Pavilion', 'الكلوب هاوس ومجمع المطاعم', 'clubhouse', 1800.00, 1, 'The premium blue-roofed clubhouse pavilion in the top-right entry zone containing fitness, spa, and community spaces.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('4585a23c-7913-49ca-a2e1-d13451629479', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Central Concentric Lagoon Pool', 'بحيرة لاغون المركزية', 'swimming_pool', 2200.00, 1, 'A large circular crystal-clear central lagoon and sun deck in the middle of the circular Lagoon Zone.', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('65e6b9f0-a243-4ac3-b90d-104abe22aeea', '623f1780-4ed7-4db4-a558-2e65e5238431', 'West Kids Play Garden', 'حديقة ألعاب الأطفال الغربية', 'kids_area', 950.00, 1, 'Lush green play park located within the quiet West Townhouses strip.', '2026-06-21 06:51:22', '2026-06-21 06:51:22');

-- --------------------------------------------------------

--
-- Table structure for table `project_media`
--

CREATE TABLE `project_media` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `media_type` varchar(255) NOT NULL,
  `reference_key` varchar(255) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `model_3d_status` varchar(255) DEFAULT NULL,
  `model_3d_url` text DEFAULT NULL,
  `tripo_task_id` varchar(255) DEFAULT NULL,
  `tripo_error_msg` text DEFAULT NULL,
  `model_generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_media`
--

INSERT INTO `project_media` (`id`, `project_id`, `media_type`, `reference_key`, `image_path`, `caption`, `model_3d_status`, `model_3d_url`, `tripo_task_id`, `tripo_error_msg`, `model_generated_at`, `created_at`, `updated_at`) VALUES
('0f727742-d4dd-4fd4-9486-51544b190114', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence A|0', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_a_0.jpg', 'Floor plan layout of Creek Residence A - Floor 0', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('18634bba-e8da-4e79-abe7-e5fe71d8d47d', '623f1780-4ed7-4db4-a558-2e65e5238431', 'building', 'Lagoon Pavilion C', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/buildings/bldg_lagoon_pavilion_c.jpg', 'External view of Lagoon Pavilion C in its designated zone', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('1d2e2db3-3508-4291-a406-c67a60111a8c', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence B|0', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_b_0.jpg', 'Floor plan layout of Creek Residence B - Floor 0', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('22e2ebe7-149e-472a-972e-301ccbff010c', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence A|4', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_a_4.jpg', 'Floor plan layout of Creek Residence A - Floor 4', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('2658ce47-75e5-4431-86f0-272d945ed017', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Lagoon Pavilion C|0', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_lagoon_pavilion_c_0.jpg', 'Floor plan layout of Lagoon Pavilion C - Floor 0', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('30dfdca7-fffe-430d-8753-cb561e1893aa', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence A|1', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_a_1.jpg', 'Floor plan layout of Creek Residence A - Floor 1', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('5046798f-1f46-4058-bdc5-1448357b64a7', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Clubhouse Pavilion E|0', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_clubhouse_pavilion_e_0.jpg', 'Floor plan layout of Clubhouse Pavilion E - Floor 0', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('6abe5b70-f7ad-43ea-9376-4a5211557007', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence B|2', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_b_2.jpg', 'Floor plan layout of Creek Residence B - Floor 2', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('6f129385-4b54-41b8-98de-25256d00712f', '02f41010-d223-46c6-90f3-2cb42fbd4d76', 'floor_plan', 'Building 12|3', 'projects/02f41010-d223-46c6-90f3-2cb42fbd4d76/floors/S3OatiwrfXvEIAwp55GmPFoD0bWQwLBbfMHLuNGR.jpg', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-15 05:22:36', '2026-06-15 05:22:36'),
('74671aad-86e6-4778-a35a-54625d5908c6', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'West Townhouse Block D|0', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_west_townhouse_block_d_0.jpg', 'Floor plan layout of West Townhouse Block D - Floor 0', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('76e1232c-5226-4489-814b-0c10292ae24a', '623f1780-4ed7-4db4-a558-2e65e5238431', 'building', 'Clubhouse Pavilion E', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/buildings/bldg_clubhouse_pavilion_e.jpg', 'External view of Clubhouse Pavilion E in its designated zone', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('8215af21-5019-4106-a434-13f299c6a144', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence B|1', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_b_1.jpg', 'Floor plan layout of Creek Residence B - Floor 1', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('823aea91-021b-49e5-a7fa-ca3af574a2e2', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence A|3', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_a_3.jpg', 'Floor plan layout of Creek Residence A - Floor 3', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('8eed846c-3abf-429e-aa20-817095502f54', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Lagoon Pavilion C|1', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_lagoon_pavilion_c_1.jpg', 'Floor plan layout of Lagoon Pavilion C - Floor 1', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('9811b67d-a747-4118-ad85-9ff30661c518', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Clubhouse Pavilion E|1', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_clubhouse_pavilion_e_1.jpg', 'Floor plan layout of Clubhouse Pavilion E - Floor 1', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('9d675d1d-93b9-4f4e-a4be-a7e34fa8c14a', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence B|3', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_b_3.jpg', 'Floor plan layout of Creek Residence B - Floor 3', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('bb142432-b989-4274-af72-7f7eab36b1de', '623f1780-4ed7-4db4-a558-2e65e5238431', 'building', 'West Townhouse Block D', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/buildings/bldg_west_townhouse_block_d.jpg', 'External view of West Townhouse Block D in its designated zone', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('c1baf217-41be-496f-83e2-cefebb1a99d1', '02f41010-d223-46c6-90f3-2cb42fbd4d76', 'building', 'Building 12', 'projects/02f41010-d223-46c6-90f3-2cb42fbd4d76/buildings/ZTpvnvndsc34WBRptkcbcCXKcymi5AqXWC4jwxPG.jpg', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-15 05:22:01', '2026-06-15 05:22:01'),
('c537b690-5aa4-49cf-8b54-30df5eb8db80', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'West Townhouse Block D|1', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_west_townhouse_block_d_1.jpg', 'Floor plan layout of West Townhouse Block D - Floor 1', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('c769fb18-12d0-42bd-8513-fa85d7146e76', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Lagoon Pavilion C|2', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_lagoon_pavilion_c_2.jpg', 'Floor plan layout of Lagoon Pavilion C - Floor 2', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('d725ffa6-acba-428d-896c-4786886d16a1', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence B|4', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_b_4.jpg', 'Floor plan layout of Creek Residence B - Floor 4', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('dbd674c1-b69f-4f7c-bf48-8f0630d55b9d', '623f1780-4ed7-4db4-a558-2e65e5238431', 'building', 'Creek Residence B', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/buildings/bldg_creek_residence_b.jpg', 'External view of Creek Residence B in its designated zone', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('e0e0567a-dd0e-45f3-821b-c755a254cb63', '623f1780-4ed7-4db4-a558-2e65e5238431', 'floor_plan', 'Creek Residence A|2', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/floors/floor_creek_residence_a_2.jpg', 'Floor plan layout of Creek Residence A - Floor 2', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('f8806dc6-b569-44fd-983d-9f3af09dcb85', '623f1780-4ed7-4db4-a558-2e65e5238431', 'building', 'Creek Residence A', 'projects/623f1780-4ed7-4db4-a558-2e65e5238431/buildings/bldg_creek_residence_a.jpg', 'External view of Creek Residence A in its designated zone', NULL, NULL, NULL, NULL, NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22');

-- --------------------------------------------------------

--
-- Table structure for table `project_payment_plans`
--

CREATE TABLE `project_payment_plans` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_ar` varchar(255) NOT NULL,
  `down_payment_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `installments` int(11) NOT NULL DEFAULT 0,
  `discount_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_payment_plans`
--

INSERT INTO `project_payment_plans` (`id`, `project_id`, `name`, `name_ar`, `down_payment_pct`, `installments`, `discount_pct`, `description`, `settings`, `created_at`, `updated_at`) VALUES
('1bd7edfc-50db-4e1e-87c5-7c951b5cd62e', 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', '7-Year Plan', 'خطة 7 سنوات', 15.00, 84, 0.00, '15% down payment + 84 monthly installments', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":7,\"installmentInterest\":0,\"installmentStartMonth\":1}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('2b96dcf7-7c98-4b28-bd2f-92497a83ac17', '02f41010-d223-46c6-90f3-2cb42fbd4d76', '7-Year Plan', 'خطة 7 سنوات', 15.00, 84, 0.00, '15% down payment + 84 monthly installments', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":7,\"installmentInterest\":0,\"installmentStartMonth\":1}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('361baae3-fb05-4ef8-8b53-9db94d79a5f9', 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', '10-Year Plan', 'خطة 10 سنوات', 10.00, 120, 0.00, '10% down payment + 120 monthly installments', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":10,\"installmentInterest\":0,\"installmentStartMonth\":1,\"enableAnnual\":true,\"annualInstallmentAmount\":\"50000\",\"includeClub\":true,\"clubCost\":\"150000\",\"clubPaymentMethod\":\"installment\",\"clubTerm\":10,\"clubInstallmentStartYear\":1,\"includeGarage\":true,\"garageCost\":\"100000\",\"garagePaymentMethod\":\"installment\",\"garageTerm\":10,\"garageInstallmentStartYear\":1,\"includeMaintenance\":true,\"maintenanceCost\":\"200000\",\"maintenancePaymentMethod\":\"installment\",\"maintenanceTerm\":10,\"maintenanceInstallmentStartYear\":1}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('497f2739-4474-4ebb-b5a8-49aaf70a4923', '623f1780-4ed7-4db4-a558-2e65e5238431', 'Cash Payment Plan', 'خطة الدفع الكاش', 100.00, 0, 12.00, 'Full cash payment with an attractive 12% discount', '{\"finalPaymentMethod\":\"cash\",\"cashGracePeriod\":14}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('8c20bf83-40d5-40d1-9bab-0681d64e84c5', '623f1780-4ed7-4db4-a558-2e65e5238431', '8-Year Extended Plan', 'خطة تقسيط ممتدة 8 سنوات', 10.00, 96, 0.00, '10% down payment with equal installments over 8 years (96 monthly payments)', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":8,\"installmentInterest\":0,\"installmentStartMonth\":1}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('9f72305f-c804-4bcd-8e5d-f301797ed953', '02f41010-d223-46c6-90f3-2cb42fbd4d76', '5-Year Plan', 'خطة 5 سنوات', 20.00, 60, 0.00, '20% down payment + 60 monthly installments', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":5,\"installmentInterest\":0,\"installmentStartMonth\":1}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('a495fa95-d80f-4ad0-ab6d-f00458a24f86', '02f41010-d223-46c6-90f3-2cb42fbd4d76', 'Cash Payment', 'كاش', 100.00, 0, 10.00, 'Full cash payment with 10% discount', '{\"finalPaymentMethod\":\"cash\",\"cashGracePeriod\":14}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('aedbc112-e5df-4c22-9f87-0ab78faeac09', '623f1780-4ed7-4db4-a558-2e65e5238431', '5-Year Installment Plan', 'خطة تقسيط 5 سنوات', 15.00, 60, 0.00, '15% down payment and equal installments over 5 years (60 monthly payments)', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":5,\"installmentInterest\":0,\"installmentStartMonth\":1}', '2026-06-21 06:51:22', '2026-06-21 06:51:22'),
('b9fbfd38-ce98-4d00-9e71-f271cc719234', '02f41010-d223-46c6-90f3-2cb42fbd4d76', '10-Year Plan', 'خطة 10 سنوات', 10.00, 120, 0.00, '10% down payment + 120 monthly installments', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":10,\"installmentInterest\":0,\"installmentStartMonth\":1,\"enableAnnual\":true,\"annualInstallmentAmount\":\"50000\",\"includeClub\":true,\"clubCost\":\"150000\",\"clubPaymentMethod\":\"installment\",\"clubTerm\":10,\"clubInstallmentStartYear\":1,\"includeGarage\":true,\"garageCost\":\"100000\",\"garagePaymentMethod\":\"installment\",\"garageTerm\":10,\"garageInstallmentStartYear\":1,\"includeMaintenance\":true,\"maintenanceCost\":\"200000\",\"maintenancePaymentMethod\":\"installment\",\"maintenanceTerm\":10,\"maintenanceInstallmentStartYear\":1}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('bbd5a9d9-9ec9-4f23-bfeb-8b49ce2eeb09', 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', '5-Year Plan', 'خطة 5 سنوات', 20.00, 60, 0.00, '20% down payment + 60 monthly installments', '{\"finalPaymentMethod\":\"installment\",\"installmentType\":\"direct\",\"interestType\":\"reducing\",\"installmentTerm\":5,\"installmentInterest\":0,\"installmentStartMonth\":1}', '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('d1daa185-4827-4725-90e0-34b39e213c90', 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', 'Cash Payment', 'كاش', 100.00, 0, 10.00, 'Full cash payment with 10% discount', '{\"finalPaymentMethod\":\"cash\",\"cashGracePeriod\":14}', '2026-06-11 07:43:06', '2026-06-11 07:43:06');

-- --------------------------------------------------------

--
-- Table structure for table `project_phases`
--

CREATE TABLE `project_phases` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `status` enum('planned','active','completed') NOT NULL DEFAULT 'planned',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `po_number` varchar(255) NOT NULL,
  `purchase_request_id` char(36) DEFAULT NULL,
  `rfq_id` char(36) DEFAULT NULL,
  `vendor_quotation_id` char(36) DEFAULT NULL,
  `vendor_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('draft','pending_approval','approved','rejected','sent_to_vendor','goods_received','partially_received','invoiced','completed','cancelled') NOT NULL DEFAULT 'draft',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requests`
--

CREATE TABLE `purchase_requests` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `requested_by` char(36) NOT NULL,
  `department_id` char(36) DEFAULT NULL,
  `estimated_cost` decimal(15,2) NOT NULL,
  `required_by_date` date DEFAULT NULL,
  `status` enum('draft','pending_approval','approved','rejected','rfq_created','ordered','completed') NOT NULL DEFAULT 'draft',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `regions`
--

CREATE TABLE `regions` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  `company_id` char(36) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `regions`
--

INSERT INTO `regions` (`id`, `name`, `code`, `company_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
('d68587ee-b316-4f60-9bbe-be1cb122bb0d', 'Cairo Greater Region', 'REG-CAI', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', 'Greater Cairo Metropolitan Area', 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59');

-- --------------------------------------------------------

--
-- Table structure for table `resale_requests`
--

CREATE TABLE `resale_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `unit_id` char(36) NOT NULL,
  `asking_price` decimal(15,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `reviewed_by` char(36) DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rescheduling_requests`
--

CREATE TABLE `rescheduling_requests` (
  `id` char(36) NOT NULL,
  `contract_id` char(36) NOT NULL,
  `reason` text NOT NULL,
  `current_installments` int(11) NOT NULL,
  `proposed_installments_count` int(11) NOT NULL,
  `proposed_monthly_amount` decimal(15,2) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rescheduling_requests`
--

INSERT INTO `rescheduling_requests` (`id`, `contract_id`, `reason`, `current_installments`, `proposed_installments_count`, `proposed_monthly_amount`, `status`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`) VALUES
('77e8ffc8-58d9-4906-861c-3c3444ad89ff', '14778e06-822f-42e9-bdfc-858f68b4ef0a', 'Medical emergency impacted temporary cash flow. Restructure request.', 24, 36, 258333.33, 'approved', NULL, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('abba51eb-30f7-40ac-b84e-832010665e9f', '61259272-f613-4338-aaf0-714a3e1754cd', 'Restructuring to 20 installments due to commercial investment changes.', 12, 20, 150000.00, 'pending', NULL, NULL, '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `unit_id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `broker_id` char(36) DEFAULT NULL,
  `eoi_amount` decimal(15,2) NOT NULL,
  `payment_receipt_path` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `approval_notes` text DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` char(36) DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `tenant_id`, `unit_id`, `client_id`, `broker_id`, `eoi_amount`, `payment_receipt_path`, `status`, `approval_notes`, `expires_at`, `cancelled_by`, `cancellation_reason`, `created_at`, `updated_at`) VALUES
('11fe74b8-9950-4c22-9460-7f684eac2d98', NULL, '961e4c37-d65e-4516-ac27-6a01e240b679', '3d4270b4-ae06-4aae-bb84-04c294e5c038', NULL, 50000.00, NULL, 'confirmed', NULL, '2026-06-21 05:39:00', NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('f5330c58-d6ee-4e1e-b5a1-96d3ecb1637e', NULL, '24508d2a-c9a0-41ea-8423-b2ca1d247865', 'a9250aee-0119-4a17-a237-259e4fe83abb', NULL, 50000.00, NULL, 'confirmed', NULL, '2026-06-21 05:36:04', NULL, NULL, '2026-06-14 05:36:04', '2026-06-14 05:36:04');

-- --------------------------------------------------------

--
-- Table structure for table `resource_allocations`
--

CREATE TABLE `resource_allocations` (
  `id` char(36) NOT NULL,
  `milestone_id` char(36) NOT NULL,
  `resource_type` enum('labor','equipment','material') NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `cost` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rfqs`
--

CREATE TABLE `rfqs` (
  `id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `purchase_request_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `status` enum('draft','sent','closed','completed') NOT NULL DEFAULT 'draft',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES
('0b0c438f-d50e-432f-96ef-b2194455fb45', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', 'efe93f7b-2305-499f-b81b-11c8bdc0ecf7', '2026-06-11 07:43:07'),
('0da21a46-1efb-4bc6-acf1-6985340248f4', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'e75fa48d-d854-443b-ba53-f9e7cd3a70e4', '2026-06-11 07:43:07'),
('0ea64b10-008d-405c-9836-93f1534f39c4', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', 'ab9ecece-2c19-467e-9a8c-3d37b1d8a163', '2026-06-11 07:43:07'),
('105ec047-06c1-430b-aedd-e4667604d86f', '72674634-79a8-4b74-a122-d2e59d59d0e5', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-16 08:35:24'),
('1099c7c1-e0eb-41e0-af9d-b190ee8d0be2', '964f5ce5-6fda-4b40-82e4-0be181c10904', '9eca95ac-9c7a-43a3-9111-44d3330c1aa7', '2026-06-11 07:43:07'),
('10e9475b-ebdd-4fb5-ac60-8c9101f97fd6', '196af811-9d7d-4023-b00d-77c0d2c53d13', '2210b6a6-802b-404d-9961-3556f88399dc', '2026-06-11 07:43:07'),
('120e90f3-605a-4f95-bf45-67b6046a4cb3', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-16 08:35:24'),
('137cff7f-d8bb-4861-b5d6-db833fe9b77f', '51564f8d-ce5e-4081-a904-df55f9629a5c', 'fa51d7de-3390-43f3-9369-7b94daf464dd', '2026-06-16 08:35:24'),
('140480ed-478a-4c2d-9277-84dfd4650c52', '964f5ce5-6fda-4b40-82e4-0be181c10904', '51bd0fbe-c958-434b-acdd-5747eaa8c3a2', '2026-06-11 07:43:07'),
('1950b993-9960-4f56-a897-8f76c7b5ae8a', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', '51bd0fbe-c958-434b-acdd-5747eaa8c3a2', '2026-06-16 08:35:24'),
('1f25b49a-430a-499c-817f-65ab96573802', 'f2ff44b8-0327-4195-953f-2961fb06a4af', 'ab9ecece-2c19-467e-9a8c-3d37b1d8a163', '2026-06-11 07:43:07'),
('1f9c2c09-5a67-4b44-ae8d-b505d9de2a66', '196af811-9d7d-4023-b00d-77c0d2c53d13', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-11 07:43:07'),
('201e0cc4-afa4-47d1-ae8f-ea09f0ebced8', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-11 07:43:07'),
('21efc0b4-b2ce-462e-8c48-481c34ef589b', '0e7d515f-7828-498d-a59b-43b2a3ff445b', '84388928-ad7c-4d26-94bc-df5dbb3ea10c', '2026-06-16 08:35:24'),
('22ae8409-7cc1-4b94-967d-f79d9334731e', '586484db-a17f-499a-91ab-82f4ea5ad45b', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-11 07:43:07'),
('230cdffa-d42e-4711-ba2d-19083f9a06eb', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', '9eca95ac-9c7a-43a3-9111-44d3330c1aa7', '2026-06-16 08:35:24'),
('2a8857c5-1a0f-46d0-b73d-fa156905d139', 'a72f6c85-0657-44dd-87d0-753d42daf271', 'd6036823-836d-4dd2-b5fc-f9f95becd73d', '2026-06-16 08:35:24'),
('2bb44846-4a91-44bf-ac10-5220901e8976', '196af811-9d7d-4023-b00d-77c0d2c53d13', '9cecb5e8-0f44-4e5a-a949-6f0397ab61a8', '2026-06-11 07:43:07'),
('2cc451b7-b269-4528-b0ff-84a16033c310', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'c50887d2-aa75-4c40-97c7-fa1a75e734db', '2026-06-11 07:43:07'),
('2d768813-75a5-44ac-87a6-9dab2df7d477', 'a72f6c85-0657-44dd-87d0-753d42daf271', 'b3e52e2a-b2f1-43e9-a2b7-2a1e4161facb', '2026-06-16 08:35:24'),
('2d98f6ca-5d2f-448d-b748-837543d5ae1c', '0e7d515f-7828-498d-a59b-43b2a3ff445b', 'c5b507f9-2f4f-4743-ac4c-9223dd4bfe73', '2026-06-16 08:35:24'),
('2dc286ed-bd0d-4ed1-868d-bb5397197c63', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-11 07:43:07'),
('3554bae1-4d80-40a5-ba45-149a3f5ed135', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', '59082fb1-89c1-4373-af49-870195090ecf', '2026-06-11 07:43:07'),
('35aa179c-36e6-4e18-a3f0-1986ef8d101d', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'dcdcb754-ffb0-4389-9212-c58a3f9424bf', '2026-06-16 08:35:24'),
('35c11c1c-2f80-40b6-8539-b313ae00bbbd', 'a72f6c85-0657-44dd-87d0-753d42daf271', 'f61a4d43-cfb0-4351-8542-88efe258fce0', '2026-06-16 08:35:24'),
('37228e77-d18b-4cda-b085-54395cfc42fe', '586484db-a17f-499a-91ab-82f4ea5ad45b', '722566ad-50a9-4965-b4fd-055b29806226', '2026-06-11 07:43:07'),
('37f4cad6-4c69-4154-98a2-9c15a50c7848', '964f5ce5-6fda-4b40-82e4-0be181c10904', '70779b5c-695a-4274-8b30-7d37ee7ddfb8', '2026-06-11 07:43:07'),
('38b8632f-01c1-437f-87d1-b3b6536e13e5', '0e7d515f-7828-498d-a59b-43b2a3ff445b', 'efe93f7b-2305-499f-b81b-11c8bdc0ecf7', '2026-06-16 08:35:24'),
('3a84f6fe-7496-4510-8044-fe26014b0933', '03ab1bb6-b6da-475d-8bd2-d1c891032914', 'ab9ecece-2c19-467e-9a8c-3d37b1d8a163', '2026-06-11 07:43:07'),
('3c72bb69-75a6-41da-9369-beea013418fd', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', 'f8a176e3-ee44-48ef-89ad-c418c79f2ffc', '2026-06-11 07:43:07'),
('3cd79445-1780-4d45-9903-9db94e99e381', 'a72f6c85-0657-44dd-87d0-753d42daf271', '49cf90b7-e7f1-44b2-9d34-7ae0e8aa7d11', '2026-06-16 08:35:24'),
('40fdde5f-d3b7-474a-bae9-21d7d11a80fe', '196af811-9d7d-4023-b00d-77c0d2c53d13', 'b9345d64-b438-4783-a391-5e3f765069de', '2026-06-11 07:43:07'),
('41241a0c-9396-43d5-bb61-9bf0d055356d', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'ab9ecece-2c19-467e-9a8c-3d37b1d8a163', '2026-06-16 08:35:24'),
('440f87d5-4cf9-493c-a408-4db8fc3b3410', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', 'e23c7d64-b75d-4c32-9525-341d064c05b1', '2026-06-16 08:35:24'),
('44906557-0bff-4a2e-8ee7-d5c6a986040d', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', '722566ad-50a9-4965-b4fd-055b29806226', '2026-06-11 07:43:07'),
('45e9f544-07f9-4b3c-b7d2-2eece565f6a7', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-16 08:35:24'),
('4a6fdf04-b8d4-4388-ae2e-94b376d2cf70', '964f5ce5-6fda-4b40-82e4-0be181c10904', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-11 07:43:07'),
('4a733378-c99d-4f23-ae46-6a828d7b7955', '0e7d515f-7828-498d-a59b-43b2a3ff445b', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-16 08:35:24'),
('5024761e-8e07-4498-9ecf-21e604ac8301', '51564f8d-ce5e-4081-a904-df55f9629a5c', '94634fa8-e42b-4b72-8a09-117f13376f1c', '2026-06-16 08:35:24'),
('50e4af37-6dc8-4b6d-aa7f-a379a46e958f', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-11 07:43:07'),
('54133893-0d2d-4de3-a459-0adfe78924d9', '51564f8d-ce5e-4081-a904-df55f9629a5c', 'fa08e30f-7f13-4753-bc8e-77bd2e68b087', '2026-06-16 08:35:24'),
('547357e8-3808-4a35-b6f5-01845bd6c0c0', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'b523e872-b7d4-4bfb-9ab4-aaad7d1a7f6c', '2026-06-11 07:43:07'),
('549bf0b8-162e-4337-8105-c6fe9fc4d4f1', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-16 08:35:24'),
('57c28c5e-8eb0-4290-85ea-2172346d6750', 'a72f6c85-0657-44dd-87d0-753d42daf271', '479c0e9a-33c2-49de-a5df-11abc1df4ce8', '2026-06-16 08:35:24'),
('57c894c0-52af-4c26-86b4-50bc7ecb0079', '51564f8d-ce5e-4081-a904-df55f9629a5c', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-16 08:35:24'),
('58d3c7cf-90c4-4fb7-8879-6c98640dd55b', '51564f8d-ce5e-4081-a904-df55f9629a5c', 'b9345d64-b438-4783-a391-5e3f765069de', '2026-06-16 08:35:24'),
('5a9442e3-7f97-4c00-90c3-a79a4646905b', '03ab1bb6-b6da-475d-8bd2-d1c891032914', '9eca95ac-9c7a-43a3-9111-44d3330c1aa7', '2026-06-11 07:43:07'),
('5a95d1c2-0db3-48b5-97c7-f1c4994d9010', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', '6adcab5c-ff8b-4de3-9c2d-164dda92172a', '2026-06-11 07:43:07'),
('5cb778f0-327e-476d-93d3-61e12d2fad81', '51564f8d-ce5e-4081-a904-df55f9629a5c', '4e944ed6-ce1e-40c8-a2ba-03db75a1e7bc', '2026-06-16 08:35:24'),
('5da04750-08bc-4fe2-ac3f-e9c1c86f8cce', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', 'c5b507f9-2f4f-4743-ac4c-9223dd4bfe73', '2026-06-11 07:43:07'),
('5e095ba3-5381-49cf-94a5-7ad8b30d3172', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', '722566ad-50a9-4965-b4fd-055b29806226', '2026-06-16 08:35:24'),
('5ead812e-342f-4553-afcc-3c2ee201298a', '51564f8d-ce5e-4081-a904-df55f9629a5c', '2210b6a6-802b-404d-9961-3556f88399dc', '2026-06-16 08:35:24'),
('61860d7c-ee47-4452-b080-1ca82e27c9fa', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-11 07:43:07'),
('61a2610e-3650-43fe-8b3f-2bbef38d8594', '72674634-79a8-4b74-a122-d2e59d59d0e5', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-16 08:35:24'),
('640de183-0a15-4f99-b060-32bcde571b52', 'f2ff44b8-0327-4195-953f-2961fb06a4af', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-11 07:43:07'),
('6469ea89-58e0-40ad-a95a-ac5abbbbaa3f', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-11 07:43:07'),
('649fe94c-e1d4-467d-a037-1158404e1659', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'dcdcb754-ffb0-4389-9212-c58a3f9424bf', '2026-06-11 07:43:07'),
('65211b0f-2499-4081-a5a1-892d4d8cb635', '196af811-9d7d-4023-b00d-77c0d2c53d13', '39ce4a79-ee8d-4dfc-95d9-8746ca7c5e1e', '2026-06-11 07:43:07'),
('65ad977a-7c40-4e0b-ae80-263f6cb70962', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'f8e8ec82-234b-43d3-8d8b-edfe7eb8f06a', '2026-06-11 07:43:07'),
('68a0325d-56ea-4467-aed5-44bfb08a2b60', '196af811-9d7d-4023-b00d-77c0d2c53d13', 'a54871ca-f5f3-410b-ac77-f7312fb90252', '2026-06-11 07:43:07'),
('6c2b26a0-6fef-4356-9b5d-e8ee3fc2366b', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'ab9ecece-2c19-467e-9a8c-3d37b1d8a163', '2026-06-11 07:43:07'),
('6df46b33-94ec-43ee-91cb-7fc408863c9c', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', 'efe93f7b-2305-499f-b81b-11c8bdc0ecf7', '2026-06-11 07:43:07'),
('6ed5a475-9e0f-4a1a-9751-9dfbca94f5d8', '51564f8d-ce5e-4081-a904-df55f9629a5c', '50943080-0b5c-46c9-bb63-0ec6b7ec9b7f', '2026-06-16 08:35:24'),
('71ac92ae-98bf-4a35-8a65-2f0fb6da23a1', '51564f8d-ce5e-4081-a904-df55f9629a5c', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-16 08:35:24'),
('730b0e91-d145-403b-97a4-9e72f79243aa', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'f8e8ec82-234b-43d3-8d8b-edfe7eb8f06a', '2026-06-16 08:35:24'),
('7374fce9-a9a7-47a5-8d7c-840b0728ad3f', '51564f8d-ce5e-4081-a904-df55f9629a5c', '342a0a19-6fea-4929-a58d-bcbc9a697cbb', '2026-06-16 08:35:24'),
('779e3858-ee54-4392-8edf-89f7d4647174', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', '722566ad-50a9-4965-b4fd-055b29806226', '2026-06-16 08:35:24'),
('77f646e6-fd80-4a5c-aa3b-b62d4d99942a', '196af811-9d7d-4023-b00d-77c0d2c53d13', '50943080-0b5c-46c9-bb63-0ec6b7ec9b7f', '2026-06-11 07:43:07'),
('804f4148-334b-439b-b762-a04003189178', '196af811-9d7d-4023-b00d-77c0d2c53d13', '3c636035-5813-440e-8e7a-03db28c544b0', '2026-06-11 07:43:07'),
('8238217b-821d-48e9-9b44-1b7368433809', '196af811-9d7d-4023-b00d-77c0d2c53d13', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-11 07:43:07'),
('89d30193-41d1-46b8-ae96-284de630cfce', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'c50887d2-aa75-4c40-97c7-fa1a75e734db', '2026-06-16 08:35:24'),
('8a18f582-6cb0-4f53-94d4-1ccaaa4d33f0', '586484db-a17f-499a-91ab-82f4ea5ad45b', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-11 07:43:07'),
('8cc03cea-ad41-4e5a-bff2-1a71cb9b9a25', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', 'ceb76c00-2d2e-4144-a619-000ad8f5c30a', '2026-06-11 07:43:07'),
('8ce9979b-2eaf-429a-99bf-0f758cec3833', '964f5ce5-6fda-4b40-82e4-0be181c10904', '67455d13-6089-487c-a4f2-1c32e8cb06b5', '2026-06-11 07:43:07'),
('9373b019-b439-4a5e-ace1-b5bb068e2af8', 'f2ff44b8-0327-4195-953f-2961fb06a4af', '9eca95ac-9c7a-43a3-9111-44d3330c1aa7', '2026-06-11 07:43:07'),
('96bb9115-365a-42e7-9d4c-ab91af3a8d2e', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-11 07:43:07'),
('96cfc2cc-6d8f-4f75-8c4b-44db6c38f273', 'a72f6c85-0657-44dd-87d0-753d42daf271', '842a471d-a7a5-476e-9146-01a14af5e2c7', '2026-06-16 08:35:24'),
('970314b7-9f8a-4483-87af-a9defd14ea25', '586484db-a17f-499a-91ab-82f4ea5ad45b', 'e23c7d64-b75d-4c32-9525-341d064c05b1', '2026-06-11 07:43:07'),
('9711871a-769e-4f2f-8a1a-861f3551b867', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-16 08:35:24'),
('97584926-a1f2-4114-b81a-4a5fae7bb8a2', 'f2ff44b8-0327-4195-953f-2961fb06a4af', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-11 07:43:07'),
('98490692-9187-47b9-add7-3e27eb9724ee', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', '84388928-ad7c-4d26-94bc-df5dbb3ea10c', '2026-06-11 07:43:07'),
('9877a997-6644-466b-b243-f27c59f2e644', '964f5ce5-6fda-4b40-82e4-0be181c10904', '6977cc94-5484-4ac5-bf58-0d9bf33c9050', '2026-06-11 07:43:07'),
('9d5b977e-a98a-4976-9099-f60e51ca187d', '964f5ce5-6fda-4b40-82e4-0be181c10904', '272e554d-4130-470d-ad54-642d320c3d19', '2026-06-11 07:43:07'),
('9e34b2c6-1a96-43cf-9936-3f898717b987', '0e7d515f-7828-498d-a59b-43b2a3ff445b', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-16 08:35:24'),
('9f1c41c4-2bf0-4bfd-9517-4d387c1f4b5f', '51564f8d-ce5e-4081-a904-df55f9629a5c', '0130b888-c22b-4c1b-9cb0-235a1db955b8', '2026-06-16 08:35:24'),
('9f95bbc4-0e76-4f4c-9e81-50cd05fad51b', '196af811-9d7d-4023-b00d-77c0d2c53d13', '7afda72e-3332-491a-92bf-2c3c83c57be8', '2026-06-11 07:43:07'),
('a0ddbc0a-91f2-479b-8da0-7b32129e193f', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-11 07:43:07'),
('a22e4588-d7dd-4636-8247-0fff2f52a4e9', '586484db-a17f-499a-91ab-82f4ea5ad45b', '84388928-ad7c-4d26-94bc-df5dbb3ea10c', '2026-06-11 07:43:07'),
('a29ad615-b0cf-46ff-8364-6fbf01256640', '51564f8d-ce5e-4081-a904-df55f9629a5c', '3c636035-5813-440e-8e7a-03db28c544b0', '2026-06-16 08:35:24'),
('a368fa43-634b-420c-ae70-1c0e5c49d52e', '964f5ce5-6fda-4b40-82e4-0be181c10904', '339105bf-3983-4dcd-a86d-7fd4dcabe773', '2026-06-11 07:43:07'),
('a48ddc09-dc93-4d3a-a554-4529ecc5673a', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', 'e75fa48d-d854-443b-ba53-f9e7cd3a70e4', '2026-06-11 07:43:07'),
('a581e82f-94d3-4ec9-958c-ea54057a3c09', 'a72f6c85-0657-44dd-87d0-753d42daf271', 'a6d1d58f-be03-46c0-a649-7cb3b2bb34fb', '2026-06-16 08:35:24'),
('ae746072-de3e-431a-af7f-0dd01aefd8cc', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', '9eca95ac-9c7a-43a3-9111-44d3330c1aa7', '2026-06-11 07:43:07'),
('af86027a-2cff-4c27-a663-5e7c8223cb85', '196af811-9d7d-4023-b00d-77c0d2c53d13', '4e944ed6-ce1e-40c8-a2ba-03db75a1e7bc', '2026-06-11 07:43:07'),
('af8abc87-1fed-4131-bcb4-62c2692a65f9', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', 'efe93f7b-2305-499f-b81b-11c8bdc0ecf7', '2026-06-16 08:35:24'),
('b0ee6b76-8b71-453f-9ae4-23598afbb864', '03ab1bb6-b6da-475d-8bd2-d1c891032914', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-11 07:43:07'),
('b1ddc0c2-11d6-4843-9458-9b2a915a410c', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', '84388928-ad7c-4d26-94bc-df5dbb3ea10c', '2026-06-16 08:35:24'),
('b6202b4d-b616-4b95-9cd8-440198c1e3ad', '196af811-9d7d-4023-b00d-77c0d2c53d13', '378a8556-8f56-4456-8080-a99474eab992', '2026-06-11 07:43:07'),
('b6bff8ef-f0a4-469c-ac08-e06b21759c3a', '586484db-a17f-499a-91ab-82f4ea5ad45b', 'efe93f7b-2305-499f-b81b-11c8bdc0ecf7', '2026-06-11 07:43:07'),
('b785c90d-4a73-456e-820a-c6d935005003', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'c0f75a20-0603-4062-9acc-eb223c66e876', '2026-06-11 07:43:07'),
('b9ac4c41-d6ed-4124-8ed4-b59f5fb3b7eb', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', 'e23c7d64-b75d-4c32-9525-341d064c05b1', '2026-06-11 07:43:07'),
('b9eb27b9-b55a-4af7-9e83-0bddeb1a5a6f', '51564f8d-ce5e-4081-a904-df55f9629a5c', '378a8556-8f56-4456-8080-a99474eab992', '2026-06-16 08:35:24'),
('baf3b71a-95d2-4df7-bd36-d9681e8841a2', '03ab1bb6-b6da-475d-8bd2-d1c891032914', 'f8a176e3-ee44-48ef-89ad-c418c79f2ffc', '2026-06-11 07:43:07'),
('bbc7385c-10e3-4457-8f0f-70ba472bd3ab', 'a72f6c85-0657-44dd-87d0-753d42daf271', 'a8424c4a-e1c3-4d87-9a5d-15ca0418332e', '2026-06-16 08:35:24'),
('c1a0d97c-c5fe-4f46-b0b1-74d0d7a92b79', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-16 08:35:24'),
('c648902e-0bbc-4092-93d0-621a82a6d5e7', '51564f8d-ce5e-4081-a904-df55f9629a5c', '9cecb5e8-0f44-4e5a-a949-6f0397ab61a8', '2026-06-16 08:35:24'),
('c8d58ec8-b360-48e2-9a25-3b24f25bc423', '51564f8d-ce5e-4081-a904-df55f9629a5c', '7afda72e-3332-491a-92bf-2c3c83c57be8', '2026-06-16 08:35:24'),
('cafcc5f7-b26d-40f4-aa69-eceb1e0dde5a', 'a72f6c85-0657-44dd-87d0-753d42daf271', '9f180aea-12e6-43dd-a18c-96afb3889702', '2026-06-16 08:35:24'),
('cde5d75e-7a2e-4337-815c-62a245f504be', '586484db-a17f-499a-91ab-82f4ea5ad45b', '39dabdd7-5fc0-4aa1-a532-4b657210037b', '2026-06-11 07:43:07'),
('d136bd9b-7e83-413d-b0ae-0c6e88937469', '196af811-9d7d-4023-b00d-77c0d2c53d13', 'fa51d7de-3390-43f3-9369-7b94daf464dd', '2026-06-11 07:43:07'),
('d1622c4d-b704-400d-848f-8c93dec8474d', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'ad33b473-0127-4497-a966-dcb531e309cb', '2026-06-11 07:43:07'),
('d194f265-47b6-477d-a3f7-9dd63fa79d28', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'e75fa48d-d854-443b-ba53-f9e7cd3a70e4', '2026-06-16 08:35:24'),
('d3380c08-1545-4f3b-af14-18bfc565a945', 'a72f6c85-0657-44dd-87d0-753d42daf271', '5ed02b9a-59d5-4801-9b35-b1ceedbfba0d', '2026-06-16 08:35:24'),
('d3f16472-53c8-48c8-8358-55a8ba404e60', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', '722566ad-50a9-4965-b4fd-055b29806226', '2026-06-11 07:43:07'),
('d742e7d7-9bc8-4dd2-b741-dcf55149f8a4', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'e23c7d64-b75d-4c32-9525-341d064c05b1', '2026-06-11 07:43:07'),
('d8ed0e31-76ec-47bd-b04b-31eaeb32c841', '196af811-9d7d-4023-b00d-77c0d2c53d13', '94634fa8-e42b-4b72-8a09-117f13376f1c', '2026-06-11 07:43:07'),
('d93bcd00-48a5-46f7-9086-086a6645b78f', '964f5ce5-6fda-4b40-82e4-0be181c10904', 'f8a176e3-ee44-48ef-89ad-c418c79f2ffc', '2026-06-11 07:43:07'),
('db11725b-acda-4e82-ac34-9816f71af708', '196af811-9d7d-4023-b00d-77c0d2c53d13', '453e9fdc-308b-4a49-b8df-f93d7f15a1d9', '2026-06-11 07:43:07'),
('df86b81c-8981-491d-9cc4-9ec731a74b5d', 'a72f6c85-0657-44dd-87d0-753d42daf271', '3c7f405e-1f32-4b9d-ae82-1ee03a05e927', '2026-06-16 08:35:24'),
('e07ed4cc-5e66-4a43-8120-b703ac330af6', '196af811-9d7d-4023-b00d-77c0d2c53d13', '0130b888-c22b-4c1b-9cb0-235a1db955b8', '2026-06-11 07:43:07'),
('e3166080-8fc8-45c9-bb97-8d53896d9869', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', 'f8a176e3-ee44-48ef-89ad-c418c79f2ffc', '2026-06-16 08:35:24'),
('e3608480-deb8-4015-a79d-18788e55cfcd', '0e7d515f-7828-498d-a59b-43b2a3ff445b', '59082fb1-89c1-4373-af49-870195090ecf', '2026-06-16 08:35:24'),
('e80855d0-a8df-4e17-9824-70da70e0e8c3', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', '84388928-ad7c-4d26-94bc-df5dbb3ea10c', '2026-06-11 07:43:07'),
('ea810c9f-3174-4ad0-a088-51f86dcf2322', '0e7d515f-7828-498d-a59b-43b2a3ff445b', '722566ad-50a9-4965-b4fd-055b29806226', '2026-06-16 08:35:24'),
('eb3399b3-1012-44e3-a4c9-9d5ad3c1ac5d', '196af811-9d7d-4023-b00d-77c0d2c53d13', 'fa08e30f-7f13-4753-bc8e-77bd2e68b087', '2026-06-11 07:43:07'),
('f0b4aa1a-feb5-49d8-bcc6-7f8ed9d33542', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', '59082fb1-89c1-4373-af49-870195090ecf', '2026-06-16 08:35:24'),
('f392f310-83cc-429d-9270-1d5b78160b5b', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', '59082fb1-89c1-4373-af49-870195090ecf', '2026-06-11 07:43:07'),
('f45a51cf-dc95-422d-870b-f5e15bdb96cd', '51564f8d-ce5e-4081-a904-df55f9629a5c', '453e9fdc-308b-4a49-b8df-f93d7f15a1d9', '2026-06-16 08:35:24'),
('f4f862c0-6fb6-44dc-8963-8de755dd52b9', 'a72f6c85-0657-44dd-87d0-753d42daf271', '557ec0d8-82f0-439e-98ff-5c2067fce498', '2026-06-16 08:35:24'),
('fa0624be-d8df-4a33-8cb7-62d79463e9a0', '51564f8d-ce5e-4081-a904-df55f9629a5c', 'a54871ca-f5f3-410b-ac77-f7312fb90252', '2026-06-16 08:35:24'),
('fc8a1e15-49f5-48b1-b297-7b8e3b73c7b9', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', '722566ad-50a9-4965-b4fd-055b29806226', '2026-06-11 07:43:07'),
('fe164741-0c5c-4628-bdf9-c786a66d6771', '196af811-9d7d-4023-b00d-77c0d2c53d13', '342a0a19-6fea-4929-a58d-bcbc9a697cbb', '2026-06-11 07:43:07'),
('ff6bec79-31a8-42c3-9a55-ebcc47b253b1', 'a72f6c85-0657-44dd-87d0-753d42daf271', '9cc87c79-6763-4bc2-956b-9df27d0955e0', '2026-06-16 08:35:24'),
('ffb49bae-e189-4b23-b5e5-6192a77a8cba', '51564f8d-ce5e-4081-a904-df55f9629a5c', '39ce4a79-ee8d-4dfc-95d9-8746ca7c5e1e', '2026-06-16 08:35:24');

-- --------------------------------------------------------

--
-- Table structure for table `service_requests`
--

CREATE TABLE `service_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `unit_id` char(36) NOT NULL,
  `service_type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` varchar(255) NOT NULL DEFAULT 'medium',
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `assigned_vendor` varchar(255) DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_inspections`
--

CREATE TABLE `site_inspections` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `milestone_id` char(36) DEFAULT NULL,
  `inspector_id` char(36) NOT NULL,
  `inspection_date` date NOT NULL,
  `comments` text DEFAULT NULL,
  `status` enum('passed','failed','pending_action') NOT NULL DEFAULT 'passed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_configs`
--

CREATE TABLE `system_configs` (
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_configs`
--

INSERT INTO `system_configs` (`key`, `value`, `created_at`, `updated_at`) VALUES
('default_broker_commission_rate', '2.5', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('delay_penalty_enabled', 'true', '2026-06-17 04:29:23', '2026-06-17 04:29:23'),
('delay_penalty_grace_days', '0', '2026-06-17 04:29:23', '2026-06-17 04:29:23'),
('delay_penalty_percentage', '1', '2026-06-17 04:29:23', '2026-06-17 04:29:23'),
('enable_app_notifications', 'true', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('enable_email_notifications', 'true', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('eoi_queue_custom_rules', '[]', '2026-06-15 05:17:57', '2026-06-15 05:17:57'),
('eoi_queue_mode', 'normal', '2026-06-15 05:17:57', '2026-06-15 05:17:57'),
('eoi_queue_nationality_priority', 'none', '2026-06-15 05:17:57', '2026-06-15 05:17:57'),
('eoi_queue_weight_cash', '50', '2026-06-15 05:17:57', '2026-06-15 05:17:57'),
('eoi_queue_weight_nationality', '40', '2026-06-15 05:17:57', '2026-06-15 05:17:57'),
('eoi_queue_weight_past_client', '100', '2026-06-15 05:17:57', '2026-06-15 05:17:57'),
('eoi_queue_weight_vip', '150', '2026-06-15 05:17:57', '2026-06-15 05:17:57'),
('kyc_auto_approve', 'false', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('lead_assignment_mode', 'manual', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('mail_encryption', 'tls', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('mail_from_address', 'noreply@redp.com', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('mail_from_name', 'Ether REDP', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('mail_host', 'smtp.mailtrap.io', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('mail_password', '', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('mail_port', '2525', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('mail_username', '', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('maintenance_mode', 'false', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('maintenance_sla_hours', '24', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('notify_lead_creation_recipient', 'sales_agent', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('notify_payment_collection_recipient', 'finance_officer', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('notify_ticket_creation_recipient', 'delivery_engineer', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('sandbox_mode', 'true', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('system_icon_name', 'Building2', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('system_logo_url', '', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('system_name', 'Ether REDP', '2026-06-11 07:48:45', '2026-06-11 07:48:45'),
('vat_rate', '14', '2026-06-11 07:48:45', '2026-06-11 07:48:45');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `parent_task_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('todo','in_progress','review','done','cancelled') NOT NULL DEFAULT 'todo',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `company_id` char(36) DEFAULT NULL,
  `recurrence_rule` varchar(255) DEFAULT NULL,
  `related_type` varchar(100) DEFAULT NULL,
  `related_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_attachments`
--

CREATE TABLE `task_attachments` (
  `id` char(36) NOT NULL,
  `task_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_checklists`
--

CREATE TABLE `task_checklists` (
  `id` char(36) NOT NULL,
  `task_id` char(36) NOT NULL,
  `item_text` varchar(255) NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_comments`
--

CREATE TABLE `task_comments` (
  `id` char(36) NOT NULL,
  `task_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_dependencies`
--

CREATE TABLE `task_dependencies` (
  `id` char(36) NOT NULL,
  `task_id` char(36) NOT NULL,
  `blocked_by_task_id` char(36) NOT NULL,
  `dependency_type` enum('finish_to_start','start_to_start','finish_to_finish') NOT NULL DEFAULT 'finish_to_start',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

CREATE TABLE `teams` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `department_id` char(36) NOT NULL,
  `company_id` char(36) NOT NULL,
  `leader_id` char(36) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teams`
--

INSERT INTO `teams` (`id`, `name`, `department_id`, `company_id`, `leader_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
('2ab360c5-a3b2-416e-84e2-7a44502b5d13', 'Site Handovers & QA Team', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', 'a9645afb-fbd9-4108-aded-a5efac694f76', NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('627b503c-ff28-4dad-88d5-b1706054094d', 'RE/MAX Alpha Team', '683c5080-ba34-4d70-8adc-3198e3de2b92', '029daefc-0a0e-4a51-9185-073650011517', NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('6679695c-6dcd-4edf-9b47-9ff27b42da4d', 'Direct Sales Team', '683c5080-ba34-4d70-8adc-3198e3de2b92', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, NULL, 'active', '2026-06-11 07:42:59', '2026-06-11 07:42:59'),
('a32dc8f7-defc-4d82-8d19-87ad724632af', 'Tele-Sales Team', '683c5080-ba34-4d70-8adc-3198e3de2b92', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', NULL, NULL, 'active', '2026-06-11 07:43:00', '2026-06-11 07:43:00');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `subdomain` varchar(255) NOT NULL,
  `domain` varchar(255) DEFAULT NULL,
  `status` enum('trial','active','suspended') NOT NULL DEFAULT 'trial',
  `branding` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`branding`)),
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tenant_subscriptions`
--

CREATE TABLE `tenant_subscriptions` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) NOT NULL,
  `plan` enum('basic','standard','enterprise') NOT NULL DEFAULT 'basic',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
  `max_users` int(11) NOT NULL DEFAULT 10,
  `max_leads` int(11) NOT NULL DEFAULT 1000,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `translations`
--

CREATE TABLE `translations` (
  `id` char(36) NOT NULL,
  `locale` varchar(10) NOT NULL,
  `group` varchar(255) NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `project_id` char(36) NOT NULL,
  `building_id` char(36) DEFAULT NULL,
  `floor_id` char(36) DEFAULT NULL,
  `unit_number` varchar(255) NOT NULL,
  `floor` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  `area` decimal(10,2) DEFAULT NULL,
  `net_area` decimal(10,2) DEFAULT NULL,
  `finishing_type` enum('core_shell','semi_finished','fully_finished','super_lux','ultra_super_lux') DEFAULT NULL,
  `bedrooms` int(11) DEFAULT NULL,
  `bathrooms` int(11) DEFAULT NULL,
  `living_rooms` int(11) DEFAULT NULL,
  `kitchen_count` int(11) NOT NULL DEFAULT 1,
  `balcony_count` int(11) NOT NULL DEFAULT 0,
  `balcony_area` decimal(8,2) DEFAULT NULL,
  `has_maid_room` tinyint(1) NOT NULL DEFAULT 0,
  `has_storage` tinyint(1) NOT NULL DEFAULT 0,
  `has_private_garden` tinyint(1) NOT NULL DEFAULT 0,
  `has_private_parking` tinyint(1) NOT NULL DEFAULT 0,
  `view_type` varchar(255) DEFAULT NULL,
  `orientation` enum('north','south','east','west','north_east','north_west','south_east','south_west') DEFAULT NULL,
  `building` varchar(255) DEFAULT NULL,
  `layout_description` text DEFAULT NULL,
  `layout_image_url` varchar(255) DEFAULT NULL,
  `model_3d_status` varchar(255) DEFAULT NULL,
  `model_3d_url` text DEFAULT NULL,
  `tripo_task_id` varchar(255) DEFAULT NULL,
  `tripo_error_msg` text DEFAULT NULL,
  `model_generated_at` timestamp NULL DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'available',
  `handover_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `phase` varchar(255) NOT NULL DEFAULT 'Phase 1',
  `handover_status` varchar(255) NOT NULL DEFAULT 'pending',
  `handover_report` text DEFAULT NULL,
  `handover_images` text DEFAULT NULL,
  `handover_signature` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `tenant_id`, `project_id`, `building_id`, `floor_id`, `unit_number`, `floor`, `type`, `area`, `net_area`, `finishing_type`, `bedrooms`, `bathrooms`, `living_rooms`, `kitchen_count`, `balcony_count`, `balcony_area`, `has_maid_room`, `has_storage`, `has_private_garden`, `has_private_parking`, `view_type`, `orientation`, `building`, `layout_description`, `layout_image_url`, `model_3d_status`, `model_3d_url`, `tripo_task_id`, `tripo_error_msg`, `model_generated_at`, `price`, `status`, `handover_date`, `created_at`, `updated_at`, `phase`, `handover_status`, `handover_report`, `handover_images`, `handover_signature`) VALUES
('04d159da-e54d-41f6-a3d5-52b2acaf1fa8', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 'd7ee4704-73dd-4e8c-b0f7-984dace9fc62', 'CRB-103', 1, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4810000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('15bf1a04-d7b9-42be-b8ac-3b18b0939e90', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 'ffbce676-338e-46e7-bd99-a82f0ec4501b', 'CRA-101', 1, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4570000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('24508d2a-c9a0-41ea-8423-b2ca1d247865', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '402-A', 4, 'Apartment', 140.00, NULL, NULL, 3, 2, NULL, 1, 0, NULL, 0, 0, 0, 0, 'garden', NULL, 'Block B4', 'شقة فاخرة: 3 غرف نوم، 2 حمام، ريسبشن قطعتين، مطبخ، تراس يطل على اللاندسكيب', NULL, NULL, NULL, NULL, NULL, NULL, 5000000.00, 'reserved', '2027-06-15', '2026-06-11 07:43:06', '2026-06-14 05:36:04', 'Phase 1', 'pending', NULL, NULL, NULL),
('26bb8c1a-526f-4fe7-9cd2-bdc1ad012e46', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '69973069-2741-47ff-87cd-87df4d15e53f', 'CRB-201', 2, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4820000.00, 'sold', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('2a0431c5-34b3-4f94-838d-cdd9dc3d4dcd', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 'ffbce676-338e-46e7-bd99-a82f0ec4501b', 'CRA-103', 1, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4810000.00, 'reserved', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('2b801330-9ba8-47cd-b4cd-3e15ba814e88', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '5cd0b0d0-e376-4c45-b39f-5f70be786605', 'CRB-401', 4, 'penthouse', 250.00, 238.00, 'fully_finished', 4, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'creek', 'north_east', 'Creek Residence B', 'Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.', NULL, NULL, NULL, NULL, NULL, NULL, 8900000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('2e83c120-0645-4591-988b-2938fedb6f47', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 'ffbce676-338e-46e7-bd99-a82f0ec4501b', 'CRA-102', 1, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'north', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4690000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('31cd1649-15c0-42c7-84da-85158c17c775', NULL, '02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, NULL, '24-C', 2, 'Villa', 330.00, NULL, NULL, 5, 4, NULL, 1, 0, NULL, 0, 0, 0, 0, 'sea', NULL, 'Villas Zone C', 'فيلا مستقلة: الأرضي (ريسبشن واسع 4 قطع، مطبخ كبير، غرفة مربية بحمام، حمام ضيوف)، الأول (5 غرف نوم منهم جناح رئيسي، ليفينج، 3 حمامات)، روف بالكامل', NULL, NULL, NULL, NULL, NULL, NULL, 6500000.00, 'reserved', '2028-02-20', '2026-06-11 07:43:06', '2026-06-14 08:20:41', 'Phase 1', 'pending', NULL, NULL, NULL),
('32c2b460-fdbe-4806-8d39-0c8075aee2f2', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '6be51f66-d328-4339-ba39-b35903e9f197', 'CRA-402', 4, 'penthouse', 270.00, 258.00, 'fully_finished', 4, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'creek', 'north_east', 'Creek Residence A', 'Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.', NULL, NULL, NULL, NULL, NULL, NULL, 9300000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('3f15daf8-da59-447f-b4f2-7633aa995e27', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '69973069-2741-47ff-87cd-87df4d15e53f', 'CRB-203', 2, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5060000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('42709e61-b5e3-4ebc-bd2a-3946bd9c47d6', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '602-A', 6, 'Apartment', 150.00, NULL, NULL, 3, 2, NULL, 1, 0, NULL, 0, 0, 0, 0, 'garden', NULL, 'Block B6', 'شقة فاخرة: 3 غرف نوم، 2 حمام، ريسبشن قطعتين، مطبخ، تراس يطل على اللاندسكيب', NULL, NULL, NULL, NULL, NULL, NULL, 6000000.00, 'available', '2027-08-15', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('47e16f8f-2123-43f1-9f12-419198e3e291', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', 'fd85cbce-1008-46f2-a51b-b27844f967c5', '60edc1c1-378d-4f47-9bdb-abb9271a3f82', 'T-01', 0, 'apartment', 120.00, NULL, 'fully_finished', 3, 2, 1, 1, 0, NULL, 0, 0, 0, 0, NULL, NULL, 'TEST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2500000.00, 'available', NULL, '2026-06-17 04:43:44', '2026-06-17 04:43:44', 'Phase 1', 'pending', NULL, NULL, NULL),
('4e970f5d-ab2c-4c5d-af60-7e227efdc651', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'b8c257e5-69b2-453c-85e3-05f491ae56e0', '9847b683-b9dd-4c7f-9c3c-405a76996fcd', 'CHP-002', 0, 'commercial', 160.00, 148.00, 'fully_finished', NULL, 1, 2, 1, 2, 10.00, 0, 1, 0, 1, 'street', 'east', 'Clubhouse Pavilion E', 'Retail & commercial shop space in the top-right commercial promenade. Ideal for cafés, boutiques, or high-end services.', NULL, NULL, NULL, NULL, NULL, NULL, 7100000.00, 'reserved', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('4f3aa97f-b899-471c-ae84-778e71785afc', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '302-A', 3, 'Townhouse', 210.00, NULL, NULL, 3, 3, NULL, 1, 0, NULL, 0, 0, 0, 0, 'pool', NULL, 'Phase 2 Townhouses', 'تاون هاوس مستقل: الأرضي (ريسبشن 3 قطع، مطبخ، حمام، تراس وحديقة)، الأول (3 غرف نوم منهم ماستر، ليفينج، حمام إضافي)', NULL, NULL, NULL, NULL, NULL, NULL, 4500000.00, 'available', '2027-05-15', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('52501a91-21e6-46b0-bd5b-304e93171d0b', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '101-A', 1, 'Apartment', 150.00, NULL, NULL, 3, 2, NULL, 1, 0, NULL, 0, 0, 0, 0, 'sea', NULL, 'Block A1', '3 غرف، 2 حمام، ريسبشن 3 قطع، مطبخ، تراس كبير بإطلالة بحرية مميزة', 'projects/fe29317c-5e3a-4342-a747-6f16c09cd4ea/units/2181lyHAZCHk5y0DgPH5gwSwpcIGKYFJn7mZSeXh.jpg', NULL, NULL, NULL, NULL, NULL, 4500000.00, 'available', '2027-05-15', '2026-06-11 07:43:06', '2026-06-17 04:30:18', 'Phase 1', 'pending', NULL, NULL, NULL),
('532d5267-2e10-4da8-9946-d3a6ecf43743', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'b8c257e5-69b2-453c-85e3-05f491ae56e0', '9847b683-b9dd-4c7f-9c3c-405a76996fcd', 'CHP-001', 0, 'commercial', 120.00, 108.00, 'fully_finished', NULL, 1, 2, 1, 2, 10.00, 0, 1, 0, 1, 'street', 'east', 'Clubhouse Pavilion E', 'Retail & commercial shop space in the top-right commercial promenade. Ideal for cafés, boutiques, or high-end services.', NULL, NULL, NULL, NULL, NULL, NULL, 6300000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('5654b3df-2ad6-47dd-820b-1b4a58eca4a4', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 'a994e9f7-a97f-4ebf-a638-15cc9f343729', 'CRA-303', 3, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5310000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('57403bbc-9b71-4b61-857a-86c9a545af53', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', 'fa582a2b-0ffb-49cb-8536-32db03a4db8e', 'LPC-201', 2, 'duplex', 210.00, 198.00, 'fully_finished', 3, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'lagoon', 'north_west', 'Lagoon Pavilion C', 'Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.', NULL, NULL, NULL, NULL, NULL, NULL, 7000000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('60434cb8-eddd-44a8-bc29-54f81934c864', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 'af1d3873-1486-4715-8952-417df54c9987', 'CRB-003', 0, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 1, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4560000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('632ff47c-41fc-4bca-8201-c1ad90b20859', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', '176d9d3a-0aff-4517-80d2-0b0aae5ffae4', 'LPC-102', 1, 'duplex', 210.00, 198.00, 'fully_finished', 3, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'lagoon', 'north_west', 'Lagoon Pavilion C', 'Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.', NULL, NULL, NULL, NULL, NULL, NULL, 7200000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('6b120e06-9e09-4d2f-8a98-cc4706210c25', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '5cd0b0d0-e376-4c45-b39f-5f70be786605', 'CRB-402', 4, 'penthouse', 270.00, 258.00, 'fully_finished', 4, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'creek', 'north_east', 'Creek Residence B', 'Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.', NULL, NULL, NULL, NULL, NULL, NULL, 9300000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('6c36121f-56b3-4dba-9ea9-8d8a694b5da9', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'ecbf54eb-f203-401f-83a2-25b7fd3a0db9', '4a53322c-d2fc-464c-997c-e7cb9c14a262', 'WTH-001', 0, 'villa', 240.00, 228.00, 'fully_finished', 4, 4, 2, 1, 2, 10.00, 1, 1, 1, 1, 'garden', 'south', 'West Townhouse Block D', 'Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.', NULL, NULL, NULL, NULL, NULL, NULL, 11000000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('6d263358-65c1-48c1-b931-2d392e239055', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '6be51f66-d328-4339-ba39-b35903e9f197', 'CRA-401', 4, 'penthouse', 250.00, 238.00, 'fully_finished', 4, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'creek', 'north_east', 'Creek Residence A', 'Duplex Penthouse offering a private roof deck, 4 bedrooms, 3 bathrooms, maid quarter, and infinity creek views.', NULL, NULL, NULL, NULL, NULL, NULL, 8900000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('6ee3e2e5-c2ca-43a9-81e4-168efba3b076', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '13270b89-cb08-44d9-b892-d3adc7ff1ff8', 'CRA-203', 2, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5060000.00, 'reserved', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('72c06fcc-9608-47d0-bdd0-14fb83ffd141', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '13270b89-cb08-44d9-b892-d3adc7ff1ff8', 'CRA-201', 2, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4820000.00, 'reserved', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('781de370-ef3f-41e7-82ae-a338000a8670', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '66811d50-0cf3-46b5-b55e-e233c0cb5f69', 'CRA-001', 0, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 1, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4320000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('7b87eb86-ec33-475e-8f19-4ebe1bb5e3d1', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 'a994e9f7-a97f-4ebf-a638-15cc9f343729', 'CRA-302', 3, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'north', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5190000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('813bb138-ec40-4d12-9047-f89b19d953a9', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', 'fd85cbce-1008-46f2-a51b-b27844f967c5', '60edc1c1-378d-4f47-9bdb-abb9271a3f82', 'T-02', 0, 'apartment', 120.00, NULL, 'fully_finished', 3, 2, 1, 1, 0, NULL, 0, 0, 0, 0, NULL, NULL, 'TEST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2500000.00, 'available', NULL, '2026-06-17 04:43:44', '2026-06-17 04:43:44', 'Phase 1', 'pending', NULL, NULL, NULL),
('8c683c3a-6d3a-4d68-bc41-4f4983a88528', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '502-A', 5, 'Townhouse', 230.00, NULL, NULL, 3, 3, NULL, 1, 0, NULL, 0, 0, 0, 0, 'pool', NULL, 'Phase 2 Townhouses', 'تاون هاوس مستقل: الأرضي (ريسبشن 3 قطع، مطبخ، حمام، تراس وحديقة)، الأول (3 غرف نوم منهم ماستر، ليفينج، حمام إضافي)', NULL, NULL, NULL, NULL, NULL, NULL, 5500000.00, 'available', '2027-07-15', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('8d7aa92c-841d-4c5e-86ee-19dc4b8014c9', NULL, '02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, NULL, '44-C', 4, 'Villa', 360.00, NULL, NULL, 5, 4, NULL, 1, 0, NULL, 0, 0, 0, 0, 'sea', NULL, 'Villas Zone C', 'فيلا مستقلة: الأرضي (ريسبشن واسع 4 قطع، مطبخ كبير، غرفة مربية بحمام، حمام ضيوف)، الأول (5 غرف نوم منهم جناح رئيسي، ليفينج، 3 حمامات)، روف بالكامل', NULL, NULL, NULL, NULL, NULL, NULL, 8000000.00, 'available', '2028-04-20', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('8f958ca4-b63e-4968-8b1a-36cae1e0df09', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '668a2039-8201-445c-b717-fd7d4b561955', 'CRB-301', 3, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5070000.00, 'sold', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('942c61ab-40b0-4039-aa4a-c5d14289822d', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', 'a994e9f7-a97f-4ebf-a638-15cc9f343729', 'CRA-301', 3, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5070000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('961e4c37-d65e-4516-ac27-6a01e240b679', NULL, '02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, NULL, '12-C', 3, 'Duplex', 210.00, NULL, NULL, 3, 3, NULL, 1, 0, NULL, 0, 0, 0, 0, 'garden', NULL, 'Building 12', 'الدور الأرضي: ريسبشن قطعتين، مطبخ، حمام ضيوف، حديقة خاصة 50م. الدور الأول: 3 غرف نوم (منهم غرفة ماستر بدريسنج وحمام)، ليفينج، حمام رئيسي', 'projects/02f41010-d223-46c6-90f3-2cb42fbd4d76/units/eo9qm05CwOTjW90RhCLP5mRHDrZPsKKjxvPdQNgl.jpg', NULL, NULL, NULL, NULL, NULL, 6200000.00, 'reserved', '2028-02-10', '2026-06-11 07:43:06', '2026-06-15 05:22:55', 'Phase 1', 'pending', NULL, NULL, NULL),
('9ebfbead-fdb1-4aba-875a-207f7e47d451', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '13270b89-cb08-44d9-b892-d3adc7ff1ff8', 'CRA-202', 2, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'north', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4940000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('9f7bc787-8508-47ee-bce2-5f51d3deac54', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '66811d50-0cf3-46b5-b55e-e233c0cb5f69', 'CRA-003', 0, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 1, 1, 'creek', 'south', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4560000.00, 'sold', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('a2928c9a-3a19-4b6f-b4fa-3e60098a2c63', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', 'fa582a2b-0ffb-49cb-8536-32db03a4db8e', 'LPC-202', 2, 'duplex', 210.00, 198.00, 'fully_finished', 3, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'lagoon', 'north_west', 'Lagoon Pavilion C', 'Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.', NULL, NULL, NULL, NULL, NULL, NULL, 7200000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('a37a15d3-1c3c-432f-9b27-d769ef858421', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', 'd9acd2a6-63dd-4509-b12d-212976f6cb88', 'LPC-002', 0, 'duplex', 210.00, 198.00, 'fully_finished', 3, 3, 2, 1, 2, 10.00, 1, 1, 1, 1, 'lagoon', 'north_west', 'Lagoon Pavilion C', 'Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.', NULL, NULL, NULL, NULL, NULL, NULL, 7200000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('a5294f26-aada-41ee-ac93-e0c2413764ee', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 'd7ee4704-73dd-4e8c-b0f7-984dace9fc62', 'CRB-101', 1, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4570000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('afb85a79-bd9f-4b16-ae88-afa9ec5da248', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', 'fd85cbce-1008-46f2-a51b-b27844f967c5', '60edc1c1-378d-4f47-9bdb-abb9271a3f82', 'T-03', 0, 'apartment', 120.00, NULL, 'fully_finished', 3, 2, 1, 1, 0, NULL, 0, 0, 0, 0, NULL, NULL, 'TEST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2500000.00, 'available', NULL, '2026-06-17 04:43:44', '2026-06-17 04:43:44', 'Phase 1', 'pending', NULL, NULL, NULL),
('b5299c0f-90ff-4ab7-ab09-49ea174984c2', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'b8c257e5-69b2-453c-85e3-05f491ae56e0', 'c09cb47b-8ad2-4447-a392-7d59c3e32a98', 'CHP-102', 1, 'commercial', 160.00, 148.00, 'fully_finished', NULL, 1, 2, 1, 2, 10.00, 0, 1, 0, 1, 'street', 'east', 'Clubhouse Pavilion E', 'Retail & commercial shop space in the top-right commercial promenade. Ideal for cafés, boutiques, or high-end services.', NULL, NULL, NULL, NULL, NULL, NULL, 7100000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('bddcb069-5df5-489e-b9bb-0eb287f7ff5e', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 'af1d3873-1486-4715-8952-417df54c9987', 'CRB-002', 0, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 1, 1, 'creek', 'north', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4440000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('cb5f7c51-b4ab-4a1d-8f85-c9237a5309d0', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', '176d9d3a-0aff-4517-80d2-0b0aae5ffae4', 'LPC-101', 1, 'duplex', 210.00, 198.00, 'fully_finished', 3, 3, 2, 1, 2, 10.00, 1, 1, 0, 1, 'lagoon', 'north_west', 'Lagoon Pavilion C', 'Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.', NULL, NULL, NULL, NULL, NULL, NULL, 7000000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('d1142aaf-5e88-4b7c-9476-ee98f561494f', NULL, '02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, NULL, '14-C', 1, 'Studio', 60.00, NULL, NULL, 1, 1, NULL, 1, 0, NULL, 0, 0, 0, 0, 'street', NULL, 'Residences Bldg G', 'استوديو مميز: غرفة نوم مفتوحة، ريسبشن قطعة واحدة، مطبخ أمريكي مفتوح، حمام، تراس بإطلالة مفتوحة', NULL, NULL, NULL, NULL, NULL, NULL, 5750000.00, 'available', '2028-01-20', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('da06d389-2d30-4a57-b5f0-ab28b289ae19', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '201-B', 2, 'Penthouse', 260.00, NULL, NULL, 4, 3, NULL, 1, 0, NULL, 0, 0, 0, 0, 'pool', NULL, 'Block A1', 'الدور السفلي: ريسبشن 3 قطع، مطبخ، حمام ضيوف. الدور العلوي: 4 غرف نوم (منهم غرفتان ماستر)، 2 حمام، ليفينج، روف تراس واسع يطل على حمام السباحة', NULL, NULL, NULL, NULL, NULL, NULL, 8900000.00, 'reserved', '2027-08-20', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('dac69402-7aae-4bb0-9110-daf28d8dbbc3', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '802-A', 8, 'Apartment', 160.00, NULL, NULL, 3, 2, NULL, 1, 0, NULL, 0, 0, 0, 0, 'garden', NULL, 'Block B8', 'شقة فاخرة: 3 غرف نوم، 2 حمام، ريسبشن قطعتين، مطبخ، تراس يطل على اللاندسكيب', NULL, NULL, NULL, NULL, NULL, NULL, 7000000.00, 'available', '2027-10-15', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('de0d3bf2-d57d-4572-ba91-f2529393c938', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'cab546d7-31d7-42a1-af46-7611e2c4c430', '66811d50-0cf3-46b5-b55e-e233c0cb5f69', 'CRA-002', 0, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 1, 1, 'creek', 'north', 'Creek Residence A', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4440000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('e0f309aa-b80c-4af9-b62e-3191bb00dba7', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'b8c257e5-69b2-453c-85e3-05f491ae56e0', 'c09cb47b-8ad2-4447-a392-7d59c3e32a98', 'CHP-101', 1, 'commercial', 120.00, 108.00, 'fully_finished', NULL, 1, 2, 1, 2, 10.00, 0, 1, 0, 1, 'street', 'east', 'Clubhouse Pavilion E', 'Retail & commercial shop space in the top-right commercial promenade. Ideal for cafés, boutiques, or high-end services.', NULL, NULL, NULL, NULL, NULL, NULL, 6300000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('e27e1723-4875-4b49-b0fa-39a1e71daf70', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'ecbf54eb-f203-401f-83a2-25b7fd3a0db9', '4a53322c-d2fc-464c-997c-e7cb9c14a262', 'WTH-002', 0, 'villa', 240.00, 228.00, 'fully_finished', 4, 4, 2, 1, 2, 10.00, 1, 1, 1, 1, 'garden', 'south', 'West Townhouse Block D', 'Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.', NULL, NULL, NULL, NULL, NULL, NULL, 11500000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('e599daf0-c312-452a-9185-a4226455a9e3', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 'd7ee4704-73dd-4e8c-b0f7-984dace9fc62', 'CRB-102', 1, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'north', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4690000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('eb4ee662-3943-4707-8bb3-3bfb0fd4013c', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'ecbf54eb-f203-401f-83a2-25b7fd3a0db9', 'fd28dcef-95f8-44a7-82f3-ddd7ab9ae953', 'WTH-101', 1, 'villa', 240.00, 228.00, 'fully_finished', 4, 4, 2, 1, 2, 10.00, 1, 1, 0, 1, 'garden', 'south', 'West Townhouse Block D', 'Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.', NULL, NULL, NULL, NULL, NULL, NULL, 11000000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('ed2e0b6a-9590-4a27-b6fe-e612fbf69507', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '69973069-2741-47ff-87cd-87df4d15e53f', 'CRB-202', 2, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'north', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4940000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('ed91caab-46de-4b6a-8120-c314bf0179e2', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '668a2039-8201-445c-b717-fd7d4b561955', 'CRB-303', 3, 'apartment', 180.00, 168.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5310000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('ef31cb4f-d802-4487-82f1-05e2b6b33301', NULL, '02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, NULL, '34-C', 3, 'Studio', 70.00, NULL, NULL, 1, 1, NULL, 1, 0, NULL, 0, 0, 0, 0, 'street', NULL, 'Residences Bldg G', 'استوديو مميز: غرفة نوم مفتوحة، ريسبشن قطعة واحدة، مطبخ أمريكي مفتوح، حمام، تراس بإطلالة مفتوحة', NULL, NULL, NULL, NULL, NULL, NULL, 7250000.00, 'available', '2028-03-20', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('ef3f31bc-1ae9-4126-abe2-6eb303af9ccd', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '702-A', 7, 'Townhouse', 250.00, NULL, NULL, 3, 3, NULL, 1, 0, NULL, 0, 0, 0, 0, 'pool', NULL, 'Phase 2 Townhouses', 'تاون هاوس مستقل: الأرضي (ريسبشن 3 قطع، مطبخ، حمام، تراس وحديقة)، الأول (3 غرف نوم منهم ماستر، ليفينج، حمام إضافي)', NULL, NULL, NULL, NULL, NULL, NULL, 6500000.00, 'available', '2027-09-15', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('f45b74c1-9016-4875-8807-f573e5636d62', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', '668a2039-8201-445c-b717-fd7d4b561955', 'CRB-302', 3, 'apartment', 165.00, 153.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 0, 1, 'creek', 'north', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 5190000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('f8a6820f-a070-400c-b082-9efdb3e3bc03', NULL, '02f41010-d223-46c6-90f3-2cb42fbd4d76', NULL, NULL, '54-C', 5, 'Studio', 80.00, NULL, NULL, 1, 1, NULL, 1, 0, NULL, 0, 0, 0, 0, 'street', NULL, 'Residences Bldg G', 'استوديو مميز: غرفة نوم مفتوحة، ريسبشن قطعة واحدة، مطبخ أمريكي مفتوح، حمام، تراس بإطلالة مفتوحة', NULL, NULL, NULL, NULL, NULL, NULL, 8750000.00, 'available', '2028-05-20', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('f9312b5c-db0e-4ee8-9314-b3129080d5cf', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', 'fd85cbce-1008-46f2-a51b-b27844f967c5', '60edc1c1-378d-4f47-9bdb-abb9271a3f82', 'T-04', 0, 'apartment', 120.00, NULL, 'fully_finished', 3, 2, 1, 1, 0, NULL, 0, 0, 0, 0, NULL, NULL, 'TEST', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2500000.00, 'available', NULL, '2026-06-17 04:43:44', '2026-06-17 04:43:44', 'Phase 1', 'pending', NULL, NULL, NULL),
('fad6734b-d60f-4a89-a4e0-536bb8aa84fe', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'ecbf54eb-f203-401f-83a2-25b7fd3a0db9', 'fd28dcef-95f8-44a7-82f3-ddd7ab9ae953', 'WTH-102', 1, 'villa', 240.00, 228.00, 'fully_finished', 4, 4, 2, 1, 2, 10.00, 1, 1, 0, 1, 'garden', 'south', 'West Townhouse Block D', 'Premium townhouse on the western edge of the master plan. Features 4 master bedrooms, large private backyard garden, and personal parking garage.', NULL, NULL, NULL, NULL, NULL, NULL, 11500000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('faf4eedf-7e64-4781-bee9-bfb754f57e33', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', 'a7b51a7b-f896-4ba7-94f1-b7ef103c13f9', 'd9acd2a6-63dd-4509-b12d-212976f6cb88', 'LPC-001', 0, 'duplex', 210.00, 198.00, 'fully_finished', 3, 3, 2, 1, 2, 10.00, 1, 1, 1, 1, 'lagoon', 'north_west', 'Lagoon Pavilion C', 'Double story Duplex directly facing the circular East Lagoon. Ground floor features reception & garden. First floor contains 3 master suites.', NULL, NULL, NULL, NULL, NULL, NULL, 7000000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL),
('fcf42879-a9ab-4c22-aa10-958942e49473', NULL, 'fe29317c-5e3a-4342-a747-6f16c09cd4ea', NULL, NULL, '202-A', 2, 'Apartment', 130.00, NULL, NULL, 3, 2, NULL, 1, 0, NULL, 0, 0, 0, 0, 'garden', NULL, 'Block B2', 'شقة فاخرة: 3 غرف نوم، 2 حمام، ريسبشن قطعتين، مطبخ، تراس يطل على اللاندسكيب', NULL, NULL, NULL, NULL, NULL, NULL, 4000000.00, 'available', '2027-04-15', '2026-06-11 07:43:06', '2026-06-11 07:43:06', 'Phase 1', 'pending', NULL, NULL, NULL),
('ff937f3a-cdd0-4c7c-ad96-cd193f00cab0', NULL, '623f1780-4ed7-4db4-a558-2e65e5238431', '02881ad3-f92c-46fc-86eb-d5a4a5333489', 'af1d3873-1486-4715-8952-417df54c9987', 'CRB-001', 0, 'apartment', 150.00, 138.00, 'fully_finished', 3, 2, 2, 1, 2, 10.00, 0, 1, 1, 1, 'creek', 'south', 'Creek Residence B', 'Luxury creek-facing apartment with 3 bedrooms, 2 bathrooms, an open reception, and a terrace with canal views.', NULL, NULL, NULL, NULL, NULL, NULL, 4320000.00, 'available', NULL, '2026-06-21 06:51:22', '2026-06-21 06:51:22', 'Phase 1', 'pending', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'client',
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `company_id` char(36) DEFAULT NULL,
  `branch_id` char(36) DEFAULT NULL,
  `department_id` char(36) DEFAULT NULL,
  `team_id` char(36) DEFAULT NULL,
  `position_id` char(36) DEFAULT NULL,
  `employee_number` varchar(30) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `name`, `email`, `password`, `phone`, `role`, `status`, `company_id`, `branch_id`, `department_id`, `team_id`, `position_id`, `employee_number`, `remember_token`, `created_at`, `updated_at`) VALUES
('0963fcbd-ab27-4a17-8a7c-7b915202c400', NULL, 'Tarek TeleSales Head', 'tele_sales_head@redp.com', '$2y$12$rPXDaW9cOqvWF0ZN2F.Ru.WerxNsqtNCvldLhHcLoOkbO8vxLUpwO', '+201005555513', 'tele_sales', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', 'EMP-0016', NULL, '2026-06-11 07:43:02', '2026-06-11 07:43:02'),
('1007c1fe-171a-46ff-a2c5-9f94e5b7f142', NULL, 'Tarek Client', 'client@redp.com', '$2y$12$D3FruHAWM7Qb5q3O0kROBengLLW0u8APFh4rK3Rg/sYfi1LfnDwS.', '+201004444444', 'client', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:43:01', '2026-06-11 07:43:01'),
('2114de19-0557-4091-950d-ec1e73dcf197', NULL, 'Hassan Technician', 'technician@redp.com', '$2y$12$xqcOjTMabvISjfY5jEq9f.zZ.0OtfhlblCpihwdu3O3yPU9V6Sp2i', '+201008888888', 'technician', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:43:05', '2026-06-11 07:43:05'),
('2277599e-6e5b-4be2-bfdc-55e6bfee4ea2', NULL, 'Hany Broker Leader', 'broker_team_leader@redp.com', '$2y$12$h/ircNRi38Lg4obiVqW2tOk2A0eyAUv3OeyH5DEyDELOu.HRriw1a', '+201005555578', 'broker', 'active', '029daefc-0a0e-4a51-9185-073650011517', NULL, NULL, '627b503c-ff28-4dad-88d5-b1706054094d', '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', 'EMP-BR02', NULL, '2026-06-11 07:43:03', '2026-06-11 07:43:03'),
('2a99bf51-533d-4db1-b3d7-77d3e86c5420', NULL, 'Karim CompanySales Head', 'company_sales@redp.com', '$2y$12$mP/SntUwYQMsxBwtkp.2U.S/OKmKR/DPMHC3NgjJQjfNpTUWI.nES', '+201005555522', 'company_sales', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', 'EMP-0003', NULL, '2026-06-11 07:43:04', '2026-06-11 07:43:04'),
('2c1843b9-b367-493d-a8c2-b6d208f55d39', NULL, 'Apartment Handover Specialist', 'handover@redp.com', '$2y$12$9rRVNsJzRjNdarcyTHEm4OP.oJ2y8M69ANPpOl2tY.6MttAo5SJSS', '+201003333344', 'handover_officer', 'active', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', '2ab360c5-a3b2-416e-84e2-7a44502b5d13', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'EMP-0012', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('3011029c-f330-4717-8317-d1eda62e0751', NULL, 'Security Compliance', 'compliance_officer@redp.com', '$2y$12$9.mVNOAvEX3KrEK7CvLo0eYQiKo67A7WntGCCZgI.9NMrtiVBG2ma', '+201009999994', 'compliance_officer', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', 'ed671359-3bdf-4d38-b15d-0218ada62413', NULL, '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'EMP-0011', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('3d4270b4-ae06-4aae-bb84-04c294e5c038', NULL, 'Mohamed Nabil', 'mohamed.nabil@gmail.com', '$2y$12$8rnYdsu.2kVW/LRqioTD2uyBUQGcMIp5aUxkupF143KMV4dYYUjFq', '+201201112223', 'client', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-14 05:39:00', '2026-06-14 05:39:00'),
('3f01955c-1764-4cb3-951e-fd540a0bc506', NULL, 'Youssef Freelance Broker', 'freelance_broker@redp.com', '$2y$12$a3eKy5R./QOML21.OfZmZOl7U8aosEVD0yeLzt/ORAiNTdZVeIqZK', '+201005555579', 'broker', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:43:03', '2026-06-11 07:43:03'),
('42bb96f2-c7b9-453b-8410-c235dc409d21', NULL, 'Noha CompanySales Leader', 'company_sales_leader@redp.com', '$2y$12$ko4kL2lr8HQ5UbdoEmfmqOZmzyKrdrbyiM2HqfTTPhj4Z/jkXEZvu', '+201005555523', 'company_sales', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', '6679695c-6dcd-4edf-9b47-9ff27b42da4d', '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', 'EMP-0014', NULL, '2026-06-11 07:43:04', '2026-06-11 07:43:04'),
('43209f55-b7a8-411a-a789-a81d697b741d', NULL, 'Sara TeleSales Agent', 'tele_sales@redp.com', '$2y$12$rNb2aQ8q56/BTOgD9VbkV.mDgRql.E3.nmmb3ybK57LznIEAoeIAy', '+201005555511', 'tele_sales', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', 'a32dc8f7-defc-4d82-8d19-87ad724632af', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'EMP-0005', NULL, '2026-06-11 07:43:02', '2026-06-11 07:43:02'),
('58ca5eb2-3238-49e9-9d6e-aa05be4cc297', NULL, 'Yasser CompanySales Agent', 'company_sales_agent@redp.com', '$2y$12$.8SJxcRr1CRgc6Ctq4nQquXaOWFM1lvQoxQLfxx.PGg5E1G8O1vI.', '+201005555524', 'company_sales', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', '6679695c-6dcd-4edf-9b47-9ff27b42da4d', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'EMP-0015', NULL, '2026-06-11 07:43:04', '2026-06-11 07:43:04'),
('597fea87-4b92-4b52-bcca-c67a3c3e5625', NULL, 'Executive Director', 'executive@redp.com', '$2y$12$q4qv.UBNq1.DawNuh6xjmu2tULevz7nWwLfaLmIfK0JIDGke07E1O', '+201009999995', 'executive', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '8614cb63-069a-4d87-a299-25f50f8e878c', NULL, '5bd1ab62-797e-4206-986a-b68622e07955', 'EMP-0002', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('772173d6-8540-48be-94b2-ec6add839726', NULL, 'Sherif Legal', 'legal_officer@redp.com', '$2y$12$fR/GqMsiycaf3INyWIV68uc7RI2Ip/3O27xxp5tUmOnVQpmAOl23u', '+201009999996', 'legal_officer', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', 'ed671359-3bdf-4d38-b15d-0218ada62413', NULL, '46ef4bc9-ac4d-4e7b-9127-7f01acfe535e', 'EMP-0010', NULL, '2026-06-11 07:43:06', '2026-06-11 07:43:06'),
('79a050f1-eccd-4405-be25-114a05846a2a', NULL, 'Ramy ProjectManager', 'project_manager@redp.com', '$2y$12$AeIPQsbk9i5XpWYKEu/zkexuqdavKsYVMIOZ4MmtfTFwfINFwmFlG', '+201009999997', 'project_manager', 'active', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', 'EMP-0007', NULL, '2026-06-11 07:43:05', '2026-06-11 07:43:05'),
('a3938d5c-9265-4bb7-af85-035bcd4b973b', NULL, 'Mostafa MaintenanceManager', 'maintenance_manager@redp.com', '$2y$12$FPYoXF8zgY5/uQ7JPkBpDeZOzYecD1UAIO/0J1E4QJfp6c5guSJE6', '+201009999998', 'maintenance_manager', 'active', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', NULL, '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', 'EMP-0009', NULL, '2026-06-11 07:43:05', '2026-06-11 07:43:05'),
('a79c826c-e7d8-477d-951e-5f737b5f264d', NULL, 'Sherif Kamal', 'client2@redp.com', '$2y$12$u6Nmd8.v0sduzchFe9AV7uZTGDUZ/gzMobmNCv57abGPsrapkMdEa', '+201509998887', 'client', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:43:01', '2026-06-11 07:43:01'),
('a9250aee-0119-4a17-a237-259e4fe83abb', NULL, 'Platform Administrator', 'admin@redp.com', '$2y$12$JH81SctwQWa9R0JRkkfFl.zLYWgE.hwtXXD5BWI4ToJyzngWYesAi', '+201009999999', 'admin', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '8614cb63-069a-4d87-a299-25f50f8e878c', NULL, '47a8660f-f28d-4b3a-a3a2-898acc68287d', 'EMP-0001', NULL, '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('aa5e20f9-2c85-45c2-88f3-007073d5474e', NULL, 'Mariam TeleSales Manager', 'tele_sales_manager@redp.com', '$2y$12$9EfWps.0rob81wKPv4sMWeyhGERHci5pWTWK./p5LvjgbsrFxjP1K', '+201005555512', 'tele_sales', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', 'a32dc8f7-defc-4d82-8d19-87ad724632af', '851d45eb-9e9c-4cdb-a765-534a2ad9b2dd', 'EMP-0013', NULL, '2026-06-11 07:43:02', '2026-06-11 07:43:02'),
('c28da1ab-30f8-4250-b8b2-98b76b646de1', NULL, 'Ahmed Broker Agent', 'broker@redp.com', '$2y$12$YAMdxjMiQOLP56LO/XMwbuzf3V/8I8Emfkk1tqQJHMFVEBHHTJj2K', '+201005555555', 'broker', 'active', '029daefc-0a0e-4a51-9185-073650011517', NULL, NULL, '627b503c-ff28-4dad-88d5-b1706054094d', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'EMP-BR03', NULL, '2026-06-11 07:43:03', '2026-06-11 07:43:03'),
('c9283383-625d-4fff-bb05-fff7447f4d89', NULL, 'Sales Agent', 'sales_agent@redp.com', '$2y$12$Fx58zKb7xdF.N1xJjuzNd.CIGRMtLFXI52zHg2epJx.KitZZOFvCm', '+201001111111', 'sales_agent', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '683c5080-ba34-4d70-8adc-3198e3de2b92', '6679695c-6dcd-4edf-9b47-9ff27b42da4d', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'EMP-0004', NULL, '2026-06-11 07:43:00', '2026-06-11 07:43:00'),
('cabb66e3-e517-46a8-8004-ff908c6662b7', NULL, 'Sara CustomerService', 'customer_service@redp.com', '$2y$12$ZVweGTOiythPabwbWsYWeeEUu4K7vE9F9nZ/WisnUBk//cl3nxziq', '+201007777777', 'customer_service', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:43:05', '2026-06-11 07:43:05'),
('d577b47e-9a96-40e1-a6b0-0f298daeaba0', NULL, 'John Broker Owner', 'broker_owner@redp.com', '$2y$12$uTLMu4lLuTIUE1b8XgGIcOB0XxMBcmz1WeYGURtZO1DE/ZJsE7whS', '+201005555577', 'broker', 'active', '029daefc-0a0e-4a51-9185-073650011517', NULL, NULL, NULL, '2f75d065-abe8-4074-a62a-bebcf7626a3f', 'EMP-BR01', NULL, '2026-06-11 07:43:02', '2026-06-11 07:43:02'),
('d8824246-5965-47b1-a61f-cb5e844b5ab0', NULL, 'Delivery Specialist', 'delivery_engineer@redp.com', '$2y$12$5GDv.OXN2sk8XOdHugT8quKx4LT6894YYO00p.MyjC0IaXoIlXUn.', '+201003333333', 'delivery_engineer', 'active', 'a9645afb-fbd9-4108-aded-a5efac694f76', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '1e0010aa-9ecc-42d8-b3fb-d919ff6de19b', '2ab360c5-a3b2-416e-84e2-7a44502b5d13', '6181bb64-f7d2-46f6-a73f-c89d55a124d0', 'EMP-0008', NULL, '2026-06-11 07:43:01', '2026-06-11 07:43:01'),
('dabbafb5-fdcb-457c-a2f7-05e00cc4783b', NULL, 'Broker Manager', 'broker_manager@redp.com', '$2y$12$m./KhYV8etYtfxVgdEFjS.jta/4SNLNnYlORQy8j0Us8ZSI5qk2Si', '+201006666666', 'broker_manager', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:43:04', '2026-06-11 07:43:04'),
('ed4b1201-f25f-45ab-b0c0-ed28eef54da1', NULL, 'Finance Officer', 'finance_officer@redp.com', '$2y$12$UfewkfYVhjgWsRj.giKEnu2RkKgRAQOkixUjge1AybM3mrwYvJ4Wm', '+201002222222', 'finance_officer', 'active', '5de527c8-a20d-4f4a-b16f-d3f1bc55ff45', '327a4ec5-8b24-4913-bf44-b8268b1e4518', '65a99eb0-acc2-4153-bb85-99fe86200d27', NULL, '46ef4bc9-ac4d-4e7b-9127-7f01acfe535e', 'EMP-0006', NULL, '2026-06-11 07:43:00', '2026-06-11 07:43:00');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `type` enum('grant','deny') NOT NULL DEFAULT 'grant',
  `granted_by` char(36) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `company_id` char(36) DEFAULT NULL,
  `branch_id` char(36) DEFAULT NULL,
  `granted_by` char(36) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role_id`, `company_id`, `branch_id`, `granted_by`, `expires_at`, `created_at`) VALUES
('037a8f43-6801-46cd-84c4-96f7ffa05fd1', '43209f55-b7a8-411a-a789-a81d697b741d', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24'),
('0a6cd211-3a0d-4237-a9d9-1f2c9c59b128', 'c28da1ab-30f8-4250-b8b2-98b76b646de1', 'f2ff44b8-0327-4195-953f-2961fb06a4af', NULL, NULL, NULL, NULL, '2026-06-11 07:43:07'),
('5aeccde2-4cbe-4071-ab67-eb2da8d29aae', 'a3938d5c-9265-4bb7-af85-035bcd4b973b', '0e7d515f-7828-498d-a59b-43b2a3ff445b', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24'),
('62cf341e-9fd9-4114-95ef-6dfda3cd220a', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', '196af811-9d7d-4023-b00d-77c0d2c53d13', NULL, NULL, NULL, NULL, '2026-06-11 07:43:07'),
('6bf819aa-4c4a-4f0d-8823-6a6db1d5cc37', '43209f55-b7a8-411a-a789-a81d697b741d', '03ab1bb6-b6da-475d-8bd2-d1c891032914', NULL, NULL, NULL, NULL, '2026-06-11 07:43:07'),
('79e5e72a-5c40-4804-ae94-c057603b7b46', 'a3938d5c-9265-4bb7-af85-035bcd4b973b', 'd8d45eb0-95ea-4797-860f-d188a34d1c61', NULL, NULL, NULL, NULL, '2026-06-11 07:43:07'),
('835c6e4f-ed1b-47b8-8e4f-b5bef5fc2718', 'c28da1ab-30f8-4250-b8b2-98b76b646de1', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24'),
('92352b4a-9d08-4112-bba5-7cc478af760a', 'c9283383-625d-4fff-bb05-fff7447f4d89', 'd8708d76-aebd-4c8c-9c95-afc8a21447f0', NULL, NULL, NULL, NULL, '2026-06-11 07:43:07'),
('9e8dba2a-c1b4-432c-9a28-2d23a46e9b6c', '2c1843b9-b367-493d-a8c2-b6d208f55d39', 'f5c3ea95-a458-4b8d-8b4e-e0323f26a175', NULL, NULL, NULL, NULL, '2026-06-11 07:43:07'),
('a4524ffa-18db-4598-a9c8-dc031df26697', 'ed4b1201-f25f-45ab-b0c0-ed28eef54da1', '51564f8d-ce5e-4081-a904-df55f9629a5c', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24'),
('d51dd986-736d-4a44-a5bc-8403f33290af', 'c9283383-625d-4fff-bb05-fff7447f4d89', 'df59fb8d-2b83-4518-8a2f-c42b1f4dee68', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24'),
('dc1f3080-cacc-4ac3-bb0a-495085171814', 'a9250aee-0119-4a17-a237-259e4fe83abb', 'c931593e-0abb-42f2-871a-517a32cec24e', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24'),
('ecc06ead-d658-49e9-b364-bf1d4a8deab2', 'd8824246-5965-47b1-a61f-cb5e844b5ab0', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24'),
('fbbc2013-3173-4283-8425-66d7584e47f1', 'd8824246-5965-47b1-a61f-cb5e844b5ab0', '586484db-a17f-499a-91ab-82f4ea5ad45b', NULL, NULL, NULL, NULL, '2026-06-11 07:43:07'),
('fc54c4b9-afb9-42b7-81c7-a99aecfd3d86', '2c1843b9-b367-493d-a8c2-b6d208f55d39', 'ca9f717c-a2bf-49bd-81f3-98abbfa4ced4', NULL, NULL, NULL, NULL, '2026-06-16 08:35:24');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `make` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `color` varchar(255) NOT NULL,
  `plate_number` varchar(255) NOT NULL,
  `year` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `service_type` varchar(255) NOT NULL,
  `rating` decimal(3,2) NOT NULL DEFAULT 5.00,
  `contact_number` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `name`, `service_type`, `rating`, `contact_number`, `created_at`, `updated_at`) VALUES
('28b037d5-521b-43a3-bdac-7d68b80a7b91', 'Arab Contractors Plumbing Co.', 'Plumbing', 4.80, '+201004445556', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('29bf979d-93ae-4d2f-81a8-ae7a479bec55', 'El-Swedy Electrics', 'Electrical', 4.90, '+201007778889', '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('98e2ad8d-8a5c-4634-9745-15ebf739896f', 'Al-Ahram Woodwork Specialists', 'Carpentry', 4.50, '+201001112223', '2026-06-11 07:43:07', '2026-06-11 07:43:07');

-- --------------------------------------------------------

--
-- Table structure for table `vendor_invoices`
--

CREATE TABLE `vendor_invoices` (
  `id` char(36) NOT NULL,
  `tenant_id` char(36) DEFAULT NULL,
  `company_id` char(36) NOT NULL,
  `vendor_id` char(36) NOT NULL,
  `purchase_order_id` char(36) DEFAULT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('pending_matching','matched','mismatch_disputed','approved','paid','cancelled') NOT NULL DEFAULT 'pending_matching',
  `matching_notes` text DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor_quotations`
--

CREATE TABLE `vendor_quotations` (
  `id` char(36) NOT NULL,
  `rfq_id` char(36) NOT NULL,
  `vendor_id` char(36) NOT NULL,
  `submitted_date` datetime DEFAULT NULL,
  `total_quoted_amount` decimal(15,2) NOT NULL,
  `delivery_timeline_days` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','under_review','accepted','rejected') NOT NULL DEFAULT 'pending',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warranties`
--

CREATE TABLE `warranties` (
  `id` char(36) NOT NULL,
  `unit_id` char(36) NOT NULL,
  `vendor_name` varchar(255) NOT NULL,
  `coverage_details` varchar(255) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workflow_templates`
--

CREATE TABLE `workflow_templates` (
  `id` char(36) NOT NULL,
  `trigger_name` varchar(255) NOT NULL,
  `action_name` varchar(255) NOT NULL,
  `rules_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rules_payload`)),
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workflow_templates`
--

INSERT INTO `workflow_templates` (`id`, `trigger_name`, `action_name`, `rules_payload`, `active`, `created_at`, `updated_at`) VALUES
('72279b43-5b20-49af-bed9-0898a50697ac', 'ContractSigned', 'GenerateHandoverTimeline', '{\"payload\":\"Timeline PDF generation.\"}', 0, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('827ea115-125a-4046-9f8f-8829d25af8c3', 'PaymentReceived', 'SendWhatsAppNotification', '{\"payload\":\"Thank you! Q3 installment processed.\"}', 1, '2026-06-11 07:43:07', '2026-06-11 07:43:07'),
('9984eb96-2ea0-4609-b98e-9d6bb66ca862', 'ReservationConfirmed', 'ScheduleQCInspection', '{\"payload\":\"Handover unit check timeline.\"}', 1, '2026-06-11 07:43:07', '2026-06-11 07:43:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_conversations`
--
ALTER TABLE `ai_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_conversations_company_id_foreign` (`company_id`),
  ADD KEY `ai_conversations_conversation_id_foreign` (`conversation_id`),
  ADD KEY `ai_conversations_session_id_index` (`session_id`);

--
-- Indexes for table `ai_predictions`
--
ALTER TABLE `ai_predictions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ai_predictions_company_id_foreign` (`company_id`),
  ADD KEY `ai_predictions_model_name_status_index` (`model_name`,`status`),
  ADD KEY `ai_predictions_entity_type_entity_id_index` (`entity_type`,`entity_id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointments_user_id_foreign` (`user_id`),
  ADD KEY `appointments_lead_id_foreign` (`lead_id`);

--
-- Indexes for table `approval_actions`
--
ALTER TABLE `approval_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approval_actions_step_id_foreign` (`step_id`),
  ADD KEY `approval_actions_actor_id_foreign` (`actor_id`),
  ADD KEY `approval_actions_instance_id_step_id_index` (`instance_id`,`step_id`);

--
-- Indexes for table `approval_conditions`
--
ALTER TABLE `approval_conditions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approval_conditions_step_id_foreign` (`step_id`);

--
-- Indexes for table `approval_instances`
--
ALTER TABLE `approval_instances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approval_instances_workflow_id_foreign` (`workflow_id`),
  ADD KEY `approval_instances_current_step_id_foreign` (`current_step_id`),
  ADD KEY `approval_instances_entity_type_entity_id_index` (`entity_type`,`entity_id`),
  ADD KEY `approval_instances_status_index` (`status`),
  ADD KEY `approval_instances_requested_by_index` (`requested_by`);

--
-- Indexes for table `approval_steps`
--
ALTER TABLE `approval_steps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approval_steps_escalation_to_foreign` (`escalation_to`),
  ADD KEY `approval_steps_workflow_id_step_order_index` (`workflow_id`,`step_order`);

--
-- Indexes for table `approval_workflows`
--
ALTER TABLE `approval_workflows`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approval_workflows_company_id_foreign` (`company_id`),
  ADD KEY `approval_workflows_created_by_foreign` (`created_by`),
  ADD KEY `approval_workflows_entity_type_is_active_index` (`entity_type`,`is_active`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_user_id_foreign` (`user_id`);

--
-- Indexes for table `boq_items`
--
ALTER TABLE `boq_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `boq_items_phase_id_foreign` (`phase_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branches_code_unique` (`code`),
  ADD KEY `branches_country_id_foreign` (`country_id`),
  ADD KEY `branches_region_id_foreign` (`region_id`),
  ADD KEY `branches_manager_id_foreign` (`manager_id`),
  ADD KEY `branches_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `brokers`
--
ALTER TABLE `brokers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `brokers_referral_code_unique` (`referral_code`),
  ADD KEY `idx_brokers_status` (`status`),
  ADD KEY `idx_brokers_phone` (`phone`),
  ADD KEY `idx_brokers_email` (`email`),
  ADD KEY `idx_brokers_user` (`user_id`),
  ADD KEY `brokers_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `budget_unique_period` (`company_id`,`account_id`,`fiscal_year`,`period`),
  ADD KEY `budgets_account_id_foreign` (`account_id`),
  ADD KEY `budgets_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `buildings`
--
ALTER TABLE `buildings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `buildings_project_id_sort_order_index` (`project_id`,`sort_order`);

--
-- Indexes for table `building_floors`
--
ALTER TABLE `building_floors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `building_floors_building_id_floor_number_unique` (`building_id`,`floor_number`),
  ADD KEY `building_floors_building_id_floor_number_index` (`building_id`,`floor_number`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `call_logs`
--
ALTER TABLE `call_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `call_logs_call_sid_unique` (`call_sid`),
  ADD KEY `idx_call_logs_lead` (`lead_id`),
  ADD KEY `idx_call_logs_status` (`status`),
  ADD KEY `idx_call_logs_direction` (`direction`),
  ADD KEY `idx_call_logs_created` (`created_at`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_campaigns_source` (`source`),
  ADD KEY `idx_campaigns_utm_source` (`utm_source`),
  ADD KEY `idx_campaigns_utm_campaign` (`utm_campaign`);

--
-- Indexes for table `cancellations`
--
ALTER TABLE `cancellations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cancellations_contract_id_foreign` (`contract_id`);

--
-- Indexes for table `capa_actions`
--
ALTER TABLE `capa_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `capa_actions_ncr_id_foreign` (`ncr_id`);

--
-- Indexes for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `chart_of_accounts_company_id_code_unique` (`company_id`,`code`),
  ADD KEY `chart_of_accounts_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `client_journey_logs`
--
ALTER TABLE `client_journey_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_journey_lead` (`lead_id`),
  ADD KEY `idx_journey_actor` (`actor_user_id`),
  ADD KEY `idx_journey_stage` (`stage`),
  ADD KEY `idx_journey_lead_stage` (`lead_id`,`stage`);

--
-- Indexes for table `client_presentations`
--
ALTER TABLE `client_presentations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_presentations_escalated_to_user_id_foreign` (`escalated_to_user_id`),
  ADD KEY `idx_presentations_broker` (`broker_user_id`),
  ADD KEY `idx_presentations_lead` (`lead_id`),
  ADD KEY `idx_presentations_project` (`project_id`),
  ADD KEY `idx_presentations_outcome` (`outcome`),
  ADD KEY `idx_presentations_broker_lead` (`broker_user_id`,`lead_id`);

--
-- Indexes for table `collections_queue`
--
ALTER TABLE `collections_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `collections_queue_contract_id_foreign` (`contract_id`),
  ADD KEY `collections_queue_client_id_foreign` (`client_id`);

--
-- Indexes for table `commissions`
--
ALTER TABLE `commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_commissions_broker` (`broker_id`),
  ADD KEY `idx_commissions_lead` (`lead_id`),
  ADD KEY `idx_commissions_unit` (`unit_id`),
  ADD KEY `idx_commissions_status` (`status`);

--
-- Indexes for table `commission_calculations`
--
ALTER TABLE `commission_calculations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commission_calculations_company_id_foreign` (`company_id`),
  ADD KEY `commission_calculations_payment_id_foreign` (`payment_id`),
  ADD KEY `commission_calculations_contract_id_foreign` (`contract_id`),
  ADD KEY `commission_calculations_rule_id_foreign` (`rule_id`),
  ADD KEY `commission_calculations_payout_id_foreign` (`payout_id`),
  ADD KEY `commission_calculations_user_id_foreign` (`user_id`),
  ADD KEY `commission_calculations_broker_id_foreign` (`broker_id`);

--
-- Indexes for table `commission_payouts`
--
ALTER TABLE `commission_payouts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `commission_payouts_payout_number_unique` (`payout_number`),
  ADD KEY `commission_payouts_company_id_foreign` (`company_id`),
  ADD KEY `commission_payouts_user_id_foreign` (`user_id`),
  ADD KEY `commission_payouts_broker_id_foreign` (`broker_id`),
  ADD KEY `commission_payouts_approved_by_foreign` (`approved_by`),
  ADD KEY `commission_payouts_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `commission_payout_requests`
--
ALTER TABLE `commission_payout_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commission_payout_requests_broker_id_foreign` (`broker_id`);

--
-- Indexes for table `commission_rules`
--
ALTER TABLE `commission_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commission_rules_company_id_foreign` (`company_id`),
  ADD KEY `commission_rules_project_id_foreign` (`project_id`),
  ADD KEY `commission_rules_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `communication_channels`
--
ALTER TABLE `communication_channels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `communication_channels_company_id_foreign` (`company_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `companies_country_id_foreign` (`country_id`),
  ADD KEY `companies_parent_company_id_index` (`parent_company_id`),
  ADD KEY `companies_status_index` (`status`),
  ADD KEY `companies_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `company_groups`
--
ALTER TABLE `company_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_groups_parent_group_id_foreign` (`parent_group_id`);

--
-- Indexes for table `company_group_members`
--
ALTER TABLE `company_group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `company_group_members_company_group_id_company_id_unique` (`company_group_id`,`company_id`),
  ADD KEY `company_group_members_company_id_foreign` (`company_id`);

--
-- Indexes for table `construction_milestones`
--
ALTER TABLE `construction_milestones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `construction_milestones_phase_id_foreign` (`phase_id`);

--
-- Indexes for table `contracts`
--
ALTER TABLE `contracts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contracts_contract_number_unique` (`contract_number`),
  ADD KEY `contracts_reservation_id_foreign` (`reservation_id`),
  ADD KEY `contracts_unit_id_foreign` (`unit_id`),
  ADD KEY `contracts_client_id_foreign` (`client_id`),
  ADD KEY `contracts_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversations_channel_id_foreign` (`channel_id`),
  ADD KEY `conversations_lead_id_foreign` (`lead_id`),
  ADD KEY `conversations_assigned_agent_id_foreign` (`assigned_agent_id`),
  ADD KEY `conversations_customer_phone_customer_email_index` (`customer_phone`,`customer_email`),
  ADD KEY `conversations_status_assigned_agent_id_index` (`status`,`assigned_agent_id`),
  ADD KEY `conversations_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `cost_centers`
--
ALTER TABLE `cost_centers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cost_centers_company_id_code_unique` (`company_id`,`code`),
  ADD KEY `cost_centers_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `court_sessions`
--
ALTER TABLE `court_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `court_sessions_case_id_foreign` (`case_id`),
  ADD KEY `court_sessions_created_by_foreign` (`created_by`),
  ADD KEY `court_sessions_session_date_status_index` (`session_date`,`status`);

--
-- Indexes for table `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `currencies_code_unique` (`code`);

--
-- Indexes for table `dashboard_layouts`
--
ALTER TABLE `dashboard_layouts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dashboard_layouts_role_type_unique` (`role_type`);

--
-- Indexes for table `defects_snags`
--
ALTER TABLE `defects_snags`
  ADD PRIMARY KEY (`id`),
  ADD KEY `defects_snags_unit_id_foreign` (`unit_id`);

--
-- Indexes for table `delegations`
--
ALTER TABLE `delegations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `delegations_company_id_foreign` (`company_id`),
  ADD KEY `delegations_created_by_foreign` (`created_by`),
  ADD KEY `delegations_delegator_id_status_index` (`delegator_id`,`status`),
  ADD KEY `delegations_delegate_id_status_index` (`delegate_id`,`status`),
  ADD KEY `delegations_end_date_status_index` (`end_date`,`status`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departments_company_id_code_unique` (`company_id`,`code`),
  ADD KEY `departments_branch_id_foreign` (`branch_id`),
  ADD KEY `departments_parent_department_id_foreign` (`parent_department_id`),
  ADD KEY `departments_head_id_foreign` (`head_id`),
  ADD KEY `departments_company_id_branch_id_index` (`company_id`,`branch_id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employee_hierarchy`
--
ALTER TABLE `employee_hierarchy`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_hierarchy_user_id_company_id_unique` (`user_id`,`company_id`),
  ADD UNIQUE KEY `employee_hierarchy_employee_number_unique` (`employee_number`),
  ADD KEY `employee_hierarchy_branch_id_foreign` (`branch_id`),
  ADD KEY `employee_hierarchy_department_id_foreign` (`department_id`),
  ADD KEY `employee_hierarchy_team_id_foreign` (`team_id`),
  ADD KEY `employee_hierarchy_position_id_foreign` (`position_id`),
  ADD KEY `employee_hierarchy_indirect_manager_id_foreign` (`indirect_manager_id`),
  ADD KEY `employee_hierarchy_matrix_manager_id_foreign` (`matrix_manager_id`),
  ADD KEY `employee_hierarchy_company_id_department_id_status_index` (`company_id`,`department_id`,`status`),
  ADD KEY `employee_hierarchy_direct_manager_id_index` (`direct_manager_id`);

--
-- Indexes for table `enterprise_countries`
--
ALTER TABLE `enterprise_countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `enterprise_countries_code_unique` (`code`);

--
-- Indexes for table `enterprise_roles`
--
ALTER TABLE `enterprise_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `enterprise_roles_name_unique` (`name`),
  ADD KEY `enterprise_roles_parent_role_id_foreign` (`parent_role_id`),
  ADD KEY `enterprise_roles_company_id_foreign` (`company_id`),
  ADD KEY `enterprise_roles_status_company_id_index` (`status`,`company_id`);

--
-- Indexes for table `eoi_queue`
--
ALTER TABLE `eoi_queue`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_eoi_lead_project` (`lead_id`,`project_id`),
  ADD KEY `idx_eoi_lead` (`lead_id`),
  ADD KEY `idx_eoi_project` (`project_id`),
  ADD KEY `idx_eoi_priority` (`priority_score`),
  ADD KEY `idx_eoi_status` (`status`),
  ADD KEY `idx_eoi_queue_number` (`queue_number`);

--
-- Indexes for table `eoi_reservations`
--
ALTER TABLE `eoi_reservations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_eoi_res_lead_project` (`lead_id`,`project_id`),
  ADD UNIQUE KEY `eoi_reservations_order_number_unique` (`order_number`),
  ADD KEY `idx_eoi_res_lead` (`lead_id`),
  ADD KEY `idx_eoi_res_project` (`project_id`),
  ADD KEY `idx_eoi_res_status` (`status`),
  ADD KEY `idx_eoi_res_queue` (`queue_number`),
  ADD KEY `idx_eoi_res_order` (`order_number`),
  ADD KEY `idx_eoi_res_email` (`client_email`),
  ADD KEY `eoi_reservations_unit_id_foreign` (`unit_id`),
  ADD KEY `eoi_reservations_reviewer_id_foreign` (`reviewer_id`);

--
-- Indexes for table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `exchange_rates_from_currency_id_to_currency_id_unique` (`from_currency_id`,`to_currency_id`),
  ADD KEY `exchange_rates_to_currency_id_foreign` (`to_currency_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `family_members`
--
ALTER TABLE `family_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `family_members_user_id_foreign` (`user_id`);

--
-- Indexes for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gl_unique_period` (`company_id`,`account_id`,`fiscal_year`,`period`),
  ADD KEY `general_ledger_account_id_foreign` (`account_id`);

--
-- Indexes for table `goods_receipts`
--
ALTER TABLE `goods_receipts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `goods_receipts_company_id_foreign` (`company_id`),
  ADD KEY `goods_receipts_purchase_order_id_foreign` (`purchase_order_id`),
  ADD KEY `goods_receipts_received_by_foreign` (`received_by`);

--
-- Indexes for table `interactions`
--
ALTER TABLE `interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interactions_lead` (`lead_id`),
  ADD KEY `idx_interactions_type` (`type`),
  ADD KEY `idx_interactions_followup` (`follow_up_date`),
  ADD KEY `idx_interactions_logged_by` (`logged_by`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `journal_entries_entry_number_unique` (`entry_number`),
  ADD KEY `journal_entries_company_id_foreign` (`company_id`),
  ADD KEY `journal_entries_created_by_foreign` (`created_by`),
  ADD KEY `journal_entries_approved_by_foreign` (`approved_by`),
  ADD KEY `journal_entries_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `journal_lines`
--
ALTER TABLE `journal_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_lines_journal_entry_id_foreign` (`journal_entry_id`),
  ADD KEY `journal_lines_account_id_foreign` (`account_id`),
  ADD KEY `journal_lines_cost_center_id_foreign` (`cost_center_id`),
  ADD KEY `journal_lines_profit_center_id_foreign` (`profit_center_id`);

--
-- Indexes for table `kpi_metrics`
--
ALTER TABLE `kpi_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kpi_metrics_company_id_name_period_unique` (`company_id`,`name`,`period`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_leads_status` (`status`),
  ADD KEY `idx_leads_score` (`lead_score`),
  ADD KEY `idx_leads_phone` (`phone`),
  ADD KEY `idx_leads_national_id` (`national_id`),
  ADD KEY `idx_leads_agent` (`assigned_sales_agent_id`),
  ADD KEY `idx_leads_campaign` (`campaign_id`),
  ADD KEY `idx_leads_broker` (`broker_id`),
  ADD KEY `idx_leads_phone_nid_composite` (`phone`,`national_id`),
  ADD KEY `idx_leads_status_agent` (`status`,`assigned_sales_agent_id`),
  ADD KEY `idx_leads_tele_sales` (`tele_sales_agent_id`),
  ADD KEY `idx_leads_company_sales` (`company_sales_agent_id`),
  ADD KEY `idx_leads_current_tier` (`current_tier`),
  ADD KEY `leads_interested_project_id_foreign` (`interested_project_id`),
  ADD KEY `leads_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `lead_locks`
--
ALTER TABLE `lead_locks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_lead_locks_phone_active` (`phone`,`status`),
  ADD KEY `idx_lead_locks_broker` (`broker_id`),
  ADD KEY `idx_lead_locks_lead` (`lead_id`),
  ADD KEY `idx_lead_locks_until` (`locked_until`),
  ADD KEY `idx_lead_locks_status` (`status`),
  ADD KEY `idx_lead_locks_phone_nid` (`phone`,`national_id`);

--
-- Indexes for table `legal_actions`
--
ALTER TABLE `legal_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `legal_actions_case_id_foreign` (`case_id`),
  ADD KEY `legal_actions_assigned_to_foreign` (`assigned_to`),
  ADD KEY `legal_actions_created_by_foreign` (`created_by`),
  ADD KEY `legal_actions_due_date_completed_at_index` (`due_date`,`completed_at`);

--
-- Indexes for table `legal_cases`
--
ALTER TABLE `legal_cases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `legal_cases_case_number_unique` (`case_number`),
  ADD KEY `legal_cases_company_id_foreign` (`company_id`),
  ADD KEY `legal_cases_assigned_lawyer_id_foreign` (`assigned_lawyer_id`),
  ADD KEY `legal_cases_entity_type_entity_id_index` (`entity_type`,`entity_id`),
  ADD KEY `legal_cases_status_priority_index` (`status`,`priority`),
  ADD KEY `legal_cases_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `legal_documents`
--
ALTER TABLE `legal_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `legal_documents_case_id_foreign` (`case_id`),
  ADD KEY `legal_documents_uploaded_by_foreign` (`uploaded_by`);

--
-- Indexes for table `legal_parties`
--
ALTER TABLE `legal_parties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `legal_parties_case_id_foreign` (`case_id`);

--
-- Indexes for table `maintenance_tickets`
--
ALTER TABLE `maintenance_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `maintenance_tickets_client_id_foreign` (`client_id`),
  ADD KEY `maintenance_tickets_unit_id_foreign` (`unit_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messages_sender_id_foreign` (`sender_id`),
  ADD KEY `messages_conversation_id_created_at_index` (`conversation_id`,`created_at`);

--
-- Indexes for table `message_templates`
--
ALTER TABLE `message_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_templates_company_id_foreign` (`company_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ncr_reports`
--
ALTER TABLE `ncr_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ncr_reports_inspection_id_foreign` (`inspection_id`),
  ADD KEY `ncr_reports_assigned_engineer_id_foreign` (`assigned_engineer_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_foreign` (`user_id`),
  ADD KEY `notifications_lead_id_foreign` (`lead_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_contract_id_foreign` (`contract_id`),
  ADD KEY `payments_payment_plan_id_foreign` (`payment_plan_id`),
  ADD KEY `payments_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `payment_plans`
--
ALTER TABLE `payment_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_plans_contract_id_foreign` (`contract_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`),
  ADD KEY `permissions_module_index` (`module`);

--
-- Indexes for table `permission_templates`
--
ALTER TABLE `permission_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `permission_templates_created_by_foreign` (`created_by`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `positions_company_id_code_unique` (`company_id`,`code`),
  ADD KEY `positions_department_id_foreign` (`department_id`);

--
-- Indexes for table `profit_centers`
--
ALTER TABLE `profit_centers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profit_centers_company_id_code_unique` (`company_id`,`code`),
  ADD KEY `profit_centers_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projects_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `project_amenities`
--
ALTER TABLE `project_amenities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_amenities_project_id_index` (`project_id`);

--
-- Indexes for table `project_media`
--
ALTER TABLE `project_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_media_project_id_media_type_reference_key_index` (`project_id`,`media_type`,`reference_key`);

--
-- Indexes for table `project_payment_plans`
--
ALTER TABLE `project_payment_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_payment_plans_project_id_foreign` (`project_id`);

--
-- Indexes for table `project_phases`
--
ALTER TABLE `project_phases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_phases_project_id_foreign` (`project_id`),
  ADD KEY `project_phases_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `purchase_orders_po_number_unique` (`po_number`),
  ADD KEY `purchase_orders_company_id_foreign` (`company_id`),
  ADD KEY `purchase_orders_purchase_request_id_foreign` (`purchase_request_id`),
  ADD KEY `purchase_orders_rfq_id_foreign` (`rfq_id`),
  ADD KEY `purchase_orders_vendor_quotation_id_foreign` (`vendor_quotation_id`),
  ADD KEY `purchase_orders_vendor_id_foreign` (`vendor_id`),
  ADD KEY `purchase_orders_approved_by_foreign` (`approved_by`),
  ADD KEY `purchase_orders_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_requests_company_id_foreign` (`company_id`),
  ADD KEY `purchase_requests_requested_by_foreign` (`requested_by`),
  ADD KEY `purchase_requests_department_id_foreign` (`department_id`),
  ADD KEY `purchase_requests_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `regions`
--
ALTER TABLE `regions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `regions_code_unique` (`code`),
  ADD KEY `regions_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `resale_requests`
--
ALTER TABLE `resale_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `resale_requests_user_id_foreign` (`user_id`),
  ADD KEY `resale_requests_unit_id_foreign` (`unit_id`),
  ADD KEY `resale_requests_reviewed_by_foreign` (`reviewed_by`);

--
-- Indexes for table `rescheduling_requests`
--
ALTER TABLE `rescheduling_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rescheduling_requests_contract_id_foreign` (`contract_id`),
  ADD KEY `rescheduling_requests_reviewed_by_foreign` (`reviewed_by`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservations_unit_id_foreign` (`unit_id`),
  ADD KEY `reservations_client_id_foreign` (`client_id`),
  ADD KEY `reservations_tenant_id_foreign` (`tenant_id`),
  ADD KEY `reservations_broker_id_foreign` (`broker_id`);

--
-- Indexes for table `resource_allocations`
--
ALTER TABLE `resource_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `resource_allocations_milestone_id_foreign` (`milestone_id`);

--
-- Indexes for table `rfqs`
--
ALTER TABLE `rfqs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `rfqs_company_id_foreign` (`company_id`),
  ADD KEY `rfqs_purchase_request_id_foreign` (`purchase_request_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`),
  ADD KEY `role_permissions_permission_id_foreign` (`permission_id`);

--
-- Indexes for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_requests_user_id_foreign` (`user_id`),
  ADD KEY `service_requests_unit_id_foreign` (`unit_id`);

--
-- Indexes for table `site_inspections`
--
ALTER TABLE `site_inspections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `site_inspections_project_id_foreign` (`project_id`),
  ADD KEY `site_inspections_tenant_id_foreign` (`tenant_id`),
  ADD KEY `site_inspections_milestone_id_foreign` (`milestone_id`),
  ADD KEY `site_inspections_inspector_id_foreign` (`inspector_id`);

--
-- Indexes for table `system_configs`
--
ALTER TABLE `system_configs`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tasks_parent_task_id_foreign` (`parent_task_id`),
  ADD KEY `tasks_created_by_foreign` (`created_by`),
  ADD KEY `tasks_company_id_foreign` (`company_id`),
  ADD KEY `tasks_related_type_related_id_index` (`related_type`,`related_id`),
  ADD KEY `tasks_status_priority_index` (`status`,`priority`),
  ADD KEY `tasks_assigned_to_due_date_index` (`assigned_to`,`due_date`),
  ADD KEY `tasks_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_attachments_task_id_foreign` (`task_id`),
  ADD KEY `task_attachments_uploaded_by_foreign` (`uploaded_by`);

--
-- Indexes for table `task_checklists`
--
ALTER TABLE `task_checklists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_checklists_task_id_foreign` (`task_id`);

--
-- Indexes for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_comments_task_id_foreign` (`task_id`),
  ADD KEY `task_comments_user_id_foreign` (`user_id`);

--
-- Indexes for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `task_dependencies_task_id_blocked_by_task_id_unique` (`task_id`,`blocked_by_task_id`),
  ADD KEY `task_dependencies_blocked_by_task_id_foreign` (`blocked_by_task_id`);

--
-- Indexes for table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `teams_company_id_foreign` (`company_id`),
  ADD KEY `teams_leader_id_foreign` (`leader_id`),
  ADD KEY `teams_department_id_status_index` (`department_id`,`status`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tenants_subdomain_unique` (`subdomain`),
  ADD UNIQUE KEY `tenants_domain_unique` (`domain`);

--
-- Indexes for table `tenant_subscriptions`
--
ALTER TABLE `tenant_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tenant_subscriptions_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `translations`
--
ALTER TABLE `translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `translations_locale_group_key_unique` (`locale`,`group`,`key`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `units_project_id_foreign` (`project_id`),
  ADD KEY `units_tenant_id_foreign` (`tenant_id`),
  ADD KEY `units_building_id_foreign` (`building_id`),
  ADD KEY `units_floor_id_foreign` (`floor_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_company_id_foreign` (`company_id`),
  ADD KEY `users_branch_id_foreign` (`branch_id`),
  ADD KEY `users_department_id_foreign` (`department_id`),
  ADD KEY `users_team_id_foreign` (`team_id`),
  ADD KEY `users_position_id_foreign` (`position_id`),
  ADD KEY `users_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_permissions_permission_id_foreign` (`permission_id`),
  ADD KEY `user_permissions_granted_by_foreign` (`granted_by`),
  ADD KEY `user_permissions_user_id_permission_id_index` (`user_id`,`permission_id`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_roles_role_id_foreign` (`role_id`),
  ADD KEY `user_roles_company_id_foreign` (`company_id`),
  ADD KEY `user_roles_branch_id_foreign` (`branch_id`),
  ADD KEY `user_roles_granted_by_foreign` (`granted_by`),
  ADD KEY `user_roles_user_id_role_id_index` (`user_id`,`role_id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicles_user_id_foreign` (`user_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vendor_invoices`
--
ALTER TABLE `vendor_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_invoices_company_id_foreign` (`company_id`),
  ADD KEY `vendor_invoices_vendor_id_foreign` (`vendor_id`),
  ADD KEY `vendor_invoices_purchase_order_id_foreign` (`purchase_order_id`),
  ADD KEY `vendor_invoices_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `vendor_quotations`
--
ALTER TABLE `vendor_quotations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_quotations_rfq_id_foreign` (`rfq_id`),
  ADD KEY `vendor_quotations_vendor_id_foreign` (`vendor_id`);

--
-- Indexes for table `warranties`
--
ALTER TABLE `warranties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warranties_unit_id_foreign` (`unit_id`);

--
-- Indexes for table `workflow_templates`
--
ALTER TABLE `workflow_templates`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ai_conversations`
--
ALTER TABLE `ai_conversations`
  ADD CONSTRAINT `ai_conversations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ai_conversations_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ai_predictions`
--
ALTER TABLE `ai_predictions`
  ADD CONSTRAINT `ai_predictions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `approval_actions`
--
ALTER TABLE `approval_actions`
  ADD CONSTRAINT `approval_actions_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_actions_instance_id_foreign` FOREIGN KEY (`instance_id`) REFERENCES `approval_instances` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_actions_step_id_foreign` FOREIGN KEY (`step_id`) REFERENCES `approval_steps` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `approval_conditions`
--
ALTER TABLE `approval_conditions`
  ADD CONSTRAINT `approval_conditions_step_id_foreign` FOREIGN KEY (`step_id`) REFERENCES `approval_steps` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `approval_instances`
--
ALTER TABLE `approval_instances`
  ADD CONSTRAINT `approval_instances_current_step_id_foreign` FOREIGN KEY (`current_step_id`) REFERENCES `approval_steps` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `approval_instances_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_instances_workflow_id_foreign` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `approval_steps`
--
ALTER TABLE `approval_steps`
  ADD CONSTRAINT `approval_steps_escalation_to_foreign` FOREIGN KEY (`escalation_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `approval_steps_workflow_id_foreign` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `approval_workflows`
--
ALTER TABLE `approval_workflows`
  ADD CONSTRAINT `approval_workflows_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `approval_workflows_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `boq_items`
--
ALTER TABLE `boq_items`
  ADD CONSTRAINT `boq_items_phase_id_foreign` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `branches_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `enterprise_countries` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `branches_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `branches_region_id_foreign` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `brokers`
--
ALTER TABLE `brokers`
  ADD CONSTRAINT `brokers_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `brokers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `budgets_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `budgets_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `buildings`
--
ALTER TABLE `buildings`
  ADD CONSTRAINT `buildings_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `building_floors`
--
ALTER TABLE `building_floors`
  ADD CONSTRAINT `building_floors_building_id_foreign` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `call_logs`
--
ALTER TABLE `call_logs`
  ADD CONSTRAINT `call_logs_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cancellations`
--
ALTER TABLE `cancellations`
  ADD CONSTRAINT `cancellations_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `capa_actions`
--
ALTER TABLE `capa_actions`
  ADD CONSTRAINT `capa_actions_ncr_id_foreign` FOREIGN KEY (`ncr_id`) REFERENCES `ncr_reports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD CONSTRAINT `chart_of_accounts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chart_of_accounts_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `client_journey_logs`
--
ALTER TABLE `client_journey_logs`
  ADD CONSTRAINT `client_journey_logs_actor_user_id_foreign` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_journey_logs_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `client_presentations`
--
ALTER TABLE `client_presentations`
  ADD CONSTRAINT `client_presentations_broker_user_id_foreign` FOREIGN KEY (`broker_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_presentations_escalated_to_user_id_foreign` FOREIGN KEY (`escalated_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `client_presentations_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `client_presentations_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `collections_queue`
--
ALTER TABLE `collections_queue`
  ADD CONSTRAINT `collections_queue_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `collections_queue_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `commissions`
--
ALTER TABLE `commissions`
  ADD CONSTRAINT `commissions_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commissions_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `commission_calculations`
--
ALTER TABLE `commission_calculations`
  ADD CONSTRAINT `commission_calculations_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_calculations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_calculations_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_calculations_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_calculations_payout_id_foreign` FOREIGN KEY (`payout_id`) REFERENCES `commission_payouts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `commission_calculations_rule_id_foreign` FOREIGN KEY (`rule_id`) REFERENCES `commission_rules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_calculations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `commission_payouts`
--
ALTER TABLE `commission_payouts`
  ADD CONSTRAINT `commission_payouts_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `commission_payouts_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_payouts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_payouts_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `commission_payouts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `commission_payout_requests`
--
ALTER TABLE `commission_payout_requests`
  ADD CONSTRAINT `commission_payout_requests_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `commission_rules`
--
ALTER TABLE `commission_rules`
  ADD CONSTRAINT `commission_rules_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_rules_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commission_rules_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `communication_channels`
--
ALTER TABLE `communication_channels`
  ADD CONSTRAINT `communication_channels_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `enterprise_countries` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `companies_parent_company_id_foreign` FOREIGN KEY (`parent_company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `companies_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `company_groups`
--
ALTER TABLE `company_groups`
  ADD CONSTRAINT `company_groups_parent_group_id_foreign` FOREIGN KEY (`parent_group_id`) REFERENCES `company_groups` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `company_group_members`
--
ALTER TABLE `company_group_members`
  ADD CONSTRAINT `company_group_members_company_group_id_foreign` FOREIGN KEY (`company_group_id`) REFERENCES `company_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `company_group_members_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `construction_milestones`
--
ALTER TABLE `construction_milestones`
  ADD CONSTRAINT `construction_milestones_phase_id_foreign` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contracts_reservation_id_foreign` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contracts_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contracts_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_assigned_agent_id_foreign` FOREIGN KEY (`assigned_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conversations_channel_id_foreign` FOREIGN KEY (`channel_id`) REFERENCES `communication_channels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conversations_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `cost_centers`
--
ALTER TABLE `cost_centers`
  ADD CONSTRAINT `cost_centers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cost_centers_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `cost_centers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `court_sessions`
--
ALTER TABLE `court_sessions`
  ADD CONSTRAINT `court_sessions_case_id_foreign` FOREIGN KEY (`case_id`) REFERENCES `legal_cases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `court_sessions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `defects_snags`
--
ALTER TABLE `defects_snags`
  ADD CONSTRAINT `defects_snags_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delegations`
--
ALTER TABLE `delegations`
  ADD CONSTRAINT `delegations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `delegations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `delegations_delegate_id_foreign` FOREIGN KEY (`delegate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `delegations_delegator_id_foreign` FOREIGN KEY (`delegator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `departments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `departments_head_id_foreign` FOREIGN KEY (`head_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `departments_parent_department_id_foreign` FOREIGN KEY (`parent_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employee_hierarchy`
--
ALTER TABLE `employee_hierarchy`
  ADD CONSTRAINT `employee_hierarchy_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employee_hierarchy_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employee_hierarchy_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employee_hierarchy_direct_manager_id_foreign` FOREIGN KEY (`direct_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employee_hierarchy_indirect_manager_id_foreign` FOREIGN KEY (`indirect_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employee_hierarchy_matrix_manager_id_foreign` FOREIGN KEY (`matrix_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employee_hierarchy_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employee_hierarchy_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employee_hierarchy_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `enterprise_roles`
--
ALTER TABLE `enterprise_roles`
  ADD CONSTRAINT `enterprise_roles_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `enterprise_roles_parent_role_id_foreign` FOREIGN KEY (`parent_role_id`) REFERENCES `enterprise_roles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `eoi_queue`
--
ALTER TABLE `eoi_queue`
  ADD CONSTRAINT `eoi_queue_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `eoi_reservations`
--
ALTER TABLE `eoi_reservations`
  ADD CONSTRAINT `eoi_reservations_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `eoi_reservations_reviewer_id_foreign` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `eoi_reservations_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  ADD CONSTRAINT `exchange_rates_from_currency_id_foreign` FOREIGN KEY (`from_currency_id`) REFERENCES `currencies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exchange_rates_to_currency_id_foreign` FOREIGN KEY (`to_currency_id`) REFERENCES `currencies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `family_members`
--
ALTER TABLE `family_members`
  ADD CONSTRAINT `family_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD CONSTRAINT `general_ledger_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `general_ledger_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `goods_receipts`
--
ALTER TABLE `goods_receipts`
  ADD CONSTRAINT `goods_receipts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `goods_receipts_purchase_order_id_foreign` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `goods_receipts_received_by_foreign` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `interactions`
--
ALTER TABLE `interactions`
  ADD CONSTRAINT `interactions_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `interactions_logged_by_foreign` FOREIGN KEY (`logged_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `journal_entries_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `journal_entries_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_entries_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_entries_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `journal_lines`
--
ALTER TABLE `journal_lines`
  ADD CONSTRAINT `journal_lines_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_lines_cost_center_id_foreign` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `journal_lines_journal_entry_id_foreign` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_lines_profit_center_id_foreign` FOREIGN KEY (`profit_center_id`) REFERENCES `profit_centers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kpi_metrics`
--
ALTER TABLE `kpi_metrics`
  ADD CONSTRAINT `kpi_metrics_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_assigned_sales_agent_id_foreign` FOREIGN KEY (`assigned_sales_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_company_sales_agent_id_foreign` FOREIGN KEY (`company_sales_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_interested_project_id_foreign` FOREIGN KEY (`interested_project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_tele_sales_agent_id_foreign` FOREIGN KEY (`tele_sales_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lead_locks`
--
ALTER TABLE `lead_locks`
  ADD CONSTRAINT `lead_locks_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lead_locks_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `legal_actions`
--
ALTER TABLE `legal_actions`
  ADD CONSTRAINT `legal_actions_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `legal_actions_case_id_foreign` FOREIGN KEY (`case_id`) REFERENCES `legal_cases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `legal_actions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `legal_cases`
--
ALTER TABLE `legal_cases`
  ADD CONSTRAINT `legal_cases_assigned_lawyer_id_foreign` FOREIGN KEY (`assigned_lawyer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `legal_cases_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `legal_cases_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `legal_documents`
--
ALTER TABLE `legal_documents`
  ADD CONSTRAINT `legal_documents_case_id_foreign` FOREIGN KEY (`case_id`) REFERENCES `legal_cases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `legal_documents_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `legal_parties`
--
ALTER TABLE `legal_parties`
  ADD CONSTRAINT `legal_parties_case_id_foreign` FOREIGN KEY (`case_id`) REFERENCES `legal_cases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `maintenance_tickets`
--
ALTER TABLE `maintenance_tickets`
  ADD CONSTRAINT `maintenance_tickets_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `maintenance_tickets_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `message_templates`
--
ALTER TABLE `message_templates`
  ADD CONSTRAINT `message_templates_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ncr_reports`
--
ALTER TABLE `ncr_reports`
  ADD CONSTRAINT `ncr_reports_assigned_engineer_id_foreign` FOREIGN KEY (`assigned_engineer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ncr_reports_inspection_id_foreign` FOREIGN KEY (`inspection_id`) REFERENCES `site_inspections` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_payment_plan_id_foreign` FOREIGN KEY (`payment_plan_id`) REFERENCES `payment_plans` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payment_plans`
--
ALTER TABLE `payment_plans`
  ADD CONSTRAINT `payment_plans_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permission_templates`
--
ALTER TABLE `permission_templates`
  ADD CONSTRAINT `permission_templates_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `positions`
--
ALTER TABLE `positions`
  ADD CONSTRAINT `positions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `positions_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `profit_centers`
--
ALTER TABLE `profit_centers`
  ADD CONSTRAINT `profit_centers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `profit_centers_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `profit_centers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `project_amenities`
--
ALTER TABLE `project_amenities`
  ADD CONSTRAINT `project_amenities_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_media`
--
ALTER TABLE `project_media`
  ADD CONSTRAINT `project_media_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_payment_plans`
--
ALTER TABLE `project_payment_plans`
  ADD CONSTRAINT `project_payment_plans_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_phases`
--
ALTER TABLE `project_phases`
  ADD CONSTRAINT `project_phases_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_phases_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_orders_purchase_request_id_foreign` FOREIGN KEY (`purchase_request_id`) REFERENCES `purchase_requests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_rfq_id_foreign` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_orders_vendor_quotation_id_foreign` FOREIGN KEY (`vendor_quotation_id`) REFERENCES `vendor_quotations` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `purchase_requests`
--
ALTER TABLE `purchase_requests`
  ADD CONSTRAINT `purchase_requests_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_requests_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_requests_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_requests_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `regions`
--
ALTER TABLE `regions`
  ADD CONSTRAINT `regions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `resale_requests`
--
ALTER TABLE `resale_requests`
  ADD CONSTRAINT `resale_requests_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `resale_requests_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `resale_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rescheduling_requests`
--
ALTER TABLE `rescheduling_requests`
  ADD CONSTRAINT `rescheduling_requests_contract_id_foreign` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rescheduling_requests_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_broker_id_foreign` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reservations_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reservations_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `resource_allocations`
--
ALTER TABLE `resource_allocations`
  ADD CONSTRAINT `resource_allocations_milestone_id_foreign` FOREIGN KEY (`milestone_id`) REFERENCES `construction_milestones` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rfqs`
--
ALTER TABLE `rfqs`
  ADD CONSTRAINT `rfqs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rfqs_purchase_request_id_foreign` FOREIGN KEY (`purchase_request_id`) REFERENCES `purchase_requests` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `enterprise_roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD CONSTRAINT `service_requests_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `site_inspections`
--
ALTER TABLE `site_inspections`
  ADD CONSTRAINT `site_inspections_inspector_id_foreign` FOREIGN KEY (`inspector_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `site_inspections_milestone_id_foreign` FOREIGN KEY (`milestone_id`) REFERENCES `construction_milestones` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `site_inspections_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `site_inspections_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_parent_task_id_foreign` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tasks_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD CONSTRAINT `task_attachments_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_attachments_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `task_checklists`
--
ALTER TABLE `task_checklists`
  ADD CONSTRAINT `task_checklists_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_comments`
--
ALTER TABLE `task_comments`
  ADD CONSTRAINT `task_comments_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD CONSTRAINT `task_dependencies_blocked_by_task_id_foreign` FOREIGN KEY (`blocked_by_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_dependencies_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `teams_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teams_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teams_leader_id_foreign` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tenant_subscriptions`
--
ALTER TABLE `tenant_subscriptions`
  ADD CONSTRAINT `tenant_subscriptions_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `units_building_id_foreign` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `units_floor_id_foreign` FOREIGN KEY (`floor_id`) REFERENCES `building_floors` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `units_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `units_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_granted_by_foreign` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `user_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_permissions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `user_roles_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `user_roles_granted_by_foreign` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `enterprise_roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_invoices`
--
ALTER TABLE `vendor_invoices`
  ADD CONSTRAINT `vendor_invoices_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendor_invoices_purchase_order_id_foreign` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vendor_invoices_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vendor_invoices_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendor_quotations`
--
ALTER TABLE `vendor_quotations`
  ADD CONSTRAINT `vendor_quotations_rfq_id_foreign` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendor_quotations_vendor_id_foreign` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `warranties`
--
ALTER TABLE `warranties`
  ADD CONSTRAINT `warranties_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
