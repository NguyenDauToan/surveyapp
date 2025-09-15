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
function LoginWithGoogle() {
  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential; // Google ID token

    if (!idToken) {
      console.error("❌ Không nhận được ID Token từ Google");
      return;
    }

    try {
      const res = await axios.post<{ token: string }>(
        `${API_BASE}/auth/google/login`,
        { id_token: idToken }
      );
      const jwtBackend = res.data.token;
      localStorage.setItem("token", jwtBackend);
    } catch (err) {
      console.error("Login backend lỗi:", err);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleLoginSuccess}
      onError={() => console.log("Login Failed")}
    />
  );
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

// =================== QUESTION ===================
export interface Question {
  id: number;
  text: string;
  type: string;
  answers: string[];
}

export const getQuestions = (formId: number, token: string) =>
  axiosClient
    .get(`/forms/${formId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) =>
      res.data.questions.map((q: any): Question => ({
        id: q.ID,
        text: q.NoiDung || q.noi_dung,
        type: q.LoaiCauHoi?.toLowerCase() || "text",
        answers: q.LuaChons?.map((opt: any) => opt.NoiDung) || [],
      }))
    );

export const addQuestion = (formId: number, data: any, token: string) =>
  axiosClient
    .post(`/forms/${formId}/questions`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.data);

export const updateQuestion = (questionId: number, data: any, token: string) =>
  axiosClient
    .put(`/questions/${questionId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.data);

export const deleteQuestion = (questionId: number, token: string) =>
  axiosClient
    .delete(`/questions/${questionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.data);

// =================== FORM ===================
export const apiCreateForm = (data: any, token: string) =>
  axiosClient
    .post("/forms", data, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.data);

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

// =================== ROOM ===================
export const getLobbyRooms = async (token: string) => {
  const res = await fetch(`${API_BASE}/lobby`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không thể lấy danh sách room");
  return await res.json();
};

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

export const createRoom = async (formId: number, name: string, isPublic = true) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Bạn cần đăng nhập để tạo room");

    const payload = { name, form_id: formId, is_public: isPublic };

    const res = await axiosClient.post<{ room_id: number }>("/rooms", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  } catch (err: any) {
    console.error("Tạo room lỗi:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Tạo room thất bại");
  }
};

export default axiosClient;
export { LoginWithGoogle };
