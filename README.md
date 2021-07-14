# Github-Voice-Notes
Github Voice Notes allows you to record and attach voice recording comments on Github pull request reviews. It only works on Chromium-based browsers such as Google Chrome and Brave. Feel free to make a pull request and I'll take a look.

# Setup and development
1. Create a .env file on repo root from .env.sample.
1. Run `npm run start`
1. Go to `chrome://extensions/` and click `Load unpacked`. Attach the `build/` dir that will be present on the repo root as a result of the `npm run start`. It will say `Extension Loaded` and you should see the extension appear.
1. Load up any pull request page on Github and you should see it embeded on any comment input field.

### Gotchas during development
1. `Uncaught Error: Extension context invalidated.` means you reloaded the extension and tried to use it on the page. Reload the page and this will go away.

## Deploying
This section is irrelevant for contributors and Ryan will handle deployments.
1. Set NODE_ENV to prod and any other necessary env confs from the .env.sample.
1. Increment the manifest.json version.
1. Run `npm run build`.
1. Zip the build/ dir.
1. Upload it to the dev console on Chrome webstore dev. Review will take about 2 days.

