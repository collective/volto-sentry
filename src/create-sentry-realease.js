const exec = () => {};

const fetchFromSentry = async (endpoint) => {};

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
    console.log('intru aici');
    if (PARAM !== '--force') {
      let getSentryReleaseURL =
        'https://sentry.io/api/0/organizations/uclass-software/releases/';
      //try and cath
      console.log(getSentryReleaseURL);
      const response = await fetch(
        'https://sentry.io/api/0/organizations/uclass-software/releases/',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Bearer 0adf3f65943944d6a2b9ab3f893f446d1423b26a02694230b741378b42223444',
          },
        },
        {},
      );
      console.log(response);
      // exec(
      //   `./node_modules/@sentry/cli/sentry-cli releases info ${process.env.RAZZLE_SENTRY_RELEASE} | grep -q ${process.env.RAZZLE_SENTRY_RELEASE}`,
      //   (err, output) => {
      //     if (err) {
      //       // log and return if we encounter an error
      //       return;
      //     }
      //     if (output) {
      //       CREATE = false;
      //     }
      //   },
      // );
    }
    if (CREATE === true) {
      // exec(
      //   ` ./node_modules/@sentry/cli/sentry-cli releases new ${process.env.RAZZLE_SENTRY_RELEASE}`,
      //   (err, output) => {
      //     if (err) {
      //       console.log(err);
      //       // log and return if we encounter an error
      //       return;
      //     }
      //     console.log(output);
      //   },
      // );
      // exec(
      //   `./node_modules/@sentry/cli/sentry-cli releases files ${process.env.RAZZLE_SENTRY_RELEASE} upload ./build/public/static/ --url-prefix "~/static"`,
      //   (err, output) => {
      //     if (err) {
      //       console.log(err);
      //       // log and return if we encounter an error
      //       return;
      //     }
      //   },
      // );
      // exec(
      //   ` ./node_modules/@sentry/cli/sentry-cli releases finalize ${process.env.RAZZLE_SENTRY_RELEASE}`,
      //   (err, output) => {
      //     if (err) {
      //       console.log(err);
      //       // log and return if we encounter an error
      //       return;
      //     }
      //   },
      // );
    } else {
      console.log(
        `Release ${process.env.RAZZLE_SENTRY_RELEASE} already exists`,
      );
      console.log('Use --force if you still want to upload the source maps');
    }
  } else console.log('SENTRY is not configured');
};
