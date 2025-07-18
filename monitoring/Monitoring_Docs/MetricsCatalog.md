# BrainBytes Metrics Catalog

## Overview
This document catalogs all custom metrics implemented in the BrainBytes monitoring system, organized by category and purpose.

## Metrics Categories

### 1. HTTP Request Metrics

#### `brainbytes_http_request_duration_seconds` (Histogram)
- **Type**: Histogram
- **Description**: Duration of HTTP requests in seconds
- **Labels**: `method`, `route`, `status_code`
- **Buckets**: [0.1, 0.5, 1, 2, 5, 10]
- **Example Query**: `histogram_quantile(0.95, rate(brainbytes_http_request_duration_seconds_bucket[5m]))`
- **Use Case**: Monitor API response times and identify slow endpoints

#### `brainbytes_http_requests_total` (Counter)
- **Type**: Counter
- **Description**: Total number of HTTP requests
- **Labels**: `method`, `route`, `status_code`
- **Example Query**: `rate(brainbytes_http_requests_total[5m])`
- **Use Case**: Track request volume and identify traffic patterns

### 2. AI Performance Metrics

#### `brainbytes_ai_response_time_seconds` (Histogram)
- **Type**: Histogram
- **Description**: Time taken for AI to generate responses
- **Labels**: `subject`, `complexity`
- **Buckets**: [0.1, 0.5, 1, 2, 5, 10]
- **Example Query**: `histogram_quantile(0.99, rate(brainbytes_ai_response_time_seconds_bucket{subject="math"}[5m]))`
- **Use Case**: Monitor AI performance by subject and complexity level

### 3. Educational Metrics

#### `brainbytes_tutoring_sessions_total` (Counter)
- **Type**: Counter
- **Description**: Total number of tutoring sessions
- **Labels**: `subject`, `grade_level`
- **Example Query**: `increase(brainbytes_tutoring_sessions_total{subject="science"}[1h])`
- **Use Case**: Track educational engagement by subject and grade level

#### `brainbytes_questions_total` (Counter)
- **Type**: Counter
- **Description**: Total number of questions asked
- **Labels**: `subject`, `grade_level`, `status`
- **Example Query**: `sum by (subject) (rate(brainbytes_questions_total[5m]))`
- **Use Case**: Monitor question patterns and success rates

#### `brainbytes_active_sessions` (Gauge)
- **Type**: Gauge
- **Description**: Number of currently active sessions
- **Labels**: `subject`
- **Example Query**: `sum(brainbytes_active_sessions)`
- **Use Case**: Track real-time user engagement

### 4. System Performance Metrics

#### `brainbytes_db_connections` (Gauge)
- **Type**: Gauge
- **Description**: Number of database connections
- **Labels**: `status`
- **Example Query**: `brainbytes_db_connections{status="active"}`
- **Use Case**: Monitor database connection health

### 5. Mobile & Network Metrics

#### `brainbytes_mobile_requests_total` (Counter)
- **Type**: Counter
- **Description**: Total requests from mobile devices
- **Labels**: `platform`, `network_type`
- **Example Query**: `sum(rate(brainbytes_mobile_requests_total[5m]))`
- **Use Case**: Track mobile usage patterns

#### `brainbytes_response_size_bytes` (Histogram)
- **Type**: Histogram
- **Description**: Size of HTTP responses in bytes
- **Labels**: `endpoint`
- **Buckets**: [1000, 10000, 50000, 100000, 500000]
- **Example Query**: `histogram_quantile(0.90, rate(brainbytes_response_size_bytes_bucket[10m]))`
- **Use Case**: Monitor data usage for mobile users

#### `brainbytes_connection_drops_total` (Counter)
- **Type**: Counter
- **Description**: Number of dropped connections
- **Labels**: `reason`
- **Example Query**: `rate(brainbytes_connection_drops_total[5m])`
- **Use Case**: Track network stability issues

### 6. Error Tracking Metrics

#### `brainbytes_errors_total` (Counter)
- **Type**: Counter
- **Description**: Total number of errors
- **Labels**: `type`, `endpoint`
- **Example Query**: `sum by (type) (rate(brainbytes_errors_total[5m]))`
- **Use Case**: Monitor error rates and types

## Metrics by System Component

