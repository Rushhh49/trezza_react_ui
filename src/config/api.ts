// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://89.116.34.13:13000",
  // TODO: Update this token when it expires - current token expires on 2025-01-30
  AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoiYWRtaW4iLCJpYXQiOjE3NTQ4MzIyNDIsImV4cCI6MzMzMTI0MzIyNDJ9.knPDyJFwJINHlzdC43W2HVO28aotjJQqHKiLaOFqmvQ"
};

// Helper function to get headers with authentication
export const getAuthHeaders = () => ({
  Authorization: `Bearer ${API_CONFIG.AUTH_TOKEN}`
});
