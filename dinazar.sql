-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le :  ven. 29 août 2025 à 15:36
-- Version du serveur :  10.4.8-MariaDB
-- Version de PHP :  7.2.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `dinazar`
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `userId` int(10) UNSIGNED DEFAULT NULL,
  `clientId` int(10) UNSIGNED DEFAULT NULL,
  `patient_name` varchar(120) NOT NULL,
  `sex` enum('homme','femme') NOT NULL,
  `age` tinyint(3) UNSIGNED DEFAULT NULL,
  `typeOfWork` enum('conjointe','amovible','analyse_aligneur','planification_implantaire','gouttiere','implant') NOT NULL,
  `sub_type` varchar(120) DEFAULT NULL,
  `model` varchar(120) DEFAULT NULL,
  `numDent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `status` enum('panier','en_attente','en_traitement','terminee','annulee','paye','rembourse') NOT NULL DEFAULT 'panier',
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
  `work_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `orders`
--

INSERT INTO `orders` (`id`, `userId`, `clientId`, `patient_name`, `sex`, `age`, `typeOfWork`, `sub_type`, `model`, `numDent`, `remark`, `status`, `createdAt`, `updatedAt`, `patient_sex`, `patient_age`, `upper_teeth`, `lower_teeth`, `file_paths`, `total`, `paymentMethod`, `transactionRef`, `work_type`) VALUES
(1, NULL, NULL, 'rakoto', 'homme', NULL, 'conjointe', 'PLAQUE STELLITE', '1 arcade', NULL, NULL, 'paye', '2025-08-27 15:53:08', '2025-08-29 10:40:28', 'Homme', 22, '[13]', '[]', '[\"/uploads/1756302788475.png\"]', '10.00', NULL, NULL, 'Adjointe'),
(2, NULL, NULL, 'nom', 'homme', NULL, 'conjointe', 'COURONNE OU BRIDGE', '1 arcade', NULL, NULL, 'paye', '2025-08-27 15:53:43', '2025-08-29 12:32:16', 'Homme', 33, '[14,15]', '[]', '[\"/uploads/1756302823303.png\"]', '10.00', 'stripe', 'pi_3S1PbOCvQPh2OtHr0BQ2JLSl', 'Conjointe'),
(3, NULL, NULL, 'homme', 'homme', NULL, 'conjointe', NULL, '1 arcade', NULL, NULL, 'panier', '2025-08-27 16:07:03', '2025-08-27 16:07:03', 'Femme', 21, '[24]', '[44]', '[]', '10.00', NULL, NULL, 'Analyse aligneur'),
(4, NULL, NULL, 'tsiry', 'homme', NULL, 'conjointe', NULL, '1 arcade', NULL, NULL, 'panier', '2025-08-28 09:42:21', '2025-08-28 09:42:21', 'Homme', 23, '[14]', '[]', '[]', '10.00', NULL, NULL, 'Analyse aligneur');

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
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `orderId`, `stripePaymentId`, `amount`, `currency`, `status`, `createdAt`) VALUES
(1, 2, 'pi_3S1PbOCvQPh2OtHr0BQ2JLSl', '10.00', 'EUR', 'success', '2025-08-29 12:32:16');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `createdAt`, `updatedAt`) VALUES
(1, 'DD', '25005.00', '2025-08-22 13:48:25', '2025-08-22 13:48:25'),
(2, 'thb', '5000.00', '2025-08-22 13:48:25', '2025-08-22 13:48:25');

-- --------------------------------------------------------

--
-- Structure de la table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL
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
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `accountStatus` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `reset_required` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `is_online` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `passwordHash`, `firstName`, `lastName`, `isActive`, `last_login_at`, `last_seen_at`, `role`, `accountStatus`, `reset_required`, `createdAt`, `is_online`) VALUES
(1, 'admin@test.com', '$2b$10$abcdefgh...', 'Admin', 'User', 1, NULL, '2025-08-23 10:46:41', 'admin', 'approved', 0, '2025-08-22 13:49:20', 0),
(2, 'dina@gmail.com', '$2b$10$zLCoMVbaCthJ8mxwUMdyGumEeWDSTjCSeV7jz25cEfZPXO63rU75q', 'dinazar', 'dina', 1, NULL, '2025-08-23 10:46:41', '', 'pending', 0, '2025-08-22 14:06:10', 0),
(3, 'test@gmail.com', '$2b$10$qbTYCj91fkqP/m3cdv.q3en.jlj.ERTkyLm1W/vMZnBE0GIFOeMWa', 'test', 'test', 1, '2025-08-29 12:59:51', '2025-08-29 12:59:51', 'user', 'approved', 0, '2025-08-22 14:12:43', 0),
(4, 'test1@gmail.com', '$2b$10$Mi4rH8vU3lna9dEGKhKh3OLHRcGNoMB1luPdLSnBDVo5ISWZD6G7a', 'test', 'test', 1, NULL, '2025-08-23 10:46:41', 'admin', 'approved', 0, '2025-08-22 14:13:31', 0),
(5, 'ok@gmail.com', '$2b$10$nDmlCiUw0sGN5FPpPKXdDuVERIElx4MHPWBkXik0s/Y3AE3l18.lm', 'okok', 'OKOK', 1, NULL, '2025-08-22 20:41:29', 'user', 'pending', 0, '2025-08-22 15:51:00', 0),
(6, 'letsi@gmail.com', '$2b$10$ImWj6IXNsCsko4hu2eFCzOI2JgPp0HVv/rr8IU4YDzD9H2eDgzr2a', 'letsi', 'le', 1, '2025-08-22 21:44:47', '2025-08-22 21:44:47', 'user', 'pending', 0, '2025-08-22 17:07:08', 0),
(7, 'jo@gmail.com', '$2b$10$EVbkYIJdamvex2hZ3/gMceAVcG1l8u7IqNvSuSCHcvPRGCvM5o/Ve', 'jo', 'jo', 1, NULL, '2025-08-23 10:46:41', 'user', 'pending', 0, '2025-08-23 09:13:52', 0),
(8, 'letsiry@gmail.com', '$2b$10$VYZtbAIJjROfL3dzhjVez.zNGi.Bb4FmZCDBuoaGsHe7GleuljTMe', 'letsiry', 'LETSIRY', 1, NULL, NULL, 'admin', 'approved', 0, '2025-08-23 11:22:58', 0),
(9, 'test2@gmail.com', '$2b$10$id1ZrXxp7YQ2sZ13FODd9eOQeDHyK/LXw6lhb6pMirR2S/9EwQqgK', '25', '25', 1, NULL, NULL, 'admin', 'approved', 0, '2025-08-23 12:42:03', 0),
(10, 'test3@gmail.com', '$2b$10$ZyJ2lcPfB2j.OR7sa3J68O6Ed20F8QwshE19mkC.b3P2dI5EoHrtW', 'test3@gmail.com', 'test3@gmail.com', 1, '2025-08-28 12:02:47', '2025-08-28 12:02:47', 'user', 'approved', 0, '2025-08-28 10:34:30', 0);

-- --------------------------------------------------------

--
-- Structure de la table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `userId` int(10) UNSIGNED NOT NULL,
  `permission` varchar(50) NOT NULL,
  `allowed` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orders_client` (`clientId`),
  ADD KEY `fk_orders_user` (`userId`);

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
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `order_files`
--
ALTER TABLE `order_files`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_client` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
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
