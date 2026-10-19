# volto-sentry

## Features

A Volto add-on that provides [Sentry.io](https://sentry.io/welcome/) integration.

## Prerequisites
  
  1. In Sentry create a new organization, and add a project to it.
  2. Create an API Token: on the top left corner, click on your name -> API keys and create a new token, "project:write" scope should be selected.

## Buildtime and Runtime
The configuration is done using environment variables:

  * `SENTRY_DSN` - required to enable the feature
  * `SENTRY_URL` - the URL of Sentry
  * `SENTRY_AUTH_TOKEN` - the authentication token for Sentry
  * `SENTRY_ORG` - the name of the organization in Sentry
  * `SENTRY_PROJECT` -the name of the project in Sentry
  * `SENTRY_RELEASE` - release number
  
If these environment variables are configured, when the app is built or starts locally, a new release will be created in Sentry.
The source code and source maps will be uploaded to Sentry, too.
After starting the application, if an error occurs, the errors will be sent to Sentry, and will be linked to the specified release.

## Upgrade

This version requires `@plone/volto >= 16.0.0.alpha.45` (`sentry` removed from Volto Core).

## Installing the addon

1. If you already have a Volto project, update `package.json`:

   ```json
   "addons": [
      "@plone-collective/volto-sentry"
   ],

   "dependencies": {
      "@plone-collective/volto-sentry": "*"
   }
   ```

1. If not, create one:

   ```
   npm install -g yo @plone/generator-volto
   yo @plone/volto my-volto-project --addon @plone-collective/volto-sentry
   cd my-volto-project
   ```


1. Install new add-ons and restart Volto:

   ```
   yarn
   yarn start
   ```

1. Go to http://localhost:3000

1. Happy editing!
