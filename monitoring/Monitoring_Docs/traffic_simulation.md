# BrainBytes Monitoring Simulation Documentation

## Overview
This document provides comprehensive documentation for the BrainBytes monitoring simulation system, including traffic simulation and scenario-based testing framework.

## System Architecture

### Comprehensive Traffic Simulator
The traffic simulator generates realistic user behavior patterns based on Philippine educational context and usage patterns.

```
┌─────────────────────────────────────────────────────────────────────┐
│                  BrainBytes Traffic Simulation                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Profiles  │    │  Time Context   │    │ Network         │
│                 │    │                 │    │ Conditions      │
│ • Quick Learner │    │ • School Hours  │    │                 │
│ • Deep Learner  │    │ • Peak Study    │    │ • Excellent     │
│ • Exam Crammer  │    │ • Lunch Break   │    │ • Good          │
│ • Casual Browser│    │ • Night Time    │    │ • Poor          │
│ • Teacher       │    │ • Weekend       │    │ • Very Poor     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Realistic     │
                    │   User Sessions │
                    │                 │
                    │ • Questions     │
                    │ • Interactions  │
                    │ • Errors        │
                    │ • Duration      │
                    └─────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Prometheus    │
                    │   Metrics       │
                    │   Generation    │
                    └─────────────────┘
```

### Scenario Testing Framework
The testing framework provides structured scenarios to validate monitoring and alerting behavior.

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Scenario Testing Framework                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Test Scenarios │    │  Execution      │    │  Validation     │
│                 │    │  Engine         │    │                 │
│ • High Load     │    │                 │    │ • Metrics       │
│ • Error Spike   │    │ • Setup         │    │ • Alerts        │
│ • Resource      │    │ • Execute       │    │ • Thresholds    │
│ • Network       │    │ • Monitor       │    │ • Expected      │
│ • Low Engagement│    │ • Teardown      │    │ • Behavior      │
│ • DB Stress     │    │ • Report        │    │ • Results       │
│ • Mobile Peak   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Test Results  │
                    │   & Reports     │
                    │                 │
                    │ • Pass/Fail     │
                    │ • Metrics       │
                    │ • Alerts        │
                    │ • Recommend     │
                    └─────────────────┘
