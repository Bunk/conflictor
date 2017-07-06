# Conflictor

A merge-conflict notification bot for GitHub pull-requests running in a serverless framework thanks to Auth0's [Webtask.io](http://webtask.io).

The genesis of this was born from a previous need that our team had to notify devs that a previous merge / build created upstream merge conflicts that needed to be resolved.

## Steps to run

1. Create a GitHub API token with `repo` access from: https://github.com/settings/tokens/new
2. Create a Slack API webhook integration from: https://SLACK_TEAM.slack.com/apps/manage/custom-integrations
3. Create a `secrets.txt` file to store tokens. (Use the template from below).
4. Generate a webtask webhook URL by running from: `npm start` OR `wt create --bundle --secrets-file secrets.txt .`
5. Install the GitHub webhook on your repo with `Push` and `Pull request` events by substituting <USERNAME> and <REPO>: https://github.com/<USERNAME>/<REPO>/settings/hooks/new
6. Optionally inspect any errors using the cli: `wt logs`

## secrets.txt
```
GITHUB_TOKEN=<your github token from step #1>
SLACK_WEBHOOK=<your slack webhook url from step #2>
```