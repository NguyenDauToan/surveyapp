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
      const res = await axiosClient.post("/auth/google/login", { id_token: idToken });
      localStorage.setItem("token", res.data.token);
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

export const addQuestionAPI = async (formId: number | string, payload: any, token: string) => {
  const res = await axios.post(
    `https://survey-server-m884.onrender.com/api/forms/${formId}/questions`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,  // <--- cần có "Bearer "
        "Content-Type": "application/json"
      }
    }
  );
  return res.data;
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
export const getLobbyRooms = async () => {
  const res = await fetch(`${API_BASE}/lobby`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể lấy danh sách room");
  }
  return res.json(); // backend trả danh sách room public
};
export const createRoomAPI = async (
  khaoSatID: number,
  tenRoom: string,
  isPublic: boolean,
  token: string,
  moTa?: string
) => {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      khao_sat_id: khaoSatID,
      ten_room: tenRoom,
      mo_ta: moTa,
      is_public: isPublic,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể tạo phòng");
  }

  return res.json(); // { room_id: number }
};
// =================== ADMIN ===================
export const getAllUsers = async (token: string) => {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể lấy danh sách người dùng");
  }

  return res.json(); // { users: [...] }
};
// getLobbyRooms → đổi thành getMyRooms
export const getMyRooms = async (token: string) => {
  const res = await fetch(`${API_BASE}/rooms/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể lấy danh sách phòng của bạn");
  }
  return res.json(); // backend trả mảng room của user
};

export const enterRoomAPI = async (roomId: number, password?: string, token?: string) => {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/enter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể tham gia phòng");
  }

  return res.json(); // { status, participant_id }
};
export const getMySurveys = async (token: string) => {
  const res = await fetch(`${API_BASE}/forms/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không thể lấy khảo sát của bạn");
  return res.json();
};

export default axiosClient;
