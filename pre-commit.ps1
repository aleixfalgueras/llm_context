$branch = git rev-parse --abbrev-ref HEAD
if ($branch -eq 'main' -or $branch -eq 'master') {
  Write-Host "🚫 Commits on '$branch' are blocked. Checkout a feature branch."
  [Environment]::Exit(1)
}
