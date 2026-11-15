-- ============================================================
-- IGNIS AI — Extension du catalogue scientifique (additive only)
--
-- Objectif : représenter dans `measurements` les grandeurs
-- numériques ET textuelles, les valeurs censurées (>500, ~6)
-- et les références de page, sans supprimer aucune donnée.
--
-- AUCUNE donnée existante n'est modifiée ni supprimée.
-- Les colonnes ajoutées sont NULL par défaut pour les
-- lignes existantes.
--
-- PRÉREQUIS : aucune. Compatible PostgreSQL 16+/Neon.
--
-- Exécution :
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f catalog_extension.sql
-- ou copier-coller dans le SQL Editor Neon.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. measurements : valeurs textuelles + qualificatifs
-- ------------------------------------------------------------
-- `value` devient nullable pour accueillir les paramètres
-- catégoriels (ex. "test_end_condition"). Les lignes
-- existantes gardent leur valeur numérique : aucune perte.

ALTER TABLE measurements
    ALTER COLUMN value DROP NOT NULL;

-- Valeur textuelle brute pour les paramètres non numériques
-- (ex. test_end_condition = 'Extinction', flex_identifier).
ALTER TABLE measurements
    ADD COLUMN IF NOT EXISTS text_value TEXT;

-- Qualificatif de la valeur numérique :
--   '>' valeur censurée supérieure (ex. ">500" -> value=500)
--   '<' valeur censurée inférieure
--   '~' valeur approximative (ex. "~6" -> value=6)
--   NULL = valeur exacte
ALTER TABLE measurements
    ADD COLUMN IF NOT EXISTS qualifier TEXT;

-- Numéro de page dans le document source (preuve scientifique).
ALTER TABLE measurements
    ADD COLUMN IF NOT EXISTS page_number INTEGER;

-- ------------------------------------------------------------
-- 2. Catalogue des variables scientifiques
-- ------------------------------------------------------------
-- Registre des grandeurs connues : unité attendue, catégorie,
-- description. Alimente les futures colonnes dynamiques et la
-- validation des importateurs. ADDITIVE : ne touche pas aux
-- tables existantes.

CREATE TABLE IF NOT EXISTS variable_catalog (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    variable_name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN (
            'experimental_conditions',
            'gas_composition',
            'combustion_results',
            'identification',
            'other'
        )),
    description TEXT,
    typical_unit TEXT
);

-- ------------------------------------------------------------
-- 3. Index utiles (additifs)
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS measurements_variable_idx
    ON measurements (variable_name);

CREATE INDEX IF NOT EXISTS measurements_experiment_variable_idx
    ON measurements (experiment_id, variable_name);

-- ------------------------------------------------------------
-- 4. Seed du catalogue (additif, idempotent)
-- ------------------------------------------------------------

INSERT INTO variable_catalog
    (variable_name, display_name, category, description, typical_unit)
VALUES
    -- ZARM-FLARE
    ('airflow_velocity', 'Airflow velocity', 'experimental_conditions',
     'Vitesse d''écoulement initiale (ZARM FLARE)', 'm/s'),
    ('oxygen_concentration', 'Oxygen concentration', 'experimental_conditions',
     'Concentration initiale en oxygène (ZARM FLARE)', '%'),
    ('pressure', 'Pressure', 'experimental_conditions',
     'Pression ambiante (ZARM FLARE)', 'Pa'),
    ('propagation_rate', 'Flame propagation rate', 'combustion_results',
     'Vitesse de propagation de flamme (ZARM FLARE)', 'mm/s'),
    -- NASA PSI-25 / BASS-II
    ('oxygen_initial', 'Initial O2', 'gas_composition',
     'Oxygène initial calibré (BASS-II)', '% vol'),
    ('oxygen_final', 'Final O2', 'gas_composition',
     'Oxygène final (BASS-II)', '% vol'),
    ('co2_initial', 'Initial CO2', 'gas_composition',
     'CO2 initial (BASS-II)', '% vol'),
    ('co2_final', 'Final CO2', 'gas_composition',
     'CO2 final (BASS-II)', '% vol'),
    ('co_initial', 'Initial CO', 'gas_composition',
     'CO initial (BASS-II)', 'ppm'),
    ('co_final', 'Final CO', 'gas_composition',
     'CO final (BASS-II)', 'ppm'),
    -- NASA PSI-69 / FLEX
    ('ambient_pressure', 'Ambient pressure', 'experimental_conditions',
     'Pression ambiante déclarée en mmHg dans le tableau FLEX — non convertie en Pa', 'mmHg'),
    ('initial_o2_fraction', 'Initial O2 fraction', 'gas_composition',
     'Fraction molaire initiale d''oxygène (0.21 = fraction, PAS 21 %)', 'mole fraction'),
    ('initial_n2_fraction', 'Initial N2 fraction', 'gas_composition',
     'Fraction molaire initiale d''azote', 'mole fraction'),
    ('initial_co_fraction', 'Initial CO fraction', 'gas_composition',
     'Fraction molaire initiale de monoxyde de carbone', 'mole fraction'),
    ('initial_he_fraction', 'Initial He fraction', 'gas_composition',
     'Fraction molaire initiale d''hélium', 'mole fraction'),
    ('droplet_initial_diameter', 'Initial droplet diameter', 'experimental_conditions',
     'Diamètre initial de la gouttelette FLEX', 'mm'),
    ('flame_extinction_diameter', 'Flame extinction diameter', 'combustion_results',
     'Diamètre de gouttelette à l''extinction de flamme visible', 'mm'),
    ('burning_rate', 'Burning rate', 'combustion_results',
     'Débit de combustion déclaré en mm dans le tableau FLEX — unité à vérifier scientifiquement', 'mm'),
    ('burn_time', 'Burn time', 'combustion_results',
     'Durée de combustion', 's'),
    ('test_end_condition', 'Test end condition', 'combustion_results',
     'Condition de fin d''essai (Extinction / Disruption / Completion)', NULL),
    ('flex_identifier', 'FLEX identifier', 'identification',
     'Identifiant FLEX de l''essai', NULL),
    ('test_gmt', 'Test GMT', 'identification',
     'Heure GMT du test', NULL)
ON CONFLICT (variable_name) DO NOTHING;

COMMIT;

-- ============================================================
-- ROLLBACK (à exécuter uniquement si nécessaire)
--
-- ATTENTION : le DROP NOT NULL ne peut pas être restauré si des
-- lignes ont été insérées avec value NULL. En cas de rollback,
-- supprimer d'abord les lignes textuelles concernées :
--
--   BEGIN;
--   DELETE FROM measurements WHERE value IS NULL;  -- ⚠ destructif, à valider
--   ALTER TABLE measurements ALTER COLUMN value SET NOT NULL;
--   ALTER TABLE measurements DROP COLUMN IF EXISTS text_value;
--   ALTER TABLE measurements DROP COLUMN IF EXISTS qualifier;
--   ALTER TABLE measurements DROP COLUMN IF EXISTS page_number;
--   DROP TABLE IF EXISTS variable_catalog;
--   DROP INDEX IF EXISTS measurements_variable_idx;
--   DROP INDEX IF EXISTS measurements_experiment_variable_idx;
--   COMMIT;
-- ============================================================
