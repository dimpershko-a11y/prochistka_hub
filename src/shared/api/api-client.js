export const apiClient = {
  async get(url, options = {}) {
    const response = await fetch(url, {
      method: 'GET',
      ...options
    });

    return parseResponse(response);
  },

  async post(url, data, options = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(data),
      ...options
    });

    return parseResponse(response);
  }
};

async function parseResponse(response) {
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}
