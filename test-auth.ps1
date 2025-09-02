# Test script for Nexus Identity Service Authentication
Write-Host "Testing Nexus Identity Service Authentication..." -ForegroundColor Green

# Test health endpoint
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
    Write-Host "Health Check: SUCCESS" -ForegroundColor Green
    $healthResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Health Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test login with default admin credentials
Write-Host "`n2. Testing Login Endpoint..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@nexus.lk"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login: SUCCESS" -ForegroundColor Green
    Write-Host "Full Response:" -ForegroundColor Cyan
    $loginResponse | ConvertTo-Json -Depth 5
    $token = $loginResponse.data.accessToken
    Write-Host "Access Token: $token" -ForegroundColor Cyan
    
    # Test profile endpoint with token
    Write-Host "`n3. Testing Profile Endpoint..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/profile" -Method GET -Headers $headers
    Write-Host "Profile: SUCCESS" -ForegroundColor Green
    $profileResponse | ConvertTo-Json -Depth 3
    
    # Test users endpoint with token
    Write-Host "`n4. Testing Users Endpoint..." -ForegroundColor Yellow
    $usersResponse = Invoke-RestMethod -Uri "http://localhost:3001/users" -Method GET -Headers $headers
    Write-Host "Users List: SUCCESS" -ForegroundColor Green
    Write-Host "Number of users: $($usersResponse.data.users.Count)" -ForegroundColor Cyan
    $usersResponse | ConvertTo-Json -Depth 5 | Out-Null
    
    # Test roles endpoint with token
    Write-Host "`n5. Testing Roles Endpoint..." -ForegroundColor Yellow
    $rolesResponse = Invoke-RestMethod -Uri "http://localhost:3001/roles" -Method GET -Headers $headers
    Write-Host "Roles List: SUCCESS" -ForegroundColor Green
    Write-Host "Number of roles: $($rolesResponse.data.roles.Count)" -ForegroundColor Cyan
    $rolesResponse | ConvertTo-Json -Depth 5 | Out-Null
    
} catch {
    Write-Host "Login: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting Complete!" -ForegroundColor Green
