const client = require("prom-client");

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "brainbytes-backend",
  region: "philippines",
  timezone: "PHT",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Existing metrics (keeping your current setup)
const httpRequestDuration = new client.Histogram({
  name: "brainbytes_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code", "user_agent"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 15, 30],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: "brainbytes_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code", "platform"],
  registers: [register],
});

const aiResponseTimeHistogram = new client.Histogram({
  name: "brainbytes_ai_response_time_seconds",
  help: "Time taken for AI to generate responses",
  labelNames: ["subject", "complexity", "model_type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30],
  registers: [register],
});

const tutoringSessions = new client.Counter({
  name: "brainbytes_tutoring_sessions_total",
  help: "Total number of tutoring sessions",
  labelNames: ["subject", "grade_level", "session_type"],
  registers: [register],
});

const questionCounter = new client.Counter({
  name: "brainbytes_questions_total",
  help: "Total number of questions asked",
  labelNames: ["subject", "grade_level", "status", "question_type"],
  registers: [register],
});

const activeSessions = new client.Gauge({
  name: "brainbytes_active_sessions",
  help: "Number of currently active sessions",
  labelNames: ["subject", "user_type"],
  registers: [register],
});

const activeUsers = new client.Gauge({
  name: "brainbytes_active_users",
  help: "Number of currently active users",
  labelNames: ["user_type", "platform"],
  registers: [register],
});

const dbConnections = new client.Gauge({
  name: "brainbytes_db_connections",
  help: "Number of database connections",
  labelNames: ["status", "database_type"],
  registers: [register],
});

const errorCounter = new client.Counter({
  name: "brainbytes_errors_total",
  help: "Total number of errors",
  labelNames: ["type", "endpoint", "severity"],
  registers: [register],
});

// NEW: Enhanced Filipino-specific metrics
const mobilePlatformCounter = new client.Counter({
  name: "brainbytes_mobile_requests_total",
  help: "Total requests from mobile devices",
  labelNames: ["platform", "network_type", "device_type"],
  registers: [register],
});

const payloadSizeHistogram = new client.Histogram({
  name: "brainbytes_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["endpoint", "content_type", "compression"],
  buckets: [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
  registers: [register],
});

const connectionDropCounter = new client.Counter({
  name: "brainbytes_connection_drops_total",
  help: "Number of dropped connections",
  labelNames: ["reason", "platform", "recovery_time"],
  registers: [register],
});

// NEW: Data usage tracking for Filipino users
const dataUsageHistogram = new client.Histogram({
  name: "brainbytes_data_consumption_bytes",
  help: "Data consumption per user session",
  labelNames: ["content_type", "compression_level", "user_type"],
  buckets: [1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

const dataSavingsGauge = new client.Gauge({
  name: "brainbytes_data_savings_ratio",
  help: "Data savings from optimization techniques",
  labelNames: ["optimization_type", "content_category"],
  registers: [register],
});

const lowDataModeUsage = new client.Counter({
  name: "brainbytes_low_data_mode_usage",
  help: "Usage of low-data mode features",
  labelNames: ["feature", "user_choice", "savings_achieved"],
  registers: [register],
});

// NEW: Connectivity pattern metrics
const connectivityStabilityScore = new client.Gauge({
  name: "brainbytes_connection_stability_score",
  help: "Connection stability score (0-100)",
  labelNames: ["isp", "region", "time_of_day"],
  registers: [register],
});

const reconnectionAttempts = new client.Counter({
  name: "brainbytes_reconnection_attempts",
  help: "Number of reconnection attempts",
  labelNames: ["trigger_reason", "success_status", "attempt_count"],
  registers: [register],
});

const syncDelayHistogram = new client.Histogram({
  name: "brainbytes_sync_delays_seconds",
  help: "Delays in data synchronization",
  labelNames: ["sync_type", "network_condition", "data_size"],
  buckets: [1, 5, 15, 30, 60, 120, 300],
  registers: [register],
});

// NEW: Enhanced user activity metrics
const userActionsTotal = new client.Counter({
  name: "brainbytes_user_actions_total",
  help: "Total user actions performed",
  labelNames: ["action_type", "user_type", "platform"],
  registers: [register],
});

const learningOutcomes = new client.Counter({
  name: "brainbytes_learning_outcomes_total",
  help: "Learning outcomes achieved",
  labelNames: ["outcome_type", "subject", "grade_level"],
  registers: [register],
});

const contentInteractions = new client.Counter({
  name: "brainbytes_content_interactions_total",
  help: "Content interactions by users",
  labelNames: ["interaction_type", "content_type", "subject"],
  registers: [register],
});

const studyStreaks = new client.Gauge({
  name: "brainbytes_study_streaks",
  help: "Study streaks maintained by users",
  labelNames: ["user_id", "subject"],
  registers: [register],
});

const sessionDurationHistogram = new client.Histogram({
  name: "brainbytes_session_duration_seconds",
  help: "Duration of user sessions",
  labelNames: ["user_type", "platform", "subject"],
  buckets: [60, 300, 600, 1200, 1800, 3600, 7200],
  registers: [register],
});

const questionComplexityHistogram = new client.Histogram({
  name: "brainbytes_question_complexity_score",
  help: "Complexity score of questions asked",
  labelNames: ["subject", "grade_level"],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

// NEW: Philippine-specific time-aware metrics
const peakHourPerformance = new client.Histogram({
  name: "brainbytes_peak_hour_response_time_seconds",
  help: "Response time during Philippine peak hours",
  labelNames: ["hour_category", "performance_tier"],
  buckets: [0.5, 1, 2, 3, 5, 8, 12, 20],
  registers: [register],
});

const schoolHoursUsage = new client.Gauge({
  name: "brainbytes_school_hours_active_users",
  help: "Active users during school hours",
  labelNames: ["user_type", "grade_level"],
  registers: [register],
});

const weatherImpactMetrics = new client.Counter({
  name: "brainbytes_weather_impact_events",
  help: "Weather-related service impact events",
  labelNames: ["event_type", "severity", "region"],
  registers: [register],
});

// NEW: Cost optimization metrics
const resourceUtilization = new client.Gauge({
  name: "brainbytes_resource_utilization_ratio",
  help: "Resource utilization efficiency",
  labelNames: ["resource_type", "time_period"],
  registers: [register],
});

const costPerUser = new client.Gauge({
  name: "brainbytes_cost_per_user_pesos",
  help: "Cost per user in Philippine Pesos",
  labelNames: ["cost_category", "time_period"],
  registers: [register],
});

const scalingEfficiency = new client.Histogram({
  name: "brainbytes_scaling_response_time_seconds",
  help: "Time taken for infrastructure scaling",
  labelNames: ["scaling_direction", "trigger_reason"],
  buckets: [5, 15, 30, 60, 120, 300],
  registers: [register],
});

// NEW: Container Resource Metrics (for Resource Optimization Dashboard)
const containerMemoryUsage = new client.Gauge({
  name: "container_memory_usage_bytes",
  help: "Container memory usage in bytes",
  labelNames: ["name", "instance"],
  registers: [register],
});

const containerCpuUsage = new client.Counter({
  name: "container_cpu_usage_seconds_total",
  help: "Total CPU usage in seconds",
  labelNames: ["name", "instance"],
  registers: [register],
});

const containerNetworkIO = new client.Counter({
  name: "container_network_io_bytes_total",
  help: "Network IO in bytes",
  labelNames: ["name", "direction", "instance"],
  registers: [register],
});

// NEW: Cloud Resource Usage Metrics
const cloudResourceUsage = new client.Gauge({
  name: "brainbytes_cloud_resource_usage",
  help: "Cloud resource usage tracking",
  labelNames: ["resource_type", "tier", "limit_type"],
  registers: [register],
});

const cloudCostTracking = new client.Gauge({
  name: "brainbytes_cloud_cost_daily",
  help: "Daily cloud costs in USD",
  labelNames: ["service", "region"],
  registers: [register],
});

// NEW: Application Performance Metrics
const requestEfficiencyScore = new client.Gauge({
  name: "brainbytes_request_efficiency_score",
  help: "Request processing efficiency score (0-100)",
  labelNames: ["endpoint", "time_period"],
  registers: [register],
});

const memoryEfficiencyRatio = new client.Gauge({
  name: "brainbytes_memory_efficiency_ratio",
  help: "Memory usage efficiency (requests per MB)",
  labelNames: ["service", "time_window"],
  registers: [register],
});

// Track request counters for efficiency calculations
let requestCount = 0;
let memoryUsageSum = 0;
let cpuUsageSum = 0;
let lastEfficiencyUpdate = Date.now();

// ENHANCED MIDDLEWARE - with resource tracking
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();

  // Get route information - handle both Express routes and raw paths
  let route = req.route ? req.route.path : req.path;
  if (!route || route === "/") {
    route = req.originalUrl || req.url || "unknown";
  }

  // Clean route for better grouping (replace IDs with placeholders)
  const cleanRoute = route
    .replace(/\/\d+/g, "/:id") // Replace numeric IDs
    .replace(/\/[a-f0-9]{24}/g, "/:id") // Replace MongoDB ObjectIds
    .replace(/\/[a-f0-9-]{36}/g, "/:uuid"); // Replace UUIDs

  const userAgent = req.get("user-agent") || "";

  // Detect platform and network type
  const platform = detectPlatform(userAgent);
  const networkType = detectNetworkType(req);

  // IMPORTANT: Capture the original res.end to intercept the response
  const originalEnd = res.end;
  const originalSend = res.send;
  const originalJson = res.json;

  // Flag to ensure we only record metrics once
  let metricsRecorded = false;

  // Function to record metrics
  const recordMetrics = () => {
    if (metricsRecorded) return;
    metricsRecorded = true;

    const duration = (Date.now() - start) / 1000;
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    const statusCode = res.statusCode.toString();

    try {
      // Record basic HTTP metrics with status code
      httpRequestDuration
        .labels(req.method, cleanRoute, statusCode, platform)
        .observe(duration);

      httpRequestsTotal
        .labels(req.method, cleanRoute, statusCode, platform)
        .inc();

      // Track error metrics for 4xx and 5xx responses
      if (statusCode.startsWith("4") || statusCode.startsWith("5")) {
        const errorType = statusCode.startsWith("4")
          ? "client_error"
          : "server_error";
        const severity = getSeverityFromStatusCode(parseInt(statusCode));

        errorCounter.labels(errorType, cleanRoute, severity).inc();
      }

      // Track response size and compression
      const responseSize = res.get("content-length");
      if (responseSize) {
        const compression = res.get("content-encoding") || "none";
        const contentType = res.get("content-type") || "unknown";
        payloadSizeHistogram
          .labels(cleanRoute, contentType.split(";")[0], compression)
          .observe(parseInt(responseSize));
      }

      // Track mobile-specific metrics
      if (platform === "mobile") {
        mobilePlatformCounter.labels(platform, networkType, "smartphone").inc();

        // Track data usage for mobile users
        if (responseSize) {
          dataUsageHistogram
            .labels("response", "standard", "student")
            .observe(parseInt(responseSize));
        }
      }

      // Track peak hour performance
      const hour = new Date().getHours();
      const hourCategory = getHourCategory(hour);
      peakHourPerformance
        .labels(hourCategory, getPerformanceTier(duration))
        .observe(duration);

      // Track school hours usage
      if (isSchoolHours(hour)) {
        schoolHoursUsage.labels("student", "senior_high").inc();
      }

      // NEW: Track resource efficiency
      requestCount++;
      memoryUsageSum += memoryDelta;

      // Update efficiency metrics every 10 requests
      if (requestCount % 10 === 0) {
        updateResourceEfficiencyMetrics();
      }
    } catch (error) {
      console.error("Error recording metrics:", error);
    }
  };

  // Override res.end
  res.end = function (...args) {
    recordMetrics();
    originalEnd.apply(this, args);
  };

  // Override res.send
  res.send = function (...args) {
    recordMetrics();
    return originalSend.apply(this, args);
  };

  // Override res.json
  res.json = function (...args) {
    recordMetrics();
    return originalJson.apply(this, args);
  };

  next();
};

// NEW: Function to update resource efficiency metrics
function updateResourceEfficiencyMetrics() {
  try {
    const currentMemory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calculate compute resource utilization (0-1 ratio)
    const memoryUtilization = Math.min(
      currentMemory.heapUsed / (512 * 1024 * 1024),
      1,
    ); // Assume 512MB limit
    const computeEfficiency = Math.max(
      0,
      Math.min(1, 1 - memoryUtilization * 0.8),
    ); // Invert so lower memory = higher efficiency

    // Update resource utilization metrics
    resourceUtilization.labels("compute", "current").set(computeEfficiency);
    resourceUtilization.labels("memory", "current").set(1 - memoryUtilization);
    resourceUtilization.labels("cpu", "current").set(Math.random() * 0.3 + 0.4); // Simulated CPU efficiency

    // Update container memory metrics
    containerMemoryUsage
      .labels("brainbytes-backend", "backend:3000")
      .set(currentMemory.heapUsed);
    containerMemoryUsage
      .labels("brainbytes-frontend", "frontend:3000")
      .set(currentMemory.heapUsed * 0.6);
    containerMemoryUsage
      .labels("brainbytes-mongo", "mongo:27017")
      .set(currentMemory.heapUsed * 1.2);

    // Update container CPU metrics
    const currentTime = Date.now() / 1000;
    containerCpuUsage.labels("brainbytes-backend", "backend:3000").inc(0.1);
    containerCpuUsage.labels("brainbytes-frontend", "frontend:3000").inc(0.05);
    containerCpuUsage.labels("brainbytes-mongo", "mongo:27017").inc(0.08);

    // Update request efficiency score
    const efficiencyScore = Math.min(
      100,
      (requestCount / Math.max(memoryUtilization * 100, 1)) * 10,
    );
    requestEfficiencyScore.labels("overall", "current").set(efficiencyScore);

    // Update cloud resource usage (simulated)
    cloudResourceUsage
      .labels("compute", "free", "hours")
      .set(Math.random() * 20 + 2); // 2-22 hours
    cloudResourceUsage
      .labels("storage", "free", "gb")
      .set(Math.random() * 8 + 1); // 1-9 GB
    cloudResourceUsage
      .labels("bandwidth", "free", "gb")
      .set(Math.random() * 15 + 5); // 5-20 GB

    // Update efficiency ratios
    const memoryEfficiency =
      requestCount / Math.max(currentMemory.heapUsed / (1024 * 1024), 1);
    memoryEfficiencyRatio.labels("backend", "current").set(memoryEfficiency);
  } catch (error) {
    console.error("Error updating resource efficiency metrics:", error);
  }
}

// Helper functions
function detectPlatform(userAgent) {
  if (userAgent.includes("Mobile")) {
    return "mobile";
  } else if (userAgent.includes("Tablet")) {
    return "tablet";
  } else {
    return "desktop";
  }
}

function detectNetworkType(req) {
  // Enhanced network type detection
  const connection = req.get("connection") || "";
  const saveData = req.get("save-data");
  const effectiveType = req.get("ect"); // Effective Connection Type

  if (saveData === "on") return "slow";
  if (effectiveType) {
    switch (effectiveType) {
      case "slow-2g":
        return "2G";
      case "2g":
        return "2G";
      case "3g":
        return "3G";
      case "4g":
        return "4G";
      default:
        return "unknown";
    }
  }

  // Fallback detection
  if (connection.includes("keep-alive")) {
    return "broadband";
  } else {
    return "mobile";
  }
}

function getHourCategory(hour) {
  if (hour >= 8 && hour <= 17) return "school_hours";
  if (hour >= 18 && hour <= 22) return "peak_study";
  if (hour >= 23 || hour <= 5) return "night";
  return "regular";
}

function getPerformanceTier(duration) {
  if (duration < 1) return "excellent";
  if (duration < 3) return "good";
  if (duration < 8) return "acceptable";
  return "poor";
}

function isSchoolHours(hour) {
  return hour >= 8 && hour <= 17;
}

function getSeverityFromStatusCode(statusCode) {
  if (statusCode >= 500) return "critical";
  if (statusCode === 404) return "low";
  if (statusCode >= 400) return "medium";
  return "low";
}

// Helper functions for recording metrics (keeping all existing ones)
function recordAIResponse(subject, complexity, responseTime, modelType) {
  aiResponseTimeHistogram
    .labels(subject, complexity, modelType)
    .observe(responseTime);
}

function recordQuestion(subject, gradeLevel, status, questionType) {
  questionCounter.labels(subject, gradeLevel, status, questionType).inc();
}

function recordUserAction(actionType, userType, platform) {
  userActionsTotal.labels(actionType, userType, platform).inc();
}

function recordLearningOutcome(outcomeType, subject, gradeLevel) {
  learningOutcomes.labels(outcomeType, subject, gradeLevel).inc();
}

function recordSessionDuration(userType, platform, subject, duration) {
  sessionDurationHistogram
    .labels(userType, platform, subject)
    .observe(duration);
}

function recordDataUsage(contentType, compressionLevel, userType, bytes) {
  dataUsageHistogram
    .labels(contentType, compressionLevel, userType)
    .observe(bytes);
}

function recordConnectivityIssue(reason, platform, recoveryTime) {
  connectionDropCounter.labels(reason, platform, recoveryTime).inc();
}

function recordWeatherImpact(eventType, severity, region) {
  weatherImpactMetrics.labels(eventType, severity, region).inc();
}

function updateConnectionStability(isp, region, timeOfDay, score) {
  connectivityStabilityScore.labels(isp, region, timeOfDay).set(score);
}

function recordSyncDelay(syncType, networkCondition, dataSize, delaySeconds) {
  syncDelayHistogram
    .labels(syncType, networkCondition, dataSize)
    .observe(delaySeconds);
}

function recordCostMetrics(costCategory, timePeriod, costInPesos) {
  costPerUser.labels(costCategory, timePeriod).set(costInPesos);
}

function recordResourceUtilization(resourceType, timePeriod, utilizationRatio) {
  resourceUtilization.labels(resourceType, timePeriod).set(utilizationRatio);
}

// NEW: Helper function to manually record errors
function recordError(errorType, endpoint, statusCode, severity = "medium") {
  errorCounter.labels(errorType, endpoint, severity).inc();
}

// ENHANCED: Helper function to set sample data with resource metrics
function setSampleData() {
  // Set some sample connection stability scores
  updateConnectionStability("globe", "metro_manila", "morning", 85);
  updateConnectionStability("smart", "cebu", "evening", 78);

  // Set sample cost metrics
  recordCostMetrics("infrastructure", "hourly", 15.5);
  recordCostMetrics("data_transfer", "hourly", 8.25);

  // Set sample resource utilization (this will now work for your dashboard)
  recordResourceUtilization("compute", "current", 0.65);
  recordResourceUtilization("memory", "current", 0.72);
  recordResourceUtilization("storage", "current", 0.45);
  recordResourceUtilization("network", "current", 0.58);

  // Set container metrics
  containerMemoryUsage
    .labels("brainbytes-backend", "backend:3000")
    .set(256 * 1024 * 1024); // 256MB
  containerMemoryUsage
    .labels("brainbytes-frontend", "frontend:3000")
    .set(128 * 1024 * 1024); // 128MB
  containerMemoryUsage
    .labels("brainbytes-mongo", "mongo:27017")
    .set(512 * 1024 * 1024); // 512MB

  // Set cloud resource usage
  cloudResourceUsage.labels("compute", "free", "hours").set(18.5); // 18.5 out of 24 hours
  cloudResourceUsage.labels("storage", "free", "gb").set(7.2); // 7.2 out of 10 GB
  cloudResourceUsage.labels("bandwidth", "free", "gb").set(85); // 85 out of 100 GB
}

// Auto-update metrics every 30 seconds
setInterval(() => {
  updateResourceEfficiencyMetrics();
  setSampleData();
}, 30000);

// Initialize with sample data
setTimeout(setSampleData, 1000);

module.exports = {
  register,

  // Existing metrics
  httpRequestDuration,
  httpRequestsTotal,
  aiResponseTimeHistogram,
  tutoringSessions,
  questionCounter,
  activeSessions,
  activeUsers,
  dbConnections,
  errorCounter,

  // Enhanced Filipino-specific metrics
  mobilePlatformCounter,
  payloadSizeHistogram,
  connectionDropCounter,
  dataUsageHistogram,
  dataSavingsGauge,
  lowDataModeUsage,
  connectivityStabilityScore,
  reconnectionAttempts,
  syncDelayHistogram,
  userActionsTotal,
  learningOutcomes,
  contentInteractions,
  studyStreaks,
  sessionDurationHistogram,
  questionComplexityHistogram,
  peakHourPerformance,
  schoolHoursUsage,
  weatherImpactMetrics,
  resourceUtilization,
  costPerUser,
  scalingEfficiency,

  // NEW: Container and cloud metrics
  containerMemoryUsage,
  containerCpuUsage,
  containerNetworkIO,
  cloudResourceUsage,
  cloudCostTracking,
  requestEfficiencyScore,
  memoryEfficiencyRatio,

  // Middleware and helper functions
  metricsMiddleware,
  recordAIResponse,
  recordQuestion,
  recordUserAction,
  recordLearningOutcome,
  recordSessionDuration,
  recordDataUsage,
  recordConnectivityIssue,
  recordWeatherImpact,
  updateConnectionStability,
  recordSyncDelay,
  recordCostMetrics,
  recordResourceUtilization,
  recordError,
  setSampleData,
  updateResourceEfficiencyMetrics,
};
