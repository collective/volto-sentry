import { fetchFromAPI } from '../helpers/helpers';
const exec = () => {};

export const createSentryRelease = async () => {
  console.log('intru in create');
  console.log(process.env.RAZZLE_SENTRY_AUTH_TOKEN);
  let PARAM = process.env.RAZZLE_SENTRY_PARAM;
  if (!PARAM) PARAM = 'not forced';

  let CREATE;

  if (
    process.env.RAZZLE_SENTRY_AUTH_TOKEN &&
    process.env.RAZZLE_SENTRY_URL &&
    process.env.RAZZLE_SENTRY_ORG &&
    process.env.RAZZLE_SENTRY_PROJECT &&
    process.env.RAZZLE_SENTRY_RELEASE
  ) {
    CREATE = true;

    if (PARAM !== '--force') {
      let releases = await fetchFromAPI(
        'api/0/organizations/uclass-software/releases/',
        { Authorization: `Bearer ${process.env.RAZZLE_SENTRY_AUTH_TOKEN}` },
      );
      if (
        releases?.find(
          (release) =>
            release?.version === process.env.RAZZLE_SENTRY_RELEASE &&
            release?.projects.find(
              (proj) => proj?.slug === process.env.RAZZLE_SENTRY_PROJECT,
            ),
        )
      )
        CREATE = false;
    }
    if (CREATE === true) {
      await fetchFromAPI(
        `api/0/organizations/${process.env.RAZZLE_SENTRY_ORG}/releases/`,
        {
          Authorization: `Bearer ${process.env.RAZZLE_SENTRY_AUTH_TOKEN}`,

          method: 'POST',
          body: {
            version: process.env.RAZZLE_SENTRY_RELEASE,
            projects: [process.env.RAZZLE_SENTRY_PROJECT],
          },
        },
      );
      let response = await fetchFromAPI(
        `api/0/organizations/${process.env.RAZZLE_SENTRY_ORG}/releases/${process.env.RAZZLE_SENTRY_RELEASE}/files/`,
        {
          Authorization: `Bearer ${process.env.RAZZLE_SENTRY_AUTH_TOKEN}`,
          contentType: 'multipart/form-data',
          method: 'POST',
          body: {
            name: '../../../../build/public/static',
            file: 'static',
          },
        },
      );
      console.log(response);
    } else {
      console.log(
        `Release ${process.env.RAZZLE_SENTRY_RELEASE} already exists`,
      );
      console.log('Use --force if you still want to upload the source maps');
    }
  } else console.log('SENTRY is not configured');
};
