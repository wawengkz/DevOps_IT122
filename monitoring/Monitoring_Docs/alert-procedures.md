# BrainBytes Alert Procedures Documentation

## 📋 Alert Procedure Template

For each alert in your system, this document provides:
- **What the alert means** - Clear explanation of the issue
- **Possible causes** - Common root causes to investigate
- **Recommended troubleshooting steps** - Step-by-step diagnostic process
- **Resolution procedures** - How to fix the issue

---

## 🚨 CRITICAL ALERTS

### Alert: ServiceDown
**Alert Expression:** `up == 0`
**Severity:** Critical
**Trigger Time:** 30 seconds

#### What the Alert Means:
The BrainBytes backend service is completely unreachable. Prometheus cannot scrape metrics from the service, indicating it's either:
- Completely down/crashed
- Network unreachable
- Container stopped/failed

#### Possible Causes:
1. **Application Crash**
   - Out of memory error
   - Unhandled exception
   - Database connection failure causing app crash

2. **Container Issues**
   - Docker container stopped
   - Container resource limits exceeded
   - Docker daemon issues

3. **Network Problems**
   - Port binding conflicts
   - Network connectivity issues
   - Firewall blocking access

4. **Resource Exhaustion**
   - System out of memory
   - Disk space full
   - CPU overload

#### Recommended Troubleshooting Steps:

**Step 1: Quick Service Check (< 1 minute)**
```bash
# Check if container is running
docker ps | grep brainbytes-backend

# If not running, check recent containers
docker ps -a | grep brainbytes-backend

# Check container logs for crash reason
docker logs brainbytes-backend --tail 50
```

**Step 2: System Resource Check (< 2 minutes)**
```bash
# Check system resources
docker stats --no-stream
free -h
df -h

# Check for port conflicts
netstat -tulpn | grep 3000
```

**Step 3: Application Health Check (< 1 minute)**
```bash
# Try direct container access
docker exec -it brainbytes-backend curl http://localhost:3000/health

# Check application logs for errors
docker logs brainbytes-backend --tail 100 | grep -i error
```

#### Resolution Procedures:

**Resolution 1: Container Restart**
```bash
# Restart the backend service
docker-compose restart backend

# Wait 30 seconds and verify
sleep 30
curl http://localhost:3000/health
```

**Resolution 2: Full Service Recovery**
```bash
# If restart fails, rebuild and restart
docker-compose down backend
docker-compose up -d backend

# Monitor startup
docker logs brainbytes-backend -f
```

**Resolution 3: System Resource Recovery**
```bash
# If resource exhaustion
docker system prune -f
docker volume prune -f

# Check and clear disk space if needed
du -sh /var/lib/docker/
```

**Verification:**
- Service responds to health check: `curl http://localhost:3000/health`
- Prometheus can scrape metrics: Check http://localhost:9091/targets
- Application logs show no errors
- Alert resolves in Alertmanager

---

### Alert: DatabaseConnectionLost
**Alert Expression:** `brainbytes_db_connections{status="active"} == 0`
**Severity:** Critical
**Trigger Time:** 10 seconds

#### What the Alert Means:
The BrainBytes application has lost all active connections to MongoDB. This means:
- Users cannot ask questions (database writes fail)
- Previous conversations cannot be loaded
- All database operations are failing

#### Possible Causes:
1. **MongoDB Service Issues**
   - MongoDB container stopped/crashed
   - MongoDB process died
   - MongoDB configuration errors

2. **Network Connectivity**
   - Network partition between app and database
   - Docker network issues
   - DNS resolution problems

3. **Authentication/Authorization**
   - Database credentials changed
   - MongoDB authentication enabled without updating app
   - Connection string misconfiguration

4. **Resource Limitations**
   - MongoDB out of disk space
   - Memory exhaustion in MongoDB
   - Connection pool exhausted

#### Recommended Troubleshooting Steps:

