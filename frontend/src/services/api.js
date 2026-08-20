const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const TOKEN_KEY = "clinicianmind_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Standardized HTTP fetch wrapper with automatic JWT injection and error unwrapping.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Backend returns unified error: { detailed_message, status_code, message, timestamp }
      const errorMsg =
        data?.detailed_message || data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network or server unreachable error
    const networkError = new Error(
      "Unable to connect to the ClinicianMind backend server. Please make sure it is running on http://localhost:8000."
    );
    networkError.status = 0;
    throw networkError;
  }
}

// -------------------------------------------------------------
// Authentication & Profile Services
// -------------------------------------------------------------
export const authApi = {
  signup: ({ fullName, email, password }) =>
    request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ full_name: fullName, email, password }),
    }),

  login: ({ email, password }) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request("/api/auth/me"),

  updateProfile: ({ fullName, email, newPassword, currentPassword }) =>
    request("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        full_name: fullName || null,
        email: email || null,
        new_password: newPassword || null,
        current_password: currentPassword || null,
      }),
    }),
};

// -------------------------------------------------------------
// Clinical Chat & Conversation Services
// -------------------------------------------------------------
export const chatApi = {
  // Starts consultation (Guest returns live RAG without DB; Auth saves to DB)
  createChat: ({ message, history = null }) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  // Sends follow-up message in existing consultation
  sendMessage: (chatId, { message }) =>
    request(`/api/chat/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  // List all user conversations
  getConversations: () => request("/api/chat"),

  // Get full messages for a conversation
  getConversation: (chatId) => request(`/api/chat/${chatId}`),

  // Delete a conversation
  deleteConversation: (chatId) =>
    request(`/api/chat/${chatId}`, {
      method: "DELETE",
    }),

  // Bookmark a message
  toggleBookmark: (messageId) =>
    request(`/api/messages/${messageId}/bookmark`, {
      method: "POST",
    }),

  // Get all bookmarked messages
  getBookmarks: () => request("/api/bookmarks"),
};

// -------------------------------------------------------------
// Reference Document Library Services
// -------------------------------------------------------------
export const documentsApi = {
  getDocuments: () => request("/api/documents"),
  getDocumentViewUrl: (fileName, page = null) => {
    let resolved = String(fileName || "file1.pdf");
    const lower = resolved.toLowerCase();
    if (lower.includes("who") || lower.includes("file1")) {
      resolved = "file1.pdf";
    } else if (lower.includes("nice") || lower.includes("file2") || lower.includes("ng136")) {
      resolved = "file2.pdf";
    } else if (!resolved.endsWith(".pdf")) {
      resolved = `${resolved}.pdf`;
    }

    let url = `${API_BASE_URL}/api/documents/${resolved}/view`;
    if (page) {
      const match = String(page).match(/\d+/);
      if (match) {
        url += `#page=${match[0]}`;
      }
    }
    return url;
  },
  getDocumentDownloadUrl: (fileName) => {
    let resolved = String(fileName || "file1.pdf");
    const lower = resolved.toLowerCase();
    if (lower.includes("who") || lower.includes("file1")) resolved = "file1.pdf";
    else if (lower.includes("nice") || lower.includes("file2") || lower.includes("ng136")) resolved = "file2.pdf";
    else if (!resolved.endsWith(".pdf")) resolved = `${resolved}.pdf`;
    return `${API_BASE_URL}/api/documents/${resolved}/download`;
  },
};
