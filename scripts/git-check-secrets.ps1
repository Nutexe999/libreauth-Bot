$ErrorActionPreference = 'SilentlyContinue'
$bad = @('.env', 'json.sqlite', 'data.sqlite')
$lines = git status --porcelain 2>$null
if (-not $lines) { exit 0 }
foreach ($line in $lines) {
    $path = $line.Substring(3).Trim()
    foreach ($b in $bad) {
        if ($path -ieq $b -or $path -like "*\$b") { exit 1 }
    }
}
exit 0
