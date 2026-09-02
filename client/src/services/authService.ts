import api from "../api/axios";

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser{
    id: string;
    name: string;
    email: string;
    phone: string;
    role:"user" | "staff" | "admin";
    staffApproval: "pending" | "approved" | "rejected";
    permissions: ("dashboard" | "products" | "orders" | "customers")[];
    subscription: {
      plan: "free" | "premium";
      startDate?: string;
      endDate?: string;
    };
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user: AuthUser;
}


//Login
export const LoginUser = async (data : LoginData):Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
};

//getme
export const getMe = async (): Promise<AuthUser> => {
  const response = await api.get<{
    success: boolean;
    user: AuthUser;
  }>("/auth/me");

  return response.data.user;
};


//logout
export const LogoutUser = async()=>{
    const response = await api.post("/auth/logout");
    return response.data
}

export const registerUser = async (data: { name: string; email: string; phone: string; password: string }) => (await api.post("/auth/register", data)).data;
export const verifyRegistrationOtp = async (email: string, otp: string) => (await api.post("/auth/verify-email-otp", { email, otp })).data;
export const resendVerification = async (email: string) => (await api.post("/auth/resend-verification", { email })).data;
export const requestPasswordReset = async (email: string) => (await api.post("/auth/forgot-password", { email })).data;
export const resetPassword = async (email: string, otp: string, password: string) => (await api.post("/auth/reset-password", { email, otp, password })).data;
export const changePassword = async (currentPassword: string, newPassword: string) => (await api.post("/auth/change-password", { currentPassword, newPassword })).data;
export const updateProfile = async (data: { name: string; email: string; phone: string; currentPassword?: string }) => (await api.patch("/auth/profile", data)).data;


