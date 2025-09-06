-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 04 sep. 2025 à 08:16
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `dinazar`
--

-- --------------------------------------------------------

--
-- Structure de la table `clients`
--

CREATE TABLE `clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `sexe` varchar(1) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `birthDate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `clients`
--

INSERT INTO `clients` (`id`, `firstName`, `lastName`, `sexe`, `createdAt`, `updatedAt`, `birthDate`) VALUES
(1, 'dinazar', 'RABE', 'M', '2025-08-22 13:48:06', '2025-08-22 13:48:06', '2005-10-02'),
(2, 'rakoto', 'RABE', 'F', '2025-08-22 13:48:06', '2025-08-22 13:48:06', '2025-08-07'),
(3, 'vvvvv', 'fhh', 'M', '2025-08-22 13:48:06', '2025-08-23 11:46:31', '2025-08-03'),
(4, 'luc', 'duboi', 'M', '2025-08-22 22:01:30', '2025-08-22 22:01:30', '2025-08-22');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `senderId` int(10) UNSIGNED NOT NULL,
  `receiverId` int(10) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `userId` int(10) UNSIGNED NOT NULL,
  `senderId` int(10) UNSIGNED NOT NULL,
  `messageId` int(10) UNSIGNED NOT NULL,
  `type` enum('message','system','order') DEFAULT 'message',
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `userId` int(10) UNSIGNED DEFAULT NULL,
  `dentistId` int(10) UNSIGNED DEFAULT NULL,
  `clientId` int(10) UNSIGNED DEFAULT NULL,
  `patient_name` varchar(120) NOT NULL,
  `sex` enum('homme','femme') NOT NULL,
  `age` tinyint(3) UNSIGNED DEFAULT NULL,
  `typeOfWork` enum('conjointe','amovible','analyse_aligneur','planification_implantaire','gouttiere','implant') NOT NULL,
  `sub_type` varchar(120) DEFAULT NULL,
  `model` varchar(120) DEFAULT NULL,
  `numDent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `works` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`works`)),
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_sex` varchar(10) DEFAULT NULL,
  `patient_age` tinyint(3) UNSIGNED DEFAULT NULL,
  `upper_teeth` longtext DEFAULT NULL,
  `lower_teeth` longtext DEFAULT NULL,
  `file_paths` longtext DEFAULT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 10.00,
  `paymentMethod` enum('stripe','mvola','orange_money','airtel_money','visa','mastercard','autre') DEFAULT NULL,
  `transactionRef` varchar(100) DEFAULT NULL,
  `work_type` varchar(50) DEFAULT NULL,
  `paymentStatus` enum('panier','paye','rembourse') NOT NULL DEFAULT 'panier',
  `orderStatus` enum('en_attente','en_cours','terminee') NOT NULL DEFAULT 'en_attente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `orders`
--

