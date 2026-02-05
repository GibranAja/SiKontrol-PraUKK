# API Testing Script for Sistem Peminjaman Alat
$BASE_URL = "http://localhost:3000/api"
$global:TOKEN = ""
$global:REFRESH_TOKEN = ""

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTING BACKEND API - Sistem Peminjaman Alat" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Helper function to make API calls
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = "",
        [bool]$UseAuth = $false,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  → $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($UseAuth -and $global:TOKEN) {
            $headers["Authorization"] = "Bearer $global:TOKEN"
        }
        
        $params = @{
            Method = $Method
            Uri = "$BASE_URL$Endpoint"
            Headers = $headers
        }
        
        if ($Body -and $Method -ne "GET") {
            $params["Body"] = $Body
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "  ✅ SUCCESS" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "=== 1. AUTHENTICATION ENDPOINTS ===" -ForegroundColor Cyan

# Test Login
$loginBody = @{
    username = "admin"
    password = "Admin123"
} | ConvertTo-Json

$loginResponse = Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Body $loginBody -Description "Login Admin"
if ($loginResponse) {
    $global:TOKEN = $loginResponse.data.accessToken
    $global:REFRESH_TOKEN = $loginResponse.data.refreshToken
    Write-Host "  Token saved: $($global:TOKEN.Substring(0, 20))..." -ForegroundColor Gray
}

Start-Sleep -Milliseconds 500

# Test Refresh Token
if ($global:REFRESH_TOKEN) {
    $refreshBody = @{
        refreshToken = $global:REFRESH_TOKEN
    } | ConvertTo-Json
    
    Test-Endpoint -Method "POST" -Endpoint "/auth/refresh" -Body $refreshBody -Description "Refresh Token" | Out-Null
}

Start-Sleep -Milliseconds 500

Write-Host "`n=== 2. USER MANAGEMENT ENDPOINTS ===" -ForegroundColor Cyan

# Get all users
Test-Endpoint -Method "GET" -Endpoint "/users" -UseAuth $true -Description "Get All Users" | Out-Null

Start-Sleep -Milliseconds 500

# Get user by ID
Test-Endpoint -Method "GET" -Endpoint "/users/1" -UseAuth $true -Description "Get User by ID" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n=== 3. KATEGORI ENDPOINTS ===" -ForegroundColor Cyan

# Create Kategori
$kategoriBody = @{
    nama_kategori = "Test Kategori API"
    deskripsi = "Kategori test dari API testing"
} | ConvertTo-Json

$kategoriResponse = Test-Endpoint -Method "POST" -Endpoint "/kategori" -Body $kategoriBody -UseAuth $true -Description "Create Kategori"
$kategoriId = if ($kategoriResponse) { $kategoriResponse.data.id_kategori } else { 1 }

Start-Sleep -Milliseconds 500

# Get all kategori
Test-Endpoint -Method "GET" -Endpoint "/kategori" -UseAuth $true -Description "Get All Kategori" | Out-Null

Start-Sleep -Milliseconds 500

# Get kategori by ID
Test-Endpoint -Method "GET" -Endpoint "/kategori/$kategoriId" -UseAuth $true -Description "Get Kategori by ID" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n=== 4. ALAT ENDPOINTS ===" -ForegroundColor Cyan

# Create Alat
$alatBody = @{
    id_kategori = $kategoriId
    nama_alat = "Test Alat API"
    kode_alat = "TST-API-001"
    stok = 5
    kondisi = "BAIK"
    spesifikasi = "Alat test dari API testing"
    harga = 100000
} | ConvertTo-Json

$alatResponse = Test-Endpoint -Method "POST" -Endpoint "/alat" -Body $alatBody -UseAuth $true -Description "Create Alat"
$alatId = if ($alatResponse) { $alatResponse.data.id_alat } else { 1 }

Start-Sleep -Milliseconds 500

# Get all alat
Test-Endpoint -Method "GET" -Endpoint "/alat" -UseAuth $true -Description "Get All Alat" | Out-Null

Start-Sleep -Milliseconds 500

# Get alat by ID
Test-Endpoint -Method "GET" -Endpoint "/alat/$alatId" -UseAuth $true -Description "Get Alat by ID" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n=== 5. PEMINJAMAN ENDPOINTS ===" -ForegroundColor Cyan

# Create Peminjaman
$peminjamanBody = @{
    id_alat = $alatId
    alasan_peminjaman = "Untuk keperluan testing API"
    keperluan_lainnya = "Test penuh sistem"
} | ConvertTo-Json

$peminjamanResponse = Test-Endpoint -Method "POST" -Endpoint "/peminjaman" -Body $peminjamanBody -UseAuth $true -Description "Create Peminjaman"
$peminjamanId = if ($peminjamanResponse) { $peminjamanResponse.data.id_peminjaman } else { 1 }

Start-Sleep -Milliseconds 500

# Get all peminjaman
Test-Endpoint -Method "GET" -Endpoint "/peminjaman" -UseAuth $true -Description "Get All Peminjaman" | Out-Null

Start-Sleep -Milliseconds 500

# Get peminjaman by ID
Test-Endpoint -Method "GET" -Endpoint "/peminjaman/$peminjamanId" -UseAuth $true -Description "Get Peminjaman by ID" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n=== 6. PERPANJANGAN ENDPOINTS ===" -ForegroundColor Cyan

# Get all perpanjangan
Test-Endpoint -Method "GET" -Endpoint "/perpanjangan" -UseAuth $true -Description "Get All Perpanjangan" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n=== 7. PENGEMBALIAN ENDPOINTS ===" -ForegroundColor Cyan

# Get all pengembalian
Test-Endpoint -Method "GET" -Endpoint "/pengembalian" -UseAuth $true -Description "Get All Pengembalian" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n=== 8. LOG AKTIVITAS ENDPOINTS ===" -ForegroundColor Cyan

# Get all logs
Test-Endpoint -Method "GET" -Endpoint "/log-aktivitas" -UseAuth $true -Description "Get All Log Aktivitas" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n=== 9. LAPORAN ENDPOINTS ===" -ForegroundColor Cyan

# Dashboard
Test-Endpoint -Method "GET" -Endpoint "/laporan/dashboard" -UseAuth $true -Description "Get Dashboard Stats" | Out-Null

Start-Sleep -Milliseconds 500

# Laporan Peminjaman
Test-Endpoint -Method "GET" -Endpoint "/laporan/peminjaman" -UseAuth $true -Description "Get Laporan Peminjaman" | Out-Null

Start-Sleep -Milliseconds 500

# Laporan Denda
Test-Endpoint -Method "GET" -Endpoint "/laporan/denda" -UseAuth $true -Description "Get Laporan Denda" | Out-Null

Start-Sleep -Milliseconds 500

# Alat Terbanyak
Test-Endpoint -Method "GET" -Endpoint "/laporan/alat-terbanyak?periode=all&limit=5" -UseAuth $true -Description "Get Top 5 Alat" | Out-Null

Start-Sleep -Milliseconds 500

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTING COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Check results above for ✅ (success) or ❌ (failed)" -ForegroundColor Yellow
