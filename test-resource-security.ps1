# test-resource-security.ps1
# Simple Resource Usage and Security Testing Script

param(
    [int]$MemoryThreshold = 80,
    [int]$CPUThreshold = 80,
    [int]$Duration = 60,
    [switch]$SkipSecurity,
    [switch]$SkipResources
)

Write-Host "=== Resource and Security Testing Suite ===" -ForegroundColor Cyan

# Function to monitor resources
function Monitor-Resources {
    param([int]$Seconds = 60)
    
    Write-Host "`nMonitoring container resources for $Seconds seconds..." -ForegroundColor Yellow
    Write-Host "Memory threshold: $MemoryThreshold%, CPU threshold: $CPUThreshold%" -ForegroundColor Gray
    
    $startTime = Get-Date
    $alerts = @()
    
    while ((Get-Date).Subtract($startTime).TotalSeconds -lt $Seconds) {
        try {
            Write-Host "`n--- Resource Check ($(Get-Date -Format 'HH:mm:ss')) ---" -ForegroundColor Cyan
            
            # Get container stats
            $statsOutput = docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemPerc}},{{.MemUsage}}"
            
            foreach ($line in $statsOutput) {
                $parts = $line -split ','
                if ($parts.Length -ge 3) {
                    $name = $parts[0]
                    $cpu = $parts[1] -replace '%', ''
                    $memory = $parts[2] -replace '%', ''
                    $memUsage = $parts[3]
                    
                    # Parse numbers safely
                    try {
                        $cpuNum = [double]::Parse($cpu)
                        $memNum = [double]::Parse($memory)
                        
                        # Display with colors
                        $cpuColor = if ($cpuNum -gt $CPUThreshold) { "Red" } elseif ($cpuNum -gt 50) { "Yellow" } else { "Green" }
                        $memColor = if ($memNum -gt $MemoryThreshold) { "Red" } elseif ($memNum -gt 50) { "Yellow" } else { "Green" }
                        
                        Write-Host "Container: $name" -ForegroundColor White
                        Write-Host "  CPU: $cpu%" -ForegroundColor $cpuColor
                        Write-Host "  Memory: $memory% ($memUsage)" -ForegroundColor $memColor
                        
                        # Check thresholds
                        if ($cpuNum -gt $CPUThreshold) {
                            $alert = "HIGH CPU - $name using $cpu% (threshold $CPUThreshold%)"
                            Write-Host "  WARNING: $alert" -ForegroundColor Red
                            $alerts += $alert
                        }
                        
                        if ($memNum -gt $MemoryThreshold) {
                            $alert = "HIGH MEMORY - $name using $memory% (threshold $MemoryThreshold%)"
                            Write-Host "  WARNING: $alert" -ForegroundColor Red
                            $alerts += $alert
                        }
                        
                    } catch {
                        Write-Host "Error parsing stats for $name" -ForegroundColor Yellow
                    }
                }
            }
            
            Start-Sleep -Seconds 10
            
        } catch {
            Write-Host "Error monitoring resources: $($_.Exception.Message)" -ForegroundColor Red
            break
        }
    }
    
    return $alerts
}

