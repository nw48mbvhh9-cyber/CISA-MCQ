param (
    [string]$Project = "YOUR-PROJECT-ID",
    [string]$Region = "us-central1"
)

Write-Host "Deploying Frontend to Cloud Run in project '$Project' to region '$Region'..."

# Make sure you are authenticated
# gcloud auth login
# gcloud config set project $Project

gcloud run deploy cisa-frontend `
    --source . `
    --project $Project `
    --region $Region `
    --port 8080 `
    --allow-unauthenticated

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment complete!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed. Check the error log above." -ForegroundColor Red
}
