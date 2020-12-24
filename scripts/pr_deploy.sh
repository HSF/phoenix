#!/bin/bash

if [ "$TRAVIS_PULL_REQUEST" != false ]
then

PR_DOMAIN=http://phoenix-pr-${TRAVIS_PULL_REQUEST}.surge.sh
GH_API_PR=https://api.github.com/repos/HSF/phoenix/pulls/${TRAVIS_PULL_REQUEST}

surge --project ../packages/phoenix-ng/docs/ --domain ${PR_DOMAIN};

curl -H "Authorization: token ${GH_TOKEN}" --request POST ${GH_API_PR} --data '{"state": "success", "target_url": "'${PR_DOMAIN}'", "description": "Pull request deployed", "context": "CollectiveDynamicDeploy"}'

fi