```

## User Profiles

### 1. Quick Learner
- **Session Duration**: 5-15 minutes
- **Questions**: 2-5 per session
- **Error Rate**: 5%
- **Complexity**: Basic, Intermediate
- **Subjects**: Math, Science, English
- **Platform**: Mobile
- **Peak Hours**: 7-9 PM

### 2. Deep Learner
- **Session Duration**: 30-60 minutes
- **Questions**: 8-15 per session
- **Error Rate**: 2%
- **Complexity**: Intermediate, Advanced
- **Subjects**: Math, Science, History, Filipino
- **Platform**: Desktop
- **Peak Hours**: 6-10 PM

### 3. Exam Crammer
- **Session Duration**: 10-40 minutes
- **Questions**: 10-20 per session
- **Error Rate**: 8%
- **Complexity**: All levels
- **Subjects**: Math, Science, English, History
- **Platform**: Mobile
- **Peak Hours**: 5-11 PM

### 4. Casual Browser
- **Session Duration**: 2-10 minutes
- **Questions**: 1-3 per session
- **Error Rate**: 15%
- **Complexity**: Basic
- **Subjects**: Math, English
- **Platform**: Mobile
- **Peak Hours**: Lunch & Evening

### 5. Teacher Reviewer
- **Session Duration**: 15-30 minutes
- **Questions**: 5-10 per session
- **Error Rate**: 1%
- **Complexity**: Intermediate, Advanced
- **Subjects**: All subjects
- **Platform**: Desktop
- **Peak Hours**: School hours

## Philippine Context Simulation

### Time-Based Patterns
- **School Hours**: 8 AM - 5 PM (Higher teacher activity)
- **Peak Study**: 6-10 PM (Maximum student activity)
- **Lunch Break**: 12-1 PM (Casual browsing)
- **Night Time**: 11 PM - 5 AM (Very low activity)
- **Weekend**: 30% reduction, later peak hours

### Network Conditions
- **Excellent**: 50ms latency, 0.1% drops, 100% speed
- **Good**: 150ms latency, 1% drops, 80% speed
- **Moderate**: 300ms latency, 3% drops, 60% speed
- **Poor**: 800ms latency, 8% drops, 30% speed
- **Very Poor**: 2000ms latency, 15% drops, 10% speed

### Environmental Factors
- **Weather Events**: 5% chance (typhoons, storms)
- **Power Outages**: 2% chance (infrastructure issues)
- **Internet Issues**: 8% chance (connectivity problems)

## Test Scenarios

### 1. High Load Test
**Purpose**: Validate system behavior under peak traffic conditions

**Configuration**:
- Duration: 5 minutes
- Load Factor: 2.5x normal
- Time Context: 7 PM (peak hour)
- Expected Users: 80-120 concurrent

**Expected Metrics**:
- Response time P95: < 2.0 seconds
- Error rate: < 5%
- Database connections: < 50
- Memory usage: May exceed 80%

**Expected Alerts**:
- `HighMemoryUsage`
- `HighCPUUsage`
- `PeakHoursPerformance`

**How to Run**:
```bash
node scenario-testing-framework.js --scenario high_load
```

### 2. Error Spike Test
**Purpose**: Validate error handling and alerting during AI service issues

**Configuration**:
- Duration: 3 minutes
- Error Rate: 20%
- Time Context: 2 PM (school hours)
- Network: Very poor conditions

**Expected Metrics**:
- Error rate: 15-25%
- AI response time: 8-15 seconds
- Failed questions: > 20

**Expected Alerts**:
- `HighErrorRate`
- `SlowAIResponses`
- `SystemIssuesDuringSchoolHours`

**How to Run**:
```bash
node scenario-testing-framework.js --scenario error_spike
```

### 3. Resource Constraints Test
**Purpose**: Validate system behavior under resource pressure

**Configuration**:
- Duration: 4 minutes
- Resource Pressure: High memory/CPU usage
- Database: Connection pressure

**Expected Metrics**:
- Memory usage: 85-95%
- CPU usage: 85-95%
- Database connections: 45-55
- Response time P95: 3-8 seconds

**Expected Alerts**:
- `HighMemoryUsage`
- `HighCPUUsage`
- `DatabaseConnectionLost`
- `ContainerHighMemory`

**How to Run**:
```bash
node scenario-testing-framework.js --scenario resource_constraints
```

### 4. Network Instability Test
**Purpose**: Validate system behavior during poor network conditions (typhoon scenario)

**Configuration**:
- Duration: 5 minutes
- Network: Very poor conditions
- Mobile Users: 90%
- Weather: Disruption simulation

**Expected Metrics**:
- Connection drops: 10-30
- Mobile response time: 5-15 seconds
- Network stability: 60-85%

**Expected Alerts**:
- `NetworkInstability`
- `SlowMobileResponses`
- `HighLatencyResponses`
- `UnusualTrafficDrop`

**How to Run**:
```bash
node scenario-testing-framework.js --scenario network_instability
```

### 5. Low Engagement Test
**Purpose**: Validate alerting for low user engagement periods

**Configuration**:
- Duration: 6 minutes
- Load Factor: 0.1x normal
- Time Context: 3 AM (very low activity)
- User Generation: Reduced by 90%

**Expected Metrics**:
- Questions per minute: < 0.05
- Active sessions: < 5
- Mobile usage ratio: < 40%

**Expected Alerts**:
- `LowStudentEngagement`
- `NoRecentQuestions`
- `LowMobileUsage`

**How to Run**:
```bash
node scenario-testing-framework.js --scenario low_engagement
```

### 6. Database Stress Test
**Purpose**: Validate database performance under heavy load

**Configuration**:
- Duration: 4 minutes
- Database: Heavy connection load
- Time Context: 3 PM (school hours)
- Connection Utilization: 90-100%

**Expected Metrics**:
- Database connection utilization: 90-100%
- Query response time: 2-10 seconds
- Database errors: > 5

**Expected Alerts**:
- `DatabaseConnectionLost`
- `HighErrorRate`
- `SystemIssuesDuringSchoolHours`

**How to Run**:
```bash
node scenario-testing-framework.js --scenario database_stress
```

### 7. Mobile Peak Load Test
**Purpose**: Validate mobile-specific performance during peak usage

**Configuration**:
- Duration: 5 minutes
- Mobile Traffic: 92%
- Time Context: 6 PM (commute time)
- Payload Sizes: Increased

**Expected Metrics**:
- Mobile usage ratio: 85-95%
- Mobile response time: 2-5 seconds
- Data usage: 60-100 MB/hour

**Expected Alerts**:
- `SlowMobileResponses`
- `HighDataUsage`
- `LargResponsePayloads`

**How to Run**:
```bash
node scenario-testing-framework.js --scenario mobile_peak_load
```

## Usage Instructions

### Running the Comprehensive Traffic Simulator

#### Basic Usage
```bash
# Start basic simulation
node comprehensive-traffic-simulator.js

