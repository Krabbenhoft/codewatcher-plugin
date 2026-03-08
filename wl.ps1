$username = Get-Content -Path "username.txt" -Raw
$username = $username.Trim()

$extensionsPath = "/mnt/c/Users/$username/.vscode/extensions/"

Write-Host "Removing old extension..."
Remove-Item -Path "$extensionsPath/watcher" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Copying new extension..."
Copy-Item -Path "watcher" -Destination $extensionsPath -Recurse -Force

Write-Host "Launching dev window..."
code --extensionDevelopmentPath="$extensionsPath"
