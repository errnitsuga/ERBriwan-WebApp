import supabase from "./supabase_client";

const API_BASE_URL = "https://er-briwan-api.vercel.app/superadmin";

type Json = Record<string, any> | any[];

async function getAuthHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Unable to attach Supabase auth token:", error);
  }

  return headers;
}

async function request<T extends Json>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseHeaders = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  let body: any = null;
  try {
    // API is expected to always return JSON
    body = await response.json();
  } catch {
    // Non‑JSON response; leave body as null
  }

  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

// Register Device
export const registerDevice = async (deviceId: string, deviceType: string) => {
  return request("/registerDevice", {
    method: "POST",
    body: JSON.stringify({
      device_id: deviceId,
      device_type: deviceType,
    }),
  });
};

// Get All Responders
export const getAllResponders = async () => {
  return request("/getAllResponders");
};

// Get All Users
export const getAllUsers = async () => {
  return request("/getAllUsers");
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
  return request("/registerResponder", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Verify User - Updates is_verified status and verifier_id directly via Supabase
export const verifyUser = async (userId: string, verifierId: string) => {
  const { data, error } = await supabase
    .from("user_tbl")
    .update({
      is_verified: true,
      verifier_id: verifierId,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Unverify User - Updates is_verified status and clears verifier_id
export const unverifyUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_tbl")
    .update({
      is_verified: false,
      verifier_id: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
