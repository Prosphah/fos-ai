# Re-exports every flyer PNG with headless Chrome.
#
# Each flyer renders as a single fixed-size sheet, so the window size IS the
# output size. --virtual-time-budget lets the local woff2 fonts settle before
# the capture.

# Chrome logs its "bytes written" line to stderr, which PowerShell surfaces as
# an error record. Success is judged by the file on disk, not by stderr.
$ErrorActionPreference = "Continue"

# The sheet lives one level up from this script.
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw "No Chrome or Edge found." }

$jobs = @(
  @{ c = "01"; s = "square";   w = 1080; h = 1080 },
  @{ c = "02"; s = "square";   w = 1080; h = 1080 },
  @{ c = "03"; s = "square";   w = 1080; h = 1080 },
  @{ c = "01"; s = "portrait"; w = 1080; h = 1440 },
  @{ c = "02"; s = "portrait"; w = 1080; h = 1440 },
  @{ c = "03"; s = "portrait"; w = 1080; h = 1440 }
)

foreach ($j in $jobs) {
  $ratio = if ($j.s -eq "portrait") { "3x4" } else { "1x1" }
  $out = Join-Path $root "png\flyer-$($j.c)-$ratio.png"
  $url = "file:///$($root -replace '\\','/')/flyers.html?c=$($j.c)&s=$($j.s)"

  & $chrome --headless=new --disable-gpu --hide-scrollbars `
    --force-device-scale-factor=1 --window-size="$($j.w),$($j.h)" `
    --virtual-time-budget=5000 --screenshot="$out" $url 2>&1 | Out-Null

  if (-not (Test-Path $out)) { Write-Error "failed: $out" }
  else { Write-Host "flyer-$($j.c)-$ratio.png  ($($j.w)x$($j.h))" }
}