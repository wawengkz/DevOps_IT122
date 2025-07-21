# BrainBytes PromQL Query Reference Guide

## Overview
This guide provides practical PromQL queries for monitoring the BrainBytes educational platform, organized by monitoring objectives and use cases.

## Basic Query Patterns

### 1. Instant Queries
```promql
# Current active sessions
brainbytes_active_sessions

# Total questions in the last hour
increase(brainbytes_questions_total[1h])

# Current database connections
brainbytes_db_connections{status="active"}
```

### 2. Rate Queries
```promql
# Questions per second
rate(brainbytes_questions_total[5m])

# HTTP requests per second
rate(brainbytes_http_requests_total[5m])

# Errors per second

```

### 3. Aggregation Queries
```promql
# Total active sessions across all 
sum(brainbytes_active_sessions)

# Questions by subject
sum by (subject) (brainbytes_questions_total)

# Average response time by subject
sum by (subject) (rate(brainbytes_ai_response_time_seconds_sum[5m])) / sum by (subject) (rate(brainbytes_ai_response_time_seconds_count[5m]))
```

## Performance Monitoring Queries

### API Performance
```promql
# 95th percentile response time
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m]))

# 99th percentile response time for specific endpoint
histogram_quantile(0.99, rate(brainbytes_http_request_duration_seconds_bucket{route="/api/messages"}[5m]))

# Average response time by status code
sum by (status_code) (rate(brainbytes_http_request_duration_seconds_sum[5m])) / sum by (status_code) (rate(brainbytes_http_request_duration_seconds_count[5m]))

# Request rate by method
sum by (method) (rate(brainbytes_http_requests_total[5m]))
```

### AI Performance
```promql
# Average AI response time
rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m])

# AI response time by subject
sum by (subject) (rate(brainbytes_ai_response_time_seconds_sum[5m])) / sum by (subject) (rate(brainbytes_ai_response_time_seconds_count[5m]))

# 95th percentile AI response time for complex questions
histogram_quantile(0.95, rate(brainbytes_ai_response_time_seconds_bucket{complexity="advanced"}[5m]))

# AI response time distribution
histogram_quantile(0.5, rate(brainbytes_ai_response_time_seconds_bucket[5m])) # Median
histogram_quantile(0.9, rate(brainbytes_ai_response_time_seconds_bucket[5m])) # 90th percentile
histogram_quantile(0.99, rate(brainbytes_ai_response_time_seconds_bucket[5m])) # 99th percentile
```

### System Performance
```promql
# Database connection utilization
brainbytes_db_connections{status="active"} / (brainbytes_db_connections{status="active"} + brainbytes_db_connections{status="idle"}) * 100

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# CPU usage percentage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)

# Disk usage percentage
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
```

## Business Intelligence Queries

### User Engagement
```promql
# Most popular subjects (last hour)
topk(5, sum by (subject) (increase(brainbytes_questions_total[1h])))

# Question success rate
(sum(rate(brainbytes_questions_total{status="answered"}[5m])) / sum(rate(brainbytes_questions_total[5m]))) * 100

# Average questions per session
sum(rate(brainbytes_questions_total[5m])) / sum(rate(brainbytes_tutoring_sessions_total[5m]))

# Student engagement score
sum(rate(brainbytes_questions_total[5m])) / sum(brainbytes_active_sessions)
```

### Educational Analytics
```promql
# Subject distribution
sum by (subject) (increase(brainbytes_questions_total[1h])) / sum(increase(brainbytes_questions_total[1h])) * 100

# Grade level activity
sum by (grade_level) (rate(brainbytes_questions_total[5m]))

# Session duration trend
sum(rate(brainbytes_tutoring_sessions_total[5m])) / sum(brainbytes_active_sessions)

# Learning complexity distribution
sum by (complexity) (rate(brainbytes_ai_response_time_seconds_count[5m]))
```

