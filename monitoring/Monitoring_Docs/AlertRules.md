# BrainBytes Alert Rules Documentation

## Overview
This document provides comprehensive documentation for all alert rules implemented in the BrainBytes monitoring system, including thresholds, justifications, and response procedures.

## Alert Severity Levels

### Critical (🔴)
- **Impact**: System unavailable or severely degraded
- **Response Time**: Immediate (< 5 minutes)
- **Escalation**: Automatic to on-call engineer
- **Examples**: Service down, database connection lost

### Warning (🟡)
- **Impact**: Performance degraded but functional
- **Response Time**: 15-30 minutes
- **Escalation**: Team notification
- **Examples**: High latency, resource pressure

### Info (🔵)
- **Impact**: Informational, trending issues
- **Response Time**: Next business day
- **Escalation**: Logging and monitoring
- **Examples**: Usage patterns, capacity planning

## Core System Alerts

### 1. Service Availability

#### ServiceDown (Critical)
```yaml
alert: ServiceDown
expr: up == 0
for: 30s
severity: critical
```
- **Description**: Service instance is not responding to health checks
- **Threshold**: Any service down for 30 seconds
- **Business Impact**: Students cannot access the platform
- **Response**: 
  1. Check service logs
  2. Verify container health
  3. Restart service if needed
  4. Escalate to infrastructure team

#### DatabaseConnectionLost (Critical)
```yaml
alert: DatabaseConnectionLost
expr: brainbytes_db_connections{status="active"} == 0
for: 10s
severity: critical
```
- **Description**: Application has lost connection to MongoDB
- **Threshold**: No active database connections for 10 seconds
- **Business Impact**: No data persistence, user sessions lost
- **Response**:
  1. Check MongoDB container status
  2. Verify network connectivity
  3. Check connection pool configuration
  4. Restart database service if needed

### 2. Performance Alerts

#### HighErrorRate (Warning)
```yaml
alert: HighErrorRate
expr: rate(brainbytes_errors_total[5m]) > 0.1
for: 2m
severity: warning
```
- **Description**: High rate of application errors
- **Threshold**: More than 0.1 errors per second for 2 minutes
- **Business Impact**: Degraded user experience
- **Response**:
  1. Check error logs for patterns
  2. Identify root cause (AI service, database, network)
  3. Apply fixes or workarounds
  4. Monitor error recovery

#### SlowAIResponses (Warning)
```yaml
alert: SlowAIResponses
expr: rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m]) > 10
for: 2m
severity: warning
```
- **Description**: AI response times are exceeding acceptable limits
- **Threshold**: Average response time > 10 seconds for 2 minutes
- **Business Impact**: Poor learning experience, student frustration
- **Response**:
  1. Check AI service health
  2. Verify Hugging Face API limits
  3. Review question complexity
  4. Consider response caching

### 3. Resource Alerts

#### HighMemoryUsage (Warning)
```yaml
alert: HighMemoryUsage
expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
for: 2m
severity: warning
```
- **Description**: System memory usage is high
- **Threshold**: > 80% memory utilization for 2 minutes
- **Business Impact**: Potential system instability
- **Response**:
  1. Identify memory-intensive processes
  2. Check for memory leaks
  3. Consider scaling resources
  4. Optimize application memory usage

#### HighCPUUsage (Warning)
```yaml
alert: HighCPUUsage
expr: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100) > 80
for: 5m
severity: warning
```
- **Description**: CPU usage is consistently high
- **Threshold**: > 80% CPU utilization for 5 minutes
- **Business Impact**: Slow response times, degraded performance
- **Response**:
  1. Identify CPU-intensive processes
  2. Check for infinite loops or inefficient algorithms
  3. Consider horizontal scaling
  4. Optimize resource-intensive operations

### 4. Business Metrics Alerts

#### NoRecentQuestions (Info)
```yaml
alert: NoRecentQuestions
expr: increase(brainbytes_questions_total[10m]) == 0
for: 10m
severity: info
```
- **Description**: No student questions in the last 10 minutes
- **Threshold**: Zero questions for 10 minutes
- **Business Impact**: Potential loss of student engagement
- **Response**:
  1. Check if during typical study hours
  2. Verify frontend accessibility
  3. Review recent changes
  4. Monitor for recovery

