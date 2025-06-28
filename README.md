BrainBytes CI/CD Documentation
This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for the BrainBytes AI tutoring platform.
Workflows Overview
Main Workflow (main.yml)
Purpose: Comprehensive CI pipeline that runs linting, testing, and building on every push and pull request.
Stages:

Test: Runs unit and integration tests for backend and frontend
Build: Builds Docker images and verifies they start correctly
Enhanced Lint: Code quality checks with ESLint and Prettier
Matrix Build: Tests compatibility across Node.js versions (18.x, 20.x)
Multi-Tool Security: Vulnerability scanning with Snyk, OSV Scanner, npm audit, and Trivy
E2E Testing: End-to-end API and service testing
Coverage: Code coverage analysis
Artifacts: Packages all reports and build outputs

Manual Execution:
To run this workflow manually, go to the Actions tab, select "BrainBytes CI/CD", and click "Run workflow".
Deployment Workflow (deploy.yml)
Purpose: Deploys the application to test, staging, and prepares production artifacts.
Deployment Strategy:

Development branch → Test environment (localhost:8080)
Main branch → Staging environment (localhost:8081)
Production → Artifacts prepared for manual deployment

Manual Execution:
To deploy manually, go to the Actions tab, select "BrainBytes Deploy", and click "Run workflow". Choose your target environment:

test: Deploy to test environment
staging: Deploy to staging environment
production: Prepare production deployment artifacts

Quality Workflow (quality.yml)
Purpose: Focused code quality checks with ESLint and Prettier for all components.
Manual Execution:
Go to the Actions tab, select "BrainBytes Code Quality", and click "Run workflow".
Security Workflow (security.yml)
Purpose: Dedicated security scanning that runs weekly and on-demand.
Features:

Dependency vulnerability scanning
Docker image security analysis
Secret detection
License compliance checking

Manual Execution:
Go to the Actions tab, select "BrainBytes Security Scan", and click "Run workflow".
Build Workflow (build.yml)
Purpose: Standalone Docker image building and testing.
Manual Execution:
Go to the Actions tab, select "BrainBytes Build", and click "Run workflow".
CI Workflow (ci.yml)
Purpose: Basic continuous integration for testing backend, frontend, and E2E.
Manual Execution:
Go to the Actions tab, select "BrainBytes CI", and click "Run workflow".
Workflow Status Badges
Add these badges to your README.md to show the current status:
Main CI/CD Pipeline
Show Image - Shows the status of the main CI/CD pipeline
Deployment Status
Show Image - Shows the status of the deployment workflow
Code Quality
Show Image - Shows code quality status
Security Scanning
Show Image - Shows security scan status
Environment URLs
Test Environment

Frontend: http://localhost:8080
Backend: http://localhost:3000
Trigger: Push to development branch or manual workflow dispatch

Staging Environment

Frontend: http://localhost:8081
Backend: http://localhost:3001
MongoDB: localhost:27018
Trigger: Push to main branch

Production Environment

Status: Artifacts prepared for manual deployment
Ports: Frontend (8082), Backend (3002), MongoDB (27019)
Includes: Nginx reverse proxy, SSL configuration, MongoDB authentication

Troubleshooting
Common Issues

Workflow Failures:

Check the specific error in the workflow logs
Verify that all required secrets are configured:

HUGGINGFACE_TOKEN: Required for AI functionality
SNYK_TOKEN: Optional, for enhanced security scanning


Ensure tests are passing locally before pushing


Deployment Issues:

Verify environment variables are correctly set
Check if the deployment environment is accessible
Review deployment logs for specific errors
Ensure Docker containers have sufficient resources


Port Conflicts:

Test environment uses ports: 8080 (frontend), 3000 (backend), 27017 (MongoDB)
Staging environment uses ports: 8081 (frontend), 3001 (backend), 27018 (MongoDB)
Stop conflicting services: docker stop $(docker ps -aq)


Security Scan Failures:

Review vulnerability reports in workflow artifacts
Update dependencies with security patches
Configure SNYK_TOKEN secret for enhanced scanning



Getting Help
If you encounter issues with the CI/CD setup:

Check the Actions tab for detailed logs of failed workflows
Review workflow artifacts for detailed reports (security scans, test results, etc.)
Consult the GitHub Actions documentation for general workflow issues
Contact the repository maintainers for project-specific problems

Manual Deployment Instructions
Local Development Testing

Test Environment (from development branch):
bash# Ensure you're on development branch
git checkout development
git push origin development

# Access via GitHub Actions or run locally:
docker compose -f deployment/docker-compose.test.yml up -d
# Access: http://localhost:8080

Staging Environment (from main branch):
bash# Ensure you're on main branch  
git checkout main
git push origin main

# Access via GitHub Actions or run locally:
docker compose -f deployment/docker-compose.staging.yml up -d
# Access: http://localhost:8081


Production Deployment

Download Production Artifacts:

Go to the latest successful main branch workflow run
Download "production-deployment" artifacts
Extract to your production server


Configure Production Environment:
bash# Copy and customize environment template
cp .env.production.template .env.production
# Edit .env.production with your production values

Deploy to Production:
bash# Run the deployment script
chmod +x deploy.sh
./deploy.sh


Security Considerations
Secrets Management

HUGGINGFACE_TOKEN: Store in GitHub Secrets for AI functionality
SNYK_TOKEN: Optional secret for enhanced vulnerability scanning
Production environment variables: Store securely and never commit to repository

Docker Security

All containers run as non-root users where possible
Images are scanned for vulnerabilities using Trivy
Base images are kept updated

Dependency Security

Dependencies are scanned using multiple tools:

Snyk (commercial vulnerability database)
OSV Scanner (Google's Open Source Vulnerabilities)
npm audit (NPM's built-in checker)
audit-ci (configurable thresholds)



Performance Optimizations
Caching Strategy

Node.js Dependencies: Cached across all jobs for faster execution
Docker Layers: Cached for faster image builds
Next.js Build: Cached for frontend optimization
Security Tools: Cached for faster vulnerability scans

Parallel Execution

Jobs run in parallel where dependencies allow
Matrix builds test multiple Node.js versions simultaneously
Independent workflows can run concurrently

Monitoring and Reporting
Workflow Artifacts
Each workflow run generates comprehensive artifacts:

Security Reports: Multi-tool vulnerability scanning results
Test Results: Unit test, integration test, and E2E test reports
Code Quality Reports: ESLint results and code coverage
Build Outputs: Docker images and build logs

GitHub Security Integration

SARIF reports are automatically uploaded to GitHub Security tab
Vulnerability alerts are integrated with GitHub's security features
Dependency scanning results appear in the repository security overview

Best Practices
Branch Strategy

Development branch: Use for feature development and testing
Main branch: Use for staging deployments and production preparation
Feature branches: Create from development, merge via pull requests

Workflow Triggers

Push events: Automatically trigger CI/CD on code changes
Pull requests: Run quality checks before merging
Scheduled runs: Weekly security scans for ongoing monitoring
Manual triggers: Available for all workflows for on-demand execution

Code Quality

ESLint configurations enforce consistent code style
Prettier ensures uniform code formatting
Multi-version compatibility testing ensures broad Node.js support
Comprehensive test coverage requirements
