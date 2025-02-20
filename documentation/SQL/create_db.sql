-- Création de la base de données
CREATE DATABASE ecoride_db;
USE ecoride_db;

-- Création des tables
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    account_type ENUM('user', 'webmaster') NOT NULL,
    account_status ENUM('pending','active', 'suspended', 'deleted') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    verification_token VARCHAR(255) DEFAULT NULL
);

CREATE TABLE users (
    account_id INT NOT NULL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    photo VARCHAR(255) DEFAULT NULL,
    credits INT NOT NULL DEFAULT 20,
    gender ENUM('male', 'female', 'other') NOT NULL,
    is_driver TINYINT(1) NOT NULL DEFAULT 0,
    consent_data_retention TINYINT NOT NULL DEFAULT 0,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE staff_members (
    account_id INT NOT NULL PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL
);

CREATE TABLE drivers (
    user_id INT PRIMARY KEY,
    accept_smoking TINYINT(1) NOT NULL DEFAULT 0,
    accept_animals TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(account_id) ON DELETE CASCADE
);

CREATE TABLE cars (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL,
    first_registration_date DATE NOT NULL,
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    energy_id INT NOT NULL,
    brand_id INT NOT NULL,
    available_seats INT NOT NULL DEFAULT 1,
    driver_id INT NOT NULL,
    FOREIGN KEY (energy_id) REFERENCES energies(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE,
    UNIQUE (registration_number)
);

CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE energies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL
);

CREATE TABLE preferences (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(100) DEFAULT NULL
);

CREATE TABLE configurations (
    driver_id INT NOT NULL,
    preference_id INT NOT NULL,
    PRIMARY KEY (driver_id, preference_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id),
    FOREIGN KEY (preference_id) REFERENCES preferences(id)
);

CREATE TABLE statistiques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day DATE NOT NULL,
    total_rides INT NOT NULL DEFAULT 0,
    daily_benefits INT NOT NULL DEFAULT 0,
    UNIQUE (day)
);

CREATE TABLE reviews_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    average_rating DECIMAL(3,2) NOT NULL,
    total_reviews INT NOT NULL,
    driver_id INT NOT NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE
);
