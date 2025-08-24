-- Create sample spectacles data
INSERT INTO public.spectacles (title, description, price, age_range_min, age_range_max, level_range, duration_minutes, is_active) VALUES
('Le Petit Prince', 'Une adaptation magique du célèbre conte de Saint-Exupéry, parfaite pour les jeunes esprits curieux.', 80.00, 6, 12, 'CP-6ème', 75, true),
('Romeo et Juliette - Version Jeunesse', 'Une version adaptée du classique de Shakespeare pour les adolescents.', 90.00, 12, 18, '6ème-Terminale', 90, true),
('Les Fables de La Fontaine', 'Un spectacle interactif mettant en scène les plus belles fables françaises.', 70.00, 5, 10, 'Maternelle-CM2', 60, true),
('Molière pour les Nuls', 'Une introduction amusante aux pièces de Molière avec des extraits adaptés.', 85.00, 14, 18, '3ème-Terminale', 85, true),
('Conte Musical - Les Quatre Saisons', 'Un spectacle musical éducatif sur les saisons et la nature.', 75.00, 4, 8, 'Maternelle-CE2', 50, true),
('Théâtre Scientifique - L''Espace', 'Découverte de l''astronomie à travers le théâtre et les expériences.', 95.00, 8, 14, 'CE2-4ème', 80, true),
('Contes d''Afrique', 'Voyage musical et théâtral à travers les contes traditionnels africains.', 80.00, 6, 12, 'CP-6ème', 70, true);

-- Create sample sessions for the spectacles
INSERT INTO public.sessions (spectacle_id, session_date, session_time, venue, city, total_capacity, b2c_capacity, price_mad, partner_quota, session_type, status, is_active) 
SELECT 
    s.id,
    CURRENT_DATE + (ROW_NUMBER() OVER () % 30) * INTERVAL '1 day' + (ROW_NUMBER() OVER () % 3) * INTERVAL '7 days',
    CASE (ROW_NUMBER() OVER () % 3) 
        WHEN 0 THEN '10:00:00'::time
        WHEN 1 THEN '14:00:00'::time
        ELSE '16:30:00'::time
    END,
    CASE (ROW_NUMBER() OVER () % 4)
        WHEN 0 THEN 'Théâtre Mohammed V'
        WHEN 1 THEN 'Centre Culturel Atlas'
        WHEN 2 THEN 'Salle Al Andalous'
        ELSE 'Théâtre National'
    END,
    CASE (ROW_NUMBER() OVER () % 4)
        WHEN 0 THEN 'Rabat'
        WHEN 1 THEN 'Casablanca'
        WHEN 2 THEN 'Marrakech'
        ELSE 'Fès'
    END,
    200,
    50,
    s.price,
    50,
    'b2b',
    'active',
    true
FROM public.spectacles s
CROSS JOIN generate_series(1, 3) AS session_num
WHERE s.is_active = true;

-- Create sample organizations
INSERT INTO public.organizations (name, type, contact_email, contact_phone, address, ice, verification_status, max_free_tickets) VALUES
('Lycée International de Rabat', 'private_school', 'admin@lir.ma', '+212 537 123 456', 'Avenue Hassan II, Rabat', 'ICE001234567890123', true, 0),
('École Primaire Al Noor', 'public_school', 'direction@alnoor.edu.ma', '+212 522 345 678', 'Rue de la Paix, Casablanca', 'ICE001234567890124', true, 100),
('Association Enfance et Avenir', 'association', 'contact@enfance-avenir.org', '+212 661 789 012', 'Boulevard Zerktouni, Marrakech', 'ICE001234567890125', true, 50),
('Collège Ibn Battuta', 'public_school', 'secretariat@ibnbattuta.ac.ma', '+212 535 456 789', 'Quartier Industriel, Fès', 'ICE001234567890126', true, 75);

-- Create sample schools
INSERT INTO public.schools (name, school_type, address, city, ice_number, domain, verification_status) VALUES
('Lycée International de Rabat', 'private', 'Avenue Hassan II, Rabat', 'Rabat', 'ICE001234567890123', 'lir.ma', 'approved'),
('École Primaire Al Noor', 'public', 'Rue de la Paix, Casablanca', 'Casablanca', 'ICE001234567890124', 'alnoor.edu.ma', 'approved'),
('Collège Ibn Battuta', 'public', 'Quartier Industriel, Fès', 'Fès', 'ICE001234567890126', 'ibnbattuta.ac.ma', 'approved');

-- Create sample associations
INSERT INTO public.associations (name, contact_person, address, city, ice_number, verification_status) VALUES
('Association Enfance et Avenir', 'Fatima Zahra Benjelloun', 'Boulevard Zerktouni, Marrakech', 'Marrakech', 'ICE001234567890125', 'approved'),
('Association Culture et Éducation', 'Ahmed El Mansouri', 'Avenue Mohammed VI, Agadir', 'Agadir', 'ICE001234567890127', 'approved'),
('Fondation Al Khayr', 'Laila Benali', 'Rue des Écoles, Meknès', 'Meknès', 'ICE001234567890128', 'pending');