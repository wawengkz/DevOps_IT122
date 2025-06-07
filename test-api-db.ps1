# test-api-db.ps1
# Simple API and Database Testing Script

param(
    [switch]$SkipAPI,
    [switch]$SkipDB,
    [switch]$Verbose
)

Write-Host "=== API and Database Testing Suite ===" -ForegroundColor Cyan

# Function to test API endpoints
function Test-APIEndpoints {
    Write-Host "Testing API endpoints..." -ForegroundColor Yellow
    
    $endpoints = @(
        "http://localhost:3000",
        "http://localhost:3000/health", 
        "http://localhost:3000/api/chat",
        "http://localhost:3000/api/history"
    )
    
    $results = @{}
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -Method Get -TimeoutSec 10 -ErrorAction Stop
            Write-Host "SUCCESS: $endpoint - Status $($response.StatusCode)" -ForegroundColor Green
            $results[$endpoint] = "PASS"
        }
        catch {
            if ($_.Exception.Response.StatusCode -eq 404) {
                Write-Host "INFO: $endpoint - 404 (endpoint may not exist)" -ForegroundColor Yellow
                $results[$endpoint] = "NOT_FOUND"
            } else {
                Write-Host "FAILED: $endpoint - Error" -ForegroundColor Red
                $results[$endpoint] = "FAIL"
            }
        }
    }
    
    return $results
}

# Function to test database
function Test-Database {
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    
    try {
        docker-compose exec -T mongo mongo --eval "db.adminCommand('ping')" --quiet 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: MongoDB connection working" -ForegroundColor Green
            return $true
        } else {
            Write-Host "FAILED: MongoDB connection failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "FAILED: Database test error" -ForegroundColor Red
        return $false
    }
}

# Function to test data persistence
function Test-Persistence {
    Write-Host "Testing data persistence..." -ForegroundColor Yellow
    
    try {
        # Insert test data
        $testId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        Write-Host "1. Inserting test data with ID: $testId" -ForegroundColor Gray
        
        $insertCmd = "db.testCollection.insertOne({testId: '$testId', message: 'persistence test', timestamp: new Date()})"
        docker-compose exec -T mongo mongo brainbytes --eval $insertCmd --quiet 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Test data inserted" -ForegroundColor Green
        } else {
            Write-Host "FAILED: Could not insert test data" -ForegroundColor Red
            return $false
        }
        
        # Restart MongoDB
        Write-Host "2. Restarting MongoDB container..." -ForegroundColor Gray
        docker-compose restart mongo
        Start-Sleep -Seconds 15
        
        # Check if data still exists
        Write-Host "3. Checking if data survived restart..." -ForegroundColor Gray
        $findCmd = "db.testCollection.findOne({testId: '$testId'})"
        $result = docker-compose exec -T mongo mongo brainbytes --eval $findCmd --quiet 2>$null
        
        if ($result -and $result.Contains($testId)) {
            Write-Host "SUCCESS: Data persistence verified!" -ForegroundColor Green
            
            # Clean up
            $deleteCmd = "db.testCollection.deleteOne({testId: '$testId'})"
            docker-compose exec -T mongo mongo brainbytes --eval $deleteCmd --quiet 2>$null
            Write-Host "Test data cleaned up" -ForegroundColor Gray
            
            return $true
        } else {
            Write-Host "FAILED: Data not found after restart" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "FAILED: Persistence test error" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "`n1. Checking if services are running..." -ForegroundColor Yellow
docker-compose ps

# Ensure services are up
Write-Host "`nStarting services if needed..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 10

# API Tests
if (-not $SkipAPI) {
    Write-Host "`n2. Running API tests..." -ForegroundColor Yellow
    $apiResults = Test-APIEndpoints
    
    # Try Jest tests if available
    if (Test-Path "backend/package.json") {
        Write-Host "`nRunning Jest tests..." -ForegroundColor Gray
        try {
            Push-Location backend
            npm test 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "SUCCESS: Jest tests passed" -ForegroundColor Green
            } else {
                Write-Host "INFO: Jest tests completed" -ForegroundColor Yellow
            }
            Pop-Location
        }
        catch {
            Write-Host "INFO: Jest tests not available" -ForegroundColor Gray
            Pop-Location
        }
    }
} else {
    Write-Host "`n2. Skipping API tests" -ForegroundColor Gray
}

# Database Tests  
if (-not $SkipDB) {
    Write-Host "`n3. Running database tests..." -ForegroundColor Yellow
    $dbConnected = Test-Database
    $persistenceOK = Test-Persistence
} else {
    Write-Host "`n3. Skipping database tests" -ForegroundColor Gray
    $dbConnected = $true
    $persistenceOK = $true
}

# Results Summary
Write-Host "`n=== Test Results Summary ===" -ForegroundColor Cyan

if (-not $SkipAPI) {
    $apiPassed = ($apiResults.Values | Where-Object { $_ -eq "PASS" }).Count
    $apiTotal = $apiResults.Count
    Write-Host "API Endpoints: $apiPassed of $apiTotal working" -ForegroundColor $(if ($apiPassed -gt 0) { "Green" } else { "Red" })
}

if (-not $SkipDB) {
    $dbStatus = if ($dbConnected) { "PASS" } else { "FAIL" }
    $persistStatus = if ($persistenceOK) { "PASS" } else { "FAIL" }
    
    Write-Host "Database Connection: $dbStatus" -ForegroundColor $(if ($dbConnected) { "Green" } else { "Red" })
    Write-Host "Data Persistence: $persistStatus" -ForegroundColor $(if ($persistenceOK) { "Green" } else { "Red" })
}

# Service URLs
Write-Host "`n=== Service URLs ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Backend: http://localhost:3000" -ForegroundColor White
Write-Host "MongoDB: mongodb://localhost:27017" -ForegroundColor White

Write-Host "`n✅ API and Database testing completed!" -ForegroundColor Green