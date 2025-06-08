import axios from "/node_modules/.vite/deps/axios.js?v=36436e12";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "/api",
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    // Fix: Use the correct token key that AuthContext uses
    const token = localStorage.getItem("auth-token");
    console.log("MessageService using token:", token ? "exists" : "missing");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized request - token may be invalid");
      // You might want to trigger logout here
      // localStorage.removeItem('auth-token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Message services
const messageService = {
  // Get user conversations
  getConversations: () => {
    return api.get("/conversations");
  },

  // Get conversation by ID
  getConversation: (id) => {
    return api.get(`/conversations/${id}`);
  },

  // Create new conversation
  createConversation: (conversationData) => {
    return api.post("/conversations", conversationData);
  },

  // Get messages by conversation
  getMessagesByConversation: (conversationId) => {
    return api.get(`/messages/conversation/${conversationId}`);
  },

  // Send a message
  sendMessage: (messageData) => {
    return api.post("/messages", messageData);
  },

  // Mark messages in a conversation as read
  markMessagesAsRead: (conversationId) => {
    return api.post(`/conversations/${conversationId}/read`);
  },
};

export default messageService;
