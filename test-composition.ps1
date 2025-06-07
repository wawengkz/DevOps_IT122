# test-composition.ps1
# Simple Docker Compose Testing Script

param(
    [int]$TimeoutSeconds = 120,
    [switch]$Cleanup,
    [switch]$Verbose
)

Write-Host "=== Docker Compose Integration Test Suite ===" -ForegroundColor Cyan

# Function to wait for service
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$TimeoutSeconds = 60
    )
    
    $elapsed = 0
    Write-Host "Waiting for $ServiceName to be ready..." -ForegroundColor Yellow
    
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "SUCCESS: $ServiceName is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            if ($Verbose) {
                Write-Host "  Attempt failed: $($_.Exception.Message)" -ForegroundColor Gray
            }
        }
        
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "  Waiting... $elapsed of $TimeoutSeconds seconds" -ForegroundColor Gray
    }
    
    Write-Host "FAILED: $ServiceName not ready within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Description
    )
    
    try {
        Write-Host "Testing $Description..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "SUCCESS: $Description is working" -ForegroundColor Green
            return $true
        } else {
            Write-Host "FAILED: $Description returned status $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "FAILED: $Description test failed - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main test execution
try {
    # Step 1: Start services
    Write-Host "`n1. Starting Docker Compose services..." -ForegroundColor Yellow
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Could not start services" -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep -Seconds 15
    
    # Step 2: Check container status
    Write-Host "`n2. Checking container status..." -ForegroundColor Yellow
    docker-compose ps
    
    # Step 3: Test services
    Write-Host "`n3. Testing services..." -ForegroundColor Yellow
    
    $backendReady = Wait-ForService -ServiceName "Backend" -Url "http://localhost:3000" -TimeoutSeconds $TimeoutSeconds
    $frontendReady = Wait-ForService -ServiceName "Frontend" -Url "http://localhost:8080" -TimeoutSeconds $TimeoutSeconds
    
    # Step 4: Test endpoints
    Write-Host "`n4. Testing endpoints..." -ForegroundColor Yellow
    $backendTest = Test-ApiEndpoint -Url "http://localhost:3000" -Description "Backend API"
    $frontendTest = Test-ApiEndpoint -Url "http://localhost:8080" -Description "Frontend App"
    
    # Step 5: Test MongoDB
    Write-Host "`n5. Testing MongoDB..." -ForegroundColor Yellow
    try {
        docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" --quiet 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: MongoDB is responding" -ForegroundColor Green
            $mongoTest = $true
        } else {
            Write-Host "FAILED: MongoDB not responding" -ForegroundColor Red
            $mongoTest = $false
        }
    }
    catch {
        Write-Host "FAILED: MongoDB test error" -ForegroundColor Red
        $mongoTest = $false
    }
    
    # Results summary
    Write-Host "`n=== Test Results ===" -ForegroundColor Cyan
    
    $tests = @{
        "Backend Service" = $backendReady
        "Frontend Service" = $frontendReady
        "Backend API" = $backendTest
        "Frontend App" = $frontendTest
        "MongoDB" = $mongoTest
    }
    
    $passed = 0
    foreach ($test in $tests.GetEnumerator()) {
        $status = if ($test.Value) { "PASS"; $passed++ } else { "FAIL" }
        $color = if ($test.Value) { "Green" } else { "Red" }
        Write-Host "$($test.Key): $status" -ForegroundColor $color
    }
    
    Write-Host "`nResults: $passed of $($tests.Count) tests passed" -ForegroundColor Cyan
    
    if ($passed -eq $tests.Count) {
        Write-Host "`nAll services are healthy!" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
        Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
        $exitCode = 0
    } else {
        Write-Host "`nSome tests failed. Check the logs:" -ForegroundColor Red
        docker-compose logs --tail=20
        $exitCode = 1
    }
    
    if ($Cleanup) {
        Write-Host "`nCleaning up..." -ForegroundColor Yellow
        docker-compose down
    }
    
    exit $exitCode
    
} catch {
    Write-Host "Test suite error: $($_.Exception.Message)" -ForegroundColor Red
    if ($Cleanup) {
        docker-compose down
    }
    exit 1
}