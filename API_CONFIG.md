# API Configuration

This document explains how to configure the client to point to a different API server.

## Configuration

By default, the client makes API requests using relative URLs (e.g., `/api/food-truck`), which means it expects the API to be served from the same host as the client.

To configure the client to point to a different API server, set the `VITE_API_BASE_URL` environment variable.

### Environment Variable

Create a `.env` file in the project root (or in the `client/` directory) and add:

```bash
# Point to a different API server
VITE_API_BASE_URL=https://api.yourdomain.com

# Or for local development with different ports
VITE_API_BASE_URL=http://localhost:3000

# Leave empty for relative URLs (default behavior)
VITE_API_BASE_URL=
```

### Examples

1. **Same host (default)**: Leave `VITE_API_BASE_URL` empty or omit it entirely
   - API calls go to `/api/food-truck`, `/api/locations`, etc.

2. **Different host**: Set `VITE_API_BASE_URL=https://api.example.com`
   - API calls go to `https://api.example.com/api/food-truck`, etc.

3. **Different port**: Set `VITE_API_BASE_URL=http://localhost:3000`
   - API calls go to `http://localhost:3000/api/food-truck`, etc.

## How it works

The configuration is handled by:

1. `client/src/lib/config.ts` - Contains the configuration logic
2. `client/src/lib/queryClient.ts` - Updated to use the configuration
3. All components updated to use the `getApiUrl()` helper function

## Files affected

- All API fetch calls now use the `getApiUrl()` helper
- Authentication URLs (login/logout) also use the configuration
- Mapbox token fetching uses the configuration

This ensures all API communication respects the configured base URL. 