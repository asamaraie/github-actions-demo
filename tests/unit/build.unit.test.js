const { createHtml, getApiBaseUrl } = require('../../scripts/build');

describe('getApiBaseUrl', () => {
  it('uses same-origin requests when API_BASE_URL is unset', () => {
    expect(getApiBaseUrl('', 'local')).toBe('');
  });

  it('removes a trailing slash from an API URL', () => {
    expect(getApiBaseUrl('https://api.example.com/')).toBe('https://api.example.com');
  });

  it('rejects non-HTTP API URLs', () => {
    expect(() => getApiBaseUrl('ftp://api.example.com')).toThrow(
      'API_BASE_URL must use HTTP or HTTPS.'
    );
  });

  it('requires API_BASE_URL outside local development', () => {
    expect(() => getApiBaseUrl('', 'staging')).toThrow(
      'API_BASE_URL is required when APP_ENV is staging.'
    );
  });
});

describe('createHtml', () => {
  it('uses configured API URL in client request', () => {
    expect(createHtml('https://api.example.com')).toContain(
      'fetch("https://api.example.com/api/hello")'
    );
  });
});
