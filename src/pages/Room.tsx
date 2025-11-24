
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { archiveRoomAPI, getMyFormsAPI, getRoomDetailAPI, removeRoomPasswordAPI, setRoomPasswordAPI, updateRoomAPI } from "@/api/Api";
import "../styles/Room.css"
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import ArchiveDialog from "./ArchivedRoomsDialog";
import { getUserByEmailOrUsername } from "@/api/Api";
import { inviteMemberAPI, removeMemberAPI } from "@/api/Api";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { enterRoomAPI } from "@/api/Api";
import { getRoomParticipantsAPI } from "@/api/Api";
import { enterRoomByShareURL } from "@/api/Api";
import { ensureOwnerInMembers } from "@/utils/roomUtils";
import { jwtDecode } from "jwt-decode";
// Room.tsx
import type { EnterRoomResponse } from "@/api/Api"; // đường dẫn chính xác tới file Api.tsx


interface Member {
    id: string;        // user_id (string hóa để đồng nhất key React)
    name: string;      // tên người dùng
    email?: string;    // optional vì API có thể không trả
    status?: string;   // trạng thái tham gia (pending, accepted, ...)
    canRemove?: boolean; // ✅ thêm vào, optional cho đỡ lỗi

}
interface KhaoSatSummary {
    id: number;
    tieu_de: string;
    mo_ta?: string;
    public_link?: string | null;
    khao_sat_id?: number | null;

}

interface Room {
    id: number;
    nguoi_tao_id?: number | string; // 👈 nên cho phép cả string (API đôi khi trả string)
    ten_room: string;
    mo_ta?: string | null;
    ngay_tao?: string;
    nguoi_tao_ten?: string;   // 👈 thêm tên chủ phòng
    nguoi_tao_email?: string;
    share_url?: string;
    trang_thai?: "active" | "deleted" | "archived";
    is_public?: boolean;
    khoa?: boolean;
    mat_khau?: string;
    members?: Member[];
    khao_sat?: KhaoSatSummary;
    isMine?: boolean; // 👈 thêm dòng này
    // ✅ Thêm 2 trường để dùng trong form edit/create
    khao_sat_id?: number | null;
    khao_sat_link?: string | null;
    joined?: boolean;   // 👈 thêm ở đây

}


interface RoomWithIsMine extends Room {
    isMine?: boolean;
    owner_id?: number | string;
    joined?: boolean; // <-- thêm đây

}
interface Survey {
    id: number;
    tieu_de: string;
    mo_ta?: string;
    public_link?: string | null;
}
interface NewRoom {
    ten_room: string;
    mo_ta: string;
    is_public: boolean;
    khoa: boolean;
    mat_khau: string;
    khao_sat_id: number | null;
    khao_sat_link: string | null; // ✅ sửa ở đây
}


