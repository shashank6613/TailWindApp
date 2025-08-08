CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  organization VARCHAR(255),
  org_type VARCHAR(100),
  education VARCHAR(100),
  home_location TEXT,
  state VARCHAR(100),
  city VARCHAR(100),
  source VARCHAR(100),
  newsletter BOOLEAN DEFAULT FALSE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
