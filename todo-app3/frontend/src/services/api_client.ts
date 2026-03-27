// API client for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://asultani-todo3.hf.space'); // Default to Hugging Face deployment

/**
 * Send a message to the chat endpoint
 */
export const sendMessage = async (message, conversationId = null) => {
  try {
    const headers = { 'Content-Type': 'application/json' };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, conversation_id: conversationId }),
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Fetch all tasks for a user
 */
export const fetchTasks = async () => {
  try {
    const headers = { 'Content-Type': 'application/json' };

    // Use the chat endpoint to list tasks, as the backend handles this via chat
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        message: "list my tasks",
        conversation_id: null
      }),
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Extract tasks from the response (backend returns tasks in the response content)
    return {
      tasks: data.tasks || [],
      response: data.response || 'Tasks retrieved successfully'
    };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Return empty tasks for demo purposes
    return { tasks: [], response: 'No tasks found' };
  }
};

/**
 * Update a task
 */
export const updateTask = async (taskId, taskData) => {
  try {
    const headers = { 'Content-Type': 'application/json' };

    // For now, we'll use the chat endpoint to update tasks
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `Update task ${taskId} to ${taskData.title || 'new description'}`,
        conversation_id: null
      }),
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId) => {
  try {
    const headers = { 'Content-Type': 'application/json' };

    // For now, we'll use the chat endpoint to delete tasks
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `Delete task with ID ${taskId}`,
        conversation_id: null
      }),
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    // No need to store token in localStorage as it's in HttpOnly cookie
    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Signup with email and password
 */
export const signup = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Signup failed');
    }

    // No need to store token in localStorage as it's in HttpOnly cookie
    return await response.json();
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Logout the user
 */
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Logout failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'  // Include cookies in requests
    });

    if (!response.ok) {
      // Throw error with status code to help identify unauthorized access
      const errorData = await response.json().catch(() => ({})); // In case response is not JSON
      const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
};