**Step 1: MongoDB Container Check (< 1 minute)**
```bash
# Check MongoDB container status
docker ps | grep mongo

# Check MongoDB logs
docker logs mongo --tail 30

# Test MongoDB directly
docker exec -it mongo mongo --eval 'db.runCommand({ping: 1})'
```

**Step 2: Connectivity Test (< 2 minutes)**
```bash
# Test network connectivity from backend
docker exec -it brainbytes-backend ping mongo

# Test database connection from backend
docker exec -it brainbytes-backend curl http://localhost:3000/health

# Check connection string
docker exec -it brainbytes-backend env | grep MONGODB_URI
```

**Step 3: Resource Check (< 1 minute)**
```bash
# Check MongoDB resource usage
docker stats mongo --no-stream

# Check disk space for MongoDB volume
docker exec -it mongo df -h

# Check MongoDB status
docker exec -it mongo mongo --eval 'db.serverStatus().connections'
```

#### Resolution Procedures:

**Resolution 1: MongoDB Service Recovery**
```bash
# Restart MongoDB
docker-compose restart mongo

# Wait for startup (MongoDB can take 30-60 seconds)
sleep 60

# Verify MongoDB is responding
docker exec -it mongo mongo --eval 'db.runCommand({ping: 1})'
```

**Resolution 2: Application Connection Recovery**
```bash
# Restart backend to reset connection pool
docker-compose restart backend

# Monitor backend reconnection
docker logs brainbytes-backend -f | grep -i mongo
```

**Resolution 3: Full Database Recovery**
```bash
# If MongoDB data corruption suspected
docker-compose down mongo
docker volume rm $(docker volume ls -q | grep mongo)
docker-compose up -d mongo

# Note: This removes all data - use only if necessary
```

**Verification:**
- MongoDB responds to ping: `docker exec -it mongo mongo --eval 'db.runCommand({ping: 1})'`
- Backend health check passes: `curl http://localhost:3000/health`
- Database connections metric shows active connections
- Can create test data via API

---

## ⚠️ WARNING ALERTS

### Alert: HighErrorRate
**Alert Expression:** `rate(brainbytes_errors_total[5m]) > 0.1`
**Severity:** Warning
**Trigger Time:** 2 minutes

#### What the Alert Means:
The application is experiencing more than 10% error rate over the last 5 minutes. This indicates:
- Users are experiencing failed requests
- Some application functionality is degraded
- Potential cascading failure developing

#### Possible Causes:
1. **AI Service Issues**
   - HuggingFace API rate limiting
   - AI model timeout/errors
   - Network issues to AI service

2. **Database Performance**
   - Slow queries causing timeouts
   - Connection pool exhaustion
   - Database locks/blocking

3. **Application Logic**
   - Recent code deployment bugs
   - Memory leaks causing instability
   - Unhandled edge cases

4. **External Dependencies**
   - Third-party API failures
   - Network connectivity issues
   - Resource constraints

#### Recommended Troubleshooting Steps:

**Step 1: Error Analysis (< 3 minutes)**
```bash
# Check recent error logs
docker logs brainbytes-backend --tail 100 | grep -i error

# Check error distribution in Grafana
# Go to: http://localhost:3001 → Explore
# Query: rate(brainbytes_errors_total[5m]) by (type, endpoint)

# Check error patterns
docker logs brainbytes-backend --tail 200 | grep -E "(error|Error|ERROR)" | tail -20
```

**Step 2: Performance Check (< 2 minutes)**
```bash
# Check application performance
curl -w "Response time: %{time_total}s\n" http://localhost:3000/health

# Check system resources
docker stats brainbytes-backend --no-stream

# Check database performance
docker exec -it mongo mongo --eval 'db.serverStatus().opcounters'
```

**Step 3: Dependency Check (< 2 minutes)**
```bash
# Check external service connectivity
docker logs brainbytes-backend | grep -i "huggingface\|api\|timeout"

# Check recent deployment changes
docker images | grep brainbytes-backend

# Check environment variables
docker exec -it brainbytes-backend env | grep -E "(HUGGINGFACE|MONGODB|API)"
```

