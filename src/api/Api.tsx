// src/api/api.tsx
import axios, { AxiosInstance } from "axios";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
// =================== CONFIG ===================
// Vite expose biến môi trường qua import.meta.env
const API_BASE = import.meta.env.VITE_API_BASE || "https://survey-server-m884.onrender.com/api";

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
interface Survey {
  id: number;
  tieu_de: string;
  mo_ta?: string;
  public_link?: string | null;
}
export interface EnterRoomResponse {
  status: string;
  room: {
    id: number;
    ten_room: string;
    mo_ta: string;
    share_url: string;
    is_public: boolean;
    ngay_tao: string;
    member_count: number;
    members: {
      id: number;
      user_id: number;
      ten_nguoi_dung: string;
      status: string;
    }[];
  };
}
export const enterRoomByShareURL = async (
  shareURL: string,
  password?: string
): Promise<EnterRoomResponse> => {
  const body = password ? { password } : {};
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log("🔹 [enterRoomByShareURL] Headers:", headers);
  console.log("🔹 [enterRoomByShareURL] Body:", body);

  try {
    const res = await axios.post<EnterRoomResponse>(
      `${API_BASE}/rooms/share/${shareURL}/enter`,
      body,
      { headers }
    );
    console.log("✅ [enterRoomByShareURL] Response:", res.data);
    return res.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ [enterRoomByShareURL] Axios error status:", error.response?.status);
      console.error("❌ [enterRoomByShareURL] Axios error data:", error.response?.data);
    } else {
      console.error("❌ [enterRoomByShareURL] Unknown error:", error);
    }
    throw error;
  }
};
// =================== SURVEY & QUESTION ===================
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
    const err = await res.json().catch(() => ({ message: res.statusText }));
    console.error("❌ [API] createSurvey error response:", err);
    throw new Error(err.message || "Không thể tạo khảo sát");
  }

  const data = await res.json();
  console.log("✅ [API] createSurvey success:", data);
  return data;
};

// src/api/api.tsx

export const addQuestionAPI = async (
  formId: number,
  payload: any,
  token?: string,
  editToken?: string
) => {
  console.log("📌 [API] addQuestion payload:", payload);
  console.log("📌 [API] formId:", formId, "token:", token, "editToken:", editToken);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (editToken) headers["X-Form-Edit-Token"] = editToken;

    const res = await axiosClient.post(`/forms/${formId}/questions`, payload, { headers });

    console.log("✅ [API] addQuestion success:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ [API] addQuestion error:", err.response?.data || err.message);

    // Nếu server trả HTML (như 405 của GitHub Pages)
    if (err.response?.headers["content-type"]?.includes("text/html")) {
      throw {
        status: err.response.status,
        message: "Lỗi server: có thể URL không đúng backend thực",
        data: err.response.data,
      };
    }

    throw {
      status: err.response?.status,
      message: err.response?.data?.message || err.message || "Lỗi thêm câu hỏi",
      data: err.response?.data,
    };
  }
};


