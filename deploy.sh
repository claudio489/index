#!/bin/bash
# Deploy INDEX PWA to GitHub Pages
# Usage: bash deploy.sh

set -e

echo "=== INDEX PWA - GitHub Pages Deploy ==="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "ERROR: GitHub CLI (gh) not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "ERROR: Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

# Get GitHub username
USERNAME=$(gh api user -q '.login')
REPO_NAME="index"
REPO_URL="https://github.com/$USERNAME/$REPO_NAME"

echo "GitHub user: $USERNAME"
echo "Repo: $REPO_NAME"
echo ""

# Check if repo exists, create if not
if ! gh repo view "$USERNAME/$REPO_NAME" &> /dev/null; then
    echo "Creating repository $REPO_NAME..."
    gh repo create "$REPO_NAME" --public --source=. --push --description "INDEX by DiveSpot - PWA for technical diving"
else
    echo "Repository exists, pushing..."
    git push origin main
fi

# Build
echo ""
echo "Building..."
npm run build

# Deploy to gh-pages
echo ""
echo "Deploying to GitHub Pages..."
npx gh-pages -d dist

# Enable GitHub Pages
echo ""
echo "Enabling GitHub Pages..."
gh api "repos/$USERNAME/$REPO_NAME/pages" -X POST -f source.branch=gh-pages -f source.path=/ 2>/dev/null || true

echo ""
echo "========================================"
echo "DEPLOY COMPLETE!"
echo ""
echo "Your PWA will be available at:"
echo "  https://$USERNAME.github.io/$REPO_NAME"
echo ""
echo "If first deploy, wait 2-5 minutes for"
echo "GitHub Pages to propagate."
echo "========================================"
