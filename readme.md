# volto-sentry

## Features

- A Volto add-on that provides Sentry.io integration

## Prerequisites
  
  1. In Sentry create a new organization, and add a project to it.
  2. Create an API Token: on the top left corner, click on your name -> API keys and create a new token, "project:write" scope should be selected.

## Buildtime and Runtime
The configuration is done using environment variables:

  * `SENTRY_DSN` - required to enable the feature
  * `SENTRY_URL` - the URL of Sentry
  * SENTRY_AUTH_TOKEN - the authentication token for sentry
  * SENTRY_ORG - the name of the organization in sentry
  * SENTRY_PROJECT -the name of the project in sentry
  * SENTRY_RELEASE - release number
  
  If these env variables are configured, when the app is built or starts locally, a new release will be created in sentry, and the source code and source maps will be uploaded to it. After starting the application if an error will occure, the errors will be sent to sentry, and will be linked to the specified release.

## Upgrade

### Upgrading to 6.x

This version requires: `@plone/volto >= 16.0.0.alpha.45` (`sentry` removed from Volto Core).

## Installing the addon

1. If you already have a volto project, just update `package.json`:

   ```JSON
   "addons": [
      "@collective/volto-sentry"
   ],

   "dependencies": {
      "@collective/volto-sentry": "*"
   }
   ```

1. If not, create one:

   ```
   npm install -g yo @plone/generator-volto
   yo @plone/volto my-volto-project --canary --addon @collective/volto-sentry
   cd my-volto-project
   ```


1. Install new addons and restart Volto:

   ```
   yarn
   yarn start
   ```

1. Go to http://localhost:3000

1. Happy editing!
