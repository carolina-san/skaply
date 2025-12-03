-- CAMBIOS:
--      - Creado tabla "Color"
--      - Relacionado tabla "Color" con "Furniture" y "Part"



-- ============================
-- Drop existing tables and types (only for reset purposes)
-- ============================
DROP TABLE IF EXISTS  Step_Tool,Assemblystep, Assemblystep_part,Assemblystep_tool,  Step_Part, Review, Issue, KPIs, Furniture_Part, Furniture, Category, Part, Tool,  Step, File, "User", Color CASCADE;
DROP TYPE IF EXISTS user_role, diff;

-- ============================
-- ENUM: user_role
-- ============================
CREATE TYPE user_role AS ENUM ('admin', 'user', 'provider');
CREATE TYPE diff AS ENUM ('low','medium','high');

-- ============================
-- TABLE: User
-- ============================
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    cif VARCHAR(20),
    company_name VARCHAR(100),
    telephone VARCHAR(15),
    tax_address VARCHAR(200),
    role user_role NOT NULL,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    new_user BOOLEAN DEFAULT FALSE,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password varchar(200) NOT NULL
);

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
    reference_number VARCHAR(100),
    difficulty diff NOT NULL,
    category_id INTEGER REFERENCES Category(id) ON DELETE SET NULL,
    provider_id INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
    color_id INTEGER REFERENCES Color(id) ON DELETE SET NULL,
    short_description TEXT
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
CREATE TABLE  Step (
    id SERIAL PRIMARY KEY,
    furniture_id INTEGER REFERENCES Furniture(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    used_in_step_with_id INTEGER REFERENCES  Step(id) ON DELETE SET NULL
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