### Application Metrics
| Metric Name | Type | Purpose | Business Impact |
|-------------|------|---------|-----------------|
| `brainbytes_questions_total` | Counter | Track student questions | Student engagement |
| `brainbytes_tutoring_sessions_total` | Counter | Track learning sessions | Educational effectiveness |
| `brainbytes_active_sessions` | Gauge | Monitor concurrent users | System capacity |
| `brainbytes_ai_response_time_seconds` | Histogram | AI performance | User experience |

### Infrastructure Metrics
| Metric Name | Type | Purpose | Business Impact |
|-------------|------|---------|-----------------|
| `brainbytes_db_connections` | Gauge | Database health | System reliability |
| `brainbytes_http_request_duration_seconds` | Histogram | API performance | User experience |
| `brainbytes_errors_total` | Counter | Error tracking | System reliability |
| `brainbytes_response_size_bytes` | Histogram | Data usage | Cost optimization |

### Business Domain Metrics
| Metric Name | Type | Purpose | Business Impact |
|-------------|------|---------|-----------------|
| `brainbytes_mobile_requests_total` | Counter | Mobile usage | Market adaptation |
| `brainbytes_connection_drops_total` | Counter | Network issues | Philippine market |
| `brainbytes_tutoring_sessions_total` | Counter | Educational impact | Learning outcomes |

## Metric Label Conventions

### Subject Labels
- `math` - Mathematics
- `science` - Science subjects
- `english` - English language
- `history` - History and social studies
- `filipino` - Filipino language

### Grade Level Labels
- `elementary` - Elementary school (Grades 1-6)
- `junior_high` - Junior high school (Grades 7-10)
- `senior_high` - Senior high school (Grades 11-12)

### Status Labels
- `answered` - Question successfully answered
- `pending` - Question awaiting response
- `failed` - Question processing failed

### Complexity Labels
- `basic` - Simple questions
- `intermediate` - Moderate difficulty
- `advanced` - Complex questions

### Platform Labels
- `ios` - iPhone/iPad users
- `android` - Android device users
- `other` - Other mobile platforms

## Example Queries by Use Case

### Performance Monitoring
```promql
# 95th percentile response time for math questions
histogram_quantile(0.95, rate(brainbytes_ai_response_time_seconds_bucket{subject="math"}[5m]))

# Request rate by endpoint
sum by (route) (rate(brainbytes_http_requests_total[5m]))

# Error rate percentage
(sum(rate(brainbytes_errors_total[5m])) / sum(rate(brainbytes_http_requests_total[5m]))) * 100
```

### Business Intelligence
```promql
# Most popular subjects
topk(5, sum by (subject) (increase(brainbytes_questions_total[1h])))

# Mobile usage percentage
(sum(rate(brainbytes_mobile_requests_total[1h])) / sum(rate(brainbytes_http_requests_total[1h]))) * 100

# Active sessions by subject
sum by (subject) (brainbytes_active_sessions)
```

### Capacity Planning
```promql
# Database connection utilization
brainbytes_db_connections{status="active"} / (brainbytes_db_connections{status="active"} + brainbytes_db_connections{status="idle"})

# Average session duration
sum(brainbytes_active_sessions) / sum(rate(brainbytes_tutoring_sessions_total[5m]))

# Data usage trend
sum(rate(brainbytes_response_size_bytes_sum[1h])) / 1024 / 1024
```

### Philippine Market Specific
```promql
# Peak hours activity (6-10 PM PHT)
brainbytes_active_sessions and on() (hour() >= 18 and hour() <= 22)

# School hours monitoring (8 AM - 5 PM PHT)
brainbytes_questions_total and on() (hour() >= 8 and hour() <= 17)

# Network stability score
(1 - (rate(brainbytes_connection_drops_total[5m]) / rate(brainbytes_http_requests_total[5m]))) * 100
```

## Metric Collection Intervals

### High Frequency (5-10 seconds)
- AI response times
- Active sessions
- Real-time user activity

### Medium Frequency (15-30 seconds)
- HTTP request metrics
- System performance
- Error rates

### Low Frequency (60+ seconds)
- Business metrics
- Database statistics
- Capacity planning metrics

## Data Retention Policy

### Prometheus Storage
- **Raw data**: 30 days
- **Aggregated data**: Via recording rules
- **Maximum size**: 10GB
- **Backup**: Not implemented (recommend for production)

### Metric Lifecycle
1. **Collection**: Real-time from application
2. **Storage**: Time-series database
3. **Aggregation**: Recording rules pre-compute
4. **Alerting**: Based on thresholds
5. **Cleanup**: Automatic after retention period