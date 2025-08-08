// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
// Import metrics components from the new metrics.js file
const {
    register,
    httpRequestMetricsMiddleware,
    userRegistrationsTotal,
    applicationErrorsTotal, // New: for general application errors
    initializePgPoolMetrics,
    updatePgDatabaseSize // New: for periodic database size updates
} = require('./metrics'); // Adjust path if metrics.js is in a different directory

const app = express();

// Load environment variables
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Apply the HTTP request metrics middleware early in the chain
app.use(httpRequestMetricsMiddleware);

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test database connection and initialize PostgreSQL pool metrics
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
        applicationErrorsTotal.inc({ type: 'db_connection' }); // Increment error counter on connection failure
    } else {
        console.log('Database connected successfully');
        // Initialize PostgreSQL pool metrics after the pool is ready
        initializePgPoolMetrics(pool);

        // Start periodically updating database size metric
        // Use the DB_NAME from environment variables
        const dbName = process.env.DB_NAME;
        if (dbName) {
            // Update immediately on startup
            updatePgDatabaseSize(pool, dbName);
            // Then update every 5 minutes (300,000 milliseconds)
            setInterval(() => updatePgDatabaseSize(pool, dbName), 300 * 1000);
        } else {
            console.warn('DB_NAME environment variable not set. Cannot collect database size metric.');
        }
    }
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create users table if it doesn't exist
        await pool.query(`
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
            )
        `);
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
        applicationErrorsTotal.inc({ type: 'db_init' }); // Increment error counter on DB init failure
    }
}

initializeDatabase();

// Helper function to transform snake_case to camelCase
function transformUserToCamelCase(user) {
    if (!user) return null;
    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        organization: user.organization,
        orgType: user.org_type,
        education: user.education,
        homeLocation: user.home_location,
        state: user.state,
        city: user.city,
        source: user.source,
        newsletter: user.newsletter,
        registrationDate: user.registration_date
    };
}

// Routes

// Create a new user
app.post('/api/users', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            organization,
            orgType,
            education,
            homeLocation,
            state,
            city,
            source,
            newsletter
        } = req.body;

        const result = await pool.query(
            `INSERT INTO users (
                first_name, last_name, email, phone, organization, org_type,
                education, home_location, state, city, source, newsletter
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                firstName,
                lastName,
                email,
                phone,
                organization,
                orgType,
                education,
                homeLocation,
                state,
                city,
                source,
                newsletter
            ]
        );

        // Increment the user registration counter from metrics.js
        userRegistrationsTotal.inc();

        res.status(201).json(transformUserToCamelCase(result.rows[0]));
    } catch (error) {
        console.error('Error creating user:', error);
        applicationErrorsTotal.inc({ type: 'user_creation' }); // Increment error counter

        // Check for duplicate email error
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email address already exists' });
        }

        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users with optional filters
app.get('/api/users', async (req, res) => {
    try {
        const { state, city, education, orgType, source } = req.query;

        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (state) {
            query += ` AND state = $${paramIndex}`;
            params.push(state);
            paramIndex++;
        }
        if (city) {
            query += ` AND city = $${paramIndex}`;
            params.push(city);
            paramIndex++;
        }
        if (education) {
            query += ` AND education = $${paramIndex}`;
            params.push(education);
            paramIndex++;
        }
        if (orgType) {
            query += ` AND org_type = $${paramIndex}`;
            params.push(orgType);
            paramIndex++;
        }
        if (source) {
            query += ` AND source = $${paramIndex}`;
            params.push(source);
            paramIndex++;
        }

        query += ' ORDER BY registration_date DESC';

        const result = await pool.query(query, params);

        // Transform snake_case to camelCase for response
        const users = result.rows.map(transformUserToCamelCase);

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        applicationErrorsTotal.inc({ type: 'user_fetch' }); // Increment error counter
        res.status(500).json({ error: 'Server error' });
    }
});


// Search users (existing functionality, kept separate for distinct search vs. filter use cases)
app.get('/api/users/search', async (req, res) => {
    try {
        const {
            searchQuery,
            searchType,
            state,
            education,
            orgType,
            newsletter
        } = req.query;

        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Add search query if provided
        if (searchQuery) {
            const searchValue = `%${searchQuery}%`;

            if (searchType === 'name') {
                query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`;
                params.push(searchValue);
                paramIndex++;
            } else if (searchType === 'email') {
                query += ` AND email ILIKE $${paramIndex}`;
                params.push(searchValue);
                paramIndex++;
            } else if (searchType === 'phone') {
                query += ` AND phone ILIKE $${paramIndex}`;
                params.push(searchValue);
                paramIndex++;
            } else if (searchType === 'organization') {
                query += ` AND organization ILIKE $${paramIndex}`;
                params.push(searchValue);
                paramIndex++;
            } else if (searchType === 'education') {
                query += ` AND education ILIKE $${paramIndex}`;
                params.push(searchValue);
                paramIndex++;
            } else if (searchType === 'location') {
                query += ` AND (home_location ILIKE $${paramIndex} OR state ILIKE $${paramIndex} OR city ILIKE $${paramIndex})`;
                params.push(searchValue);
                paramIndex++;
            } else {
                // Search all fields
                query += ` AND (
                    first_name ILIKE $${paramIndex} OR
                    last_name ILIKE $${paramIndex} OR
                    email ILIKE $${paramIndex} OR
                    phone ILIKE $${paramIndex} OR
                    organization ILIKE $${paramIndex} OR
                    home_location ILIKE $${paramIndex} OR
                    state ILIKE $${paramIndex} OR
                    city ILIKE $${paramIndex}
                )`;
                params.push(searchValue);
                paramIndex++;
            }
        }

        // Add filters if provided
        if (state) {
            query += ` AND state = $${paramIndex}`;
            params.push(state);
            paramIndex++;
        }

        if (education) {
            query += ` AND education = $${paramIndex}`;
            params.push(education);
            paramIndex++;
        }

        if (orgType) {
            query += ` AND org_type = $${paramIndex}`;
            params.push(orgType);
            paramIndex++;
        }

        if (newsletter !== undefined) {
            query += ` AND newsletter = $${paramIndex}`;
            params.push(newsletter === 'true');
            paramIndex++;
        }

        // Add order by
        query += ' ORDER BY registration_date DESC';

        const result = await pool.query(query, params);

        // Transform snake_case to camelCase for response
        const users = result.rows.map(transformUserToCamelCase);

        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        applicationErrorsTotal.inc({ type: 'user_search' }); // Increment error counter
        res.status(500).json({ error: 'Server error' });
    }
});

// Get a specific user by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(transformUserToCamelCase(result.rows[0]));
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        applicationErrorsTotal.inc({ type: 'user_fetch_by_id' }); // Increment error counter
        res.status(500).json({ error: 'Server error' });
    }
});


// Expose Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