INSERT INTO `orders` (`id`, `userId`, `dentistId`, `clientId`, `patient_name`, `sex`, `age`, `typeOfWork`, `sub_type`, `model`, `numDent`, `remark`, `works`, `createdAt`, `updatedAt`, `patient_sex`, `patient_age`, `upper_teeth`, `lower_teeth`, `file_paths`, `total`, `paymentMethod`, `transactionRef`, `work_type`, `paymentStatus`, `orderStatus`) VALUES
(1, NULL, 1, NULL, 'rakoto', 'homme', NULL, 'conjointe', 'PLAQUE STELLITE', '1 arcade', NULL, NULL, NULL, '2025-08-27 15:53:08', '2025-09-01 12:09:35', 'Homme', 22, '[13]', '[]', '[\"/uploads/1756302788475.png\"]', 10.00, NULL, NULL, 'Adjointe', 'panier', 'terminee'),
(2, NULL, 1, NULL, 'nom', 'homme', NULL, 'conjointe', 'COURONNE OU BRIDGE', '1 arcade', NULL, 'okok', NULL, '2025-08-27 15:53:43', '2025-09-02 07:48:24', 'Homme', 33, '[14,15]', '[]', '[\"/uploads/1756302823303.png\"]', 10.00, 'stripe', 'pi_3S1PbOCvQPh2OtHr0BQ2JLSl', 'Conjointe', 'panier', 'terminee'),
(3, NULL, NULL, NULL, 'homme', 'homme', NULL, 'conjointe', NULL, '1 arcade', NULL, NULL, NULL, '2025-08-27 16:07:03', '2025-09-01 15:04:08', 'Femme', 21, '[24]', '[44]', '[]', 10.00, NULL, NULL, 'Analyse aligneur', 'panier', 'terminee'),
(4, NULL, 1, NULL, 'tsiry', 'homme', NULL, 'conjointe', NULL, '1 arcade', NULL, NULL, NULL, '2025-08-28 09:42:21', '2025-09-01 13:54:22', 'Homme', 23, '[14]', '[]', '[]', 10.00, NULL, NULL, 'Analyse aligneur', 'panier', 'terminee'),
(5, 3, NULL, NULL, 'rakoto', 'homme', NULL, 'conjointe', 'inlay onlay', '1 arcade', NULL, NULL, NULL, '2025-08-30 05:19:27', '2025-09-01 17:10:15', 'Homme', 22, '[13]', '[]', '[\"/uploads/1756531486984.txt\"]', 10.00, 'stripe', 'pi_3S2ZN3CvQPh2OtHr1Uxen5VU', 'Conjointe', 'paye', 'terminee'),
(6, 10, 1, NULL, 'test', 'homme', NULL, 'conjointe', 'PLAQUE STELLITE', '1 arcade', NULL, NULL, NULL, '2025-08-30 05:24:09', '2025-09-01 14:57:19', 'Homme', 22, '[16]', '[]', '[\"/uploads/1756532237190.txt\"]', 10.00, NULL, NULL, 'Gouttière', 'panier', 'terminee'),
(7, 3, 1, NULL, 'rakoto', 'homme', NULL, 'conjointe', 'inlay onlay', '1 arcade', NULL, NULL, NULL, '2025-09-01 15:20:17', '2025-09-01 19:17:22', 'Femme', 55, '[14]', '[]', NULL, 10.00, NULL, NULL, 'Conjointe', 'panier', 'en_cours'),
(8, 3, 1, NULL, 'fdfg', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, 'rien a dire pour le moment', NULL, '2025-09-01 15:42:21', '2025-09-02 07:48:36', 'Homme', 66, '[16,17]', '[]', NULL, 4.00, 'stripe', 'pi_3S2ZVOCvQPh2OtHr05IIVu1L', 'Conjointe', 'paye', 'en_cours'),
(9, 3, 1, NULL, 'tsiry', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, 'R', NULL, '2025-09-02 08:16:46', '2025-09-02 11:08:33', 'Homme', 34, '[13]', '[]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_cours'),
(10, 3, 1, NULL, 'rakoto', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 09:53:23', '2025-09-02 11:08:23', 'Homme', 22, '[13]', '[]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_cours'),
(11, 3, 1, NULL, 'rakoto', 'homme', NULL, 'conjointe', 'Sellite', NULL, NULL, 'vvv', NULL, '2025-09-02 09:54:04', '2025-09-02 11:08:28', 'Homme', 22, '[15]', '[]', NULL, 10.00, NULL, NULL, 'Amovible', 'panier', 'en_cours'),
(12, 3, 1, NULL, 'Dinauss', 'homme', NULL, 'conjointe', 'Gouttière alligneur', NULL, NULL, 'hh', NULL, '2025-09-02 11:28:49', '2025-09-02 11:28:49', 'Homme', 22, '[13,14]', '[35]', NULL, 30.00, NULL, NULL, 'Gouttières', 'panier', 'en_attente'),
(13, 3, 1, NULL, 'luk', 'homme', NULL, 'conjointe', 'Guide Chirugicale', NULL, NULL, NULL, NULL, '2025-09-02 11:32:05', '2025-09-02 11:46:31', 'Homme', 22, '[14]', '[35,36,37]', NULL, 20.00, NULL, NULL, 'Implant', 'panier', 'en_cours'),
(14, 3, 1, NULL, 'Jean', 'homme', NULL, 'conjointe', 'Gouttière alligneur', NULL, NULL, NULL, NULL, '2025-09-02 12:32:31', '2025-09-02 13:01:59', 'Homme', 56, '[]', '[37]', NULL, 30.00, NULL, NULL, 'Gouttières', 'panier', 'terminee'),
(15, 3, 1, NULL, 'Jean', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 13:54:26', '2025-09-02 13:54:26', 'Homme', 44, '[]', '[37,38]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(16, 3, 1, NULL, 'fffr', 'homme', NULL, 'conjointe', NULL, NULL, NULL, NULL, NULL, '2025-09-02 13:59:44', '2025-09-02 13:59:44', 'Homme', 32, '[14,15]', '[]', NULL, 10.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(17, 3, 1, NULL, 'jj', 'homme', NULL, 'conjointe', NULL, NULL, NULL, NULL, NULL, '2025-09-02 14:06:22', '2025-09-02 14:06:22', 'Homme', 66, '[]', '[35]', NULL, 10.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(18, 3, 1, NULL, 'iik', 'homme', NULL, 'conjointe', NULL, NULL, NULL, NULL, NULL, '2025-09-02 14:10:26', '2025-09-02 14:10:26', 'Homme', 44, '[16]', '[]', NULL, 10.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(19, 3, 1, NULL, 'dina', 'homme', NULL, 'conjointe', 'Couronne', NULL, NULL, NULL, NULL, '2025-09-02 14:15:50', '2025-09-02 14:15:50', 'Homme', 66, '[]', '[37]', NULL, 5.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(20, 3, 1, NULL, 'nb', 'homme', NULL, 'conjointe', 'Ilay onlay', NULL, NULL, NULL, NULL, '2025-09-02 14:18:03', '2025-09-02 14:18:03', 'Homme', 66, '[]', '[37]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(21, 3, 1, NULL, 'Jean', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 14:21:26', '2025-09-02 14:21:26', 'Femme', 76, '[]', '[36,37]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(22, 3, 1, NULL, 'fffr', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 14:25:26', '2025-09-02 14:33:14', 'Homme', 77, '[14,15]', '[]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'terminee'),
(23, 3, 1, NULL, 'Jean', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 15:02:52', '2025-09-02 15:02:52', 'Homme', 33, '[]', '[37,35]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(24, 3, 1, NULL, 'Jean', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 15:06:28', '2025-09-03 10:35:42', 'Homme', 34, '[]', '[36,37]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_cours'),
(25, 3, 1, NULL, 'iik', 'homme', NULL, 'conjointe', 'Ilay onlay', NULL, NULL, NULL, NULL, '2025-09-02 15:07:32', '2025-09-03 16:48:13', 'Homme', 43, '[15]', '[]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'terminee'),
(26, 3, 1, NULL, 'Jean', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 15:09:30', '2025-09-02 15:57:47', 'Homme', 34, '[15]', '[]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_cours'),
(27, 3, 1, NULL, 'gt', 'homme', NULL, 'conjointe', 'Inlay core', NULL, NULL, NULL, NULL, '2025-09-02 15:12:23', '2025-09-02 15:57:46', 'Homme', 45, '[]', '[37]', NULL, 4.00, NULL, NULL, 'Conjointe', 'panier', 'en_cours'),
(28, 3, 1, NULL, 'rabe', 'homme', NULL, 'conjointe', '[\"Inlay core\"]', '1 arcade', NULL, 'test', NULL, '2025-09-03 17:20:20', '2025-09-03 17:20:20', 'Homme', 27, '[11,14,15]', '[]', NULL, 10.00, NULL, NULL, 'Conjointe', 'panier', 'en_attente'),
(29, 3, 1, NULL, 'rakoto', 'homme', NULL, 'conjointe', NULL, NULL, NULL, 'rien', '\"[{\\\"work_type\\\":\\\"Conjointe\\\",\\\"sub_type\\\":\\\"Inlay core\\\",\\\"teeth\\\":[14,15,35]},{\\\"work_type\\\":\\\"Amovible\\\",\\\"sub_type\\\":\\\"Sellite\\\",\\\"teeth\\\":[15,35]}]\"', '2025-09-03 18:50:05', '2025-09-03 18:50:05', 'Homme', 28, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 'panier', 'en_attente'),
(30, 3, 1, NULL, 'rabe', 'homme', NULL, 'conjointe', NULL, '1 arcade', NULL, 'rien a dire ', NULL, '2025-09-03 18:56:45', '2025-09-03 18:56:45', 'Homme', 28, '[]', '[]', NULL, 10.00, NULL, NULL, NULL, 'panier', 'en_attente'),
(31, 3, 1, NULL, 'sport', 'homme', NULL, 'conjointe', NULL, 'Haut et bas', NULL, 'izy', NULL, '2025-09-04 09:04:52', '2025-09-04 09:04:52', 'Homme', 24, '[]', '[]', NULL, 10.00, NULL, NULL, NULL, 'panier', 'en_attente');

-- --------------------------------------------------------

--
-- Structure de la table `order_files`
--

CREATE TABLE `order_files` (
  `id` int(10) UNSIGNED NOT NULL,
  `orderId` int(10) UNSIGNED NOT NULL,
  `storedName` varchar(255) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `mimeType` varchar(100) DEFAULT NULL,
  `size` bigint(20) UNSIGNED DEFAULT NULL,
  `url` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `uploadedBy` enum('user','dentist') NOT NULL DEFAULT 'user',
  `isValidated` tinyint(1) NOT NULL DEFAULT 0,
  `uploadedById` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `order_files`
--

INSERT INTO `order_files` (`id`, `orderId`, `storedName`, `originalName`, `mimeType`, `size`, `url`, `createdAt`, `uploadedBy`, `isValidated`, `uploadedById`) VALUES
(1, 6, '1756534410936.txt', 'NOTICE.txt', NULL, NULL, '/uploads/1756534410936.txt', '2025-08-30 08:13:30', 'dentist', 0, 10),
(2, 6, '1756534574574.txt', 'NOTICE.txt', NULL, NULL, '/uploads/1756534574574.txt', '2025-08-30 08:16:14', 'dentist', 0, 10),
(3, 6, '1756534901041.pdf', '10-FIRESAHANA_AMIN_NY_ANJELY-1.pdf', NULL, NULL, '/uploads/1756534901041.pdf', '2025-08-30 08:21:41', 'dentist', 0, 10),
(4, 6, '1756534917873.pdf', 'Dossier_Business_-_Module_2_-_Methode_de_vente_Cash_Mail_System.pdf', NULL, NULL, '/uploads/1756534917873.pdf', '2025-08-30 08:21:57', 'dentist', 0, 10),
(5, 6, '1756534927502.pdf', 'Dossier_Business_-_Module_2_-_Methode_de_vente_Cash_Mail_System.pdf', NULL, NULL, '/uploads/1756534927502.pdf', '2025-08-30 08:22:07', 'dentist', 0, 10),
(6, 6, '1756535076924.jpg', 'IMG_20250409_095558.jpg', NULL, NULL, '/uploads/1756535076924.jpg', '2025-08-30 08:24:36', 'dentist', 0, 10),
(7, 6, '1756535343189.jpg', 'IMG_20250409_095558.jpg', NULL, NULL, '/uploads/1756535343189.jpg', '2025-08-30 08:29:03', 'dentist', 0, 10),
(8, 6, '1756535381712.txt', 'messure.txt', NULL, NULL, '/uploads/1756535381712.txt', '2025-08-30 08:29:41', 'dentist', 0, 10),
(9, 6, '1756535674087.docx', 'Formation quebec.docx', NULL, NULL, '/uploads/1756535674087.docx', '2025-08-30 08:34:34', 'dentist', 0, 10),
(10, 1, '1756535984070.docx', 'CAHIER-DES-CHARGES-ESMIA (1).docx', NULL, NULL, '/uploads/1756535984070.docx', '2025-08-30 08:39:44', 'dentist', 0, 10),
(11, 2, '1756536019355.docx', 'SPEECH.docx', NULL, NULL, '/uploads/1756536019355.docx', '2025-08-30 08:40:19', 'dentist', 0, 10),
(12, 1, '1756565749788.docx', 'Formation quebec.docx', NULL, NULL, '/uploads/1756565749788.docx', '2025-08-30 16:55:49', 'dentist', 0, 3),
(13, 1, '1756565756647.docx', 'Formation quebec.docx', NULL, NULL, '/uploads/1756565756647.docx', '2025-08-30 16:55:56', 'dentist', 0, 3),
(14, 1, '1756566037355.pdf', 'lab-what-was-taken.pdf', NULL, NULL, '/uploads/1756566037355.pdf', '2025-08-30 17:00:37', 'dentist', 0, 3),
(15, 2, '1756566087342.pdf', 'French_Ethics_Decision_Tree.pdf', NULL, NULL, '/uploads/1756566087342.pdf', '2025-08-30 17:01:27', 'dentist', 0, 3),
(16, 2, '1756566895578.pdf', 'French_Ethics_Decision_Tree.pdf', NULL, NULL, '/uploads/1756566895578.pdf', '2025-08-30 17:14:55', 'dentist', 0, 3),
(17, 2, '1756567221279.pdf', 'French_Ethics_Decision_Tree.pdf', NULL, NULL, '/uploads/1756567221279.pdf', '2025-08-30 17:20:21', 'dentist', 0, 3),
(18, 1, '1756567256071.pdf', 'French_Ethics_Decision_Tree.pdf', NULL, NULL, '/uploads/1756567256071.pdf', '2025-08-30 17:20:56', 'dentist', 0, 3),
(19, 2, '1756712085466.pdf', 'lab-what-was-taken.pdf', NULL, NULL, '/uploads/1756712085466.pdf', '2025-09-01 09:34:45', 'dentist', 0, 3),
(20, 2, '1756720310323.pdf', 'French_Ethics_Decision_Tree.pdf', NULL, NULL, '/uploads/1756720310323.pdf', '2025-09-01 11:51:50', 'dentist', 0, 3),
(21, 3, '1756720337632.jpg', 'IMG_20250409_095558.jpg', NULL, NULL, '/uploads/1756720337632.jpg', '2025-09-01 11:52:17', 'dentist', 0, 3),
(22, 5, '1756720379070.docx', 'CAHIER-DES-CHARGES-ESMIA (1).docx', NULL, NULL, '/uploads/1756720379070.docx', '2025-09-01 11:52:59', 'dentist', 0, 3),
(23, 4, '1756723737526.docx', 'CAHIER-DES-CHARGES-ESMIA (1).docx', NULL, NULL, '/uploads/1756723737526.docx', '2025-09-01 12:48:57', 'dentist', 0, 3),
(24, 2, '1756724427213.docx', 'CAHIER-DES-CHARGES-ESMIA (1).docx', NULL, NULL, '/uploads/1756724427213.docx', '2025-09-01 13:00:27', 'dentist', 0, 3),
(25, 5, '1756727042637.jpg', 'IMG_20250409_095558.jpg', NULL, NULL, '/uploads/1756727042637.jpg', '2025-09-01 13:44:02', 'dentist', 0, 3),
(26, 3, '1756731818997.jpg', 'IMG_20250409_095558.jpg', NULL, NULL, '/uploads/1756731818997.jpg', '2025-09-01 15:03:39', 'dentist', 0, 3),
(27, 3, '1756731843116.pdf', 'Rapport de stage(1)(1).pdf', NULL, NULL, '/uploads/1756731843116.pdf', '2025-09-01 15:04:03', 'dentist', 0, 3),
(28, 8, '1756746117591.docx', 'Tsiry.docx', NULL, NULL, '/uploads/1756746117591.docx', '2025-09-01 19:01:57', 'dentist', 0, 11),
(29, 8, '1756792277935.docx', 'cahier de charge.docx', NULL, NULL, '/uploads/1756792277935.docx', '2025-09-02 07:51:17', 'dentist', 0, 11),
(30, 1, '1756302788475.png', '1756302788475.png', NULL, NULL, '/uploads/1756302788475.png', '2025-09-02 08:03:10', 'user', 0, 3),
(31, 11, '1756802160439.js', 'initTables.js', NULL, NULL, '/uploads/1756802160439.js', '2025-09-02 10:36:00', 'dentist', 0, 11),
(32, 14, '1756810768168.pdf', 'soja (1).pdf', NULL, NULL, '/uploads/1756810768168.pdf', '2025-09-02 12:59:28', 'dentist', 0, 11),
(33, 18, '1756815025944.jpg', 'IMG_20250409_095558.jpg', 'image/jpeg', 4118694, '/uploads/1756815025944.jpg', '2025-09-02 14:10:26', 'user', 0, 3),
(34, 21, '1756815686404.pdf', 'livre franÃ§ais comprendre,s\'exprimer,lire, ecrire.pdf', 'application/pdf', 4697371, '/uploads/users/1756815686404.pdf', '2025-09-02 14:21:26', 'user', 0, 3),
(35, 22, '1756815926966.pdf', 'LEGIOMINA_1_.pdf', 'application/pdf', 848712, '/uploads/users/1756815926966.pdf', '2025-09-02 14:25:27', 'user', 0, 3),
(36, 22, '1756816064060.pdf', 'Voly dipoavatra_Fisy teknika OK t.pdf', NULL, NULL, '/uploads/1756816064060.pdf', '2025-09-02 14:27:44', 'dentist', 0, 11),
(37, 23, '1756818172614.pdf', 'CompostGasy.pdf', 'application/pdf', 765138, '/uploads/users/1756818172614.pdf', '2025-09-02 15:02:52', 'user', 0, 3),
(38, 24, '1756818388723.pdf', 'Voly Garana _ Fiche technique OK.pdf', 'application/pdf', 1905581, '/uploads/users/1756818388723.pdf', '2025-09-02 15:06:28', 'user', 0, 3),
(39, 25, '1756818452430.pdf', 'LEGIOMINA[1].pdf', 'application/pdf', 848712, '/uploads/users/1756818452430.pdf', '2025-09-02 15:07:32', 'user', 0, 3),
(40, 26, '1756818570046.pdf', 'SAKAFO RECETTE.pdf', 'application/pdf', 4517419, '/uploads/users/1756818570046.pdf', '2025-09-02 15:09:30', 'user', 0, 3),
(41, 27, '1756818743397.pdf', 'SAKAFO CUISINE-1.pdf', 'application/pdf', 10175202, '/uploads/users/1756818743397.pdf', '2025-09-02 15:12:23', 'user', 0, 3),
(42, 24, '1756884937552.png', 'femmejoliesourire.png', 'image/png', 2038490, '/uploads/dentists/1756884937552.png', '2025-09-03 10:35:37', 'dentist', 0, 11),
(43, 28, '1756909220537.jpg', 'RIYAN_20250828_105006_ð¿ iPhone Effect by dyluu-1.jpg', 'image/jpeg', 15519303, '/uploads/users/1756909220537.jpg', '2025-09-03 17:20:20', 'user', 0, 3),
(44, 29, '1756914605061.jpg', 'RIYAN_20250828_105415_ð¿ iPhone Effect by dyluu-1.jpg', 'image/jpeg', 14249554, '/uploads/users/1756914605061.jpg', '2025-09-03 18:50:05', 'user', 0, 3),
(45, 30, '1756915005572.jpg', 'RIYAN_20250828_105415_ð¿ iPhone Effect by dyluu-1.jpg', 'image/jpeg', 14249554, '/uploads/users/1756915005572.jpg', '2025-09-03 18:56:45', 'user', 0, 3),
(46, 31, '1756965892975.txt', 'install.ps1.txt', 'text/plain', 26066, '/uploads/users/1756965892975.txt', '2025-09-04 09:04:52', 'user', 0, 3);

-- --------------------------------------------------------

--
-- Structure de la table `order_products`
--

CREATE TABLE `order_products` (
  `id` int(10) UNSIGNED NOT NULL,
  `orderId` int(10) UNSIGNED NOT NULL,
  `productId` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `order_products`
--

INSERT INTO `order_products` (`id`, `orderId`, `productId`, `quantity`, `createdAt`, `updatedAt`) VALUES
(1, 3, 1, 1, '2025-08-22 19:20:07', '2025-08-26 09:54:56');

-- --------------------------------------------------------

--
-- Structure de la table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `userId` int(10) UNSIGNED NOT NULL,
  `token` varchar(191) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `usedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `orderId` int(10) UNSIGNED NOT NULL,
  `stripePaymentId` varchar(100) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'EUR',
  `status` enum('success','failed','refunded') DEFAULT 'success',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `orderId`, `stripePaymentId`, `amount`, `currency`, `status`, `createdAt`) VALUES
(1, 2, 'pi_3S1PbOCvQPh2OtHr0BQ2JLSl', 10.00, 'EUR', 'success', '2025-08-29 12:32:16'),
(2, 5, 'pi_3S2ZN3CvQPh2OtHr1Uxen5VU', 10.00, 'EUR', 'success', '2025-09-01 17:10:15'),
(3, 8, 'pi_3S2ZVOCvQPh2OtHr05IIVu1L', 4.00, 'EUR', 'success', '2025-09-01 17:18:53');

-- --------------------------------------------------------

--
-- Structure de la table `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `createdAt`, `updatedAt`) VALUES
(1, 'DD', 25005.00, '2025-08-22 13:48:25', '2025-08-22 13:48:25'),
(2, 'thb', 5000.00, '2025-08-22 13:48:25', '2025-08-22 13:48:25');

-- --------------------------------------------------------

--
-- Structure de la table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(190) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `firstName` varchar(100) DEFAULT '',
  `lastName` varchar(100) DEFAULT '',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `last_seen_at` datetime DEFAULT NULL,
  `role` enum('user','dentiste','admin') NOT NULL DEFAULT 'user',
  `accountStatus` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `reset_required` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `is_online` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `passwordHash`, `firstName`, `lastName`, `isActive`, `last_login_at`, `last_seen_at`, `role`, `accountStatus`, `reset_required`, `createdAt`, `is_online`) VALUES
(1, 'admin@test.com', '$2b$10$abcdefgh...', 'Admin', 'User', 1, NULL, '2025-08-23 10:46:41', 'user', 'approved', 0, '2025-08-22 13:49:20', 0),
(2, 'dina@gmail.com', '$2b$10$zLCoMVbaCthJ8mxwUMdyGumEeWDSTjCSeV7jz25cEfZPXO63rU75q', 'dinazar', 'dina', 1, NULL, '2025-08-23 10:46:41', '', 'pending', 0, '2025-08-22 14:06:10', 0),
(3, 'test@gmail.com', '$2b$10$qbTYCj91fkqP/m3cdv.q3en.jlj.ERTkyLm1W/vMZnBE0GIFOeMWa', 'test', 'test', 1, '2025-09-03 10:32:45', '2025-09-03 10:32:45', 'user', 'approved', 0, '2025-08-22 14:12:43', 0),
(4, 'test1@gmail.com', '$2b$10$Mi4rH8vU3lna9dEGKhKh3OLHRcGNoMB1luPdLSnBDVo5ISWZD6G7a', 'test', 'test', 1, NULL, '2025-08-23 10:46:41', 'admin', 'approved', 0, '2025-08-22 14:13:31', 0),
(5, 'ok@gmail.com', '$2b$10$nDmlCiUw0sGN5FPpPKXdDuVERIElx4MHPWBkXik0s/Y3AE3l18.lm', 'okok', 'OKOK', 1, NULL, '2025-08-22 20:41:29', 'user', 'pending', 0, '2025-08-22 15:51:00', 0),
(6, 'letsi@gmail.com', '$2b$10$ImWj6IXNsCsko4hu2eFCzOI2JgPp0HVv/rr8IU4YDzD9H2eDgzr2a', 'letsi', 'le', 1, '2025-08-22 21:44:47', '2025-08-22 21:44:47', 'user', 'pending', 0, '2025-08-22 17:07:08', 0),
(7, 'jo@gmail.com', '$2b$10$EVbkYIJdamvex2hZ3/gMceAVcG1l8u7IqNvSuSCHcvPRGCvM5o/Ve', 'jo', 'jo', 1, NULL, '2025-08-23 10:46:41', 'user', 'pending', 0, '2025-08-23 09:13:52', 0),
(8, 'letsiry@gmail.com', '$2b$10$VYZtbAIJjROfL3dzhjVez.zNGi.Bb4FmZCDBuoaGsHe7GleuljTMe', 'letsiry', 'LETSIRY', 1, NULL, NULL, 'admin', 'approved', 0, '2025-08-23 11:22:58', 0),
(9, 'test2@gmail.com', '$2b$10$id1ZrXxp7YQ2sZ13FODd9eOQeDHyK/LXw6lhb6pMirR2S/9EwQqgK', '25', '25', 1, NULL, NULL, 'admin', 'approved', 0, '2025-08-23 12:42:03', 0),
(10, 'test3@gmail.com', '$2b$10$ZyJ2lcPfB2j.OR7sa3J68O6Ed20F8QwshE19mkC.b3P2dI5EoHrtW', 'test3@gmail.com', 'test3@gmail.com', 1, '2025-09-03 10:34:30', '2025-09-03 10:34:30', 'admin', 'approved', 0, '2025-08-28 10:34:30', 0),
(11, 'sundev.energie@gmail.com', '$2b$10$93BeZvoxUa.5AgDu58ZvyOeZcI1w82xovz4HaUzGrFu0QnZItZHc6', 'Luck', 'Luck', 1, '2025-09-03 10:30:19', '2025-09-03 10:30:19', 'dentiste', 'approved', 0, '2025-09-01 19:00:33', 0);

-- --------------------------------------------------------

--
-- Structure de la table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `userId` int(10) UNSIGNED NOT NULL,
  `permission` varchar(50) NOT NULL,
  `allowed` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_messages_sender` (`senderId`),
  ADD KEY `fk_messages_receiver` (`receiverId`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notif_user_idx` (`userId`),
  ADD KEY `notif_sender_idx` (`senderId`),
  ADD KEY `notif_message_idx` (`messageId`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orders_client` (`clientId`),
  ADD KEY `fk_orders_user` (`userId`),
  ADD KEY `fk_orders_dentist` (`dentistId`);

--
-- Index pour la table `order_files`
--
ALTER TABLE `order_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_files_orderId_idx` (`orderId`);

--
-- Index pour la table `order_products`
--
ALTER TABLE `order_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_product_unique` (`orderId`,`productId`),
  ADD KEY `order_products_ibfk_6` (`productId`);

--
-- Index pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_token` (`token`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stripePaymentId` (`stripePaymentId`),
  ADD KEY `idx_payments_order` (`orderId`);

--
-- Index pour la table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`userId`,`permission`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT pour la table `order_files`
--
ALTER TABLE `order_files`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT pour la table `order_products`
--
ALTER TABLE `order_products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_message` FOREIGN KEY (`messageId`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notif_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_client` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_dentist` FOREIGN KEY (`dentistId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `order_files`
--
ALTER TABLE `order_files`
  ADD CONSTRAINT `order_files_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `order_products`
--
ALTER TABLE `order_products`
  ADD CONSTRAINT `order_products_ibfk_5` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_products_ibfk_6` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `prt_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
