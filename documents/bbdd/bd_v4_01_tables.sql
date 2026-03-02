
-- ============================
-- DROP EXISTING TABLES
-- ============================
DROP TABLE IF EXISTS  Step_Tool,Assemblystep, Assemblystep_part,Assemblystep_tool,  Step_Part, Review, Issue, KPIs, Furniture_Part, Furniture, Category, Part, Tool,  Step, File, "User", Color CASCADE;
DROP TYPE IF EXISTS user_role, diff, user_status;

-- ============================
-- ENUMS
-- ============================
CREATE TYPE user_role AS ENUM ('admin', 'user', 'provider');
CREATE TYPE diff AS ENUM ('low','medium','high');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================
-- TABLE: User
-- ============================

CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NULL,
    cif VARCHAR(20) NULL,
    company_name VARCHAR(100) NULL,
    telephone VARCHAR(15) NULL,
    tax_address VARCHAR(200) NULL,

    role user_role NOT NULL,

    registration_status user_status NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    visible BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    disabled_at TIMESTAMP NULL,
    enabled_at TIMESTAMP NULL,

    image_url TEXT,
    password VARCHAR(200),
    google_id VARCHAR(255) UNIQUE,

    -- Solo providers tienen registration_status
    CONSTRAINT registration_status_only_for_providers
    CHECK (
        (role = 'provider' AND registration_status IS NOT NULL)
        OR
        (role != 'provider' AND registration_status IS NULL)
    ),

    -- Enabled solo si approved
    CONSTRAINT enabled_only_for_approved_providers
    CHECK (
        role != 'provider'
        OR
        (registration_status = 'approved' AND enabled IN (true, false))
        OR
        (registration_status IN ('pending', 'rejected') AND enabled = false)
    ),

    -- Visible solo si approved
    CONSTRAINT visible_only_when_approved_and_enabled
    CHECK (
        visible = false
        OR
        (
            role = 'provider'
            AND registration_status = 'approved'
            AND enabled = true
        )
    ),

    -- Proveedor siempre tiene CIF
    CONSTRAINT cif_required_for_providers
    CHECK (
        role != 'provider' OR cif IS NOT NULL
    )
);

-- ============================
-- INDEX: CIF
-- ============================

CREATE UNIQUE INDEX uniq_provider_cif
ON "User"(cif)
WHERE role = 'provider';

-- ============================
-- TABLE: Category
-- ============================
CREATE TABLE Category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subcategory_id INTEGER REFERENCES Category(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: Color
-- ============================
CREATE TABLE Color (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    hex VARCHAR(7)
);

-- ============================
-- TABLE: Furniture
-- ============================
CREATE TABLE Furniture (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    file_uri TEXT NOT NULL,
    assemblyPDF_uri TEXT NOT NULL,
    image_url TEXT,
    reference_number VARCHAR(100),
    difficulty diff NOT NULL,
    category_id INTEGER REFERENCES Category(id) ON DELETE SET NULL,
    provider_id INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
    color_id INTEGER REFERENCES Color(id) ON DELETE SET NULL,
    short_description TEXT,
    qr_url VARCHAR(255),
    required_people INTEGER NOT NULL DEFAULT 1,
    visible BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- TABLE: Part
-- ============================
CREATE TABLE Part (
    id SERIAL PRIMARY KEY,
    file_uri TEXT NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    color_id INTEGER REFERENCES Color(id) ON DELETE SET NULL
);

-- ============================
-- TABLE: Tool
-- ============================
-- Tool/Screw
-- nombre, dimesion, diametro, longitud, corte, etc
CREATE TABLE Tool (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url TEXT
);

-- ============================
-- TABLE: Furniture_Part (many-to-many with quantity)
-- ============================
CREATE TABLE Furniture_Part (
    furniture_id INTEGER REFERENCES Furniture(id) ON DELETE CASCADE,
    part_id INTEGER REFERENCES Part(id) ON DELETE CASCADE,
    quantity INTEGER CHECK (quantity >= 0),
    exploded_axis CHAR(1) CHECK (exploded_axis IN ('x','y','z')),
    exploded_distance FLOAT,
    PRIMARY KEY (furniture_id, part_id)
);

-- ============================
-- TABLE:  Step
-- ============================
-- scene_camera_angle -> por si se rota la camara (boca abajo) angulo 180
CREATE TABLE  Step (
    id SERIAL PRIMARY KEY,
    furniture_id INTEGER REFERENCES Furniture(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    description TEXT,
    used_in_step_with_id INTEGER REFERENCES  Step(id) ON DELETE SET NULL,
    scene_camera_angle INTEGER DEFAULT NULL,
    scene_camera_rotation_axis CHAR(1) CHECK (scene_camera_rotation_axis IN ('x','y','z')) DEFAULT  NULL
);

-- ============================
-- Junction table for  Step <-> Part (many-to-many with quantity)
-- ============================
CREATE TABLE  Step_Part (
      stepId INTEGER REFERENCES  Step(id) ON DELETE CASCADE,
    part_id INTEGER REFERENCES Part(id) ON DELETE CASCADE,
    quantity INTEGER CHECK (quantity >= 0),
    PRIMARY KEY (  stepId, part_id)
);

-- ============================
-- Junction table for  Step <-> Tool (many-to-many)
-- ============================
CREATE TABLE  Step_Tool (
      stepId INTEGER REFERENCES  Step(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES Tool(id) ON DELETE CASCADE,
    PRIMARY KEY (  stepId, tool_id)
);

-- ============================
-- TABLE: Issue
-- ============================
CREATE TABLE Issue (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    user_email VARCHAR(50) NOT NULL,
    furniture_id INTEGER REFERENCES Furniture(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: File
-- ============================
CREATE TABLE File (
    uri TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    format VARCHAR(50) NOT NULL,
    size FLOAT NOT NULL,
    issue_id INTEGER REFERENCES Issue(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: Review
-- ============================
CREATE TABLE Review (
    id SERIAL PRIMARY KEY,
    stars INTEGER CHECK (stars BETWEEN 1 AND 5) NOT NULL,
    text TEXT,
    date TIMESTAMP DEFAULT NOW(),
    furniture_id INTEGER REFERENCES Furniture(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: KPIs
-- ============================
CREATE TABLE KPIs (
    id SERIAL PRIMARY KEY,
    n_issues INTEGER DEFAULT 0,
    n_suppliers INTEGER DEFAULT 0,
    n_reviews INTEGER DEFAULT 0,
    provider_id INTEGER REFERENCES "User"(id) ON DELETE SET NULL
);

-- ============================
-- INDEXES for Google OAuth
-- ============================
-- Index for Google ID lookups (only where google_id is not null for performance)
CREATE INDEX idx_user_google_id ON "User"(google_id) WHERE google_id IS NOT NULL;

-- ============================
-- REINICIAR IDS
-- ============================

TRUNCATE TABLE
    "User",
    Category,
    Color,
    Furniture,
    Part,
    Tool,
    Furniture_Part,
    Step,
    Step_Part,
    Step_Tool,
    Issue,
    File,
    Review,
    KPIs
RESTART IDENTITY CASCADE;
