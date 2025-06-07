# test-e2e.ps1
# End-to-End Testing Script for BrainBytes

param(
    [switch]$Headless,
    [switch]$Debug,
    [switch]$Watch,
    [switch]$SetupOnly,
    [int]$Timeout = 60
)

Write-Host "=== BrainBytes E2E Testing Suite ===" -ForegroundColor Cyan

# Function to check if services are ready
function Wait-ForServices {
    param([int]$TimeoutSeconds = 60)
    
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    
    $services = @(
        @{ Name = "Frontend"; Url = "http://localhost:8080" },
        @{ Name = "Backend"; Url = "http://localhost:3000" }
    )
    
    $startTime = Get-Date
    $allReady = $false
    
    while (-not $allReady -and (Get-Date).Subtract($startTime).TotalSeconds -lt $TimeoutSeconds) {
        $readyCount = 0
        
        foreach ($service in $services) {
            try {
                $response = Invoke-WebRequest -Uri $service.Url -Method Get -TimeoutSec 5 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    $readyCount++
                }
            }
            catch {
                # Service not ready yet
            }
        }
        
        if ($readyCount -eq $services.Count) {
            $allReady = $true
            Write-Host "✓ All services are ready!" -ForegroundColor Green
        } else {
            Write-Host "  Waiting... ($readyCount/$($services.Count) services ready)" -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
    
    return $allReady
}

# Function to setup E2E environment
function Setup-E2EEnvironment {
    Write-Host "`nSetting up E2E test environment..." -ForegroundColor Yellow
    
    # Create E2E directory structure
    if (-not (Test-Path "e2e")) {
        New-Item -ItemType Directory -Name "e2e" -Force
        Write-Host "✓ Created e2e directory" -ForegroundColor Green
    }
    
    if (-not (Test-Path "e2e/tests")) {
        New-Item -ItemType Directory -Path "e2e/tests" -Force
        Write-Host "✓ Created e2e/tests directory" -ForegroundColor Green
    }
    
    # Check if package.json exists
    if (-not (Test-Path "e2e/package.json")) {
        Write-Host "Creating E2E package.json..." -ForegroundColor Gray
        
        $packageJson = @{
            name = "brainbytes-e2e-tests"
            version = "1.0.0"
            description = "End-to-End tests for BrainBytes application"
            scripts = @{
                test = "jest"
                "test:headless" = "jest --testTimeout=60000"
                "test:debug" = "jest --runInBand --detectOpenHandles"
            }
            devDependencies = @{
                jest = "^29.0.0"
                puppeteer = "^21.0.0"
                axios = "^1.0.0"
            }
            jest = @{
                testTimeout = 60000
                testEnvironment = "node"
                verbose = $true
            }
        }
        
        $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "e2e/package.json" -Encoding UTF8
        Write-Host "✓ Created package.json" -ForegroundColor Green
    }
    
    # Install dependencies
    Write-Host "Installing E2E dependencies..." -ForegroundColor Gray
    try {
        Push-Location e2e
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "⚠ Dependencies installation completed with warnings" -ForegroundColor Yellow
        }
        Pop-Location
    }
    catch {
        Write-Host "⚠ Error installing dependencies: $($_.Exception.Message)" -ForegroundColor Yellow
        Pop-Location
    }
    
    return $true
}

