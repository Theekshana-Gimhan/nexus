<#!
Automated permission enforcement test for Identity Service.
Validates that:
  - Admin can list roles and create users.
  - Manager cannot list roles or create users, but receives appropriate 403.
  - Manager login reflects only granted permissions (read/update users).
Starts compiled server (dist) for isolation.
#>
param(
  [switch]$KeepServer
)

Function Invoke-Api {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = $null,
    [object]$Body = $null
  )
  $result = [ordered]@{ method=$Method; url=$Url; status=$null; ok=$false; body=$null; error=$null }
  try {
    $json = $null
    if ($Body) { $json = $Body | ConvertTo-Json -Depth 8 }
    $resp = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $json -ContentType 'application/json' -ErrorAction Stop
    $result.status = 200
    $result.ok = $true
    $result.body = $resp
  } catch {
    $err = $_
    $status = $null
    try { $status = $err.Exception.Response.StatusCode.Value__ } catch {}
    $result.status = $status
    $result.error = $err.Exception.Message
    try {
      if ($err.ErrorDetails.Message) { $result.body = ($err.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue) }
    } catch {}
  }
  return [pscustomobject]$result
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$servicePath = Join-Path $root 'services/identity-service'
if (-not (Test-Path $servicePath)) { throw "Service path not found: $servicePath" }

Write-Host "Building service..." -ForegroundColor Yellow
Push-Location $servicePath
npm run build | Out-Null
Pop-Location

Write-Host "Starting server (dist)..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
$server = Start-Process -FilePath node -ArgumentList 'dist/index.js' -WorkingDirectory $servicePath -PassThru -WindowStyle Hidden

# Wait for health
$healthy = $false
for ($i=0; $i -lt 30; $i++) {
  Start-Sleep -Milliseconds 500
  $h = Invoke-Api -Method GET -Url 'http://localhost:3001/health'
  if ($h.ok) { $healthy = $true; break }
}
if (-not $healthy) { Write-Host 'Health check failed; aborting.' -ForegroundColor Red; if (-not $KeepServer) { try { Stop-Process -Id $server.Id -Force } catch {} }; exit 1 }
Write-Host 'Health OK' -ForegroundColor Green

# Login admin
$adminLogin = Invoke-Api POST 'http://localhost:3001/auth/login' -Body @{ email='admin@nexus.lk'; password='admin123'}
if (-not $adminLogin.ok) { Write-Host 'Admin login failed' -ForegroundColor Red; goto Cleanup }
$adminToken = $adminLogin.body.data.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$adminPerms = $adminLogin.body.data.user.permissions | ForEach-Object { "$($_.module):$($_.action):$($_.resource)" }

# Admin should have manage roles permission
Write-Host "Admin permissions: $($adminPerms -join ', ')" -ForegroundColor Cyan

$rolesList = Invoke-Api GET 'http://localhost:3001/roles' -Headers $adminHeaders
$usersCreateManagerEmail = "manager_$(Get-Random)@nexus.lk"
$createManager = Invoke-Api POST 'http://localhost:3001/users' -Headers $adminHeaders -Body @{ email=$usersCreateManagerEmail; password='manager123'; firstName='Mgr'; lastName='User'; roleId='b1c2d3e4-f5a6-7890-bcde-f12345678901' }

# Login manager
$managerLogin = Invoke-Api POST 'http://localhost:3001/auth/login' -Body @{ email=$usersCreateManagerEmail; password='manager123' }
$managerToken = if ($managerLogin.ok) { $managerLogin.body.data.accessToken } else { $null }
$managerHeaders = if ($managerToken) { @{ Authorization = "Bearer $managerToken" } } else { @{} }
$managerPermStrings = @()
if ($managerLogin.ok) { $managerPermStrings = $managerLogin.body.data.user.permissions | ForEach-Object { "$($_.module):$($_.action):$($_.resource)" } }

# Manager attempts restricted actions
$managerRolesAttempt = Invoke-Api GET 'http://localhost:3001/roles' -Headers $managerHeaders
$managerCreateUserAttempt = Invoke-Api POST 'http://localhost:3001/users' -Headers $managerHeaders -Body @{ email="emp_$(Get-Random)@nexus.lk"; password='emp1234'; firstName='Emp'; lastName='User' }

# Summaries
$summary = [pscustomobject]@{
  AdminRolesListStatus = $rolesList.status
  AdminCreateManagerStatus = $createManager.status
  ManagerLoginStatus = $managerLogin.status
  ManagerRolesListStatus = $managerRolesAttempt.status
  ManagerCreateUserStatus = $managerCreateUserAttempt.status
  ManagerPermissions = ($managerPermStrings -join ', ')
}

Write-Host "\n=== Permission Test Summary ===" -ForegroundColor Magenta
$summary | Format-Table -AutoSize | Out-String | Write-Host

# Basic assertions
$failures = @()
if ($rolesList.status -ne 200) { $failures += 'Admin should list roles (200)' }
if ($createManager.status -notin 200,201) { $failures += "Admin should create manager (201) but got $($createManager.status)" }
if ($managerLogin.status -ne 200) { $failures += 'Manager should login (200)' }
if ($managerRolesAttempt.status -ne 403) { $failures += 'Manager roles list should be forbidden (403)' }
if ($managerCreateUserAttempt.status -ne 403) { $failures += 'Manager user create should be forbidden (403)' }
if (-not ($managerPermStrings -contains 'identity:read:users')) { $failures += 'Manager should have identity:read:users permission' }
if (-not ($managerPermStrings -contains 'identity:update:users')) { $failures += 'Manager should have identity:update:users permission' }
if ($managerPermStrings -contains 'identity:create:users') { $failures += 'Manager should NOT have identity:create:users permission' }
if ($managerPermStrings -contains 'identity:manage:roles') { $failures += 'Manager should NOT have identity:manage:roles permission' }

if ($failures.Count -gt 0) {
  Write-Host "\nFailures:" -ForegroundColor Red
  $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  $exit = 1
} else {
  Write-Host "\nAll permission checks passed." -ForegroundColor Green
  $exit = 0
}

# Cleanup
if (-not $KeepServer -and $server) { try { Stop-Process -Id $server.Id -Force } catch {} }
exit $exit
