<#!
Tests Identity Service in two modes:
 1. dev  - run with ts-node directly
 2. prod - build then run compiled dist
Verifies /health, /auth/login and inspects permissions structure.
#>
param(
  [string[]]$Modes = @('dev','prod')
)

Function Invoke-Json($Method, $Url, $BodyObj=$null, $Headers=@{}) {
  try {
    if ($BodyObj) { $json = $BodyObj | ConvertTo-Json -Depth 6 } else { $json = $null }
    $resp = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $json -ContentType 'application/json'
    return $resp
  } catch {
    Write-Host "Request $Method $Url failed: $($_.Exception.Message)" -ForegroundColor Red
    return $null
  }
}

$servicePath = Join-Path $PSScriptRoot 'services/identity-service'
if (-not (Test-Path $servicePath)) { throw "Identity service path not found: $servicePath" }

Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

$results = @()

foreach ($mode in $Modes) {
  Write-Host "\n=== Starting mode: $mode ===" -ForegroundColor Cyan
  Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
  Push-Location $servicePath
  $proc = $null
  if ($mode -eq 'prod') {
    Write-Host 'Building TypeScript...' -ForegroundColor Yellow
    npm run build | Out-Null
    $proc = Start-Process -FilePath node -ArgumentList 'dist/index.js' -WorkingDirectory $servicePath -PassThru -WindowStyle Hidden
  } else {
    # dev - direct ts-node via npx.cmd (Windows)
    $npx = 'npx.cmd'
    if (-not (Get-Command $npx -ErrorAction SilentlyContinue)) { throw 'npx.cmd not found in PATH' }
    $proc = Start-Process -FilePath $npx -ArgumentList 'ts-node','src/index.ts' -WorkingDirectory $servicePath -PassThru -WindowStyle Hidden
  }

  # Wait for health endpoint
  $healthy = $false
  for ($i=0; $i -lt 25; $i++) {
    Start-Sleep -Milliseconds 600
    $health = Invoke-Json GET 'http://localhost:3001/health'
    if ($health) { $healthy = $true; break }
  }
  if (-not $healthy) {
    Write-Host 'Service failed to become healthy in time.' -ForegroundColor Red
  } else {
    Write-Host 'Health OK' -ForegroundColor Green
  }

  $login = Invoke-Json POST 'http://localhost:3001/auth/login' @{ email='admin@nexus.lk'; password='admin123' }
  $token = $null
  $jwtPermCount = 0
  $userPermCount = 0
  $permShapeOk = $false
  if ($login) {
    $token = $login.data.accessToken
    $userPerms = $login.data.user.permissions
    if ($userPerms -is [Array]) { $userPermCount = $userPerms.Count }
    if ($userPermCount -gt 0) {
      $first = $userPerms[0]
      if ($first.PSObject.Properties.Name -contains 'module' -and $first.PSObject.Properties.Name -contains 'action' -and $first.PSObject.Properties.Name -contains 'resource') {
        $permShapeOk = $true
      }
    }
  }

  $results += [pscustomobject]@{
    Mode = $mode
    Healthy = $healthy
    LoginSucceeded = [bool]$login
    UserPermissionObjects = $userPermCount
    PermissionObjectsShapeValid = $permShapeOk
  }

  if ($proc) {
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  }
  Pop-Location
}

Write-Host "\n=== Summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize | Out-String | Write-Host

Write-Host 'Done.' -ForegroundColor Green
