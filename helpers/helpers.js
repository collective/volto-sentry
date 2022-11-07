export const API = process.env.RAZZLE_SENTRY_URL;

/**
 * A helper function to fetch data from your API.
 */
export async function fetchFromAPI(endpointURL, opts) {
  const { method, body, Authorization, contentType } = {
    method: 'GET',
    body: null,
    ...opts,
  };

  try {
    const res = await fetch(`${API}/${endpointURL}`, {
      method,
      ...(body && { body: JSON.stringify(body) }),
      headers: {
        'Content-Type': contentType || 'application/json',
        Authorization,
      },
    });
    return res.json();
  } catch (error) {
    console.error(error);
  }
  return undefined;
}