const RoomPage = () => {
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRoom, setNewRoom] = useState<NewRoom>({ ten_room: "", mo_ta: "", is_public: true, khoa: false, mat_khau: "", khao_sat_id: null, khao_sat_link: null });
    const [editRoom, setEditRoom] = useState<Room | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [archiveDialogRoom, setArchiveDialogRoom] = useState<Room | null>(null);
    const token = localStorage.getItem("token") || "";
    const userId = Number(localStorage.getItem("user_id") || 0);
    const API_BASE = "https://survey-server-m884.onrender.com/api";
    const [selectedRoom, setSelectedRoom] = useState<RoomWithIsMine | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false); // 👈 Thêm loading cho members
    const [joinRoomURL, setJoinRoomURL] = useState("");
    const [mySurveys, setMySurveys] = useState<Survey[]>([]);
    const [roomPassword, setRoomPassword] = useState("");
    const [shouldOpenDialog, setShouldOpenDialog] = useState(false);
    const [requirePassword, setRequirePassword] = useState(false);
    const [currentOpenedRoomId, setCurrentOpenedRoomId] = useState<string | null>(null);
    // Trong component, trước return JSX
    const localSurveyUrl = localStorage.getItem("latest_survey_url") || null;
    const [surveyLink, setSurveyLink] = useState<string | null>(null);
    const [isLocking, setIsLocking] = useState(false);

    useEffect(() => {
        if (!token) return;
        getMyFormsAPI(token)
            .then((data) => {
                const surveys: Survey[] = (data || []).map((s: any) => ({
                    id: s.id,
                    tieu_de: s.title,
                    public_link: s.public_link || null,
                    mo_ta: s.mo_ta || "",
                }));
                setMySurveys(surveys);
            })
            .catch(() => toast.error("Không tải được khảo sát của bạn"));
    }, []);
    const handleJoinRoomByURL = async () => {
        if (!joinRoomURL) {
            toast.error("Vui lòng nhập URL phòng");
            return;
        }

        console.log("🔹 [handleJoinRoomByURL] joinRoomURL:", joinRoomURL);

        // Lấy shareURL từ link
        const roomIdMatch = joinRoomURL.match(
            /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
        );
        if (!roomIdMatch) {
            toast.error("URL không hợp lệ");
            return;
        }
        const shareURL = roomIdMatch[0];
        console.log("🔹 [handleJoinRoomByURL] Extracted shareURL:", shareURL);

        try {
            // Lấy thông tin phòng
            const roomRes = await axios.get(`${API_BASE}/rooms/share/${shareURL}`);
            const roomData = roomRes.data.room || roomRes.data;
            console.log("🔹 [handleJoinRoomByURL] Fetched room data:", roomData);

            // Nếu phòng yêu cầu mật khẩu nhưng user chưa nhập → bật input
            if (roomData.require_password && !roomPassword) {
                setRequirePassword(true);
                toast.info("Phòng này yêu cầu mật khẩu, vui lòng nhập");
                return; // dừng ở đây, chờ người dùng nhập password
            }

            // Gọi API join phòng, truyền password nếu có
            const enterRes: EnterRoomResponse = await enterRoomByShareURL(
                shareURL,
                roomPassword || undefined
            );
            console.log("🔹 [handleJoinRoomByURL] enterRoomByShareURL response:", enterRes);

            const joinedRoom = enterRes.room;

            // Map members
            const members: Member[] = (joinedRoom.members || []).map((p) => ({
                id: String(p.user_id ?? p.id),
                name: p.ten_nguoi_dung || "Người dùng",
                email: "",
                status: p.status || "active",
            }));

            // Thêm owner nếu chưa có
            const ownerId = String(roomData.nguoi_tao_id);
            if (!members.some((m) => m.id === ownerId)) {
                members.unshift({
                    id: ownerId,
                    name: roomData.nguoi_tao_ten || "Chủ phòng",
                    email: roomData.nguoi_tao_email || "",
                    status: "owner",
                });
            }

            // Room object đầy đủ
            const newRoom: RoomWithIsMine = {
                ...joinedRoom,
                nguoi_tao_id: ownerId,
                members,
                share_url: joinedRoom.share_url || shareURL,
                isMine: ownerId === String(userId),
                joined: true,
            };

            // Lưu state
            setMyRooms((prev) => {
                const exists = prev.some((r) => r.id === newRoom.id);
                const newRooms = exists
                    ? prev.map((r) => (r.id === newRoom.id ? newRoom : r))
                    : [...prev, newRoom];
                localStorage.setItem("myRooms", JSON.stringify(newRooms));
                return newRooms;
            });

            setPublicRooms(prev => {
                return prev.map(r => {
                    if (r.id === newRoom.id) {
                        return { ...r, members: newRoom.members }; // đảm bảo owner được hiển thị
                    }
                    return r;
                });
            });

            setSelectedRoom(newRoom);
            setMembers(members);
            localStorage.setItem("selectedRoom", JSON.stringify(newRoom));

            // Reset state input password
            toast.success("Bạn đã tham gia phòng thành công");
            setJoinRoomURL("");
            setRoomPassword("");
            setRequirePassword(false);

        } catch (error: any) {
            console.error("❌ [handleJoinRoomByURL] Lỗi khi join room:", error);
        
            if (axios.isAxiosError(error)) {
                const errData = error.response?.data;
                console.log("🔹 [handleJoinRoomByURL] Axios error response:", errData);
        
                if (error.response?.status === 400) {
                    // Kiểm tra lỗi có liên quan mật khẩu
                    if (errData?.error?.toLowerCase().includes("mật khẩu") || 
                        errData?.message?.toLowerCase().includes("mật khẩu")) {
                        setRequirePassword(true);
                        toast.error("❌ Sai mật khẩu, vui lòng thử lại");
                        return;
                    }
                }
        
                toast.error(errData?.message || "Không thể tham gia phòng");
            } else {
                toast.error("Lỗi không xác định khi tham gia phòng");
            }
        }
    };
    const fetchRooms = async () => {
        if (!token) return;

        try {
            // 1️⃣ Fetch rooms từ backend
            const [resMy, resPublic] = await Promise.all([
                axios.get(`${API_BASE}/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/lobby`),
            ]);

            const myData: Room[] = resMy.data.data || [];
            const publicData: Room[] = resPublic.data.data || resPublic.data.rooms || [];

            const currentUserId = String(userId);
            const savedMyRooms: Room[] = JSON.parse(localStorage.getItem("myRooms") || "[]");
            const savedSelectedRoom: Room | null = JSON.parse(localStorage.getItem("selectedRoom") || "null");

            const ensureOwnerInMembers = (room: Room, members: Member[]): Member[] => {
                if (!members.some(m => String(m.id) === String(room.nguoi_tao_id))) {
                    members.unshift({
                        id: String(room.nguoi_tao_id),
                        name: "Chủ phòng",
                        email: "",
                        status: "owner",
                    });
                }
                return members;
            };

            // ========== MY ROOMS ==========
            const myRoomsWithMembers: Room[] = await Promise.all(
                myData.map(async r => {
                    try {
                        const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`, { headers: { Authorization: `Bearer ${token}` } });
                        let members: Member[] = (resMembers.data.participants || []).map((p: any) => ({
                            id: String(p.user_id),
                            name: p.ten_nguoi_dung || "",
                            email: p.email || "",
                            status: p.status || "active"
                        }));
                        members = ensureOwnerInMembers(r, members);
                        return { ...r, nguoi_tao_id: String(r.nguoi_tao_id), members, isMine: String(r.nguoi_tao_id) === currentUserId, joined: true };
                    } catch {
                        return { ...r, members: [], nguoi_tao_id: String(r.nguoi_tao_id), joined: true };
                    }
                })
            );

            // ========== PUBLIC ROOMS ==========
            // ========== PUBLIC ROOMS ==========
            const publicRoomsWithMembers: Room[] = await Promise.all(
                publicData.map(async (r) => {
                    try {
                        // Gọi API participants giống như myRooms
                        const resMembers = await axios.get(
                            `${API_BASE}/rooms/${r.id}/participants`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        let members: Member[] = (resMembers.data.participants || []).map((p: any) => ({
                            id: String(p.user_id),
                            name: p.ten_nguoi_dung || "",
                            email: p.email || "",
                            status: p.status || "active",
                        }));

                        // Thêm chủ phòng nếu chưa có
                        if (!members.some(m => String(m.id) === String(r.nguoi_tao_id))) {
                            members.unshift({
                                id: String(r.nguoi_tao_id),
                                name: r.nguoi_tao_ten || "Chủ phòng",
                                email: r.nguoi_tao_email || "",
                                status: "owner",
                            });
                        }

                        const isJoined = members.some(m => m.id === String(userId));

                        return {
                            ...r,
                            nguoi_tao_id: String(r.nguoi_tao_id),
                            members,
                            isMine: String(r.nguoi_tao_id) === String(userId),
                            joined: isJoined,
                        };
                    } catch {
                        // fallback nếu gọi participants lỗi
                        return {
                            ...r,
                            nguoi_tao_id: String(r.nguoi_tao_id),
                            members: [
                                {
                                    id: String(r.nguoi_tao_id),
                                    name: r.nguoi_tao_ten || "Chủ phòng",
                                    email: r.nguoi_tao_email || "",
                                    status: "owner",
                                },
                            ],
                            joined: false,
                        };
                    }
                })
            );


            // ========== MERGE WITH LOCALSTORAGE ==========
            const mergedMyRooms: Room[] = [...myRoomsWithMembers, ...publicRoomsWithMembers.filter(r => r.joined && !r.isMine)].map(r => {
                const saved = savedMyRooms.find(s => s.id === r.id);
                const joined = saved?.joined || r.isMine || r.joined || false;
                const members = r.members && r.members.length > 0 ? r.members : saved?.members || [];
                return { ...r, ...saved, members, joined };
            });

            setMyRooms(mergedMyRooms);
            localStorage.setItem("myRooms", JSON.stringify(mergedMyRooms));
            setPublicRooms(publicRoomsWithMembers);

            // cập nhật selectedRoom
            if (savedSelectedRoom) {
                const updatedSelected = mergedMyRooms.find(r => String(r.id) === String(savedSelectedRoom.id));
                if (updatedSelected) {
                    setSelectedRoom(updatedSelected);
                    setMembers(updatedSelected.members || []);
                } else {
                    setSelectedRoom(null);  // phòng không còn → tắt dialog
                    setMembers([]);
                }
            }



        } catch (err: any) {
            console.error("Lỗi fetchRooms:", err);
            toast.error("Không lấy được danh sách phòng");
        }
    };

    useEffect(() => {
        if (!selectedRoom) return;
        setMembers(selectedRoom.members || []);
    }, [selectedRoom]);
    const handleRemoveMember = async (roomId: number, memberId: string) => {
        if (!token) return toast.error("Bạn phải đăng nhập để xoá thành viên");

        try {
            console.log("🚀 removeMemberAPI called ", { roomId, memberId });
            await removeMemberAPI(roomId, token, memberId);
            toast.success("Đã xoá thành viên");

            // Lấy lại dữ liệu phòng từ server
            const resRoom = await getRoomDetailAPI(roomId, token);
            const roomData: Room = resRoom.data;

            // ✅ Thêm owner vào members nếu chưa có
            const ownerId = String(roomData.nguoi_tao_id);
            const ownerName = roomData.nguoi_tao_ten || "Chủ phòng";
            const ownerEmail = roomData.nguoi_tao_email || "";

            const updatedMembers = ensureOwner(roomData.members || [], ownerId, ownerName, ownerEmail);

            // Cập nhật myRooms
            setMyRooms(prev => prev.map(room =>
                room.id === roomId ? { ...room, members: updatedMembers } : room
            ));

            // Cập nhật selectedRoom nếu đang mở
            setSelectedRoom(prev => {
                if (!prev || prev.id !== roomId) return prev;
                return { ...prev, members: updatedMembers };
            });

            // Cập nhật localStorage
            const updatedRooms = myRooms.map(room =>
                room.id === roomId ? { ...room, members: updatedMembers } : room
            );
            localStorage.setItem("myRooms", JSON.stringify(updatedRooms));

        } catch (err: any) {
            console.error("❌ removeMemberAPI error", err);
            toast.error(err.response?.data?.message || "Không thể xoá thành viên");
        }
    };

    const handleCreateRoom = async () => {
        if (!token) return toast.error("Bạn phải đăng nhập mới tạo được phòng");
        if (!newRoom.ten_room.trim()) return toast.error("Tên phòng không được để trống");
        if (!newRoom.khao_sat_id && !localSurveyUrl)
            return toast.error("Phải chọn hoặc tạo khảo sát trước khi tạo phòng");

        try {
            const res = await axios.post(
                `${API_BASE}/rooms`,
                {
                    khao_sat_id: newRoom.khao_sat_id,
                    ten_room: newRoom.ten_room,
                    mo_ta: newRoom.mo_ta,
                    is_public: newRoom.is_public,
                    mat_khau: newRoom.mat_khau?.trim() || null,
                    khoa: !!newRoom.mat_khau?.trim(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const roomData = res.data.data;

            // Lấy thông tin user hiện tại
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const currentUserIdStr = String(userId);

            const newCreatedRoom: RoomWithIsMine = {
                ...roomData,
                nguoi_tao_id: currentUserIdStr,
                nguoi_tao_ten: user.Ten || "Bạn",
                nguoi_tao_email: user.email || "",
                members: [
                    {
                        id: currentUserIdStr,
                        name: "Bạn",
                        email: user.email || "",
                        status: "owner",
                        canRemove: false,
                    },
                ],
                isMine: true,
                joined: true,
                khao_sat_link: newRoom.khao_sat_link || localSurveyUrl || null,
            };

            setMyRooms(prev => [newCreatedRoom, ...prev]);
            if (newRoom.is_public) setPublicRooms(prev => [newCreatedRoom, ...prev]);

            localStorage.setItem("myRooms", JSON.stringify([newCreatedRoom, ...myRooms]));

            toast.success(`Phòng "${newRoom.ten_room}" đã tạo`);
            setNewRoom({
                ten_room: "",
                mo_ta: "",
                is_public: true,
                khoa: false,
                mat_khau: "",
                khao_sat_id: null,
                khao_sat_link: null
            });

        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không tạo được phòng");
        }
    };
    const openEditRoom = (room: Room) => {
        setEditRoom({ ...room, mat_khau: "" });
        setShowEditForm(true);
        setSelectedRoom(null);

    };
    const handleUpdateRoom = async () => {
        if (!token || !editRoom) return;
        try {
            // Cập nhật phòng
            await updateRoomAPI(editRoom.id, token, {
                ten_room: editRoom.ten_room,
                mo_ta: editRoom.mo_ta,
                is_public: editRoom.is_public,
                khao_sat_id: editRoom.khao_sat_id,      // <-- thêm id khảo sát
                khao_sat_link: editRoom.khao_sat_link   // <-- thêm link khảo sát
            });

            // Cập nhật mật khẩu
            if (editRoom.khoa && editRoom.mat_khau?.trim()) {
                await setRoomPasswordAPI(editRoom.id, token, editRoom.mat_khau);
            } else if (!editRoom.khoa) {
                await removeRoomPasswordAPI(editRoom.id, token);
            }

            toast.success("Cập nhật phòng thành công");
            setEditRoom(null);
            setShowEditForm(false);
            fetchRooms();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không cập nhật được phòng");
        }
    };

    const handleArchiveRoom = async (roomId: number) => {
        if (!token) return toast.error("Bạn phải đăng nhập mới lưu trữ được phòng");
        try {
            await archiveRoomAPI(roomId, token);
            toast.success("Phòng đã được lưu trữ");
            setArchiveDialogRoom(null);
            fetchRooms();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không lưu trữ được phòng");
        }
    };
    const copyInviteCode = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => {
                toast.success("Đã sao chép link mời");
            })
            .catch((err) => {
                console.error("Không thể sao chép link:", err);
                toast.error("Sao chép thất bại");
            });
    };
    // Helper thêm owner vào đầu danh sách nếu chưa có
    const ensureOwner = (
        members: Member[] = [],
        ownerId?: string | number | null,
        ownerName?: string | null,
        ownerEmail?: string | null
    ): Member[] => {
        if (!ownerId) return [...members];

        const ownerIdStr = String(ownerId);
        let updated = [...members];

        const idx = updated.findIndex(m => String(m.id) === ownerIdStr);

        if (idx === -1) {
            updated.unshift({
                id: ownerIdStr,
                name: ownerName || "Chủ phòng",
                email: ownerEmail && ownerEmail.trim() !== "" ? ownerEmail : "Chưa cập nhật",
                status: "owner",
            });
        } else {
            updated[idx] = {
                ...updated[idx],
                status: "owner",
                name: updated[idx].name || ownerName || "Chủ phòng",
                email: updated[idx].email && updated[idx].email.trim() !== ""
                    ? updated[idx].email
                    : ownerEmail && ownerEmail.trim() !== ""
                        ? ownerEmail
                        : "Chưa cập nhật",
            };

            if (idx > 0) {
                const [owner] = updated.splice(idx, 1);
                updated.unshift(owner);
            }
        }

        return updated;
    };

    const handleOpenRoom = async (room: Room) => {
        setCurrentOpenedRoomId(String(room.id));
        setMembersLoading(true);
        setSelectedRoom(room); // set room hiện tại
        setShouldOpenDialog(true);

        try {
            const detail = await getRoomDetailAPI(room.id, token);

            const currentUserId = String(userId);

            // map members, fallback cho name/email
            let mappedMembers: Member[] = (detail.data.members || []).map((p: any) => ({
                id: String(p.user_id ?? p.id),
                name: p.ten_nguoi_dung || p.name || p.email || "Người dùng",
                email: p.email || "",
                status: p.status || "active",
                canRemove: true,
            }));

            // Thêm owner vào đầu danh sách nếu chưa có
            const ownerId = String(detail.data.nguoi_tao_id || room.nguoi_tao_id);
            const ownerName = detail.data.nguoi_tao_ten || room.nguoi_tao_ten || "Chủ phòng";
            const ownerEmail = detail.data.nguoi_tao_email || room.nguoi_tao_email || "";
            mappedMembers = ensureOwner(mappedMembers, ownerId, ownerName, ownerEmail);

            // Đổi tên currentUser thành "Bạn"
            mappedMembers = mappedMembers.map(m =>
                m.id === currentUserId ? { ...m, name: "Bạn" } : m
            );

            const fullRoom: RoomWithIsMine = {
                ...room,
                ...detail.data,
                members: mappedMembers,
                isMine: ownerId === currentUserId,
                joined: true,
                khao_sat: detail.data.khao_sat || room.khao_sat || null,
                khao_sat_link: detail.data.khao_sat?.public_link || room.khao_sat?.public_link || null,
            };

            setSelectedRoom(fullRoom);
            setMembers(mappedMembers);
        } catch (err) {
            console.error("❌ handleOpenRoom error:", err);
            setSelectedRoom(room);
            setMembers([]);
        } finally {
            setMembersLoading(false);
        }
    };


    const enterRoom = async (room: Room) => {
        if (!token) return toast.error("Bạn phải đăng nhập để tham gia phòng");

        let password: string | undefined;

        try {
            if (room.khoa) {
                password = prompt("Nhập mật khẩu phòng:");
                if (!password) return toast.error("Bạn chưa nhập mật khẩu");
            }

            const res = await enterRoomAPI(room.id, password, token);
            const roomData = res.room;
            if (!roomData) return toast.error("Không thể tham gia phòng, dữ liệu không hợp lệ.");

            // Map members và đảm bảo owner luôn có mặt
            const members: Member[] = ((roomData.members || []) as any[]).map(m => ({
                id: String(m.user_id ?? m.id),
                name: m.ten_nguoi_dung || m.name || "",
                email: m.email || "",
                status: m.status,
            }));

            if (!members.some(m => String(m.id) === String(roomData.nguoi_tao_id))) {
                members.unshift({
                    id: String(roomData.nguoi_tao_id),
                    name: "Chủ phòng",
                    email: "",
                    status: "owner",
                });
            }

            const updatedRoom: RoomWithIsMine = {
                ...roomData,
                nguoi_tao_id: String(roomData.nguoi_tao_id),
                members,
                share_url: roomData.share_url || `${window.location.origin}/room/${roomData.id}`,
                isMine: String(roomData.nguoi_tao_id) === String(userId),
                joined: true,
            };

            // ✅ Cập nhật myRooms và lưu localStorage
            setMyRooms(prev => {
                const exists = prev.some(r => r.id === updatedRoom.id);
                const newRooms = exists
                    ? prev.map(r => (r.id === updatedRoom.id ? updatedRoom : r))
                    : [...prev, updatedRoom];
                localStorage.setItem("myRooms", JSON.stringify(newRooms));
                return newRooms;
            });

            // ✅ Cập nhật publicRooms
            setPublicRooms(prev => prev.map(r => (r.id === updatedRoom.id ? updatedRoom : r)));

            // ✅ Cập nhật selectedRoom
            setSelectedRoom(updatedRoom);
            setMembers(members);
            localStorage.setItem("selectedRoom", JSON.stringify(updatedRoom));

            toast.success("Bạn đã tham gia phòng thành công");
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Không thể tham gia phòng");
        }
    };
    const mergeRooms = (
        myData: Room[],
        publicData: Room[],
        savedMyRooms: Room[],
        currentUserId: string
    ): Room[] => {
        const processRoom = (r: Room, joinedDefault: boolean): Room => {
            const members = ensureOwnerInMembers(r, r.members || []);
            const saved = savedMyRooms.find(s => s.id === r.id);

            const isMine = String(r.nguoi_tao_id) === currentUserId;
            const joined = saved?.joined ?? joinedDefault ?? false;

            return {
                ...r,
                members,
                isMine,
                joined,
            };
        };

        const myRoomsProcessed = myData.map(r => processRoom(r, true));
        const publicRoomsProcessed = publicData.map(r => processRoom(r, false));

        // Lấy tất cả phòng đã join (isMine || joined) làm myRooms
        const myRoomsMerged = [...myRoomsProcessed, ...publicRoomsProcessed.filter(r => r.isMine || r.joined)];

        return myRoomsMerged;
    };

    // ==================== Phần trên component ====================
    const fetchRoomsFull = async (options?: { keepSelected?: boolean }) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const localSurveyUrl = localStorage.getItem("latest_survey_url") || null;
        const savedMyRooms: Room[] = JSON.parse(localStorage.getItem("myRooms") || "[]");
        const savedSelectedRoom: Room | null = JSON.parse(localStorage.getItem("selectedRoom") || "null");

        const normalizeMembers = (detailData: any, oldMembers?: Member[], currentUserId?: string): Member[] => {
            const ownerId = detailData.nguoi_tao_id ? String(detailData.nguoi_tao_id) : null;

            const owner: Member | null = ownerId
                ? {
                    id: ownerId,
                    name: detailData.nguoi_tao_ten || "Chủ phòng",
                    email: detailData.nguoi_tao_email || "Chưa cập nhật",
                    status: "owner",
                    canRemove: false,
                }
                : null;

            const apiMembers: Member[] = (detailData.members || [])
                .filter((m: any) => ownerId !== String(m.user_id))
                .map((m: any) => ({
                    id: String(m.user_id),
                    name: m.ten_nguoi_dung || "",
                    email: m.email || "",
                    status: m.status || "active",
                    canRemove: true,
                }));

            let mergedMembers: Member[] = [...apiMembers];
            if (owner) mergedMembers.unshift(owner);

            if (currentUserId && mergedMembers.some(m => m.id === currentUserId)) {
                mergedMembers = mergedMembers.map(m =>
                    m.id === currentUserId ? { ...m, name: "Bạn" } : m
                );
            }

            if (oldMembers) {
                oldMembers.forEach(m => {
                    if (!mergedMembers.some(x => x.id === m.id)) {
                        mergedMembers.push(m);
                    }
                });
            }

            return mergedMembers.filter(
                (m, index, self) => self.findIndex(x => x.id === m.id) === index
            );
        };

        try {
            const currentUserId = String(userId);

            // 1️⃣ Fetch myRooms + publicRooms cùng lúc
            const [resMy, resPublic] = await Promise.all([
                axios.get(`${API_BASE}/rooms`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE}/lobby`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const myData: Room[] = resMy.data.data || [];
            const publicData: Room[] = resPublic.data.data || resPublic.data.rooms || [];

            // 2️⃣ Merge rooms
            const mergeRoom = (r: Room, saved?: Room, joinedDefault = false): Room => {
                // ✅ Nếu keepSelected && đây là selectedRoom, dùng members hiện tại
                let members = options?.keepSelected && savedSelectedRoom && r.id === savedSelectedRoom.id
                    ? savedSelectedRoom.members
                    : [...(r.members?.length ? r.members : saved?.members || [])];

                const ownerId = String(r.nguoi_tao_id);
                members = members.map(m =>
                    String(m.id) === ownerId ? { ...m, status: "owner" } : m
                );

                const khao_sat = {
                    ...saved?.khao_sat,
                    ...r.khao_sat,
                    public_link: r.khao_sat?.public_link ?? saved?.khao_sat?.public_link ?? localSurveyUrl ?? undefined,
                };

                const isMine = String(r.nguoi_tao_id) === currentUserId;
                const joined = saved?.joined ?? joinedDefault;

                return {
                    ...r,
                    members,
                    isMine,
                    joined,
                    khao_sat,
                    khao_sat_link: khao_sat.public_link,
                };
            };

            const mergedMyRooms: Room[] = [
                ...myData.map(r => mergeRoom(r, savedMyRooms.find(s => s.id === r.id), true)),
                ...publicData
                    .map(r => mergeRoom(r, savedMyRooms.find(s => s.id === r.id), false))
                    .filter(r => r.joined),
            ];

            // ✅ Loại bỏ duplicate theo id
            const finalMyRooms = mergedMyRooms.filter(
                (room, index, self) => self.findIndex(r => r.id === room.id) === index
            );

            setMyRooms(finalMyRooms);
            localStorage.setItem("myRooms", JSON.stringify(finalMyRooms));

            // 3️⃣ Fetch full public rooms + members
            const fullPublicRooms: Room[] = await Promise.all(
                publicData.map(async r => {
                    try {
                        const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        let members: Member[] = (resMembers.data.participants || []).map((p: any) => ({
                            id: String(p.user_id),
                            name: p.ten_nguoi_dung || "",
                            email: p.email || "",
                            status: p.status || "active",
                        }));

                        // ✅ Thêm chủ phòng luôn
                        const ownerId = String(r.nguoi_tao_id);
                        if (!members.some(m => m.id === ownerId)) {
                            members.unshift({
                                id: ownerId,
                                name: r.nguoi_tao_ten || "Chủ phòng",
                                email: r.nguoi_tao_email || "",
                                status: "owner",
                            });
                        }

                        const joined = members.some(m => m.id === String(userId));
                        const isMine = ownerId === String(userId);

                        return { ...r, members, joined, isMine };
                    } catch (err) {
                        console.error("Lỗi fetch members:", err);
                        return { ...r, members: [], joined: false, isMine: false };
                    }
                })
            );

            setPublicRooms(fullPublicRooms);


            // 4️⃣ Cập nhật selectedRoom
            if (options?.keepSelected && savedSelectedRoom) {
                const updatedSelected = mergedMyRooms.find(r => String(r.id) === String(savedSelectedRoom.id));
                if (updatedSelected) {
                    const detailRes = await getRoomDetailAPI(updatedSelected.id, token);
                    const detailData = detailRes.data;
                    const mergedMembers = normalizeMembers(detailData, savedSelectedRoom.members, currentUserId);

                    setSelectedRoom({ ...updatedSelected, ...detailData, members: mergedMembers });
                    setMembers(mergedMembers);
                } else {
                    setSelectedRoom(null);
                    setMembers([]);
                }
            }
        } catch (err) {
            console.error("Lỗi fetchRoomsFull:", err);
            toast.error("Không lấy được danh sách phòng");
        }
    };


    // ==================== useEffect chạy fetchRoomsFull lần đầu ====================
    useEffect(() => {
        fetchRoomsFull(); // chạy lần đầu
        const interval = setInterval(() => fetchRoomsFull(), 1000); // chạy định kỳ
        return () => clearInterval(interval);
    }, []);


    const handleLockRoom = async (roomId: number, lock: boolean) => {
        if (!token) return toast.error("Bạn phải đăng nhập để thực hiện");

        try {
            setIsLocking(true);

            let res;
            if (lock) {
                // Lock room
                res = await axios.post(`${API_BASE}/rooms/${roomId}/lock`, null, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                // Unlock room
                res = await axios.put(`${API_BASE}/rooms/${roomId}/unlock`, null, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            // Cập nhật state
            setSelectedRoom(prev => prev ? { ...prev, is_locked: lock } : prev);
            setMyRooms(prev => prev.map(r => r.id === roomId ? { ...r, is_locked: lock } : r));
            setPublicRooms(prev => prev.map(r => r.id === roomId ? { ...r, is_locked: lock } : r));

            toast.success(res.data.message || `Phòng đã ${lock ? 'khóa' : 'mở khóa'}`);
        } catch (err: any) {
            if (err.response?.status === 401) toast.error("Bạn phải đăng nhập để thực hiện hành động này");
            else if (err.response?.status === 403) toast.error("Bạn không có quyền thực hiện hành động này");
            else if (err.response?.status === 404) toast.error("Phòng không tồn tại");
            else toast.error(err.response?.data?.error || "Không thể thay đổi trạng thái phòng");
        } finally {
            setIsLocking(false);
        }
    };



    const fetchMembers = async (roomId: number) => {
        if (!token) return;
        try {
            const res = await getRoomParticipantsAPI(roomId, token);
            const mappedMembers: Member[] = (res.data.participants || []).map((p: any) => ({
                id: String(p.user_id),          // dùng user_id làm id
                name: p.ten_nguoi_dung || "",   // map tên
                email: p.email || ""            // nếu API không có email thì để rỗng
            }));
            setMembers(mappedMembers);
        } catch (err: any) {
            toast.error("Không lấy được danh sách thành viên");
        }
    };

    const checkRoomExists = async (roomId) => {
        try {
            const response = await axios.get(`${API_BASE}/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data; // Nếu phòng tồn tại, trả về dữ liệu phòng
        } catch (error) {
            console.error("Phòng không tồn tại:", error.response.data);
            return null; // Nếu phòng không tồn tại, trả về null
        }
    };
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Quản lý phòng</h1>
                            <p className="text-muted-foreground">Tạo và quản lý các phòng khảo sát của bạn</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Tạo phòng mới
                            </Button>
                            {/* Nút Phòng đã lưu trữ */}
                            <ArchiveDialog
                                token={token}
                                onRestore={(room) => {
                                    // Cập nhật danh sách myRooms
                                    setMyRooms(prev => [
                                        {
                                            id: Number(room.id),
                                            ten_room: room.ten_room,
                                            mo_ta: room.mo_ta,
                                            members: (room.members ?? []).map(m =>
                                                typeof m === "string"
                                                    ? { id: m, name: "Bạn", email: "" } // convert string → Member
                                                    : m
                                            ),
                                            trang_thai: "active",
                                            ngay_tao: room.ngay_tao,
                                            nguoi_tao_id: userId,
                                            share_url: room.share_url || `${window.location.origin}/room/${room.id}`,
                                        },
                                        ...prev
                                    ]);
                                }}
                            />

                            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                                <DialogTrigger asChild>
                                    <Button className="relative flex items-center gap-2" variant="outline">
                                        <Users className="h-4 w-4" /> Tham gia phòng
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Tham gia phòng</DialogTitle>
                                        <DialogDescription>Nhập URL phòng để tham gia</DialogDescription>
                                    </DialogHeader>

                                    <Input
                                        placeholder="Nhập URL phòng"
                                        value={joinRoomURL}
                                        onChange={async (e) => {
                                            const url = e.target.value;
                                            setJoinRoomURL(url);
                                            setRoomPassword(""); // reset password
                                            setRequirePassword(false); // reset requirePassword

                                            // Kiểm tra URL hợp lệ chưa
                                            const match = url.match(
                                                /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
                                            );
                                            if (!match) return;

                                            const shareURL = match[0];

                                            try {
                                                const roomRes = await axios.get(`${API_BASE}/rooms/share/${shareURL}`);
                                                const roomData = roomRes.data.room || roomRes.data;

                                                // Nếu phòng require password thì hiển thị input
                                                if (roomData.require_password) {
                                                    setRequirePassword(true);
                                                }
                                            } catch (err) {
                                                console.error("Lỗi khi fetch room:", err);
                                            }
                                        }}
                                    />

                                    {requirePassword && (
                                        <Input
                                            placeholder="Nhập mật khẩu phòng"
                                            type="password"
                                            value={roomPassword}
                                            onChange={(e) => setRoomPassword(e.target.value)}
                                            className="mt-2"
                                        />
                                    )}

                                    <Button
                                        onClick={async () => {
                                            try {
                                                await handleJoinRoomByURL(); // hàm này sẽ dùng roomPassword nếu có
                                                setShowInviteDialog(false); // chỉ đóng dialog khi join thành công
                                                setJoinRoomURL("");
                                                setRoomPassword("");
                                                setRequirePassword(false);
                                            } catch (err) {
                                                console.error("Lỗi join room:", err);
                                            }
                                        }}
                                        className="mt-4"
                                    >
                                        Tham gia
                                    </Button>
                                </DialogContent>
                            </Dialog>



                        </div>
                    </div>
                    {/* CREATE FORM */}
                    {showCreateForm && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>Tạo phòng mới</CardTitle>
                                <CardDescription>Điền thông tin để tạo phòng khảo sát mới</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Tên phòng"
                                    value={newRoom.ten_room}
                                    onChange={e => setNewRoom({ ...newRoom, ten_room: e.target.value })}
                                />
                                <Input
                                    placeholder="Mô tả"
                                    value={newRoom.mo_ta}
                                    onChange={e => setNewRoom({ ...newRoom, mo_ta: e.target.value })}
                                />

                                {/* Dropdown chọn khảo sát */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium mb-1 block">Chọn khảo sát</label>
                                    <select
                                        value={newRoom.khao_sat_id ?? ""}
                                        onChange={e =>
                                            setNewRoom({ ...newRoom, khao_sat_id: Number(e.target.value) })
                                        }
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        <option value="">-- Chọn khảo sát --</option>
                                        {mySurveys.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.tieu_de || `Khảo sát #${s.id}`}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Hiển thị URL khảo sát khi đã chọn */}
                                    {newRoom.khao_sat_id !== null && (() => {
                                        const selectedSurvey = mySurveys.find(s => s.id === newRoom.khao_sat_id);
                                        <p>{selectedSurvey.tieu_de || "Khảo sát chưa đặt tiêu đề"}</p>


                                        return (
                                            <div className="mt-2 space-y-1">
                                                <p className="text-sm font-medium">
                                                    {selectedSurvey.tieu_de} {/* Tên khảo sát thực */}
                                                </p>
                                                {selectedSurvey.public_link ? (
                                                    <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50">
                                                        <code className="text-sm truncate">{selectedSurvey.public_link}</code>
                                                        <Button
                                                            onClick={() => copyInviteCode(selectedSurvey.public_link!)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="ml-2 hover:bg-primary/10"
                                                        >
                                                            <Copy className="h-4 w-4 text-primary" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">Khảo sát này chưa có URL</p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-4">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newRoom.is_public ?? true}
                                            onChange={e => setNewRoom({ ...newRoom, is_public: e.target.checked })}
                                        />{" "}
                                        Công khai
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newRoom.khoa ?? false}
                                            onChange={e => setNewRoom({ ...newRoom, khoa: e.target.checked })}
                                        />{" "}
                                        Khoá (có mật khẩu)
                                    </label>
                                </div>

                                {newRoom.khoa && (
                                    <Input
                                        type="password"
                                        placeholder="Mật khẩu"
                                        value={newRoom.mat_khau}
                                        onChange={e => setNewRoom({ ...newRoom, mat_khau: e.target.value })}
                                    />
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        onClick={async () => {
                                            if (!token) return toast.error("Bạn phải đăng nhập mới tạo được phòng");
                                            if (!newRoom.ten_room.trim()) return toast.error("Tên phòng không được để trống");
                                            if (!newRoom.khao_sat_id && !localSurveyUrl)
                                                return toast.error("Phải chọn hoặc tạo khảo sát trước khi tạo phòng");

                                            await handleCreateRoom();
                                        }}
                                    >
                                        Tạo phòng
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>Hủy</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* EDIT FORM */}
                    {showEditForm && editRoom && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>Chỉnh sửa phòng</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    value={editRoom.ten_room}
                                    onChange={e => setEditRoom({ ...editRoom, ten_room: e.target.value })}
                                />
                                <Input
                                    value={editRoom.mo_ta || ""}
                                    onChange={e => setEditRoom({ ...editRoom, mo_ta: e.target.value })}
                                />

                                {/* Dropdown chọn khảo sát */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium mb-1 block">Chọn khảo sát</label>
                                    <select
                                        value={editRoom.khao_sat_id ?? ""}
                                        onChange={e =>
                                            setEditRoom({
                                                ...editRoom,
                                                khao_sat_id: Number(e.target.value),
                                                khao_sat_link: mySurveys.find(s => s.id === Number(e.target.value))?.public_link || null
                                            })
                                        }
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        <option value="">-- Chọn khảo sát --</option>
                                        {mySurveys.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.tieu_de}  {/* Hiển thị tên khảo sát thực */}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Hiển thị URL khảo sát khi đã chọn */}
                                    {editRoom.khao_sat_link && (
                                        <div className="mt-2 flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50">
                                            <code className="text-sm truncate">{editRoom.khao_sat_link}</code>
                                            <Button
                                                onClick={() => copyInviteCode(editRoom.khao_sat_link!)}
                                                variant="ghost"
                                                size="icon"
                                                className="ml-2 hover:bg-primary/10"
                                            >
                                                <Copy className="h-4 w-4 text-primary" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editRoom.is_public ?? true}
                                            onChange={e => setEditRoom({ ...editRoom, is_public: e.target.checked })}
                                        />{" "}
                                        Công khai
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editRoom.khoa ?? false}
                                            onChange={e => setEditRoom({ ...editRoom, khoa: e.target.checked })}
                                        />{" "}
                                        Khoá (có mật khẩu)
                                    </label>
                                </div>
                                {editRoom.khoa && (
                                    <Input
                                        type="password"
                                        placeholder="Mật khẩu"
                                        value={editRoom.mat_khau || ""}
                                        onChange={e => setEditRoom({ ...editRoom, mat_khau: e.target.value })}
                                    />
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={handleUpdateRoom}>Cập nhật</Button>
                                    <Button variant="outline" onClick={() => {
                                        setShowEditForm(false);
                                        setEditRoom(null);
                                        setSelectedRoom(null);
                                    }}>Hủy</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Phòng của bạn (tạo hoặc tham gia) */}
                    {myRooms.
                        filter(room => {
                            const isOwner = String(room.nguoi_tao_id) === String(userId);
                            const isMember = (room.members ?? []).some(m => String(m.id) === String(userId));
                            return isOwner || isMember;
                        }).length > 0 && (
                            <>
                                <h2 className="text-2xl font-bold mb-4">Phòng của bạn</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myRooms
                                        .filter(room => {
                                            const isOwner = String(room.nguoi_tao_id) === String(userId);
                                            const isMember = (room.members ?? []).some(m => String(m.id) === String(userId));
                                            return isOwner || isMember;
                                        })
                                        .map((room, index) => {  // <-- thêm index ở đây
                                            const isOwner = String(room.nguoi_tao_id) === String(userId);

                                            return (
                                                <Card
                                                    key={`my-${room.id}-${index}`} // <-- dùng index trong key để đảm bảo unique
                                                    className="hover:shadow-lg transition-shadow cursor-pointer"
                                                    onClick={(e) => {
                                                        if ((e.target as HTMLElement).closest(".no-detail")) return;
                                                        if (archiveDialogRoom) return;
                                                        handleOpenRoom(room);
                                                    }}
                                                >
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <Badge className={`room-state ${room.is_public ? "bg-primary text-white" : "bg-red-500 text-white"}`}>
                                                                    {room.is_public ? "Công khai" : "Riêng tư"}
                                                                </Badge>
                                                                <CardTitle>{room.ten_room}</CardTitle>
                                                                <CardDescription>{room.mo_ta}</CardDescription>
                                                            </div>
                                                            {isOwner && (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openEditRoom(room);  // <-- gọi hàm mở edit room
                                                                            /* open edit */
                                                                        }}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="no-detail"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        onClick={(e) => { e.stopPropagation(); setArchiveDialogRoom(room); setSelectedRoom(null); }}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-destructive no-detail"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="flex flex-col gap-3">
                                                        {/* Thành viên */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm font-medium">
                                                                    Thành viên ({(selectedRoom?.id === room.id ? members.length : room.members?.length) ?? 0})
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(room.members ?? []).slice(0, 3).map(member => (
                                                                    <Badge
                                                                        key={`my-${room.id}-member-${member.id}`}
                                                                        variant="secondary"
                                                                        className="text-xs flex items-center gap-1"
                                                                    >
                                                                        {member.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* URL + copy */}
                                                        <div className="flex justify-between items-center">
                                                            <Badge variant="outline">{room.share_url}</Badge>
                                                            <Button onClick={() => copyInviteCode(room.share_url!)} variant="ghost" size="sm">
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        <div className="text-xs text-muted-foreground pt-2 border-t">
                                                            Ngày tạo: {room.ngay_tao ? format(new Date(room.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi }) : "Không rõ"}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                    {/* Empty State */}
                    {!showCreateForm &&
                        myRooms.filter(r => String(r.nguoi_tao_id) === String(userId)).length === 0 &&
                        publicRooms.filter(r => r.is_public).length === 0 && (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">Chưa có phòng nào</h3>
                                <p className="text-muted-foreground mb-4">Tạo phòng đầu tiên để bắt đầu</p>
                                <Button onClick={() => setShowCreateForm(true)} className="flex items-center justify-center gap-2 mx-auto">
                                    <Plus className="h-4 w-4" /> Tạo phòng mới
                                </Button>
                            </div>
                        )}
                    {/* PHÒNG CÔNG KHAI */}
                    {Array.isArray(publicRooms) && publicRooms.some(room => room.is_public) && (
                        <>
                            <h2 className="text-2xl font-bold mt-8 mb-4">Phòng công khai</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {publicRooms
                                    .filter(room => room.is_public)
                                    .map((room, index) => (
                                        <Card
                                            key={`public-${room.id}-${index}`}
                                            className="hover:shadow-lg transition-shadow cursor-pointer"
                                            onClick={(e) => {
                                                if ((e.target as HTMLElement).closest(".no-detail")) return;
                                                setSelectedRoom({ ...room, isMine: false });
                                            }}
                                        >
                                            <CardHeader>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <Badge
                                                            className={`room-state ${room.is_public ? "bg-primary text-white" : "bg-red-500 text-white"}`}
                                                        >
                                                            {room.is_public ? "Công khai" : "Riêng tư"}
                                                        </Badge>
                                                        <CardTitle>{room.ten_room}</CardTitle>
                                                        <CardDescription>{room.mo_ta}</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-3">
                                                {/* Thành viên */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">
                                                            Thành viên ({room.members?.length ?? 0})
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(() => {
                                                            const ownerId = String(room.nguoi_tao_id);
                                                            const ownerName = room.nguoi_tao_ten || "Chủ phòng";
                                                            const membersToShow = room.members ? [...room.members] : [];
                                                            if (!membersToShow.some(m => String(m.id) === ownerId)) {
                                                                membersToShow.unshift({
                                                                    id: ownerId,
                                                                    name: ownerName,
                                                                    status: "owner"
                                                                });
                                                            }
                                                            return membersToShow.slice(0, 3).map(member => (
                                                                <Badge
                                                                    key={`public-${room.id}-member-${member.id}`}
                                                                    variant="secondary"
                                                                    className="text-xs flex items-center gap-1"
                                                                >
                                                                    {member.name}
                                                                </Badge>
                                                            ));
                                                        })()}

                                                    </div>
                                                </div>

                                                {/* URL + copy */}
                                                <div className="flex justify-between items-center">
                                                    <Badge variant="outline">{room.share_url}</Badge>
                                                    <Button
                                                        onClick={() => room.share_url && copyInviteCode(room.share_url)}
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                {/* Ngày tạo */}
                                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                                    Ngày tạo:{" "}
                                                    {room.ngay_tao
                                                        ? format(new Date(room.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi })
                                                        : "Không rõ"}
                                                </div>

                                                {/* 👉 Nút tham gia phòng (chỉ hiện khi chưa tham gia và không phải chủ phòng) */}
                                                {!room.isMine && (
                                                    <Button
                                                        className="mt-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            enterRoom(room); // ✅ gọi hàm bạn viết
                                                        }}
                                                    >
                                                        Tham gia phòng
                                                    </Button>
                                                )}

                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        </>
                    )}


                    {/* Dialog Lưu trữ phòng */}
                    {archiveDialogRoom && (
                        <Dialog
                            open={archiveDialogRoom !== null}
                            onOpenChange={(open) => {
                                if (!open) setArchiveDialogRoom(null);
                            }}
                        >
                            <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Lưu trữ phòng?</DialogTitle>
                                    <DialogDescription>
                                        Bạn có chắc muốn lưu trữ phòng <b>{archiveDialogRoom.ten_room}</b>?
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2 mt-4">
                                    <DialogClose asChild>
                                        <Button variant="outline">Hủy</Button>
                                    </DialogClose>
                                    <Button
                                        className="bg-yellow-600 text-white hover:bg-yellow-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchiveRoom(archiveDialogRoom.id);
                                            setArchiveDialogRoom(null);
                                        }}
                                    >
                                        Lưu trữ
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    {/* Dialog hiển thị chi tiết */}
                    <Dialog open={selectedRoom !== null && !showEditForm} onOpenChange={() => setSelectedRoom(null)}>
                        <DialogContent className="max-w-lg rounded-2xl shadow-xl p-6 bg-white">
                            {selectedRoom && (
                                <>
                                    <DialogHeader className="border-b pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-primary/10">
                                                <Users className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl font-semibold">
                                                    {selectedRoom.ten_room}
                                                </DialogTitle>
                                                <DialogDescription className="text-sm text-muted-foreground">
                                                    {selectedRoom.mo_ta || "Không có mô tả"}
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>
                                    {/* Tabs */}
                                    <Tabs defaultValue="info" className="w-full">
                                        <TabsList className="grid grid-cols-4 mb-4">
                                            <TabsTrigger value="info">Info</TabsTrigger>
                                            <TabsTrigger value="members">Members</TabsTrigger>
                                            <TabsTrigger value="security">Security</TabsTrigger>
                                            <TabsTrigger value="surveys">Surveys</TabsTrigger> {/* tab mới */}

                                        </TabsList>
                                        {/* INFO TAB */}
                                        <TabsContent value="info" className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Trạng thái</span>
                                                <Badge
                                                    className={`px-3 py-1 rounded-full text-xs ${selectedRoom.is_public ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                                        }`}
                                                >
                                                    {selectedRoom.is_public ? "Công khai" : "Riêng tư"}
                                                </Badge>
                                            </div>
                                            <div className="max-w-full overflow-hidden">
                                                {/* Link khảo sát */}
                                                {selectedRoom.khao_sat?.public_link && (
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground mb-2">Liên kết khảo sát</p>
                                                        <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50 max-w-full">
                                                            <code className="text-sm break-words whitespace-pre-wrap max-w-[calc(100%-40px)]">
                                                                {selectedRoom.khao_sat.public_link}
                                                            </code>
                                                            <Button
                                                                onClick={() => copyInviteCode(selectedRoom.khao_sat!.public_link!)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="ml-2 hover:bg-primary/10 flex-shrink-0"
                                                            >
                                                                <Copy className="h-4 w-4 text-primary" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Link mời */}
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-2">Liên kết mời</p>
                                                    <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50 max-w-full">
                                                        <code className="text-sm break-words whitespace-pre-wrap max-w-[calc(100%-40px)]">
                                                            {selectedRoom.share_url}
                                                        </code>
                                                        <Button
                                                            onClick={() => copyInviteCode(selectedRoom.share_url!)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="ml-2 hover:bg-primary/10 flex-shrink-0"
                                                        >
                                                            <Copy className="h-4 w-4 text-primary" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground pt-4 border-t">
                                                Ngày tạo:{" "}
                                                {selectedRoom.ngay_tao
                                                    ? format(new Date(selectedRoom.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi })
                                                    : "Không rõ"}
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="members" className="space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium text-muted-foreground">Thành viên</p>
                                            </div>

                                            <div className="space-y-2">
                                                {members.length > 0 ? (
                                                    <>
                                                        {/* Chủ phòng */}
                                                        {members
                                                            .filter(m => m.status === "owner")
                                                            .map(owner => (
                                                                <div key={owner.id} className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">
                                                                            {owner.name} <span className="ml-1 text-xs text-primary">(Chủ phòng)</span>
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground italic">
                                                                            {owner.email?.trim() !== "" ? owner.email : "Chưa cập nhật"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                        {/* Thành viên khác */}
                                                        {members
                                                            .filter(m => m.status !== "owner")
                                                            .map(member => (
                                                                <div key={member.id} className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">{member.name || "Người dùng"}</span>
                                                                        <span className="text-xs text-muted-foreground italic">
                                                                            {member.email?.trim() !== "" ? member.email : "Chưa cập nhật"}
                                                                        </span>
                                                                    </div>
                                                                    {selectedRoom?.isMine && member.id !== String(userId) && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-destructive hover:bg-destructive/10"
                                                                            onClick={() => handleRemoveMember(selectedRoom.id, member.id)}
                                                                        >
                                                                            Xoá
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Chưa có thành viên nào</span>
                                                )}
                                            </div>

                                        </TabsContent>

                                        {/* SECURITY TAB */}
                                        {/* SECURITY TAB */}
                                        <TabsContent value="security" className="space-y-4">
                                            {selectedRoom.isMine ? (
                                                selectedRoom.is_public ? (
                                                    // 👉 Nếu phòng công khai thì chỉ báo không thể đặt mật khẩu
                                                    <span className="text-sm text-muted-foreground">
                                                        Phòng đang công khai, không thể đặt mật khẩu
                                                    </span>
                                                ) : (
                                                    // 👉 Nếu phòng private thì mới cho đặt/gỡ mật khẩu
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedRoom.mat_khau}
                                                            onChange={async (e) => {
                                                                if (e.target.checked) {
                                                                    const newPass = prompt("Nhập mật khẩu mới:");
                                                                    if (newPass) {
                                                                        try {
                                                                            await setRoomPasswordAPI(selectedRoom.id, token!, newPass);
                                                                            toast.success("Đã đặt mật khẩu");
                                                                            fetchRooms();
                                                                            setSelectedRoom((prev) => ({
                                                                                ...prev!,
                                                                                mat_khau: "****",
                                                                            }));
                                                                        } catch (err) {
                                                                            console.error("❌ setRoomPasswordAPI error:", err);
                                                                            toast.error("Không đặt được mật khẩu");
                                                                        }
                                                                    }
                                                                } else {
                                                                    try {
                                                                        await removeRoomPasswordAPI(selectedRoom.id, token!);
                                                                        toast.success("Đã gỡ mật khẩu");
                                                                        fetchRooms();
                                                                        setSelectedRoom((prev) => ({
                                                                            ...prev!,
                                                                            mat_khau: undefined,
                                                                        }));
                                                                    } catch (err) {
                                                                        console.error("❌ removeRoomPasswordAPI error:", err);
                                                                        toast.error("Không gỡ được mật khẩu");
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm">Yêu cầu mật khẩu khi join</span>
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    Bạn không có quyền chỉnh bảo mật cho phòng này
                                                </span>
                                            )}
                                        </TabsContent>




                                        <TabsContent value="surveys" className="space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                                Khảo sát đã chọn cho phòng
                                            </p>
                                            {selectedRoom && selectedRoom.khao_sat?.public_link ? (
                                                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50 max-w-full">
                                                    <code className="text-sm break-words whitespace-pre-wrap max-w-[calc(100%-40px)]">
                                                        {selectedRoom.khao_sat.public_link}
                                                    </code>
                                                    <Button
                                                        onClick={() => copyInviteCode(selectedRoom.khao_sat!.public_link!)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="ml-2 hover:bg-primary/10 flex-shrink-0"
                                                    >
                                                        <Copy className="h-4 w-4 text-primary" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    Chưa có khảo sát nào được chọn
                                                </span>
                                            )}
                                        </TabsContent>


                                    </Tabs>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default RoomPage;