#### Resolution Procedures:

**Resolution 1: Quick Mitigation**
```bash
# Restart application to clear transient issues
docker-compose restart backend

# Monitor error rate reduction
# Check Grafana for error rate trending down
```

**Resolution 2: AI Service Recovery**
```bash
# Check HuggingFace token validity
docker exec -it brainbytes-backend env | grep HUGGINGFACE_TOKEN

# If AI timeouts, consider reducing complexity
# Check API rate limits and usage
```

**Resolution 3: Database Optimization**
```bash
# Check for slow queries
docker exec -it mongo mongo --eval 'db.setProfilingLevel(2, {slowms: 100})'

# Monitor database performance
docker exec -it mongo mongo --eval 'db.system.profile.find().sort({ts: -1}).limit(5)'
```

**Verification:**
- Error rate drops below 10%: Check `rate(brainbytes_errors_total[5m])`
- Application responds normally: Test key endpoints
- No error patterns in logs
- User experience improved

---

### Alert: SlowAIResponses
**Alert Expression:** `rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m]) > 10`
**Severity:** Warning
**Trigger Time:** 2 minutes

#### What the Alert Means:
AI responses are taking longer than 10 seconds on average. This affects:
- Student learning experience
- User satisfaction and retention
- Platform competitiveness

#### Possible Causes:
1. **AI Service Performance**
   - HuggingFace API slowdowns
   - Model overload/high demand
   - Network latency to AI service

2. **Question Complexity**
   - More complex questions requiring longer processing
   - Increased context/conversation history
   - Larger response generation requirements

3. **Application Issues**
   - Memory pressure affecting processing
   - CPU constraints slowing AI calls
   - Network connectivity issues

4. **Rate Limiting**
   - API rate limits causing delays
   - Queue backups in AI service
   - Concurrent request limitations

#### Recommended Troubleshooting Steps:

**Step 1: AI Performance Analysis (< 3 minutes)**
```bash
# Check recent AI response times
docker logs brainbytes-backend | grep -i "ai.*response\|duration" | tail -10

# Check AI service connectivity
docker exec -it brainbytes-backend curl -I https://api-inference.huggingface.co/

# Analyze response time distribution in Grafana
# Query: histogram_quantile(0.95, rate(brainbytes_ai_response_time_seconds_bucket[5m]))
```

**Step 2: System Resource Check (< 2 minutes)**
```bash
# Check application resource usage
docker stats brainbytes-backend --no-stream

# Check network connectivity
docker exec -it brainbytes-backend ping 8.8.8.8

# Check concurrent AI requests
docker logs brainbytes-backend | grep -c "AI.*processing" | tail -5
```

**Step 3: Question Pattern Analysis (< 2 minutes)**
```bash
# Check recent question types/complexity
docker logs brainbytes-backend | grep -i "question\|subject" | tail -10

# Check for unusual patterns
docker logs brainbytes-backend | grep -E "(timeout|rate.*limit|error)" | tail -5
```

#### Resolution Procedures:

**Resolution 1: Immediate Optimization**
```bash
# Restart application to clear any stuck processes
docker-compose restart backend

# Monitor for improvement
# Check: rate(brainbytes_ai_response_time_seconds_sum[5m]) / rate(brainbytes_ai_response_time_seconds_count[5m])
```

**Resolution 2: AI Service Optimization**
```bash
# Check API key status and limits
# Review HuggingFace dashboard for rate limiting

# Consider implementing request queuing/batching
# Implement response caching for similar questions
```

**Resolution 3: Application Scaling**
```bash
# If resource constrained, scale up
docker-compose down
# Edit docker-compose.yml to increase memory limits
docker-compose up -d

# Monitor performance improvement
```

**Verification:**
- Average AI response time drops below 10 seconds
- 95th percentile response time acceptable (< 15 seconds)
- No timeout errors in logs
- User experience feedback improves

---

## 📊 INFORMATION ALERTS

