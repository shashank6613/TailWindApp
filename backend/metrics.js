// metrics.js
const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// ------------------- Default Node.js Process Metrics -------------------
// Enable collection of default metrics for the Node.js process (CPU, Memory, Event Loop, etc.)
// These are automatically collected and exposed by prom-client.
// Examples of metrics collected:
// - process_cpu_seconds_total: Total user and system CPU time spent in seconds.
// - process_memory_bytes: Resident memory size in bytes.
// - nodejs_eventloop_lag_seconds: Lag of the event loop in seconds.
// - nodejs_heap_size_used_bytes: Current heap size used in bytes.
// - nodejs_external_memory_bytes: Node.js external memory in bytes.
client.collectDefaultMetrics({ register });

// ------------------- Custom HTTP Request Metrics -------------------
// Histogram to measure HTTP request duration
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status_code'],
    // Define buckets for the histogram. These are cumulative upper bounds.
    // For example, 0.1 means requests completed in <= 0.1 seconds.
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
});

// Counter to track total HTTP requests (covers "total number of users hit the application")
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests processed by the application',
    labelNames: ['method', 'path', 'status_code']
});

// Register custom HTTP metrics with the registry
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);

// Middleware for tracking HTTP request metrics
const httpRequestMetricsMiddleware = (req, res, next) => {
    // Start the timer for the request duration
    const end = httpRequestDurationMicroseconds.startTimer();

    // When the response finishes, record the duration and increment the counter
    res.on('finish', () => {
        const labels = { method: req.method, path: req.path, status_code: res.statusCode };
        end(labels); // End the timer with relevant labels
        httpRequestsTotal.inc(labels); // Increment the total requests counter
    });
    next(); // Move to the next middleware/route handler
};

// ------------------- Custom Application Business Metrics -------------------
// Counter for new user registrations
const userRegistrationsTotal = new client.Counter({
    name: 'user_registrations_total',
    help: 'Total number of new user registrations'
});

// Counter for application-level errors (e.g., database errors, unhandled exceptions in routes)
const applicationErrorsTotal = new client.Counter({
    name: 'application_errors_total',
    help: 'Total number of application errors encountered',
    labelNames: ['type']
});

// Register custom business metrics
register.registerMetric(userRegistrationsTotal);
register.registerMetric(applicationErrorsTotal);


// ------------------- PostgreSQL Pool Metrics -------------------
// These are Gauges that will be updated dynamically based on the pg pool state.
// The 'collect' function is called by prom-client when metrics are scraped.
const pgPoolTotalConnections = new client.Gauge({
    name: 'pg_pool_total_connections',
    help: 'Total number of active PostgreSQL connections in the pool',
});
const pgPoolIdleConnections = new client.Gauge({
    name: 'pg_pool_idle_connections',
    help: 'Number of idle PostgreSQL connections in the pool',
});
const pgPoolWaitingClients = new client.Gauge({
    name: 'pg_pool_waiting_clients',
    help: 'Number of clients waiting for a PostgreSQL connection',
});

// Gauge for database size (in bytes)
const pgDatabaseSizeBytes = new client.Gauge({
    name: 'pg_database_size_bytes',
    help: 'Size of the PostgreSQL database in bytes',
    labelNames: ['database_name']
});


// Register PostgreSQL pool and database metrics
register.registerMetric(pgPoolTotalConnections);
register.registerMetric(pgPoolIdleConnections);
register.registerMetric(pgPoolWaitingClients);
register.registerMetric(pgDatabaseSizeBytes);


/**
 * Initializes and registers PostgreSQL pool metrics.
 * This function needs to be called from server.js after the pg pool is created.
 * @param {object} pool - The node-postgres Pool instance.
 */
const initializePgPoolMetrics = (pool) => {
    // Set the collect functions for the gauges
    pgPoolTotalConnections.collect = () => {
        pgPoolTotalConnections.set(pool.totalCount);
    };
    pgPoolIdleConnections.collect = () => {
        pgPoolIdleConnections.set(pool.idleCount);
    };
    pgPoolWaitingClients.collect = () => {
        pgPoolWaitingClients.set(pool.waitingCount);
    };
    console.log('PostgreSQL pool metrics initialized.');
};

/**
 * Updates the pgDatabaseSizeBytes gauge by querying the database.
 * This function should be called periodically (e.g., every minute) from server.js.
 * @param {object} pool - The node-postgres Pool instance.
 * @param {string} dbName - The name of the database to query size for.
 */
const updatePgDatabaseSize = async (pool, dbName) => {
    try {
        const result = await pool.query(`SELECT pg_database_size($1) AS db_size;`, [dbName]);
        const dbSize = result.rows[0].db_size;
        pgDatabaseSizeBytes.set({ database_name: dbName }, Number(dbSize));
        // console.log(`Database size updated for ${dbName}: ${dbSize} bytes`);
    } catch (error) {
        console.error('Error updating PostgreSQL database size metric:', error);
        applicationErrorsTotal.inc({ type: 'db_metric_collection' }); // Increment error counter
    }
};


// ------------------- Exports -------------------
module.exports = {
    register, // The Prometheus registry, needed for the /metrics endpoint
    httpRequestMetricsMiddleware, // Middleware to apply to Express app
    userRegistrationsTotal, // Counter to be incremented on user creation
    applicationErrorsTotal, // Counter to be incremented on application errors
    initializePgPoolMetrics, // Function to set up pg pool metrics
    updatePgDatabaseSize, // Function to update database size metric
};