#### ContainerHighMemory (Warning)
```yaml
alert: ContainerHighMemory
expr: container_memory_usage_bytes{name="brainbytes-backend"} / 1024 / 1024 > 500
for: 2m
severity: warning
```
- **Description**: Backend container using excessive memory
- **Threshold**: > 500MB memory usage for 2 minutes
- **Business Impact**: Container instability, potential crashes
- **Response**:
  1. Check application memory patterns
  2. Review recent code changes
  3. Consider container memory limits
  4. Optimize memory usage

## Philippine-Specific Alerts

### 1. Network Quality Alerts

#### NetworkInstability (Warning)
```yaml
alert: NetworkInstability
expr: rate(brainbytes_connection_drops_total[5m]) > 5
for: 2m
severity: warning
```
- **Description**: High rate of connection drops
- **Threshold**: > 5 connection drops per second for 2 minutes
- **Business Impact**: Poor user experience, especially mobile users
- **Response**:
  1. Check network infrastructure
  2. Monitor ISP status
  3. Verify CDN performance
  4. Consider connection retry logic

#### SlowMobileResponses (Warning)
```yaml
alert: SlowMobileResponses
expr: histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m])) > 3
for: 5m
severity: warning
```
- **Description**: Mobile users experiencing slow response times
- **Threshold**: 95th percentile > 3 seconds for 5 minutes
- **Business Impact**: Mobile user frustration, potential abandonment
- **Response**:
  1. Check mobile-specific optimizations
  2. Review payload sizes
  3. Verify CDN configuration
  4. Consider mobile-first improvements

### 2. Data Usage Alerts

#### HighDataUsage (Info)
```yaml
alert: HighDataUsage
expr: sum(rate(brainbytes_response_size_bytes_sum[1h])) / 1024 / 1024 > 50
for: 15m
severity: info
```
- **Description**: Application sending large amounts of data
- **Threshold**: > 50MB per hour for 15 minutes
- **Business Impact**: High data costs for users with limited plans
- **Response**:
  1. Review response payload sizes
  2. Implement compression
  3. Optimize asset delivery
  4. Consider data usage warnings

#### LargResponsePayloads (Warning)
```yaml
alert: LargResponsePayloads
expr: histogram_quantile(0.90, rate(brainbytes_response_size_bytes_bucket[10m])) > 100000
for: 5m
severity: warning
```
- **Description**: Large response payloads detected
- **Threshold**: 90th percentile > 100KB for 5 minutes
- **Business Impact**: Slow loading on 2G/3G connections
- **Response**:
  1. Identify large responses
  2. Implement response compression
  3. Optimize data structures
  4. Consider pagination

### 3. Time-Sensitive Alerts

#### PeakHoursPerformance (Warning)
```yaml
alert: PeakHoursPerformance
expr: (hour() >= 18 and hour() <= 22) and rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m]) > 5
for: 3m
severity: warning
```
- **Description**: Poor performance during peak study hours
- **Threshold**: AI response time > 5 seconds during 6-10 PM PHT
- **Business Impact**: Degraded experience during critical study time
- **Response**:
  1. Scale AI processing capacity
  2. Optimize for peak load
  3. Consider request queuing
  4. Monitor resource utilization

#### SystemIssuesDuringSchoolHours (Critical)
```yaml
alert: SystemIssuesDuringSchoolHours
expr: (hour() >= 8 and hour() <= 17) and (up{job="brainbytes-backend"} == 0 or rate(brainbytes_errors_total[5m]) > 0.1)
for: 1m
severity: critical
```
- **Description**: Critical issues during school hours
- **Threshold**: Service down or high errors during 8 AM - 5 PM PHT
- **Business Impact**: Students cannot access during school time
- **Response**:
  1. Immediate escalation to all team members
  2. Prioritize quick resolution
  3. Communicate with users if needed
  4. Post-incident review

