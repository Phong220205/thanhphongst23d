// Server-side API utility for Next.js Server Components
// This determines the correct backend URL based on the environment

export function getBackendUrl(): string {
  // Priority order:
  // 1. NEXT_PUBLIC_BACKEND_URL_SERVER (for Docker/server-side, usually without /api)
  // 2. NEXT_PUBLIC_API_BASE_URL (fallback, might include /api)
  // 3. Default to localhost for local development

  const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SERVER;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  // Use server URL if available
  if (serverUrl) {
    return serverUrl.replace(/\/api\/?$/, ''); // Remove /api if present
  }
  
  // If API base URL is set, use it (remove /api if present)
  if (apiBaseUrl) {
    return apiBaseUrl.replace(/\/api\/?$/, '');
  }
  
  // Default to localhost for local development
  // In Docker, NEXT_PUBLIC_BACKEND_URL_SERVER should be set
  return 'http://localhost:5000';
}

export function getApiUrl(endpoint: string): string {
  const backendUrl = getBackendUrl();
  // Remove trailing slash from backendUrl
  const cleanBackendUrl = backendUrl.replace(/\/$/, '');
  // Ensure endpoint starts with / and doesn't already have /api
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // If endpoint doesn't start with /api, add it
  if (!cleanEndpoint.startsWith('/api')) {
    cleanEndpoint = `/api${cleanEndpoint}`;
  }
  return `${cleanBackendUrl}${cleanEndpoint}`;
}