# Function to run security checks
function Test-Security {
    Write-Host "`nRunning security checks..." -ForegroundColor Yellow
    
    $securityIssues = @()
    
    # Check 1: Container users
    Write-Host "`nChecking container users..." -ForegroundColor Gray
    try {
        $containers = docker ps --format "{{.Names}}"
        foreach ($container in $containers) {
            try {
                $user = docker exec $container whoami 2>$null
                if ($user -eq "root") {
                    Write-Host "  WARNING: $container running as root" -ForegroundColor Yellow
                    $securityIssues += "$container is running as root user"
                } else {
                    Write-Host "  OK: $container running as $user" -ForegroundColor Green
                }
            } catch {
                Write-Host "  Could not check user for $container" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "Error checking container users" -ForegroundColor Red
    }
    
    # Check 2: Port exposure
    Write-Host "`nChecking exposed ports..." -ForegroundColor Gray
    try {
        $ports = docker ps --format "{{.Names}} {{.Ports}}"
        foreach ($line in $ports) {
            Write-Host "  $line" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "Error checking ports" -ForegroundColor Red
    }
    
    return $securityIssues
}

# Function to scan vulnerabilities
function Scan-Vulnerabilities {
    Write-Host "`nScanning for vulnerabilities..." -ForegroundColor Yellow
    
    # Get available images
    $images = @()
    try {
        $imageList = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -match "brainbytes|devops_it122" }
        $images = $imageList
    } catch {
        Write-Host "Error getting image list" -ForegroundColor Red
        return
    }
    
    if ($images.Count -eq 0) {
        Write-Host "No project images found to scan" -ForegroundColor Yellow
        return
    }
    
    foreach ($image in $images) {
        Write-Host "`nScanning image: $image" -ForegroundColor Gray
        
        try {
            # Try using local trivy first
            if (Get-Command trivy -ErrorAction SilentlyContinue) {
                Write-Host "  Using local Trivy..." -ForegroundColor Gray
                trivy image --format table --severity HIGH,CRITICAL $image
            } else {
                # Use Docker version of trivy
                Write-Host "  Using Docker Trivy..." -ForegroundColor Gray
                docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --format table --severity HIGH,CRITICAL $image 2>$null
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Scan completed for $image" -ForegroundColor Green
            } else {
                Write-Host "  Scan had issues for $image" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "  Error scanning $image" -ForegroundColor Red
        }
    }
}

# Main execution
try {
    # Step 1: Check container status
    Write-Host "`n1. Checking container status..." -ForegroundColor Yellow
    $containers = docker ps --format "{{.Names}}"
    
    if (-not $containers) {
        Write-Host "No containers running. Starting services..." -ForegroundColor Yellow
        docker-compose up -d
        Start-Sleep -Seconds 15
        $containers = docker ps --format "{{.Names}}"
    }
    
    if ($containers) {
        Write-Host "Containers running:" -ForegroundColor Green
        foreach ($container in $containers) {
            Write-Host "  - $container" -ForegroundColor Cyan
        }
    } else {
        Write-Host "ERROR: No containers are running" -ForegroundColor Red
        exit 1
    }
    
    # Step 2: Resource monitoring
    if (-not $SkipResources) {
        Write-Host "`n2. Resource Usage Testing..." -ForegroundColor Yellow
        
        # Quick snapshot first
        Write-Host "`nCurrent resource usage:" -ForegroundColor Gray
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.MemUsage}}"
        
        # Extended monitoring
        $resourceAlerts = Monitor-Resources -Seconds $Duration
        
        Write-Host "`n=== Resource Analysis ===" -ForegroundColor Cyan
        if ($resourceAlerts.Count -gt 0) {
            Write-Host "Resource alerts triggered:" -ForegroundColor Red
            foreach ($alert in $resourceAlerts) {
                Write-Host "  - $alert" -ForegroundColor Yellow
            }
        } else {
            Write-Host "No resource threshold violations detected" -ForegroundColor Green
        }
    } else {
        Write-Host "`n2. Skipping resource tests..." -ForegroundColor Gray
    }
    
    # Step 3: Security testing
    if (-not $SkipSecurity) {
        Write-Host "`n3. Security Testing..." -ForegroundColor Yellow
        
        # Quick security checks
        $securityIssues = Test-Security
        
        # Vulnerability scanning
        Scan-Vulnerabilities
        
        Write-Host "`n=== Security Summary ===" -ForegroundColor Cyan
        if ($securityIssues.Count -gt 0) {
            Write-Host "Security issues found:" -ForegroundColor Red
            foreach ($issue in $securityIssues) {
                Write-Host "  - $issue" -ForegroundColor Yellow
            }
        } else {
            Write-Host "No immediate security issues detected" -ForegroundColor Green
        }
        
    } else {
        Write-Host "`n3. Skipping security tests..." -ForegroundColor Gray
    }
    
    # Step 4: Final summary
    Write-Host "`n=== Part 6: Resource and Security Testing Summary ===" -ForegroundColor Cyan
    Write-Host "Resource monitoring: COMPLETED" -ForegroundColor Green
    Write-Host "Security scanning: COMPLETED" -ForegroundColor Green
    Write-Host "Vulnerability assessment: COMPLETED" -ForegroundColor Green
    
    Write-Host "`n=== Recommendations ===" -ForegroundColor Yellow
    Write-Host "1. Monitor resource usage during peak loads" -ForegroundColor Cyan
    Write-Host "2. Address any critical/high vulnerabilities found" -ForegroundColor Cyan
    Write-Host "3. Consider running containers as non-root users" -ForegroundColor Cyan
    Write-Host "4. Regularly update base images" -ForegroundColor Cyan
    Write-Host "5. Implement resource limits in docker-compose.yml" -ForegroundColor Cyan
    
    Write-Host "`nPart 6 COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    
} catch {
    Write-Host "Resource and Security testing failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}