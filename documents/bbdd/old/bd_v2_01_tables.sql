-- ============================
-- Drop existing tables and types (only for reset purposes)
-- ============================
DROP TABLE IF EXISTS AssemblyStep_Tool, AssemblyStep_Part, Review, Issue, KPIs, Furniture_Part, Furniture, Category, Part, Tool, AssemblyStep, File, "User" CASCADE;
DROP TYPE IF EXISTS user_role;

-- ============================
-- ENUM: user_role
-- ============================
CREATE TYPE user_role AS ENUM ('admin', 'user', 'provider');

-- ============================
-- TABLE: User
-- ============================
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    cif VARCHAR(20),
    company_name VARCHAR(100),
    professional_code VARCHAR(50),
    fiscal_address VARCHAR(200),
    role user_role NOT NULL
);

-- ============================
-- TABLE: Category
-- ============================
CREATE TABLE Category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subcategory INTEGER REFERENCES Category(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: Furniture
-- ============================
CREATE TABLE Furniture (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    estimated_time INTEGER NOT NULL,
    file_uri TEXT NOT NULL,
    color VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    category INTEGER REFERENCES Category(id) ON DELETE SET NULL,
    provider INTEGER REFERENCES "User"(id) ON DELETE SET NULL
);

-- ============================
-- TABLE: Part
-- ============================
CREATE TABLE Part (
    id SERIAL PRIMARY KEY,
    file_uri TEXT NOT NULL,
    color VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100) NOT NULL
);

-- ============================
-- TABLE: Tool
-- ============================
CREATE TABLE Tool (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- ============================
-- TABLE: Furniture_Part (many-to-many with quantity)
-- ============================
CREATE TABLE Furniture_Part (
    furniture INTEGER REFERENCES Furniture(id) ON DELETE CASCADE,
    part INTEGER REFERENCES Part(id) ON DELETE CASCADE,
    quantity INTEGER CHECK (quantity >= 0),
    PRIMARY KEY (furniture, part)
);

-- ============================
-- TABLE: AssemblyStep
-- ============================
CREATE TABLE AssemblyStep (
    id SERIAL PRIMARY KEY,
    step INTEGER NOT NULL,
    furniture INTEGER REFERENCES Furniture(id) ON DELETE CASCADE,
    step_dependency INTEGER REFERENCES AssemblyStep(id) ON DELETE SET NULL
);

-- ============================
-- Junction table for AssemblyStep <-> Tool (many-to-many)
-- ============================
CREATE TABLE AssemblyStep_Tool (
    assembly_step INTEGER REFERENCES AssemblyStep(id) ON DELETE CASCADE,
    tool INTEGER REFERENCES Tool(id) ON DELETE CASCADE,
    PRIMARY KEY (assembly_step, tool)
);

-- ============================
-- Junction table for AssemblyStep <-> Part (many-to-many with quantity)
-- ============================
CREATE TABLE AssemblyStep_Part (
    assembly_step INTEGER REFERENCES AssemblyStep(id) ON DELETE CASCADE,
    part INTEGER REFERENCES Part(id) ON DELETE CASCADE,
    quantity INTEGER CHECK (quantity >= 0),
    PRIMARY KEY (assembly_step, part)
);

-- ============================
-- TABLE: Issue
-- ============================
CREATE TABLE Issue (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    user_email VARCHAR(50) NOT NULL,
    furniture INTEGER REFERENCES Furniture(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: File
-- ============================
CREATE TABLE File (
    uri TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    format VARCHAR(50) NOT NULL,
    size FLOAT NOT NULL,
    issue INTEGER REFERENCES Issue(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: Review
-- ============================
CREATE TABLE Review (
    id SERIAL PRIMARY KEY,
    stars INTEGER CHECK (stars BETWEEN 1 AND 5) NOT NULL,
    text TEXT,
    date TIMESTAMP DEFAULT NOW(),
    furniture INTEGER REFERENCES Furniture(id) ON DELETE CASCADE
);

-- ============================
-- TABLE: KPIs
-- ============================
CREATE TABLE KPIs (
    id SERIAL PRIMARY KEY,
    n_issues INTEGER DEFAULT 0,
    n_suppliers INTEGER DEFAULT 0,
    n_reviews INTEGER DEFAULT 0,
    provider INTEGER REFERENCES "User"(id) ON DELETE SET NULL
);
