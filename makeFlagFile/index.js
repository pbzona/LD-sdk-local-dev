const fs = require('fs');
const https = require('https');
const launchdarkly = require('launchdarkly-node-server-sdk');

require('dotenv').config();

// writeFlagsToFile actually serves two purposes - it creates the initial flag file
// to read from on the local version of `variation`, but it can also be run subsequently
// to keep local dev environment in sync with the upstream (e.g. the LD dev environment)
async function writeFlagsToFile() {

  // Define a user context - for the purposes of this script it doesn't actually matter
  // what you put here as long as it has a `key` property. The variations are meant to be 
  // overridden so the "real" values will only serve as defaults
  const user = {
    key: 'someUserKey'
  }

  const ldClient = launchdarkly.init(process.env.LD_SDK_KEY);
  await ldClient.waitForInitialization();

  // Make a request to get all flags - this returns a bunch of metadata
  // about each flag including targeting state, rules, segments, and all
  // the information the SDK would normally use to evaluate a flag
  https.get('https://sdk.launchdarkly.com/sdk/latest-all',
  {
    headers: { 'Authorization': process.env.LD_SDK_KEY }
  }, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', async () => {
      let flags = {};
      for (let [flagKey, flagValues] of Object.entries(JSON.parse(data).flags)) {

        // Picking off a couple useful properties from the flags object, but you 
        // could choose to include more at this point. Keep readability of the 
        // resulting file in mind here
        const { on, variations } = flagValues;
        flags[flagKey] = {
          on, 
          variations,
          value: await ldClient.variation(flagKey, user, null)
        }
      }
      
      // Write flags to a file - this will be read by the mock SDK client
      fs.writeFileSync('../flags.js', 'const Flags = ' + JSON.stringify(flags));
    });
    
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });

  ldClient.close();
}

writeFlagsToFile();