#!/bin/bash

# Environment variables

# From GitHub actions
# PULL_REQUEST_NUMBER       - The pull request number if the pipeline runs on a pull request
# GITHUB_REPOSITORY         - User and repository name as in GitHub URL `HSF/phoenix`
# GITHUB_SHA                - SHA of the commit associated with the pull request

# Set in GitHub settings
# SURGE_LOGIN               - Surge email account for deploying to surge
# GH_TOKEN                  - GitHub token to update the pull request status
# SURGE_TOKEN               - Token for deploying to surge (isn't use in the code but required in Travis settings)

if [ "$PULL_REQUEST_NUMBER" != false ]
then

if [ -z ${SURGE_LOGIN+x} ]
then

echo "Cannot deploy PR from a fork"

else

PR_DOMAIN=http://phoenix-pr-${PULL_REQUEST_NUMBER}.surge.sh
GH_API_PR=https://api.github.com/repos/${GITHUB_REPOSITORY}/statuses/${GITHUB_SHA}

echo "Setting up surge"

yarn global add surge
yarn deploy:web

echo "Deploying PR to surge"

surge --project ./packages/phoenix-ng/docs/ --domain ${PR_DOMAIN};

echo "Updating PR status"

curl -H "Authorization: token ${GH_TOKEN}" --request POST ${GH_API_PR} --data '{"state": "success", "target_url": "'${PR_DOMAIN}'", "description": "Pull request deployed", "context": "Phoenix PR Deployment"}'

fi

fi
