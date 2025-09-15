// src/api/api.tsx
import axios, { AxiosInstance } from "axios";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

// =================== CONFIG ===================
const API_BASE = "https://survey-server-m884.onrender.com/api";

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Interceptor log lỗi
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// =================== GOOGLE LOGIN ===================
export function LoginWithGoogle() {
  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) return console.error("❌ Không nhận được ID Token từ Google");

    try {
      const res = await axiosClient.post<{ token: string }>(
        `/auth/google/login`,
        { id_token: idToken }
      );
      localStorage.setItem("token", res.data.token);
    } catch (err) {
      console.error("Login backend lỗi:", err);
    }
  };

  return <GoogleLogin onSuccess={handleLoginSuccess} onError={() => console.log("Login Failed")} />;
}

// =================== AUTH API ===================
export const apiLogin = (email: string, password: string) =>
  axiosClient
    .post<{ token: string }>("/auth/login", { email, mat_khau: password })
    .then((res) => res.data);

export const apiGetMe = (token: string) =>
  axiosClient
    .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.data);

// =================== SURVEY & QUESTION ===================
export interface Question {
  id: number;
  text: string;
  type: string;
  answers: string[];
}

export const createSurveyAPI = async (token: string, payload: any) => {
  const res = await fetch(`${API_BASE}/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Không thể tạo khảo sát");
  }
  return res.json();
};

export const addQuestionAPI = async (formId: number, payload: any, token: string) => {
  const res = await fetch(`${API_BASE}/forms/${formId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Lỗi khi thêm câu hỏi");
  }
  return res.json();
};

export const getQuestions = (formId: number, token: string) =>
  axiosClient
    .get(`/forms/${formId}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) =>
      res.data.questions.map((q: any): Question => ({
        id: q.ID,
        text: q.NoiDung || q.noi_dung,
        type: q.LoaiCauHoi?.toLowerCase() || "text",
        answers: q.LuaChons?.map((opt: any) => opt.NoiDung) || [],
      }))
    );

// =================== ROOM ===================
export const getLobbyRooms = async (token: string) => {
  const res = await fetch(`${API_BASE}/lobby`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không thể lấy danh sách room");
  return await res.json();
};

export const createRoom = async (formId: number, name: string, isPublic = true) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Bạn cần đăng nhập để tạo room");

  const payload = { name, form_id: formId, is_public: isPublic };
  const res = await axiosClient.post<{ room_id: number }>("/rooms", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
export const getMySurveys = async (token: string) => {
  const res = await fetch(`${API_BASE}/forms/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không thể lấy khảo sát của bạn");
  return res.json();
};

export default axiosClient;
