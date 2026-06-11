# One-off helper: rebuilds app icons and the OG banner from public/logo.png
param([string]$Root = "d:\VSCode\exportready")

Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $Root "public\logo.png"
$src = [System.Drawing.Image]::FromFile($srcPath)

function New-SquareIcon([int]$size, [string]$outPath, [System.Drawing.Image]$img) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::White)
  $pad = [int]($size * 0.02)
  $avail = $size - 2 * $pad
  $scale = [Math]::Min($avail / $img.Width, $avail / $img.Height)
  $w = [int]($img.Width * $scale)
  $h = [int]($img.Height * $scale)
  $x = [int](($size - $w) / 2)
  $y = [int](($size - $h) / 2)
  $g.DrawImage($img, $x, $y, $w, $h)
  $g.Dispose()
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $outPath ($size x $size)"
}

New-SquareIcon 512 (Join-Path $Root "src\app\icon.png") $src
New-SquareIcon 180 (Join-Path $Root "src\app\apple-icon.png") $src

# OG banner 1200x630
$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 247, 240))
$g.FillRectangle($bg, 0, 0, $W, $H)

$amber = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 148, 31))
$g.FillRectangle($amber, 0, $H - 14, $W, 14)

# Logo on right
$logoSize = 440
$scale = [Math]::Min($logoSize / $src.Width, $logoSize / $src.Height)
$lw = [int]($src.Width * $scale); $lh = [int]($src.Height * $scale)
$g.DrawImage($src, $W - $lw - 70, [int](($H - 14 - $lh) / 2), $lw, $lh)

# Text on left
$navy = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(27, 58, 107))
$gray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 100, 115))
$titleFont = New-Object System.Drawing.Font("Segoe UI", 58, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Segoe UI", 26, [System.Drawing.FontStyle]::Regular)
$smallFont = New-Object System.Drawing.Font("Segoe UI", 17, [System.Drawing.FontStyle]::Regular)

$g.DrawString("ExportReady AI", $titleFont, $navy, 60, 200)
$g.DrawString("Cek Kesiapan Ekspor UMKM Anda", $subFont, $gray, 66, 310)
$g.DrawString("Skor kesiapan 0-100  -  Negara tujuan  -  Roadmap 4 fase", $smallFont, $gray, 68, 370)

$g.Dispose()
$bmp.Save((Join-Path $Root "public\og-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$src.Dispose()
Write-Host "Wrote og-image.png (1200 x 630)"