### Mobile Usage Analysis
```promql
# Mobile usage percentage
(sum(rate(brainbytes_mobile_requests_total[1h])) / sum(rate(brainbytes_http_requests_total[1h]))) * 100

# Mobile vs desktop traffic
sum by (platform) (rate(brainbytes_mobile_requests_total[5m]))

# Mobile response time
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m]))

# Data usage per mobile user
sum(rate(brainbytes_response_size_bytes_sum[1h])) / sum(rate(brainbytes_mobile_requests_total[1h])) / 1024 / 1024
```

## Error Monitoring Queries

### Error Rates
```promql
# Overall error rate
(sum(rate(brainbytes_errors_total[5m])) / sum(rate(brainbytes_http_requests_total[5m]))) * 100

# Error rate by type
sum by (type) (rate(brainbytes_errors_total[5m]))

# Error rate by endpoint
sum by (endpoint) (rate(brainbytes_errors_total[5m]))

# 4xx vs 5xx errors
sum(rate(brainbytes_http_requests_total{status_code=~"4.."}[5m])) # Client errors
sum(rate(brainbytes_http_requests_total{status_code=~"5.."}[5m])) # Server errors
```

### Connection Issues
```promql
# Connection drop rate
rate(brainbytes_connection_drops_total[5m])

# Network stability score
(1 - (rate(brainbytes_connection_drops_total[5m]) / rate(brainbytes_http_requests_total[5m]))) * 100

# Connection drops by reason
sum by (reason) (rate(brainbytes_connection_drops_total[5m]))
```

## Philippine Market Specific Queries

### Peak Hours Analysis
```promql
# Activity during school hours (8 AM - 5 PM PHT)
brainbytes_active_sessions and on() (hour() >= 8 and hour() <= 17)

# Evening study sessions (6-10 PM PHT)
brainbytes_active_sessions and on() (hour() >= 18 and hour() <= 22)

# Weekend vs weekday activity
brainbytes_active_sessions and on() (day_of_week() == 0 or day_of_week() == 6) # Weekend
brainbytes_active_sessions and on() (day_of_week() >= 1 and day_of_week() <= 5) # Weekday
```

### Network Quality
```promql
# High latency detection
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m])) > 10

# Large payload detection (for slow connections)
histogram_quantile(0.90, rate(brainbytes_response_size_bytes_bucket[10m])) > 100000

# Mobile network performance
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m]))
```

## Capacity Planning Queries

### Growth Trends
```promql
# Request volume growth (24h trend)
(sum(rate(brainbytes_http_requests_total[5m])) - sum(rate(brainbytes_http_requests_total[5m] offset 24h))) / sum(rate(brainbytes_http_requests_total[5m] offset 24h)) * 100

# User growth trend
(sum(brainbytes_active_sessions) - sum(brainbytes_active_sessions offset 24h)) / sum(brainbytes_active_sessions offset 24h) * 100

# Database growth trend
(sum(rate(brainbytes_questions_total[1h])) - sum(rate(brainbytes_questions_total[1h] offset 24h))) / sum(rate(brainbytes_questions_total[1h] offset 24h)) * 100
```

### Resource Utilization
```promql
# Database connection pool usage
brainbytes_db_connections{status="active"} / (brainbytes_db_connections{status="active"} + brainbytes_db_connections{status="idle"}) * 100

# Request processing capacity
sum(rate(brainbytes_http_requests_total[5m])) / 100  # Assuming 100 RPS capacity

# AI processing load
sum(rate(brainbytes_ai_response_time_seconds_count[5m]))
```

## Alert Condition Queries

### Critical Alerts
```promql
# Service down
up == 0

# Database connection lost
brainbytes_db_connections{status="active"} == 0

# High error rate
rate(brainbytes_errors_total[5m]) > 0.1

# Very slow AI responses
rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m]) > 10
```

