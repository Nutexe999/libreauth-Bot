$ErrorActionPreference = 'SilentlyContinue'
$s = git status --porcelain 2>$null
if (-not $s) {
    Write-Output (Get-Date -Format 'yyyy-MM-dd HH:mm')
    exit 0
}
$n = @($s).Count
$top = @($s | ForEach-Object {
    $p = $_.Substring(3).Trim()
    if ($p -match '[\\/]') { ($p -split '[\\/]')[0] } else { $p }
} | Select-Object -Unique -First 3) -join ', '
if ($n -gt 3) { $top += " +$($n - 3) more" }
if ($top) { Write-Output "update: $top" }
else { Write-Output (Get-Date -Format 'yyyy-MM-dd HH:mm') }
