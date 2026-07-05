Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$srcPath = Join-Path $root 'assets\images\icon.png'
$resDir = Join-Path $root 'android\app\src\main\res'
$src = [System.Drawing.Image]::FromFile($srcPath)

# density -> [foregroundSize, legacySize]
$dens = @{
  'mdpi'    = @(108, 48)
  'hdpi'    = @(162, 72)
  'xhdpi'   = @(216, 96)
  'xxhdpi'  = @(324, 144)
  'xxxhdpi' = @(432, 192)
}

function New-Canvas([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  return @($bmp, $g)
}

foreach ($d in $dens.Keys) {
  $fgSize = $dens[$d][0]
  $lgSize = $dens[$d][1]
  $dir = Join-Path $resDir "mipmap-$d"

  # ---- Adaptive foreground: logo at 66% on transparent ----
  $c = New-Canvas $fgSize
  $bmp = $c[0]; $g = $c[1]
  $inner = [int]($fgSize * 0.66)
  $off = [int](($fgSize - $inner) / 2)
  $g.DrawImage($src, $off, $off, $inner, $inner)
  $g.Dispose()
  # remove existing webp to avoid duplicate resource, write png
  Remove-Item (Join-Path $dir 'ic_launcher_foreground.webp') -ErrorAction SilentlyContinue
  $bmp.Save((Join-Path $dir 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  # ---- Legacy square launcher: full framed logo ----
  $c = New-Canvas $lgSize
  $bmp = $c[0]; $g = $c[1]
  $g.DrawImage($src, 0, 0, $lgSize, $lgSize)
  $g.Dispose()
  Remove-Item (Join-Path $dir 'ic_launcher.webp') -ErrorAction SilentlyContinue
  $bmp.Save((Join-Path $dir 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  # ---- Legacy round launcher: maroon circle + logo fully inside ----
  $c = New-Canvas $lgSize
  $bmp = $c[0]; $g = $c[1]
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#630B0B'))
  $g.FillEllipse($brush, 0, 0, $lgSize, $lgSize)
  $brush.Dispose()
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse(0, 0, $lgSize, $lgSize)
  $g.SetClip($path)
  $rInner = [int]($lgSize * 0.78)
  $rOff = [int](($lgSize - $rInner) / 2)
  $g.DrawImage($src, $rOff, $rOff, $rInner, $rInner)
  $g.Dispose()
  $path.Dispose()
  Remove-Item (Join-Path $dir 'ic_launcher_round.webp') -ErrorAction SilentlyContinue
  $bmp.Save((Join-Path $dir 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  Write-Host "Generated mipmap-$d (fg=$fgSize, legacy=$lgSize)"
}

$src.Dispose()
Write-Host 'Done.'
