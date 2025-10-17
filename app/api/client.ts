// API client for interacting with the FastAPI backend

const API_BASE_URL = 'http://192.168.87.162:8000'; // Use the same IP address shown in the Metro logs

// Generic API request function
async function apiRequest(endpoint: string, method: string = 'GET', data?: any) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making ${method} request to: ${url}`);

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return responseData;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// User API methods
export const userApi = {
  createUser: (userData: any) => {
    return apiRequest('/users/', 'POST', userData);
  },

  getUserByEmail: (email: string) => {
    return apiRequest(`/users/${email}`);
  },

  // Updated methods for address handling
  getUserAddress: (email: string) => {
    return apiRequest(`/address/user/${encodeURIComponent(email)}`);
  },

  updateUserAddress: (email: string, addressData: any) => {
    return apiRequest(`/address/user/${encodeURIComponent(email)}`, 'POST', addressData);
  },
};

// Intake form API methods
export const intakeFormApi = {
  initializeForm: (email: string) => {
    return apiRequest(`/intake/initialize/${email}`, 'POST');
  },

  getIntakeForm: (email: string) => {
    return apiRequest(`/intake/${email}`);
  },

  updateIntakeForm: (email: string, formData: any) => {
    return apiRequest(`/intake/${email}`, 'PUT', formData);
  },

  // Add this new method for strength measurements
  saveStrengthMeasurements: (email: string, strengthData: any) => {
    return apiRequest(`/intake/${email}/strength-measurements`, 'POST', strengthData);
  },
  
};

export const goalsApi = {
  createGoals: (email: string, goalsData: any) => {
    return apiRequest(`/goals?email=${email}`, 'POST', goalsData);
  },

  getGoals: (email: string) => {
    return apiRequest(`/goals/${email}`);
  },

  updateGoals: (email: string, goalsData: any) => {
    return apiRequest(`/goals/${email}`, 'PUT', goalsData);
  },
};
