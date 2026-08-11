const APP_ENVIRONMENTS = ['local', 'staging', 'production'];

function getAppEnvironment(value = process.env.APP_ENV) {
  const environment = value || 'local';

  if (!APP_ENVIRONMENTS.includes(environment)) {
    throw new Error(`APP_ENV must be one of: ${APP_ENVIRONMENTS.join(', ')}.`);
  }

  return environment;
}

function getApiBaseUrl(value = process.env.API_BASE_URL, environment = getAppEnvironment()) {
  if (!value) {
    if (environment === 'local') {
      return '';
    }

    throw new Error(`API_BASE_URL is required when APP_ENV is ${environment}.`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('API_BASE_URL must be an absolute HTTP(S) URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('API_BASE_URL must use HTTP or HTTPS.');
  }

  return url.toString().replace(/\/$/, '');
}

function getAllowedOrigins(value = process.env.SITE_ORIGIN, environment = getAppEnvironment()) {
  const origins = (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (environment !== 'local' && origins.length === 0) {
    throw new Error(`SITE_ORIGIN is required when APP_ENV is ${environment}.`);
  }

  return origins;
}

module.exports = { getAllowedOrigins, getApiBaseUrl, getAppEnvironment };
