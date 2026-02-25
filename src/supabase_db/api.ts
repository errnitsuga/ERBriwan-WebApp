import axios from "axios";
import supabase from "./supabase_client";

const API_BASE_URL = "https://er-briwan-api.vercel.app/superadmin";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Supabase JWT access token to every request (when available)
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Unable to attach Supabase auth token:", error);
  }

  return config;
});

// Register Device
export const registerDevice = async (deviceId: string, deviceType: string) => {
  try {
    const response = await apiClient.post("/registerDevice", {
      device_id: deviceId,
      device_type: deviceType,
    });
    return response.data;
  } catch (error) {
    console.error("Error registering device:", error);
    throw error;
  }
};

// Get All Responders
export const getAllResponders = async () => {
  try {
    const response = await apiClient.get("/getAllResponders");
    return response.data;
  } catch (error) {
    console.error("Error fetching responders:", error);
    throw error;
  }
};

// Get All Users
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get("/getAllUsers");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Register Responder
export interface RegisterResponderData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  organization: string;
  phone_number: string;
  region: string;
  city_municipality: string;
  barangay: string;
  middlename?: string;
}

export const registerResponder = async (data: RegisterResponderData) => {
  try {
    const response = await apiClient.post("/registerResponder", data);
    return response.data;
  } catch (error) {
    console.error("Error registering responder:", error);
    throw error;
  }
};

export default apiClient;