# Start with Docker Compose
docker-compose --profile simulation up -d
```

#### Advanced Configuration
```bash
# Set environment variables
export SIMULATION_INTENSITY=high
export SIMULATION_DURATION=3600  # 1 hour
export PHILIPPINE_TIME_OVERRIDE=19  # Force 7 PM

# Run with custom settings
node comprehensive-traffic-simulator.js
```

### Running Scenario Tests

#### Single Scenario
```bash
# Run specific scenario
node scenario-testing-framework.js --scenario high_load

# Get scenario instructions
node scenario-testing-framework.js --instructions high_load
```

#### Multiple Scenarios
```bash
# Run all scenarios
node scenario-testing-framework.js --all

# List available scenarios
node scenario-testing-framework.js --list
```

#### With Docker
```bash
# Run scenario in container
docker-compose exec backend node scenario-testing-framework.js --scenario error_spike
```

### Monitoring During Tests

#### Prometheus Queries
```bash
# Monitor during high load test
curl "http://localhost:9091/api/v1/query?query=brainbytes_active_sessions"

# Check error rates
curl "http://localhost:9091/api/v1/query?query=rate(brainbytes_errors_total[5m])"

# Monitor AI response times
curl "http://localhost:9091/api/v1/query?query=histogram_quantile(0.95,rate(brainbytes_ai_response_time_seconds_bucket[5m]))"
```

#### Alert Monitoring
```bash
# Check active alerts
curl "http://localhost:9093/api/v1/alerts"

# View alert receiver logs
curl "http://localhost:5001/health"
```

## Expected Behavior by Scenario

### High Load Test Expected Behavior
1. **Metrics Changes**:
   - Active sessions increase to 80-120
   - Response times may increase to 1-2 seconds
   - Memory usage rises above 80%
   - CPU usage increases significantly

2. **Alerts Triggered**:
   - `HighMemoryUsage` should fire within 2 minutes
   - `HighCPUUsage` should fire within 5 minutes
   - `PeakHoursPerformance` may trigger if AI responses slow

3. **System Behavior**:
   - Application should remain responsive
   - Database connections should scale appropriately
   - No critical failures expected

### Error Spike Test Expected Behavior
1. **Metrics Changes**:
   - Error rate jumps to 15-25%
   - AI response time increases to 8-15 seconds
   - Failed questions counter increases rapidly

2. **Alerts Triggered**:
   - `HighErrorRate` should fire within 2 minutes
   - `SlowAIResponses` should fire within 2 minutes
   - `SystemIssuesDuringSchoolHours` should fire immediately

3. **System Behavior**:
   - Users experience delayed responses
   - Some requests fail completely
   - System attempts retry logic

### Network Instability Test Expected Behavior
1. **Metrics Changes**:
   - Connection drops increase significantly
   - Mobile response times degrade to 5-15 seconds
   - Network stability score drops to 60-85%

2. **Alerts Triggered**:
   - `NetworkInstability` should fire within 2 minutes
   - `SlowMobileResponses` should fire within 5 minutes
   - `HighLatencyResponses` should fire within 3 minutes

3. **System Behavior**:
   - Mobile users experience poor performance
   - Connection timeouts increase
   - Traffic may decrease due to poor conditions

## Validation Criteria

### Metrics Validation
For each scenario, the framework validates:
- **Metric Ranges**: Actual values fall within expected ranges
- **Trend Direction**: Metrics move in expected directions
- **Timing**: Changes occur within expected timeframes
- **Correlation**: Related metrics change together

### Alert Validation
For each scenario, the framework checks:
- **Alert Triggering**: Expected alerts fire within timeout
- **Alert Timing**: Alerts fire at appropriate thresholds
- **Alert Resolution**: Alerts resolve when conditions clear
- **Alert Accuracy**: No false positives or negatives

### System Behavior Validation
For each scenario, the framework verifies:
- **Service Availability**: Core services remain available
- **Performance Degradation**: Performance degrades gracefully
- **Recovery**: System recovers after scenario ends
- **Data Integrity**: No data corruption or loss

## Troubleshooting Guide

### Common Issues

#### Simulation Not Starting
**Symptoms**: No metrics being generated
**Possible Causes**:
- Prometheus not accessible
- Metrics endpoint not responding
- Network connectivity issues

**Solutions**:
```bash
# Check Prometheus connectivity
curl http://localhost:9091/-/healthy

