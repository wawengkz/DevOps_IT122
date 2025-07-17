const express = require('express');
const app = express();
const port = 5001;

// Middleware to parse JSON
app.use(express.json());

// Webhook endpoint for Alertmanager
app.post('/alert', (req, res) => {
  console.log('\n🚨 ALERT RECEIVED! 🚨');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(50));
  
  // Parse the alert payload
  const alerts = req.body.alerts || [];
  
  alerts.forEach((alert, index) => {
    console.log(`\n📋 Alert ${index + 1}:`);
    console.log(`   🏷️  Name: ${alert.labels?.alertname || 'Unknown'}`);
    console.log(`   🎯 Severity: ${alert.labels?.severity || 'Unknown'}`);
    console.log(`   📝 Summary: ${alert.annotations?.summary || 'No summary'}`);
    console.log(`   📖 Description: ${alert.annotations?.description || 'No description'}`);
    console.log(`   🟢 Status: ${alert.status || 'Unknown'}`);
    console.log(`   ⏰ Started: ${alert.startsAt || 'Unknown'}`);
    
    if (alert.status === 'resolved') {
      console.log(`   ✅ Resolved: ${alert.endsAt || 'Unknown'}`);
    }
    
    // Show all labels
    if (alert.labels) {
      console.log('   🏷️  Labels:');
      Object.entries(alert.labels).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    }
    
    console.log('-'.repeat(40));
  });
  
  // Log the full payload for debugging
  console.log('\n📦 Full Alert Payload:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('='.repeat(50));
  
  // Send response back to Alertmanager
  res.status(200).json({ 
    status: 'success', 
    message: `Received ${alerts.length} alert(s)`,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Alert Webhook Receiver'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'BrainBytes Alert Webhook Receiver',
    endpoints: {
      alert: 'POST /alert',
      health: 'GET /health'
    },
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log('\n🎯 BrainBytes Alert Receiver Started!');
  console.log(`📡 Listening on port ${port}`);
  console.log(`🔗 Webhook URL: http://localhost:${port}/alert`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log('\n⏳ Waiting for alerts...\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Alert Receiver...');
  process.exit(0);
});

module.exports = app;