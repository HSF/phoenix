#!/bin/bash

# Environment variables

# Default from Travis
# TRAVIS_PULL_REQUEST       - The pull request number if the pipeline runs on a pull request
# TRAVIS_REPO_SLUG          - User and repository name as in GitHub URL `HSF/phoenix`
# TRAVIS_PULL_REQUEST_SHA   - SHA of the commit associated with the pull request

# Set in Travis settings
# SURGE_LOGIN               - Surge email account for deploying to surge
# GH_TOKEN                  - GitHub token to update the pull request status
# SURGE_TOKEN               - Token for deploying to surge (isn't use in the code but required in Travis settings)

if [ "$TRAVIS_PULL_REQUEST" != false ]
then

if [ -z ${SURGE_LOGIN+x} ]
then

echo "Cannot deploy PR from a fork"

else

PR_DOMAIN=http://phoenix-pr-${TRAVIS_PULL_REQUEST}.surge.sh
GH_API_PR=https://api.github.com/repos/${TRAVIS_REPO_SLUG}/statuses/${TRAVIS_PULL_REQUEST_SHA}

echo "Setting up surge"

npm install surge --global
npm run deploy:web

echo "Deploying PR to surge"

surge --project ./packages/phoenix-ng/docs/ --domain ${PR_DOMAIN};

echo "Updating PR status"

curl -H "Authorization: token ${GH_TOKEN}" --request POST ${GH_API_PR} --data '{"state": "success", "target_url": "'${PR_DOMAIN}'", "description": "Pull request deployed", "context": "Phoenix PR Deployment"}'

fi

fi
