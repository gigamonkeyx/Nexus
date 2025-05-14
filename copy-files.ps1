# Copy files from agent-frontend-ui to agent-frontend-ui-new
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\src\components" -Destination "D:\mcp\nexus\agent-frontend-ui-new\src\" -Recurse -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\src\contexts" -Destination "D:\mcp\nexus\agent-frontend-ui-new\src\" -Recurse -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\src\pages" -Destination "D:\mcp\nexus\agent-frontend-ui-new\src\" -Recurse -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\src\services" -Destination "D:\mcp\nexus\agent-frontend-ui-new\src\" -Recurse -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\src\App.jsx" -Destination "D:\mcp\nexus\agent-frontend-ui-new\src\" -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\src\config.js" -Destination "D:\mcp\nexus\agent-frontend-ui-new\src\" -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\src\index.css" -Destination "D:\mcp\nexus\agent-frontend-ui-new\src\" -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\.env" -Destination "D:\mcp\nexus\agent-frontend-ui-new\" -Force
Copy-Item -Path "D:\mcp\nexus\agent-frontend-ui\README.md" -Destination "D:\mcp\nexus\agent-frontend-ui-new\" -Force

# Update package.json to include our dependencies
$packageJson = Get-Content -Path "D:\mcp\nexus\agent-frontend-ui-new\package.json" -Raw | ConvertFrom-Json
$packageJson.dependencies | Add-Member -Name "@emotion/react" -Value "^11.11.0" -MemberType NoteProperty -Force
$packageJson.dependencies | Add-Member -Name "@emotion/styled" -Value "^11.11.0" -MemberType NoteProperty -Force
$packageJson.dependencies | Add-Member -Name "@mui/icons-material" -Value "^5.11.16" -MemberType NoteProperty -Force
$packageJson.dependencies | Add-Member -Name "@mui/material" -Value "^5.13.0" -MemberType NoteProperty -Force
$packageJson.dependencies | Add-Member -Name "axios" -Value "^1.4.0" -MemberType NoteProperty -Force
$packageJson.dependencies | Add-Member -Name "react-markdown" -Value "^8.0.7" -MemberType NoteProperty -Force
$packageJson.dependencies | Add-Member -Name "react-query" -Value "^3.39.3" -MemberType NoteProperty -Force
$packageJson.dependencies | Add-Member -Name "react-router-dom" -Value "^6.11.1" -MemberType NoteProperty -Force
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "D:\mcp\nexus\agent-frontend-ui-new\package.json"

Write-Host "Files copied successfully!"
