param($localRef, $localSha, $remoteRef, $remoteSha)

# Extract branch name from remote ref
$branch = $remoteRef -replace 'refs/heads/', ''
if ($branch -eq 'main' -or $branch -eq 'master') {
  Write-Host "🚫 Blocking push to '$branch'. Use a feature branch instead."
  exit 1
}
exit 0