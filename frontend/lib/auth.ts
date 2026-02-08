import { User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

// Helper function to set auth token in localStorage
function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

// Helper function to remove auth token from localStorage
function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

// Helper function to make authenticated API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Sign in function
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Sign in failed");
    }

    const data = await response.json();
    const { access_token, user } = data;

    // Store the token
    setAuthToken(access_token);

    return { user, token: access_token };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

// Sign up function
export async function signUp(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Sign up failed");
    }

    const data = await response.json();
    const { access_token, user } = data;

    // Store the token
    setAuthToken(access_token);

    return { user, token: access_token };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
}

// Sign out function
export function signOut(): void {
  removeAuthToken();
}

// Check auth state function
export function checkAuthState(): { isAuthenticated: boolean; user: User | null } {
  if (typeof window === "undefined") {
    // Server-side, return default state
    return { isAuthenticated: false, user: null };
  }

  const token = getAuthToken();
  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  // In a real app, you might want to validate the token with an API call
  // For now, we'll decode the token to get user info (assuming it's a JWT)
  try {
    // Simple JWT token decoding to extract user info
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return { isAuthenticated: false, user: null };
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const user: User = {
      userId: payload.sub,
      email: payload.email || "",
    };

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      removeAuthToken();
      return { isAuthenticated: false, user: null };
    }

    return { isAuthenticated: true, user };
  } catch (error) {
    console.error("Error decoding token:", error);
    removeAuthToken();
    return { isAuthenticated: false, user: null };
  }
}

// Get current user function
export async function getCurrentUser(): Promise<User> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

// Refresh token function (if needed)
export async function refreshToken(): Promise<string | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      removeAuthToken();
      return null;
    }

    const data = await response.json();
    const newToken = data.access_token;

    setAuthToken(newToken);
    return newToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    removeAuthToken();
    return null;
  }
}