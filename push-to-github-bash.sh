#!/bin/bash

# Bash script to push Cloudflare essentials to GitHub

# Get GitHub username
echo "Enter your GitHub username:"
read github_username

# Configure remote repository
echo "Configuring remote repository..."
git remote set-url origin "https://github.com/$github_username/documentation-library-cloudflare.git"

# Push your code to GitHub
echo "Pushing to GitHub..."
git push -u origin master

# Check if push was successful
if [ $? -eq 0 ]; then
    echo "Successfully pushed to GitHub!"
    echo "Your Cloudflare essentials are now stored in a private GitHub repository."
    echo "Repository URL: https://github.com/$github_username/documentation-library-cloudflare"
else
    echo "Failed to push to GitHub. Please check the error message above."
    echo "Make sure you've created the repository on GitHub and that your credentials are correct."
fi
