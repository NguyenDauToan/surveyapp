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
  console.log("📌 [API] createSurvey payload:", payload);
  console.log("📌 [API] token:", token);

  const res = await fetch(`${API_BASE}/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("📌 [API] createSurvey response status:", res.status);

  if (!res.ok) {
    const err = await res.json();
    console.error("❌ [API] createSurvey error response:", err);
    throw new Error(err.message || "Không thể tạo khảo sát");
  }

  const data = await res.json();
  console.log("✅ [API] createSurvey success:", data);
  return data;
};


export const addQuestionAPI = async (
  formId: number,
  payload: any,
  token?: string,
  editToken?: string
) => {
  console.log("📌 [API] addQuestion payload:", payload);
  console.log("📌 [API] formId:", formId, "token:", token, "editToken:", editToken);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (editToken) {
    headers["X-Form-Edit-Token"] = editToken;
  }

  const res = await fetch(`/api/forms/${formId}/questions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  

  console.log("📌 [API] addQuestion response status:", res.status);

  if (!res.ok) {
    const err = await res.json();
    console.error("❌ [API] addQuestion error response:", err);
    throw { status: res.status, data: err, message: err.message };
  }

  const data = await res.json();
  console.log("✅ [API] addQuestion success:", data);
  return data;
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
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể tạo phòng");
  }

  return res.json(); // { data: room }
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
// =================== ROOM ===================
export const getMyRooms = async (token: string, userId: string, page = 1, limit = 10, search = "") => {
  const res = await fetch(`${API_BASE}/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "GET",
    // gửi params theo query string
    body: null,
  });
  const url = new URL(`${API_BASE}/rooms`);
  url.searchParams.append("owner_id", userId);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", limit.toString());
  if (search) url.searchParams.append("search", search);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(err.message || "Không thể lấy danh sách phòng của bạn");
  }
  return response.json(); // backend trả về { data: [...], total, page, limit }
};
// =================== ROOM DELETE ===================
export const deleteRoomAPI = async (roomId: number, token: string) => {
  if (!token) throw new Error("Bạn phải đăng nhập để xóa phòng");

  const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể xóa phòng");
  }

  return res.json(); // backend trả về { success: true } hoặc thông tin room
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

export const getFormDetail = async (id: number, token: string) => {
  const res = await axiosClient.get(`/forms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateForm = async (id: number, body: any, token: string) => {
  const res = await axiosClient.put(`/forms/${id}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
// =================== SURVEY ===================
export const getMySurveys = async (token: string) => {
  const res = await axiosClient.get("/forms/my", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // backend trả về mảng survey của user
};

export const deleteForm = async (id: number, token: string) => {
  const res = await axiosClient.delete(`/forms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
// =================== ROOM DETAIL ===================
export const getRoomDetailAPI = async (roomId: number, token: string) => {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể lấy chi tiết phòng");
  }

  return res.json(); // { id, ten_room, mo_ta, khao_sat, share_url, locked, members, ... }
};

// =================== ROOM UPDATE ===================
export const updateRoomAPI = async (
  roomId: number,
  token: string,
  payload: {
    ten_room?: string;
    mo_ta?: string;
    khao_sat_id?: number;
    is_public?: boolean;
    khoa?: boolean;
    mat_khau?: string;
  }
) => {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể cập nhật phòng");
  }

  return res.json(); // { success: true, room: {...} }
};
export const setRoomPasswordAPI = async (roomId: number, token: string, password: string) => {
  return axios.post(
    `${API_BASE}/rooms/${roomId}/password`,
    { password },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const removeRoomPasswordAPI = async (roomId: number, token: string) => {
  return axios.delete(`${API_BASE}/rooms/${roomId}/password`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
// Archive room
export const archiveRoomAPI = async (roomId: number, token: string) => {
  const res = await axios.put(
    `${API_BASE}/rooms/${roomId}/archive`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
// Lấy danh sách room đã lưu trữ
export const getArchivedRoomsAPI = async (token: string) => {
  const res = await axios.get(`${API_BASE}/rooms/archived`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Khôi phục room
export const restoreRoomAPI = async (roomId: number, token: string) => {
  const res = await axios.put(
    `${API_BASE}/rooms/${roomId}/restore`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export default axiosClient;
