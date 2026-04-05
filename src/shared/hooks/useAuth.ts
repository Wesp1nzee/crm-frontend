import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

async function fetchCurrentUser() {
  console.log("Sending request to get current user...");
  const response = await fetch(`/api/users/me`, {
    credentials: "include",
  });

  console.log("Response from /api/users/me:", response.status);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      console.log("401 Unauthorized - token removed from localStorage");
    }
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const userData = await response.json();
  console.log("Current user data received:", userData);

  return userData;
}

async function loginUser(credentials: { email: string; password: string }) {
  console.log("Sending login request with credentials:", {
    email: credentials.email,
    password: "[HIDDEN]",
  });

  const response = await fetch(`/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    credentials: "include",
  });

  console.log("Login response status:", response.status);

  if (!response.ok) {
    let errorData: { detail?: string } = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: `Login failed: ${response.status}` };
    }

    const error = new Error(
      errorData.detail || `Login failed: ${response.status}`,
    );
    (error as any).response = {
      status: response.status,
      data: errorData,
    };
    throw error;
  }

  const data = await response.json();
  console.log("Login successful - response data:", data);

  if (data.token) {
    localStorage.setItem("token", data.token);
    console.log("Token saved to localStorage");
  }

  return data;
}

async function logoutUser() {
  console.log("Sending logout request...");
  const response = await fetch(`/api/users/logout`, {
    method: "POST",
    credentials: "include",
  });

  console.log("Logout response status:", response.status);

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }

  localStorage.removeItem("token");
  console.log("Token removed from localStorage after logout");

  return response.json();
}

export function useAuth() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 0,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      console.log("Login successful, setting user data in cache");
      queryClient.setQueryData(["currentUser"], data);
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      console.log("Logout successful, clearing currentUser cache");
      queryClient.setQueryData(["currentUser"], null);
      queryClient.removeQueries({ queryKey: ["currentUser"] });

      navigate("/login", { replace: true });
    },
    onError: (error) => {
      console.error("Logout error:", error);
      queryClient.setQueryData(["currentUser"], null);
      queryClient.removeQueries({ queryKey: ["currentUser"] });
      localStorage.removeItem("token");
      console.log("Token removed after logout error, navigating to login");
      navigate("/login", { replace: true });
    },
  });
}
