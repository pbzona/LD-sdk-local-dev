// Project used for testing:
// https://app.launchdarkly.com/phil-z-redis-testing/production/features

const LD_CLIENT_ID = '';
const ENVIRONMENT = 'local'; // This defaults to something like 'development'
updateEnvLabel();

const user = { key: 'someUserKey' };
const ld = LDClient.initialize(LD_CLIENT_ID, user);

// Create an incredibly simple wrapper object
// You can implement this however you want, the key point is how `variation` works
const launchdarkly = {
  __proto__: ld,
  variation: function(key, fallback) {
    if (ENVIRONMENT === 'local') {
      return Flags[key].value;
    }

    return ld.variation(key, fallback);
  }
}

// Once ready, populate the UI and subscribe to changes
launchdarkly.on('ready', () => {
  setup(launchdarkly);
})

// Util
function updateEnvLabel() {
  const env = document.getElementById('environment');
  env.innerText = ENVIRONMENT;
}

function setup(client) {
  const flagA = document.getElementById('flag-a');
  const flagB = document.getElementById('flag-b');
  const flagC = document.getElementById('flag-c');

  // Get variations and update the UI
  flagA.innerText = client.variation('flag-a');
  flagB.innerText = client.variation('flag-b');
  flagC.innerText = client.variation('flag-c');

  // Subscribe to changes
  // Need to exclude subscriptions in local environment or else changes to LD in the upstream WILL still change the values here
  client.on('change:flag-a', (value) => {
    if (ENVIRONMENT !== 'local') {
      flagA.innerText = value;
    }
  })
  
  client.on('change:flag-b', (value) => {
    if (ENVIRONMENT !== 'local') {
      flagB.innerText = value;
    }
  })
    
  client.on('change:flag-c', (value) => {
    if (ENVIRONMENT !== 'local') {
      flagC.innerText = value;
    }
  })
}