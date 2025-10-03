// utils/roomInvites.ts
import axios from "axios";
import { toast } from "sonner";

const API_BASE = "https://survey-server-m884.onrender.com/api";

export const handleAcceptInvite = async (inviteId: number, token: string, setInvites: any) => {
  try {
    await axios.put(`${API_BASE}/room-invites/${inviteId}/respond`, { status: "accepted" }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Update local state
    setInvites((prev: any[]) =>
      prev.map(inv => inv.id === inviteId ? { ...inv, status: "accepted" } : inv)
    );
    toast.success("Đã chấp nhận lời mời");
  } catch (err: any) {
    toast.error(err.response?.data?.error || "Không thể chấp nhận lời mời");
  }
};


export const handleDeclineInvite = async (
  inviteId: number,
  token: string,
  setInvites: React.Dispatch<React.SetStateAction<any[]>>
) => {
  if (!token) return toast.error("Bạn phải đăng nhập");
  try {
    await axios.post(
      `${API_BASE}/invites/${inviteId}/decline`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Đã từ chối lời mời");
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Lỗi khi từ chối");
  }
};