### Warning Alerts
```promql
# High memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80

# Slow mobile responses
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m])) > 3

# Large response payloads
histogram_quantile(0.90, rate(brainbytes_response_size_bytes_bucket[10m])) > 100000

# Network instability
rate(brainbytes_connection_drops_total[5m]) > 5
```

### Business Alerts
```promql
# Low student engagement
rate(brainbytes_questions_total[30m]) < 0.1

# Low mobile usage (unusual for Philippine market)
(rate(brainbytes_mobile_requests_total[1h]) / rate(brainbytes_http_requests_total[1h])) * 100 < 70

# Unusual traffic drop
rate(brainbytes_http_requests_total[1h]) < (rate(brainbytes_http_requests_total[24h] offset 24h) * 0.3)
```

## Recording Rules Queries

### Performance Recording Rules
```promql
# Average AI response time (5m)
rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m])

# 95th percentile AI response time (5m)
histogram_quantile(0.95, rate(brainbytes_ai_response_time_seconds_bucket[5m]))

# AI success rate (5m)
(rate(brainbytes_ai_requests_total{status="success"}[5m]) / rate(brainbytes_ai_requests_total[5m])) * 100
```

### Business Recording Rules
```promql
# Questions per minute
rate(brainbytes_questions_total[1m])

# Subject popularity ranking
topk(5, sum by (subject) (increase(brainbytes_questions_total[1h])))

# Mobile usage ratio
(rate(brainbytes_mobile_requests_total[1h]) / rate(brainbytes_http_requests_total[1h])) * 100

# User engagement score
(rate(brainbytes_questions_total[5m]) / (brainbytes_active_sessions + 1))
```

## Advanced Query Techniques

### Time-based Filtering
```promql
# Only during Philippine business hours (8 AM - 5 PM)
brainbytes_active_sessions and on() (hour() >= 8 and hour() <= 17)

# Peak study hours (6-10 PM PHT)
brainbytes_questions_total and on() (hour() >= 18 and hour() <= 22)

# Weekend activity
brainbytes_active_sessions and on() (day_of_week() == 0 or day_of_week() == 6)

# Weekday activity
brainbytes_active_sessions and on() (day_of_week() >= 1 and day_of_week() <= 5)
```

### Regex Pattern Matching
```promql
# Mobile user agent detection
brainbytes_http_requests_total{user_agent=~".*Mobile.*"}

# Error status codes
brainbytes_http_requests_total{status_code=~"[45].."}

# API endpoints only
brainbytes_http_requests_total{route=~"/api/.*"}

# Math and Science subjects
brainbytes_questions_total{subject=~"math|science"}
```

### Mathematical Operations
```promql
# Percentage calculations
(metric_a / metric_b) * 100

# Growth rate calculation
(metric_current - metric_previous) / metric_previous * 100

# Ratio calculations
metric_numerator / metric_denominator

# Rate of change
rate(metric[5m])
```

## Troubleshooting Common Issues

### Query Performance Tips
1. **Use recording rules** for expensive queries
2. **Limit time ranges** to what's necessary
3. **Use appropriate functions** (rate vs increase)
4. **Avoid high cardinality** labels in aggregations

### Common Query Errors
```promql
# ❌ Wrong: Missing rate() function
brainbytes_questions_total[5m]

# ✅ Correct: Using rate() for counters
rate(brainbytes_questions_total[5m])

# ❌ Wrong: Histogram without histogram_quantile
brainbytes_ai_response_time_seconds_bucket[5m]

# ✅ Correct: Using histogram_quantile
histogram_quantile(0.95, rate(brainbytes_ai_response_time_seconds_bucket[5m]))
```

## Query Optimization

### Efficient Aggregations
```promql
# Efficient: Aggregate before calculations
sum by (subject) (rate(brainbytes_questions_total[5m])) / sum by (subject) (rate(brainbytes_tutoring_sessions_total[5m]))

# Less efficient: Calculate then aggregate
sum by (subject) (rate(brainbytes_questions_total[5m]) / rate(brainbytes_tutoring_sessions_total[5m]))
```