### Alert: NoRecentQuestions
**Alert Expression:** `increase(brainbytes_questions_total[10m]) == 0`
**Severity:** Info
**Trigger Time:** 10 minutes

#### What the Alert Means:
No questions have been asked in the last 10 minutes. This could indicate:
- Low user engagement
- Technical issues preventing question submission
- Off-peak usage times
- Potential outage affecting user access

#### Possible Causes:
1. **Normal Patterns**
   - Off-peak hours (late night, early morning)
   - Weekend or holiday periods
   - Seasonal low usage

2. **Technical Issues**
   - Frontend not loading properly
   - API endpoint issues
   - Database connection problems preventing question logging

3. **User Experience Issues**
   - Slow response times discouraging usage
   - Interface problems
   - Mobile accessibility issues

4. **External Factors**
   - Network issues in Philippines
   - Power outages in target regions
   - Educational calendar (exam periods, breaks)

#### Recommended Troubleshooting Steps:

**Step 1: Context Check (< 2 minutes)**
```bash
# Check current time and day (Philippines context)
date
# Consider: Is this expected low-usage time?

# Check overall system health
curl http://localhost:3000/health

# Check recent activity patterns
# Grafana query: rate(brainbytes_questions_total[1h])
```

**Step 2: Technical Health Check (< 3 minutes)**
```bash
# Check frontend accessibility
curl -I http://localhost:8080

# Check API endpoints
curl http://localhost:3000/api/messages

# Check database connectivity
docker exec -it mongo mongo --eval 'db.stats()'
```

**Step 3: User Experience Check (< 2 minutes)**
```bash
# Check for errors that might prevent questions
docker logs brainbytes-backend | grep -E "(error|Error)" | tail -10

# Check response times
# Grafana query: rate(brainbytes_http_request_duration_seconds_sum[5m]) / rate(brainbytes_http_request_duration_seconds_count[5m])

# Check mobile performance
# Grafana query: rate(brainbytes_mobile_requests_total[5m])
```

#### Resolution Procedures:

**Resolution 1: If Technical Issue Detected**
```bash
# Address any identified technical problems
# Follow procedures for related alerts (ServiceDown, DatabaseConnection, etc.)

# Test question submission flow
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "Test question", "userId": "test"}'
```

**Resolution 2: If Normal Low Usage**
```bash
# Document as expected pattern
echo "$(date): Low usage period identified as normal" >> monitoring/usage-patterns.log

# Monitor for return to normal activity
# Set up notification for when questions resume
```

**Resolution 3: Proactive Engagement**
```bash
# If business hours with low engagement, consider:
# - User notification campaigns
# - Platform promotion
# - Technical optimization for better experience

# Monitor mobile usage patterns (Philippines is mobile-first)
# Grafana query: rate(brainbytes_mobile_requests_total[5m]) / rate(brainbytes_http_requests_total[5m])
```

**Verification:**
- Questions resume at expected rate for time period
- No technical issues preventing question submission
- User engagement metrics return to normal
- No related error alerts firing

---

### Alert: ContainerHighMemory
**Alert Expression:** `container_memory_usage_bytes{name="brainbytes-backend"} / 1024 / 1024 > 500`
**Severity:** Warning
**Trigger Time:** 2 minutes

#### What the Alert Means:
The backend container is using more than 500MB of memory. This could lead to:
- Performance degradation
- Container being killed by Docker
- System instability
- Memory exhaustion

#### Possible Causes:
1. **Memory Leaks**
   - Unclosed database connections
   - Event listeners not properly removed
   - Large objects not garbage collected

2. **Increased Load**
   - Higher than normal user traffic
   - Concurrent AI processing requests
   - Large conversation histories being stored

3. **Inefficient Processing**
   - Large data structures in memory
   - Caching strategies using too much memory
   - AI model loading consuming memory

4. **Configuration Issues**
   - Memory limits set too low
   - Node.js heap size misconfigured
   - Buffer sizes too large

#### Recommended Troubleshooting Steps:

