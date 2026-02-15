// API Configuration
export const API_CONFIG = {
  // BASE_URL: "http://89.116.34.13:13000",
  BASE_URL: "https://admin.yourcustom.jewelry",
  // TODO: Update this token when it expires - current token expires on 2025-01-30
  AUTH_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoicm9vdCIsImlhdCI6MTc3MTE0NDc2NSwiZXhwIjozMzMyODc0NDc2NX0.MjaTn-kQkBlk1zWOgJ1tJ62qVjo60B6fjSj61RgWlCE"
};

// Helper function to get headers with authentication
export const getAuthHeaders = () => ({
  Authorization: `Bearer ${API_CONFIG.AUTH_TOKEN}`
});