### Label Filtering
```promql
# Filter early in the query
sum(rate(brainbytes_questions_total{subject="math"}[5m]))

# Better than filtering after aggregation
sum(rate(brainbytes_questions_total[5m])) by (subject) and on() (subject == "math")
```

## Business Intelligence Dashboards

### Student Engagement Dashboard
```promql
# Active students now
sum(brainbytes_active_sessions)

# Questions per hour
sum(increase(brainbytes_questions_total[1h]))

# Popular subjects
topk(5, sum by (subject) (increase(brainbytes_questions_total[1h])))

# Success rate
(sum(rate(brainbytes_questions_total{status="answered"}[5m])) / sum(rate(brainbytes_questions_total[5m]))) * 100
```

### Performance Dashboard
```promql
# Response time percentiles
histogram_quantile(0.5, rate(brainbytes_http_request_duration_seconds_bucket[5m]))   # Median
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m]))  # 95th percentile
histogram_quantile(0.99, rate(brainbytes_http_request_duration_seconds_bucket[5m]))  # 99th percentile

# Error rate
(sum(rate(brainbytes_errors_total[5m])) / sum(rate(brainbytes_http_requests_total[5m]))) * 100

# AI performance
rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m])
```

### Mobile Experience Dashboard
```promql
# Mobile traffic percentage
(sum(rate(brainbytes_mobile_requests_total[1h])) / sum(rate(brainbytes_http_requests_total[1h]))) * 100

# Mobile response time
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket{user_agent=~".*Mobile.*"}[5m]))

# Data usage
sum(rate(brainbytes_response_size_bytes_sum[1h])) / 1024 / 1024  # MB per hour

# Connection stability
(1 - (rate(brainbytes_connection_drops_total[5m]) / rate(brainbytes_http_requests_total[5m]))) * 100
```

## Alerting Query Examples

### SLA Monitoring
```promql
# Response time SLA (95% under 2 seconds)
histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m])) > 2

# Availability SLA (99.9% uptime)
(sum(up{job="brainbytes-backend"}) / count(up{job="brainbytes-backend"})) * 100 < 99.9

# Error rate SLA (< 1% errors)
(sum(rate(brainbytes_errors_total[5m])) / sum(rate(brainbytes_http_requests_total[5m]))) * 100 > 1
```

### Capacity Alerts
```promql
# Database connection pool exhaustion
brainbytes_db_connections{status="active"} / (brainbytes_db_connections{status="active"} + brainbytes_db_connections{status="idle"}) > 0.8

# High request volume
sum(rate(brainbytes_http_requests_total[5m])) > 50  # More than 50 RPS

# Memory pressure
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
```

## Query Templates

### Template: Performance Analysis
```promql
# Replace {METRIC_NAME} and {TIME_RANGE} with actual values
# Average value
rate({METRIC_NAME}_sum[{TIME_RANGE}]) / rate({METRIC_NAME}_count[{TIME_RANGE}])

# 95th percentile
histogram_quantile(0.95, rate({METRIC_NAME}_bucket[{TIME_RANGE}]))

# Rate of change
rate({METRIC_NAME}[{TIME_RANGE}])
```

### Template: Business Metrics
```promql
# Replace {COUNTER_METRIC} and {LABEL} with actual values
# Growth rate
(sum(rate({COUNTER_METRIC}[5m])) - sum(rate({COUNTER_METRIC}[5m] offset 24h))) / sum(rate({COUNTER_METRIC}[5m] offset 24h)) * 100

# Distribution by label
sum by ({LABEL}) (rate({COUNTER_METRIC}[5m])) / sum(rate({COUNTER_METRIC}[5m])) * 100

# Top N by label
topk(5, sum by ({LABEL}) (increase({COUNTER_METRIC}[1h])))
```

This comprehensive PromQL reference guide provides the queries needed to monitor, analyze, and alert on your BrainBytes educational platform effectively.