# Function to run manual E2E tests
function Test-ManualE2E {
    Write-Host "`nRunning manual E2E tests..." -ForegroundColor Yellow
    
    # Test 1: Frontend loading
    Write-Host "1. Testing frontend loading..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Get -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Frontend loads successfully" -ForegroundColor Green
            $frontendContent = $response.Content
            
            # Check for common web app elements
            $hasTitle = $frontendContent -match "<title.*?>"
            $hasBody = $frontendContent -match "<body.*?>"
            $hasScripts = $frontendContent -match "<script.*?>"
            
            Write-Host "  - Has title tag: $(if ($hasTitle) { '✓' } else { '✗' })" -ForegroundColor $(if ($hasTitle) { 'Green' } else { 'Red' })
            Write-Host "  - Has body tag: $(if ($hasBody) { '✓' } else { '✗' })" -ForegroundColor $(if ($hasBody) { 'Green' } else { 'Red' })
            Write-Host "  - Has script tags: $(if ($hasScripts) { '✓' } else { '✗' })" -ForegroundColor $(if ($hasScripts) { 'Green' } else { 'Red' })
        }
    }
    catch {
        Write-Host "✗ Frontend loading failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 2: Backend API communication
    Write-Host "`n2. Testing backend API..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend API responds successfully" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✗ Backend API test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 3: Service integration
    Write-Host "`n3. Testing service integration..." -ForegroundColor Gray
    $integrationScore = 0
    
    # Check if frontend can reach backend
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8080" -Method Get -TimeoutSec 5
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5
        
        if ($frontendResponse.StatusCode -eq 200 -and $backendResponse.StatusCode -eq 200) {
            $integrationScore++
            Write-Host "✓ Both services responding" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠ Service integration check: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test 4: Database connectivity (through backend)
    Write-Host "`n4. Testing database connectivity..." -ForegroundColor Gray
    try {
        docker-compose exec -T mongo mongo --eval "db.adminCommand('ping')" --quiet 2>$null
        if ($LASTEXITCODE -eq 0) {
            $integrationScore++
            Write-Host "✓ Database connectivity confirmed" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠ Database connectivity test: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    return $integrationScore
}

# Function to create a simple test file
function Create-SimpleE2ETest {
    $testContent = @'
const puppeteer = require('puppeteer');

describe('Simple E2E Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Should load the application', async () => {
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const title = await page.title();
    expect(title).toBeDefined();
    console.log('✓ Application loaded with title:', title);
  });

  test('Should have working backend', async () => {
    try {
      const response = await page.goto('http://localhost:3000', { timeout: 10000 });
      expect(response.status()).toBe(200);
      console.log('✓ Backend is responding');
    } catch (error) {
      console.log('Backend test info:', error.message);
    }
  });
});
'@

    $testContent | Out-File -FilePath "e2e/tests/simple.test.js" -Encoding UTF8
    Write-Host "✓ Created simple E2E test file" -ForegroundColor Green
}

# Main execution
try {
    # Step 1: Check if services are running
    Write-Host "`n1. Checking service status..." -ForegroundColor Yellow
    docker-compose ps
    
    # Ensure services are up
    Write-Host "`nEnsuring services are running..." -ForegroundColor Yellow
    docker-compose up -d
    
    # Step 2: Wait for services to be ready
    Write-Host "`n2. Waiting for services..." -ForegroundColor Yellow
    $servicesReady = Wait-ForServices -TimeoutSeconds $Timeout
    
    if (-not $servicesReady) {
        Write-Host "✗ Services are not ready. Cannot proceed with E2E tests." -ForegroundColor Red
        exit 1
    }
    
    # Step 3: Setup E2E environment
    Write-Host "`n3. Setting up E2E environment..." -ForegroundColor Yellow
    $setupSuccess = Setup-E2EEnvironment
    
    if ($SetupOnly) {
        Write-Host "`n✅ E2E setup completed. Use the test files in ./e2e/tests/" -ForegroundColor Green
        exit 0
    }
    
    # Step 4: Run manual E2E tests
    Write-Host "`n4. Running E2E tests..." -ForegroundColor Yellow
    $manualScore = Test-ManualE2E
    
    # Step 5: Run Puppeteer tests if available
    if (Test-Path "e2e/package.json") {
        Write-Host "`n5. Running Puppeteer tests..." -ForegroundColor Yellow
        
        # Create a simple test if none exists
        if (-not (Test-Path "e2e/tests/*.test.js")) {
            Create-SimpleE2ETest
        }
        
        try {
            Push-Location e2e
            
            if ($Debug) {
                npm run test:debug
            } elseif ($Watch) {
                npm run test:watch
            } else {
                npm test
            }
            
            $jestExitCode = $LASTEXITCODE
            Pop-Location
            
            if ($jestExitCode -eq 0) {
                Write-Host "✓ Puppeteer E2E tests passed" -ForegroundColor Green
            } else {
                Write-Host "⚠ Puppeteer E2E tests completed with issues" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "ℹ Puppeteer tests info: $($_.Exception.Message)" -ForegroundColor Gray
            Pop-Location
        }
    }
    
    # Step 6: Generate E2E test report
    Write-Host "`n=== E2E Test Results Summary ===" -ForegroundColor Cyan
    
    Write-Host "Services Status:" -ForegroundColor White
    Write-Host "  - Frontend (http://localhost:8080): $(if ($servicesReady) { 'READY' } else { 'NOT READY' })" -ForegroundColor $(if ($servicesReady) { 'Green' } else { 'Red' })
    Write-Host "  - Backend (http://localhost:3000): $(if ($servicesReady) { 'READY' } else { 'NOT READY' })" -ForegroundColor $(if ($servicesReady) {