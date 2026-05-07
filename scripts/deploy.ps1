# 虾蛋星球 - 自动部署脚本
# 使用宝塔 API 上传文件到服务器

param(
    [string]$PanelUrl = "http://139.196.113.91:8888",
    [string]$ApiKey = "bHXtooMGSrOlrC1jeBJPeopOPxcTpVrs",
    [string]$LocalDistPath = "d:\claw planet\clawplanet-web\dist",
    [string]$RemotePath = "/www/wwwroot/aiclawplanet.com"
)

Write-Host "=== 虾蛋星球自动部署 ===" -ForegroundColor Cyan
Write-Host ""

# 获取当前时间戳
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 检查 dist 目录
if (-not (Test-Path $LocalDistPath)) {
    Write-Error "错误：找不到 dist 目录: $LocalDistPath"
    Write-Host "请先运行: npm run build" -ForegroundColor Yellow
    exit 1
}

# 获取文件列表
$files = Get-ChildItem $LocalDistPath -File
Write-Host "找到 $($files.Count) 个文件:" -ForegroundColor Green
$files | ForEach-Object { Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 2)) KB)" }
Write-Host ""

# 构建 API 请求头
$headers = @{
    "BT-Key" = $ApiKey
}

# 上传文件的函数
function Upload-FileToBtPanel {
    param(
        [string]$FilePath,
        [string]$RemoteFileName
    )
    
    $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $fileName = Split-Path $FilePath -Leaf
    
    # 构建 multipart/form-data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: application/octet-stream",
        "",
        [System.Text.Encoding]::Default.GetString($fileBytes),
        "--$boundary--",
        ""
    ) -join $LF
    
    $body = [System.Text.Encoding]::Default.GetBytes($bodyLines)
    
    $uploadHeaders = $headers.Clone()
    $uploadHeaders["Content-Type"] = "multipart/form-data; boundary=$boundary"
    
    $uploadUrl = "$PanelUrl/files?action=upload_file&path=$RemotePath"
    
    try {
        $response = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $uploadHeaders -Body $body -TimeoutSec 60
        return $response
    } catch {
        Write-Error "上传失败: $_"
        return $null
    }
}

# 使用简单方式：直接复制到服务器（需要映射网络驱动器或使用 scp）
# 由于宝塔 API 上传文件比较复杂，我们用更简单的方式：生成一个批处理脚本

Write-Host "正在生成部署脚本..." -ForegroundColor Cyan

# 生成部署批处理文件
$deployBat = @"
@echo off
chcp 65001 >nul
echo === 虾蛋星球部署脚本 ===
echo.
echo 正在上传文件到服务器...
echo.

REM 使用 WinSCP 或类似工具上传
REM 如果没有安装，请手动上传以下文件:
echo 请手动上传以下文件到服务器:
echo.
"@

$files | ForEach-Object {
    $deployBat += "echo   - $($_.FullName) -> $RemotePath/$($_.Name)`n"
}

$deployBat += @"
echo.
echo 服务器信息:
echo   IP: 139.196.113.91
echo   路径: $RemotePath
echo.
echo 上传完成后，请重命名 bundle 文件:
echo   bundle.*.js -> bundle.js
echo.
pause
"@

$batPath = "d:\claw planet\clawplanet-web\scripts\deploy_manual.bat"
$deployBat | Out-File -FilePath $batPath -Encoding UTF8

Write-Host ""
Write-Host "部署脚本已生成: $batPath" -ForegroundColor Green
Write-Host ""
Write-Host "由于宝塔 API 上传文件需要复杂的认证，建议使用以下方式:" -ForegroundColor Yellow
Write-Host ""
Write-Host "方式1 - 手动上传:" -ForegroundColor Cyan
Write-Host "  1. 打开宝塔面板 -> 文件" -ForegroundColor White
Write-Host "  2. 进入: $RemotePath" -ForegroundColor White
Write-Host "  3. 删除旧文件 (index.html, bundle.js)" -ForegroundColor White
Write-Host "  4. 上传新文件:" -ForegroundColor White
$files | ForEach-Object { Write-Host "     - $($_.Name)" -ForegroundColor White }
Write-Host "  5. 重命名 bundle.*.js -> bundle.js" -ForegroundColor White
Write-Host ""
Write-Host "方式2 - 使用 WinSCP 自动上传 (推荐):" -ForegroundColor Cyan
Write-Host "  我可以帮你配置 WinSCP 脚本实现一键上传" -ForegroundColor White
Write-Host ""

# 同时生成 WinSCP 脚本
$winscpScript = @"
# WinSCP 自动上传脚本
# 使用方法: WinSCP.com /script=upload.txt

open sftp://admin@139.196.113.91/ -hostkey="*"
cd $RemotePath
rm index.html
rm bundle.js
put "$LocalDistPath\index.html"
put "$LocalDistPath\bundle.*.js"
# 重命名 bundle 文件
mv bundle.*.js bundle.js
close
exit
"@

$winscpPath = "d:\claw planet\clawplanet-web\scripts\winscp_upload.txt"
$winscpScript | Out-File -FilePath $winscpPath -Encoding UTF8

Write-Host "WinSCP 脚本已生成: $winscpPath" -ForegroundColor Green
Write-Host ""
Write-Host "如果你安装了 WinSCP，可以运行:" -ForegroundColor Cyan
Write-Host "  WinSCP.com /script=`"$winscpPath`"" -ForegroundColor White