### 4. Market-Specific Alerts

#### LowMobileUsage (Info)
```yaml
alert: LowMobileUsage
expr: (rate(brainbytes_mobile_requests_total[1h]) / rate(brainbytes_http_requests_total[1h])) * 100 < 70
for: 2h
severity: info
```
- **Description**: Mobile usage below expected levels
- **Threshold**: < 70% mobile traffic for 2 hours
- **Business Impact**: Potential mobile accessibility issues
- **Response**:
  1. Check mobile app functionality
  2. Review mobile user experience
  3. Verify mobile-specific features
  4. Analyze user behavior patterns

#### UnusualTrafficDrop (Warning)
```yaml
alert: UnusualTrafficDrop
expr: rate(brainbytes_http_requests_total[1h]) < (rate(brainbytes_http_requests_total[24h] offset 24h) * 0.3)
for: 1h
severity: warning
```
- **Description**: Significant drop in traffic compared to yesterday
- **Threshold**: < 30% of same time yesterday for 1 hour
- **Business Impact**: Potential system issues or external factors
- **Response**:
  1. Check for system problems
  2. Review weather conditions (typhoons)
  3. Verify internet connectivity
  4. Check for external service issues

## Alert Routing and Escalation

### Routing Configuration
```yaml
route:
  group_by: ['alertname']
  group_wait: 5s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'brainbytes-webhook'
```

### Escalation Matrix
| Severity | Initial Response | Escalation Level 1 | Escalation Level 2 |
|----------|------------------|-------------------|-------------------|
| Critical | Immediate alert | 5 minutes | 15 minutes |
| Warning | Team notification | 30 minutes | 2 hours |
| Info | Log + daily report | Next business day | N/A |

### Notification Channels
1. **Primary**: Webhook to alert receiver (Port 5001)
2. **Secondary**: Email notifications (optional)
3. **Tertiary**: Slack notifications (optional)

## Response Procedures

### Critical Alert Response
1. **Acknowledge** alert within 5 minutes
2. **Assess** impact and severity
3. **Mitigate** immediate issues
4. **Communicate** with stakeholders
5. **Resolve** root cause
6. **Document** incident and lessons learned

### Warning Alert Response
1. **Review** alert details
2. **Investigate** underlying cause
3. **Plan** remediation steps
4. **Execute** fixes during maintenance window
5. **Monitor** for improvement
6. **Close** alert when resolved

### Info Alert Response
1. **Log** alert for analysis
2. **Review** during daily standup
3. **Analyze** trends and patterns
4. **Plan** preventive measures
5. **Update** monitoring if needed

## Alert Testing and Validation

### Test Scenarios
```bash
# Test service down alert
docker-compose stop backend

# Test high error rate
curl -X POST http://localhost:3000/api/nonexistent

# Test database connection
docker-compose stop mongo

# Test memory usage
stress --vm 1 --vm-bytes 1G --timeout 300s
```

### Validation Checklist
- [ ] Alert fires when condition is met
- [ ] Alert resolves when condition clears
- [ ] Notification is received
- [ ] Alert details are accurate
- [ ] Escalation works correctly

## Alert Tuning Guidelines

### Threshold Adjustment
1. **Collect baseline metrics** for 1-2 weeks
2. **Calculate percentiles** (95th, 99th)
3. **Set thresholds** based on business impact
4. **Monitor false positives** and adjust
5. **Review quarterly** and tune as needed

### Alert Fatigue Prevention
- Use appropriate severity levels
- Implement proper time windows
- Group related alerts
- Set reasonable repeat intervals
- Regular alert review and cleanup

## Maintenance and Updates

### Monthly Review
- Review alert effectiveness
- Analyze false positive rates
- Update thresholds based on usage patterns
- Test alert channels
- Update documentation

### Quarterly Assessment
- Evaluate alert coverage
- Add new alerts for new features
- Remove obsolete alerts
- Update escalation procedures
- Training for new team members

This comprehensive alert documentation ensures proper incident response and maintains system reliability for the BrainBytes educational platform.