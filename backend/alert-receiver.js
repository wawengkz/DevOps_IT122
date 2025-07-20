const express = require("express");
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "alert-receiver",
    timestamp: new Date().toISOString(),
  });
});

// Main alert webhook endpoint
app.post("/webhook", (req, res) => {
  const alerts = req.body.alerts || [];

  console.log(
    `📨 Received ${alerts.length} alert(s) at ${new Date().toISOString()}`,
  );

  alerts.forEach((alert, index) => {
    console.log(`🚨 Alert ${index + 1}:`);
    console.log(`   Status: ${alert.status}`);
    console.log(`   Alert: ${alert.labels?.alertname || "Unknown"}`);
    console.log(`   Instance: ${alert.labels?.instance || "Unknown"}`);
    console.log(`   Severity: ${alert.labels?.severity || "Unknown"}`);
    console.log(
      `   Description: ${alert.annotations?.description || "No description"}`,
    );
    console.log(`   Summary: ${alert.annotations?.summary || "No summary"}`);
    console.log("   ---");
  });

  res.json({
    status: "success",
    message: `Processed ${alerts.length} alerts`,
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({
    message: "Alert receiver is working!",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "BrainBytes Alert Receiver",
    version: "1.0.0",
    status: "running",
    endpoints: [
      "GET /health - Health check",
      "POST /webhook - Alert webhook",
      "GET /test - Test endpoint",
    ],
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Alert receiver listening on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📝 Alert receiver shutting down gracefully");
  process.exit(0);
});

module.exports = app;
