# BrainBytes Monitoring System Architecture

## System Overview

The BrainBytes monitoring system is a comprehensive observability solution designed specifically for educational applications in the Philippine market. It provides real-time insights into system performance, user engagement, and business metrics.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BrainBytes Monitoring System                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   MongoDB       │
│   (Next.js)     │    │   (Node.js)     │    │   Database      │
│   Port: 8080    │    │   Port: 3000    │    │   Port: 27017   │
│                 │    │                 │    │                 │
│  /metrics       │    │  /metrics       │    │                 │
│  /health        │    │  /health        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Prometheus    │
                    │   (Metrics      │
                    │   Collection)   │
                    │   Port: 9091    │
                    └─────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │  Alertmanager   │
                    │  (Alert         │
                    │  Management)    │
                    │  Port: 9093     │
                    └─────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │ Alert Receiver  │
                    │ (Webhook        │
                    │ Endpoint)       │
                    │ Port: 5001      │
                    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Node Exporter  │    │MongoDB Exporter │    │Blackbox Exporter│
│  (System        │    │ (Database       │    │ (Endpoint       │
│  Metrics)       │    │ Metrics)        │    │ Monitoring)     │
│  Port: 9100     │    │ Port: 9216      │    │ Port: 9115      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Prometheus    │
                    │   (Scrapes all  │
                    │   exporters)    │
                    └─────────────────┘
```

## Component Documentation

### 1. Application Layer

#### Frontend (Next.js)
- **Port**: 8080
- **Container**: `frontend`
- **Metrics**: Basic Node.js metrics via `/metrics` endpoint
- **Health Check**: Available at `/health`
- **Purpose**: Serves the BrainBytes web application

#### Backend (Node.js/Express)
- **Port**: 3000
- **Container**: `backend`
- **Metrics**: Custom application metrics + Node.js defaults
- **Health Check**: Available at `/health`
- **Purpose**: Main API server with AI tutoring capabilities

#### Database (MongoDB)
- **Port**: 27017
- **Container**: `mongo`
- **Version**: 4.4
- **Purpose**: Stores user data, messages, and learning materials

### 2. Metrics Collection Layer

#### Prometheus Server
- **Port**: 9091
- **Container**: `prometheus`
- **Version**: v2.48.0
- **Configuration**: `/etc/prometheus/prometheus.yml`
- **Data Retention**: 30 days / 10GB
- **Purpose**: Central metrics collection and storage

#### Node Exporter
- **Port**: 9100
- **Container**: `node-exporter`
- **Version**: v1.7.0
- **Purpose**: Collects system-level metrics (CPU, memory, disk, network)

#### MongoDB Exporter
- **Port**: 9216
- **Container**: `mongodb-exporter`
- **Version**: 0.40.0
- **Purpose**: Exports MongoDB performance metrics

#### Blackbox Exporter
- **Port**: 9115
- **Container**: `blackbox-exporter`
- **Version**: v0.24.0
- **Purpose**: Monitors external endpoints and connectivity

### 3. Alert Management Layer

#### Alertmanager
- **Port**: 9093
- **Container**: `alertmanager`
- **Version**: v0.26.0
- **Configuration**: `/etc/alertmanager/alertmanager.yml`
- **Purpose**: Handles alert routing and notification

#### Alert Receiver
- **Port**: 5001
- **Container**: `alert-receiver`
- **Technology**: Node.js/Express
- **Purpose**: Webhook endpoint for receiving and logging alerts

### 4. Simulation Layer

#### Activity Simulator
- **Container**: `activity-simulator`
- **Profile**: `simulation` (optional)
- **Purpose**: Generates realistic user activity for testing metrics

## Data Flow

### 1. Metrics Collection Flow
```
Application → Prometheus → Alertmanager → Alert Receiver
     ↓              ↓            ↓             ↓
  /metrics     Storage &     Alert Rules   Webhook
  endpoint    Recording     Evaluation    Logging
              Rules
```

### 2. Alert Processing Flow
```
Metric Value → Alert Rule → Alertmanager → Webhook → Console Log
     ↓              ↓            ↓           ↓          ↓
  Exceeds        Fires        Groups       HTTP       Human
  Threshold      Alert        Alerts       POST       Readable
```

### 3. Health Check Flow
```
Blackbox Exporter → Target Endpoints → Prometheus → Alert Rules
        ↓                   ↓               ↓           ↓
   HTTP/TCP Tests      Response Status   Metrics     Alerts
```

## Network Architecture

### Docker Network
- **Network**: `brainbytes-network`
- **Driver**: `bridge`
- **Subnet**: `172.20.0.0/16`
- **Purpose**: Isolated network for all monitoring components

### Port Mapping
| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| Frontend | 3000 | 8080 | Web Application |
| Backend | 3000 | 3000 | API Server |
| MongoDB | 27017 | 27017 | Database |
| Prometheus | 9090 | 9091 | Metrics Server |
| Alertmanager | 9093 | 9093 | Alert Manager |
| Node Exporter | 9100 | 9100 | System Metrics |
| MongoDB Exporter | 9216 | 9216 | DB Metrics |
| Blackbox Exporter | 9115 | 9115 | Endpoint Tests |
| Alert Receiver | 5001 | 5001 | Webhook Server |

## Storage Architecture

### Persistent Volumes
- **mongo-data**: MongoDB data storage
- **prometheus-data**: Prometheus metrics storage
- **alertmanager-data**: Alertmanager configuration storage
- **backend_node_modules**: Backend dependencies cache
- **frontend_node_modules**: Frontend dependencies cache

### Data Retention
- **Prometheus**: 30 days or 10GB maximum
- **MongoDB**: Persistent until manually deleted
- **Alertmanager**: 120 hours for alert history

## Security Considerations

### Network Security
- All services run in isolated Docker network
- No direct external access to internal services
- Health checks use internal network communication

### Data Security
- No sensitive data in metrics labels
- Alert webhooks use internal network only
- Database connections use internal Docker DNS

## Scalability Design

### Horizontal Scaling Ready
- Prometheus supports federation
- Multiple alert receivers can be configured
- Database can be scaled with replica sets

### Resource Limits
- Prometheus: 50 concurrent queries, 50M samples max
- MongoDB: Connection pooling configured
- Node.js: Process-level resource monitoring

## Philippine-Specific Features

### Network Optimization
- Mobile-first metrics collection
- Slow network condition simulation
- Regional performance tracking

### Educational Context
- School hours monitoring (8 AM - 5 PM PHT)
- Peak study time alerts (6-10 PM PHT)
- Subject-specific performance tracking

### Business Intelligence
- Student engagement metrics
- Learning outcome tracking
- Content interaction analysis