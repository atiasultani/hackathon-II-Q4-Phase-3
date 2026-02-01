// API client for communicating with the backend
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://asultani-todo3.hf.space'); // Default to Hugging Face deployment

/**
 * Send a message to the chat endpoint
 */
export const sendMessage = async (userId = "user123", message, conversationId = null) => {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/${userId}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, conversation_id: conversationId })
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
export const fetchTasks = async (userId = "user123") => {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Use the chat endpoint to list tasks, as the backend handles this via chat
    const response = await fetch(`${API_BASE_URL}/api/${userId}/chat`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        message: "list my tasks",
        conversation_id: null
      })
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
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // For now, we'll use the chat endpoint to update tasks
    const response = await fetch(`${API_BASE_URL}/api/user123/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `Update task ${taskId} to ${taskData.title || 'new description'}`,
        conversation_id: null
      })
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
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // For now, we'll use the chat endpoint to delete tasks
    const response = await fetch(`${API_BASE_URL}/api/user123/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `Delete task with ID ${taskId}`,
        conversation_id: null
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Get a token for a specific user ID (for demo purposes)
 */
export const getTokenForUser = async (userId = 'user123') => {
  try {
    // Try the login endpoint first
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      // If login endpoint doesn't exist, try the token endpoint
      const tokenResponse = await fetch(`${API_BASE_URL}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!tokenResponse.ok) {
        // Fallback for development - create a simple token
        const token = 'demo-token-' + userId + '-' + Date.now();
        localStorage.setItem('token', token);
        return token;
      }

      const data = await tokenResponse.json();

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        return data.access_token;
      }
      return null;
    }

    const data = await response.json();

    // Store the token in localStorage
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      return data.access_token;
    }

    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    // Fallback for development
    const fallbackToken = 'fallback-token-' + userId + '-' + Date.now();
    localStorage.setItem('token', fallbackToken);
    return fallbackToken;
  }
};