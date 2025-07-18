const client = require("prom-client");

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "brainbytes-backend",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for BrainBytes application

// HTTP Request metrics
const httpRequestDuration = new client.Histogram({
  name: "brainbytes_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: "brainbytes_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// AI Response Time metrics
const aiResponseTimeHistogram = new client.Histogram({
  name: "brainbytes_ai_response_time_seconds",
  help: "Time taken for AI to generate responses",
  labelNames: ["subject", "complexity"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Tutoring Session metrics
const tutoringSessions = new client.Counter({
  name: "brainbytes_tutoring_sessions_total",
  help: "Total number of tutoring sessions",
  labelNames: ["subject", "grade_level"],
  registers: [register],
});

const questionCounter = new client.Counter({
  name: "brainbytes_questions_total",
  help: "Total number of questions asked",
  labelNames: ["subject", "grade_level", "status"],
  registers: [register],
});

// Active sessions gauge
const activeSessions = new client.Gauge({
  name: "brainbytes_active_sessions",
  help: "Number of currently active sessions",
  labelNames: ["subject"],
  registers: [register],
});

// Database connection metrics
const dbConnections = new client.Gauge({
  name: "brainbytes_db_connections",
  help: "Number of database connections",
  labelNames: ["status"],
  registers: [register],
});

// Mobile and Philippine-specific metrics
const mobilePlatformCounter = new client.Counter({
  name: "brainbytes_mobile_requests_total",
  help: "Total requests from mobile devices",
  labelNames: ["platform", "network_type"],
  registers: [register],
});

const payloadSizeHistogram = new client.Histogram({
  name: "brainbytes_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["endpoint"],
  buckets: [1000, 10000, 50000, 100000, 500000],
  registers: [register],
});

const connectionDropCounter = new client.Counter({
  name: "brainbytes_connection_drops_total",
  help: "Number of dropped connections",
  labelNames: ["reason"],
  registers: [register],
});

// Error tracking
const errorCounter = new client.Counter({
  name: "brainbytes_errors_total",
  help: "Total number of errors",
  labelNames: ["type", "endpoint"],
  registers: [register],
});

// Middleware function to track HTTP requests
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Track request start
  const route = req.route ? req.route.path : req.path;

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.labels(req.method, route, statusCode).observe(duration);

    httpRequestsTotal.labels(req.method, route, statusCode).inc();

    // Track response size if available
    const responseSize = res.get("content-length");
    if (responseSize) {
      payloadSizeHistogram.labels(route).observe(parseInt(responseSize));
    }

    // Track mobile requests
    const userAgent = req.get("user-agent") || "";
    if (userAgent.includes("Mobile")) {
      const platform = userAgent.includes("iPhone")
        ? "ios"
        : userAgent.includes("Android")
          ? "android"
          : "other";
      mobilePlatformCounter.labels(platform, "unknown").inc();
    }

    originalEnd.apply(this, args);
  };

  next();
};

module.exports = {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  aiResponseTimeHistogram,
  tutoringSessions,
  questionCounter,
  activeSessions,
  dbConnections,
  mobilePlatformCounter,
  payloadSizeHistogram,
  connectionDropCounter,
  errorCounter,
  metricsMiddleware,
};