# Check metrics endpoint
curl http://localhost:3000/metrics

# Check Docker network
docker network ls
docker network inspect brainbytes-network
```

#### Alerts Not Firing
**Symptoms**: Expected alerts not triggering during scenarios
**Possible Causes**:
- Alert thresholds too high
- Evaluation intervals too long
- Alertmanager configuration issues

**Solutions**:
```bash
# Check alert rules
curl http://localhost:9091/api/v1/rules

# Check alertmanager status
curl http://localhost:9093/api/v1/status

# Verify alert receiver
curl http://localhost:5001/health
```

#### Metrics Not Realistic
**Symptoms**: Metrics don't match expected Philippine patterns
**Possible Causes**:
- Time zone configuration incorrect
- User profile distributions wrong
- Network conditions not realistic

**Solutions**:
- Verify system time zone settings
- Check user profile selection logic
- Validate network condition simulation

### Performance Optimization

#### Simulation Performance
- **Reduce Metric Collection Frequency**: Lower from 5s to 10s intervals
- **Limit Concurrent Users**: Cap at 100 concurrent sessions
- **Optimize Database Queries**: Use connection pooling
- **Memory Management**: Clean up old session data regularly

#### Monitoring Performance
- **Prometheus Retention**: Reduce retention during testing
- **Query Optimization**: Use recording rules for complex queries
- **Alert Evaluation**: Increase evaluation intervals if needed
- **Resource Limits**: Set appropriate container limits

## Integration with CI/CD

### Automated Testing
```yaml
# GitHub Actions example
name: Monitoring Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  monitoring-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Start services
      run: docker-compose up -d
    - name: Wait for services
      run: sleep 30
    - name: Run monitoring tests
      run: |
        npm install
        node scenario-testing-framework.js --all
    - name: Upload test results
      uses: actions/upload-artifact@v2
      with:
        name: monitoring-test-results
        path: test-results.json
```

### Continuous Monitoring
```bash
# Cron job for regular testing
# Run every 4 hours
0 */4 * * * /path/to/scenario-testing-framework.js --scenario high_load

# Run full test suite daily
0 2 * * * /path/to/scenario-testing-framework.js --all
```

## Customization Guide

### Adding New User Profiles
```javascript
// Add to userProfiles in comprehensive-traffic-simulator.js
parent_helper: {
  sessionDuration: { min: 600, max: 1200 }, // 10-20 minutes
  questionsPerSession: { min: 3, max: 8 },
  errorRate: 0.10, // 10% error rate
  complexityPreference: ["basic", "intermediate"],
  subjects: ["math", "science", "english"],
  platform: "mobile",
  peakHours: [18, 19, 20] // 6-8 PM
}
```

### Adding New Scenarios
```javascript
// Add to scenarios in scenario-testing-framework.js
this.scenarios.set('weekend_load', {
  name: 'Weekend Load Test',
  description: 'Simulates weekend usage patterns',
  duration: 300,
  expectedMetrics: {
    concurrent_users: { min: 20, max: 40 },
    weekend_traffic_ratio: { min: 0.6, max: 0.8 }
  },
  expectedAlerts: ['WeekendPerformanceIssues'],
  setup: async () => {
    this.simulator.simulationMode = "weekend";
    this.forcePhilippineTime(20); // 8 PM weekend
  },
  teardown: async () => {
    this.simulator.simulationMode = "normal";
  }
});
```

### Custom Metrics
```javascript
// Add to metrics.js
const weekendTrafficRatio = new client.Gauge({
  name: 'brainbytes_weekend_traffic_ratio',
  help: 'Ratio of weekend to weekday traffic',
  labelNames: ['day_type'],
  registers: [register]
});
```

This comprehensive simulation system provides realistic testing of your BrainBytes monitoring setup, ensuring that your alerts and metrics work correctly under various Philippine market conditions.