**Step 1: Memory Usage Analysis (< 2 minutes)**
```bash
# Check current memory usage
docker stats brainbytes-backend --no-stream

# Check memory usage trend
# Grafana query: container_memory_usage_bytes{name="brainbytes-backend"} / 1024 / 1024

# Check for memory growth pattern
docker logs brainbytes-backend | grep -i "memory\|heap" | tail -10
```

**Step 2: Application Performance Check (< 2 minutes)**
```bash
# Check for performance impact
curl -w "Response time: %{time_total}s\n" http://localhost:3000/health

# Check for memory-related errors
docker logs brainbytes-backend | grep -i "out.*memory\|heap.*out\|enomem" | tail -5

# Check current load
# Grafana query: rate(brainbytes_http_requests_total[5m])
```

**Step 3: Process Analysis (< 1 minute)**
```bash
# Check processes inside container
docker exec -it brainbytes-backend ps aux

# Check Node.js memory usage
docker exec -it brainbytes-backend node -e "console.log(process.memoryUsage())"
```

#### Resolution Procedures:

**Resolution 1: Immediate Memory Relief**
```bash
# Restart container to clear memory
docker-compose restart backend

# Monitor memory usage after restart
watch -n 5 'docker stats brainbytes-backend --no-stream'
```

**Resolution 2: Memory Optimization**
```bash
# Increase memory limits if needed
# Edit docker-compose.yml:
# backend:
#   deploy:
#     resources:
#       limits:
#         memory: 1G

# Optimize Node.js heap size
# Add to environment variables:
# NODE_OPTIONS: "--max-old-space-size=1024"
```

**Resolution 3: Application Tuning**
```bash
# Review and optimize memory usage in application
# Check for:
# - Database connection pooling
# - Proper resource cleanup
# - Caching strategies

# Monitor garbage collection
docker exec -it brainbytes-backend node --expose-gc -e "
  setInterval(() => {
    global.gc();
    console.log(process.memoryUsage());
  }, 5000);
"
```

**Verification:**
- Memory usage drops and stabilizes below 500MB
- No performance degradation observed
- Application responds normally
- No memory-related errors in logs

---

## 📞 Emergency Contacts & Escalation

### Severity Levels & Response Times:
- **Critical (Database, Service Down):** < 15 minutes
- **Warning (High Errors, Slow AI):** < 30 minutes  
- **Info (No Questions, High Memory):** < 2 hours

### Escalation Path:
1. **First Responder** (0-15 min): On-call engineer
2. **Senior Engineer** (15-30 min): Technical lead
3. **Manager Escalation** (30+ min): Engineering manager
4. **Executive Escalation** (1+ hour, business critical): CTO

### Key Contacts:
- **On-call Engineer:** [Your contact info]
- **Database Admin:** [DBA contact]
- **DevOps Lead:** [DevOps contact]
- **Product Manager:** [PM contact for business impact]

### External Vendors:
- **HuggingFace Support:** [For AI service issues]
- **Hosting Provider:** [For infrastructure issues]
- **Network Provider:** [For connectivity issues]

---

## 📋 Post-Incident Procedures

### After Resolving Any Alert:

1. **Document Resolution:**
   ```bash
   echo "$(date): Alert [ALERT_NAME] resolved. Root cause: [CAUSE]. Resolution: [STEPS]" >> monitoring/incident-log.txt
   ```

2. **Verify Alert Clearance:**
   - Check Grafana for alert status
   - Confirm metrics return to normal
   - Test affected functionality

3. **Update Runbooks:**
   - Add any new troubleshooting steps discovered
   - Update known issues and workarounds
   - Improve alert thresholds if needed

4. **Prevention Planning:**
   - Identify preventive measures
   - Schedule infrastructure improvements
   - Update monitoring coverage

5. **Stakeholder Communication:**
   - Notify affected users (if external impact)
   - Update team on resolution
   - Plan follow-up improvements

This documentation provides comprehensive procedures for each alert type, enabling quick and effective incident response while building institutional knowledge for continuous improvement.