# PowerShell script to install Cloudflare Tunnel as a Windows service
# Replace with your actual token from the Cloudflare dashboard
$token = "eyJhIjoiNzM0ZjdkOGI3MzJkNDU5ZDkzMmZlOWE5NmVjNWY0Y2YiLCJ0IjoiYzVhMzA0ZmQtMzljYy00N2JlLWJkMTYtYzI0NTMxYzQyMjQ5IiwicyI6Ik1UQXdNR1ZpTkRndE1qUTJOeTAwWkRFMExUaGtNVGN0TURJeU5qWTVNVEZoTVRNMCJ9"

# Install the service
Write-Host "Installing Cloudflare Tunnel as a Windows service..."
cloudflared.exe service install $token

# Check service status
Write-Host "Checking service status..."
Get-Service -Name "Cloudflared agent"
