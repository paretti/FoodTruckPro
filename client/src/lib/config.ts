// API Configuration
export const API_CONFIG = {
  // Default to relative URLs for development when client and server are on same host
  // Set VITE_API_BASE_URL environment variable to point to different server
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
} as const;

// Helper function to construct full API URLs
export function getApiUrl(endpoint: string): string {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (API_CONFIG.baseUrl) {
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = API_CONFIG.baseUrl.endsWith('/') 
      ? API_CONFIG.baseUrl.slice(0, -1) 
      : API_CONFIG.baseUrl;
    
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }
  
  // Default to relative URL (current behavior)
  return `/${cleanEndpoint}`;
} 