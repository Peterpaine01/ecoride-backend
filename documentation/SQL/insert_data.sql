USE ecoride_db;

INSERT INTO accounts (email, password, account_type, account_status, verification_token) VALUES
('user1@example.com', 'hashed_password1', 'user', 'active', 'token1'),
('user2@example.com', 'hashed_password2', 'user', 'pending', 'token2'),
('johndoe@example.com', 'hashed_password3', 'webmaster', 'active', 'token3');

INSERT INTO users (account_id, username, photo, gender, is_driver, consent_data_retention) VALUES
(1, 'UserOne', 'photo1.jpg', 'male', 1, 1),
(2, 'UserTwo', 'photo2.jpg', 'female', 0, 1);

INSERT INTO staff_members (account_id, last_name, first_name, role_id) VALUES
(3, 'Doe', 'John', 1);

INSERT INTO roles (label) VALUES
('Administrator'),
('Moderator'),
('Support');

INSERT INTO drivers (user_id, accept_smoking, accept_animals) VALUES
(1, 1, 0);

INSERT INTO cars (registration_number, first_registration_date, model, color, energy_id, brand_id, available_seats, driver_id) VALUES
('ABC123XYZ', '2020-05-15', '208', 'Bleu', 1, 1, 4, 1),
('DEF456LMN', '2018-09-10', 'Clio', 'Rouge', 2, 2, 5, 1);

INSERT INTO brands (label) VALUES
('Peugeot'),
('Renault'),
('Citroën'),
('DS Automobiles'),
('Alpine'),
('Bugatti'),
('Volkswagen'),
('Audi'),
('BMW'),
('Mercedes-Benz'),
('Porsche'),
('Opel'),
('Fiat'),
('Alfa Romeo'),
('Ferrari'),
('Lamborghini'),
('Maserati'),
('Toyota'),
('Honda'),
('Nissan'),
('Mazda'),
('Subaru'),
('Hyundai'),
('Kia'),
('Ford'),
('Chevrolet'),
('Tesla'),
('Mini'),
('Jaguar'),
('Land Rover');

INSERT INTO energies (label) VALUES
('Essence (SP95, SP98, E10)'),
('Diesel (B7, B10, XTL)'),
('Électricité'),
('Hybride');

INSERT INTO preferences (label, icon) VALUES
('aime la musique', 'music'),
('aime discuter', 'talk');

INSERT INTO configurations (driver_id, preference_id) VALUES
(1, 1),
(1, 2);

INSERT INTO statistiques (day, total_rides, daily_benefits) VALUES
('2024-02-01', 10, 500),
('2024-02-02', 15, 750);

INSERT INTO reviews_summaries (average_rating, total_reviews, driver_id) VALUES
(4.8, 25, 1);