export const getQuestions = async (formId: number, token: string) => {
  const res = await fetch(`${API_BASE}/forms/${formId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể lấy câu hỏi");
  }

  const data = await res.json();
  return data.questions.map((q: any) => ({
    id: q.ID,
    text: q.NoiDung || q.noi_dung,
    type: q.LoaiCauHoi?.toLowerCase() || "text",
    answers: q.LuaChons?.map((opt: any) => opt.NoiDung) || [],
  }));
};

// =================== ROOM ===================
export const getLobbyRooms = async () => {
  const res = await fetch(`${API_BASE}/lobby`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể lấy danh sách room");
  }
  return res.json();
};

export const createRoomAPI = async (
  khaoSatID: number,
  tenRoom: string,
  token: string,
  moTa?: string
) => {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ khao_sat_id: khaoSatID, ten_room: tenRoom, mo_ta: moTa }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể tạo phòng");
  }

  return res.json();
};

export const getMyRooms = async (
  token: string,
  userId: string,
  page = 1,
  limit = 10,
  search = ""
) => {
  const url = new URL(`${API_BASE}/rooms`);
  url.searchParams.append("owner_id", userId);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", limit.toString());
  if (search) url.searchParams.append("search", search);

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể lấy danh sách phòng của bạn");
  }
  return res.json();
};

export const deleteRoomAPI = async (roomId: number, token: string) => {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Không thể xóa phòng");
  }

  return res.json();
};

export const enterRoomAPI = async (roomId: number, password?: string, token?: string) => {
  const payload: any = {};
  if (password) payload.password = password;

  console.log("[enterRoomAPI] roomId:", roomId, "payload:", payload, "token:", token);

  const res = await fetch(`${API_BASE}/rooms/${roomId}/enter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  console.log("[enterRoomAPI] raw response:", res);

  if (!res.ok) {
    const data = await res.json();
    console.error("[enterRoomAPI] error response:", data);
    throw new Error(data.error || data.message || "Không thể tham gia phòng");
  }

  const data = await res.json();
  console.log("[enterRoomAPI] success response:", data);
  return data; // Đảm bảo rằng data có chứa room và members
};
// api/Api.ts
export const getRoomParticipantsAPI = async (roomId: number, token: string) => {
  const res = await axios.get(`${API_BASE}/rooms/${roomId}/participants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.participants;
};



export const getFormDetail = async (id: number, token: string) => {
  const res = await axiosClient.get(`/forms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};


export const updateForm = async (id: number, data: { title: string; description: string }, token?: string) => {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Không thể cập nhật khảo sát");
  }
  return await res.json();
};
// =================== SURVEY ===================
export const getMySurveys = async (token: string) => {
  try {
    const res = await axiosClient.get("/forms/my", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const surveysFromDB: Survey[] = res.data || [];

    // Nếu localStorage có URL, thêm vào mảng, nếu không thì bỏ qua
    const localUrl = localStorage.getItem("latest_survey_url");
    if (localUrl) {
      surveysFromDB.push({
        id: -1, // id giả để không trùng với DB
        tieu_de: "Khảo sát local",
        public_link: localUrl,
      });
    }

    return surveysFromDB;
  } catch (err) {
    console.error("Lỗi lấy khảo sát:", err);
    return [];
  }
};


export const deleteForm = async (id: number, token: string) => {
  const res = await axiosClient.delete(`/forms/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
// =================== ROOM DETAIL ===================
export const getRoomDetailAPI = async (roomId: number, token: string) => {
  console.log("Fetching room detail for roomId:", roomId);

  const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("Response status:", res.status, "ok:", res.ok);

  let data: any = null;
  try {
    data = await res.json();
    console.log("Response data:", data);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
  }

  if (!res.ok) {
    throw new Error(data?.message || res.statusText || "Không thể lấy chi tiết phòng");
  }

  // Log khao_sat riêng
  console.log("KhaoSat in data:", data?.data?.khao_sat);

  return data; 
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
export const getMyFormsAPI = async (token: string): Promise<Survey[]> => {
  try {
    // Lấy khảo sát từ database
    const res = await axios.get(`${API_BASE}/forms/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const surveysFromDB: Survey[] = res.data.forms || [];

    // Kiểm tra khảo sát local
    const localUrl = localStorage.getItem("latest_survey_url");
    if (localUrl) {
      surveysFromDB.push({
        id: -1,            // id âm để phân biệt khảo sát local
        tieu_de: "Khảo sát local",
        public_link: localUrl,
      });
    }

    return surveysFromDB;
  } catch (err) {
    console.error("Lỗi lấy khảo sát:", err);
    return [];
  }
};
// FE
export const getUserByEmailOrUsername = async (email: string, token: string) => {
  return axios.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { email }, // thay vì query
  });
};
export const getUserByIdAPI = async (userId: number, token: string) => {
  return axios.get(`${API_BASE}/users`, {  // 👈 Assume backend hỗ trợ search by id param
    headers: { Authorization: `Bearer ${token}` },
    params: { id: userId },  // Hoặc /users/${userId} nếu có endpoint riêng
  });
};
// =================== ROOM MEMBER ===================
// Invite member
export const inviteMemberAPI = (roomId: number, token: string, userId: number) => {
  return axios.post(
    `${API_BASE}/room-invites/${roomId}/invite`,
    { nguoi_dung_id: userId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const getRoomInvitesAPI = async (roomId: number, token: string) => {
  const res = await axios.get(`${API_BASE}/room-invites/${roomId}/invites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.invites;
};
// Api.tsx
export const fetchRoomParticipants = async (roomId: number, token: string) => {
  const res = await axios.get(`${API_BASE}/rooms/${roomId}/participants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.participants;
};

// Api.tsx
export const removeMemberAPI = async (roomId: number, token: string, memberId: string) => {
  console.log("🚀 removeMemberAPI called", { roomId, memberId });
  const res = await axios.delete(`${API_BASE}/rooms/${roomId}/removemem/${memberId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const shareFormAPI = async (formId: string, token: string) => {
  try {
    const res = await axiosClient.post(`/forms/${formId}/share`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { embed_code, share_url }
  } catch (err: any) {
    console.error(err.response?.data);
    throw new Error(err.response?.data?.message || "Không thể tạo link chia sẻ");
  }
};

// Lấy form công khai (không cần token)
export const getPublicFormAPI = async (shareToken: string) => {
  try {
    const res = await axiosClient.get(`/forms/public/${shareToken}`);
    return res.data;
  } catch (err: any) {
    console.error(err.response?.data);
    throw new Error(err.response?.data?.message || "Không thể tải form");
  }
};

// Gửi câu trả lời
export const submitAnswersAPI = async (formId: number, answers: any[]) => {
  try {
    const res = await axiosClient.post(`/forms/${formId}/answers`, { answers });
    return res.data;
  } catch (err: any) {
    console.error(err.response?.data);
    throw new Error(err.response?.data?.message || "Không thể gửi câu trả lời");
  }
};
// =================getFormDashboardAPI================
export const getFormDashboardAPI = async (formId: number, token: string) => {
  try {
    const res = await axiosClient.get(`/forms/${formId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err: any) {
    console.error(err.response?.data);
    throw new Error(err.response?.data?.message || "Không thể tải dashboard");
  }
};

// Lấy chi tiết submission
export const getSubmissionDetailAPI = async (
  formId: number,
  subId: number,
  token: string
) => {
  try {
    const res = await axiosClient.get(
      `/forms/${formId}/submissions/${subId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err: any) {
    console.error(err.response?.data);
    throw new Error(
      err.response?.data?.error || "Không thể tải chi tiết phản hồi"
    );
  }
};
// src/api/Api.ts
interface GetFormSubmissionsParams {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

export const getFormSubmissionsAPI = async (
  formId: number,
  token: string,
  page: number = 1,
  limit: number = 10,
  start_date?: string,
  end_date?: string
) => {
  try {
    const params: GetFormSubmissionsParams = { page, limit };
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    const res = await axiosClient.get(`/forms/${formId}/submissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    return res.data; // { form_id, limit, page, submissions, total }
  } catch (err: any) {
    console.error(err.response?.data);
    throw new Error(
      err.response?.data?.error || "Không thể lấy danh sách phản hồi"
    );
  }
};


export const updateQuestionAPI = async (
  questionId: number,
  content: string,
  props?: object
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Bạn chưa đăng nhập");

  const body: any = { content };
  if (props) body.props = props;

  const res = await axios.put(
    `https://survey-server-m884.onrender.com/api/questions/${questionId}`,
    body,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data; // { message: "updated" }
};



export default axiosClient;
