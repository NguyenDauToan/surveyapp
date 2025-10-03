
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

interface Member {
    id: string;        // user_id (string hóa để đồng nhất key React)
    name: string;      // tên người dùng
    email?: string;    // optional vì API có thể không trả
    status?: string;   // trạng thái tham gia (pending, accepted, ...)
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
    share_url?: string;
    trang_thai?: "active" | "deleted" | "archived";
    is_public?: boolean;
    khoa?: boolean;
    mat_khau?: string;
    members?: Member[]; // 👈 đổi từ string[] sang Member[]
     is_locked?: boolean;
}

    members?: Member[];
    khao_sat?: KhaoSatSummary;

    // ✅ Thêm 2 trường để dùng trong form edit/create
    khao_sat_id?: number | null;
    khao_sat_link?: string | null;
}


interface RoomWithIsMine extends Room {
    isMine?: boolean;
    owner_id?: number | string;
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
    const token = localStorage.getItem("token");
    const userId = Number(localStorage.getItem("user_id") || 0); // ép về number
    const API_BASE = "http://localhost:8080/api";
    const [selectedRoom, setSelectedRoom] = useState<RoomWithIsMine | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [invites, setInvites] = useState<RoomInvite[]>([]);
    //    =====
    const [isLocking, setIsLocking] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false); // 👈 Thêm loading cho members
    const [joinRoomURL, setJoinRoomURL] = useState("");
    const [mySurveys, setMySurveys] = useState<Survey[]>([]);
    const [surveyLink, setSurveyLink] = useState<string | null>(null);
    // Trong component, trước return JSX
    const localSurveyUrl = localStorage.getItem("latest_survey_url") || null;
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        getMyFormsAPI(token)
            .then(data => {
                const surveys = (data || []).map((s: any) => ({
                    ...s,
                    tieu_de: s.title,      // <-- map title từ API thành tieu_de
                    public_link: s.public_link || null,
                    id: s.id,
                }));
                setMySurveys(surveys);
            })
            .catch(err => toast.error("Không tải được khảo sát của bạn"));
    }, []);

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
    useEffect(() => { fetchInvites(); }, []);

// ================= KHÓA / MỞ KHÓA PHÒNG =================
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





    // ================= FETCH ROOMS =================
    const fetchRooms = async () => {

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
    const handleJoinRoomByURL = async () => {
        if (!joinRoomURL) return toast.error("Vui lòng nhập URL phòng");

        console.log("👉 joinRoomURL nhập vào:", joinRoomURL);

        const roomIdMatch = joinRoomURL.match(
            /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
        );
        console.log("👉 roomIdMatch:", roomIdMatch);

        if (!roomIdMatch) {
            toast.error("URL không hợp lệ");
            return;
        }

        const shareURL = roomIdMatch[0];
        console.log("👉 shareURL lấy được từ URL:", shareURL);

        const alreadyJoined = myRooms.some(r => r.share_url === shareURL);
        console.log("👉 alreadyJoined:", alreadyJoined);

        if (alreadyJoined) return toast.error("Bạn đã là thành viên của phòng này");

        const mapToMember = (p: any): Member => ({
            id: String(p.user_id ?? p.id),
            name: p.ten_nguoi_dung || "",
            email: p.email || "",
            status: p.status,
        });

        try {
            console.log("👉 Gọi API enterRoomByShareURL với:", shareURL);
            const response = await enterRoomByShareURL(shareURL);
            console.log("👉 Response từ API:", response);

            const roomData = response.room as any;

            const newRoom: RoomWithIsMine = {
                ...roomData,
                nguoi_tao_id: Number(roomData.nguoi_tao_id ?? userId),
                members: (roomData.members || []).map(mapToMember),
                share_url: roomData.share_url || shareURL,
                isMine: String(roomData.nguoi_tao_id) === String(userId),
            };

            console.log("👉 newRoom object:", newRoom);

            setMyRooms(prev => [...prev, newRoom]);
            toast.success("Bạn đã tham gia phòng thành công");
            setJoinRoomURL("");
        } catch (error: any) {
            console.error("❌ Lỗi khi join room:", error);

            if (error.response?.data?.error === "Vui lòng nhập mật khẩu") {
                const password = prompt("Nhập mật khẩu phòng:");
                if (!password) return toast.error("Bạn chưa nhập mật khẩu");

                try {
                    console.log("👉 Gọi API enterRoomByShareURL với password");
                    const responseWithPass = await enterRoomByShareURL(shareURL, password);
                    console.log("👉 ResponseWithPass:", responseWithPass);

                    const roomData = responseWithPass.room as any;

                    const newRoom: RoomWithIsMine = {
                        ...roomData,
                        nguoi_tao_id: Number(roomData.nguoi_tao_id ?? userId),
                        members: (roomData.members || []).map(mapToMember),
                        share_url: roomData.share_url || shareURL,
                        isMine: String(roomData.nguoi_tao_id) === String(userId),
                    };

                    setMyRooms(prev => [...prev, newRoom]);
                    toast.success("Bạn đã tham gia phòng thành công");
                    setJoinRoomURL("");
                } catch (err) {
                    console.error("❌ Lỗi khi join với password:", err);
                    toast.error("Sai mật khẩu hoặc không thể tham gia phòng");
                }
            } else {
                toast.error("Không thể tham gia phòng, vui lòng kiểm tra lại URL");
            }
        }
    };


    const fetchPublicRooms = async () => {
        try {
            const res = await axios.get(`${API_BASE}/lobby`);
            const rooms: Room[] = res.data.data || res.data.rooms || [];

            const roomsWithMembers = await Promise.all(
                rooms
                    .filter(r => r.trang_thai !== "archived" && r.is_public)
                    .map(async r => {
                        try {
                            const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`);
                            const mappedMembers: Member[] = (resMembers.data.participants || []).map((p: any) => ({
                                id: String(p.user_id),
                                name: p.ten_nguoi_dung || "",
                                email: p.email || ""
                            }));
                            return { ...r, members: mappedMembers, share_url: r.share_url || `${window.location.origin}/room/${r.id}` };
                        } catch {
                            return { ...r, members: [], share_url: r.share_url || `${window.location.origin}/room/${r.id}` };
                        }
                    })
            );
            setPublicRooms(roomsWithMembers);
        } catch (err) {
            console.error("Lỗi khi fetch public rooms:", err);
        }
    };


    const fetchRooms = async () => {
        if (!token) return;
        try {
            const resMy = await axios.get(`${API_BASE}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
            const resPublic = await axios.get(`${API_BASE}/lobby`);

            const myData: Room[] = resMy.data.data || [];
            const publicData: Room[] = resPublic.data.data || resPublic.data.rooms || []; // 👈 sửa lại

            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

            const myRoomsWithMembers: Room[] = await Promise.all(
                myData.map(async r => {
                    try {
                        const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`);
                        const mappedMembers: Member[] = (resMembers.data.participants || []).map((p: any) => ({
                            id: String(p.user_id),
                            name: p.ten_nguoi_dung || "",
                            email: p.email || "",
                            status: p.status || undefined,
                        }));

                        return {
                            ...r,
                            nguoi_tao_id: String(r.nguoi_tao_id ?? userId),
                            members: mappedMembers,
                            share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                            isMine: r.nguoi_tao_id === userId, // ✅ so sánh trực tiếp
                        };
                    } catch {
                        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                        return {
                            ...r,
                            members: [
                                {
                                    id: String(userId), // ✅ ép sang string
                                    name: storedUser.Ten || "Bạn",
                                    email: storedUser.email || "",
                                    status: "owner",
                                },
                            ],
                        };
                    }
                })
            );



            const publicRoomsWithMembers: Room[] = await Promise.all(
                publicData.map(async (r) => {
                    try {
                        const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        const mappedMembers: Member[] = (resMembers.data.participants || []).map((p: any) => ({
                            id: String(p.user_id),
                            name: p.ten_nguoi_dung || "",
                            email: p.email || "",
                            status: p.status || undefined,
                        }));

                        return {
                            ...r,
                            members: mappedMembers,
                            share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                            isMine: String(r.nguoi_tao_id) === String(userId),
                        };
                    } catch (err) {
                        console.error("Không lấy được member cho public room", r.id, err);
                        return { ...r, members: [] };
                    }
                })
            );

            setMyRooms(myRoomsWithMembers);
            setPublicRooms(publicRoomsWithMembers);

            if (selectedRoom) {
                const updated = [...myRoomsWithMembers, ...publicRoomsWithMembers].find(r => r.id === selectedRoom.id);
                if (updated) setSelectedRoom({ ...updated, isMine: selectedRoom.isMine });
                setMembers(updated?.members || []);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không lấy được danh sách phòng");
            console.error(err);
        }
    };

    useEffect(() => {
        if (!selectedRoom) return;
        setMembers(selectedRoom.members || []);
    }, [selectedRoom]);
    useEffect(() => {
        fetchPublicRooms(); // fetch ngay khi mount
        fetchRooms(); // fetch ngay khi mount
        const interval = setInterval(fetchRooms, 10000); // 10s
        return () => clearInterval(interval);
    }, []);
    const handleRemoveMember = async (roomId: number, memberId: string) => {
        if (!token) return toast.error("Bạn phải đăng nhập để xoá thành viên");
        try {
            await removeMemberAPI(roomId, token, memberId);
            setSelectedRoom(prev => prev ? { ...prev, members: prev.members?.filter(m => m.id !== memberId) } : prev);
            setMyRooms(prev => prev.map(r => r.id === roomId ? { ...r, members: r.members?.filter(m => m.id !== memberId) } : r));
            toast.success("Đã xoá thành viên");
        } catch (err: any) {
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
                    khao_sat_id: newRoom.khao_sat_id, // ✅ dùng ID thực tế
                    ten_room: newRoom.ten_room,
                    mo_ta: newRoom.mo_ta,
                    is_public: newRoom.is_public,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const roomData = res.data.data; // backend trả về Room
            const surveyFromDB = roomData.khao_sat; // khảo sát từ backend
            const surveyUrl = surveyFromDB?.public_link || localSurveyUrl; // fallback local

            const newCreatedRoom: Room = {
                id: roomData.id,
                ten_room: roomData.ten_room,
                mo_ta: roomData.mo_ta,
                is_public: roomData.is_public,
                nguoi_tao_id: userId,
                trang_thai: "active",
                ngay_tao: new Date().toISOString(),
                share_url: roomData.share_url || `${window.location.origin}/room/${roomData.id}`,
                khao_sat: surveyFromDB
                    ? { ...surveyFromDB, public_link: surveyUrl }
                    : surveyUrl
                        ? { id: 0, tieu_de: "Khảo sát mới", mo_ta: "", public_link: surveyUrl }
                        : null,
                members: [
                    {
                        id: String(userId), // ép sang string
                        name: JSON.parse(localStorage.getItem("user") || "{}").Ten || "Bạn",
                        email: JSON.parse(localStorage.getItem("user") || "{}").email || ""
                    }
                ],
            };

            // ✅ Cập nhật surveyLink trong newRoom
            if (surveyUrl) {
                localStorage.setItem("latest_survey_url", surveyUrl);
                setNewRoom(prev => ({ ...prev, khao_sat_link: surveyUrl }));
            }

            setMyRooms(prev => [newCreatedRoom, ...prev]);
            if (newRoom.is_public) setPublicRooms(prev => [newCreatedRoom, ...prev]);

            toast.success(`Phòng "${newRoom.ten_room}" đã tạo`);
            // ✅ Reset state newRoom đầy đủ
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
            await updateRoomAPI(editRoom.id, token, {
                ten_room: editRoom.ten_room,
                mo_ta: editRoom.mo_ta,
                is_public: editRoom.is_public
            });
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
    const handleOpenRoom = async (room: Room) => {
        if (!token) return;
        try {
            const detail = await getRoomDetailAPI(room.id, token);
            const mappedMembers: Member[] = (detail.data.members || []).map((p: any) => ({
                id: String(p.user_id),
                name: p.ten_nguoi_dung || "",
                email: p.email || ""
            }));

            const surveyFromDB = detail.data.khao_sat;
            const localSurveyUrl = room.khao_sat?.public_link || localStorage.getItem("latest_survey_url") || null;

            const fullRoom: RoomWithIsMine = {
                ...room,
                ...detail.data,
                members: mappedMembers,
                khao_sat: surveyFromDB
                    ? { ...surveyFromDB, public_link: surveyFromDB.public_link || localSurveyUrl }
                    : room.khao_sat
                        ? { ...room.khao_sat, public_link: room.khao_sat.public_link || localSurveyUrl }
                        : localSurveyUrl
                            ? { id: 0, tieu_de: "", mo_ta: "", public_link: localSurveyUrl }
                            : null,
                isMine: String(room.nguoi_tao_id) === String(userId),
            };

            setSelectedRoom(fullRoom);
            setMembers(mappedMembers);
        } catch (err: any) {
            toast.error(err.message || "Không lấy được chi tiết phòng");
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

            // Kiểm tra phản hồi từ API
            if (res && res.data && res.data.room) {
                toast.success("Bạn đã tham gia phòng thành công");
                const members = res.data.room.members || []; // Sử dụng danh sách thành viên trả về từ backend
                const updatedRoom: Room = { ...res.data.room, members };

                setMyRooms(prev => {
                    const exist = prev.find(r => r.id === updatedRoom.id);
                    return exist ? prev.map(r => r.id === updatedRoom.id ? updatedRoom : r) : [...prev, updatedRoom];
                });

                setPublicRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
                setSelectedRoom({ ...updatedRoom, isMine: true });
                setMembers(members); // Cập nhật danh sách thành viên trong trạng thái
            } else {
                toast.error("Không thể tham gia phòng, dữ liệu không hợp lệ.");
            }
        } catch (err: any) {
            toast.error(err.message || "Không thể tham gia phòng");
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
                                onRestore={(room) => {
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
                                        <DialogDescription>
                                            Nhập URL phòng để tham gia
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Input
                                        placeholder="Nhập URL phòng"
                                        value={joinRoomURL}
                                        onChange={(e) => setJoinRoomURL(e.target.value)}
                                    />
                                    <Button onClick={handleJoinRoomByURL} className="mt-4">Tham gia</Button>
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
                                        .map(room => {
                                            const isOwner = String(room.nguoi_tao_id) === String(userId);

                                            return (
                                                <Card
                                                    key={room.id}
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
                                                                        onClick={(e) => { e.stopPropagation(); /* open edit */ }}
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
                                                                <span className="text-sm font-medium">Thành viên ({room.members?.length ?? 0})</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(room.members ?? []).slice(0, 3).map((member, index) => (
                                                                    <Badge key={index} variant="secondary" className="text-xs">{member.name}</Badge>
                                                                ))}
                                                                {room.members && room.members.length > 3 && (
                                                                    <Badge variant="secondary" className="text-xs">+{room.members.length - 3} khác</Badge>
                                                                )}
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
                                    .map(room => (
                                        <Card
                                            key={room.id}
                                            className="hover:shadow-lg transition-shadow cursor-pointer"
                                            onClick={(e) => {
                                                if ((e.target as HTMLElement).closest(".no-detail")) return;
                                                setSelectedRoom({ ...room, isMine: false });
                                            }}
                                        >
                                            <CardHeader>
                                                <div>
                                                    <Badge
                                                        className={`room-state ${room.is_public ? "bg-primary text-white" : "bg-red-500 text-white"}`}
                                                    >
                                                        {room.is_public ? "Công khai" : "Riêng tư"}
                                                    </Badge>
                                                    <CardTitle>{room.ten_room}</CardTitle>
                                                    <CardDescription>{room.mo_ta}</CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex flex-col gap-3">
                                                {/* Thành viên */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">
                                                            Thành viên ({selectedRoom?.members?.length ?? 0})
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(selectedRoom?.members ?? []).slice(0, 3).map((member, index) => (
                                                            <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                                                                {member.name}
                                                                {selectedRoom?.isMine && member.id !== String(userId) && (
                                                                    <button
                                                                        onClick={() => handleRemoveMember(selectedRoom.id, member.id)}
                                                                        className="ml-1 text-red-500 hover:text-red-700 text-[10px]"
                                                                    >
                                                                        x
                                                                    </button>
                                                                )}
                                                            </Badge>
                                                        ))}
                                                        {selectedRoom?.members && selectedRoom.members.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{selectedRoom.members.length - 3} khác
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* URL + copy */}
                                                <div className="flex justify-between items-center">
                                                    <Badge variant="outline">{selectedRoom?.share_url}</Badge>
                                                    <Button
                                                        onClick={() => selectedRoom?.share_url && copyInviteCode(selectedRoom.share_url)}
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                {/* Ngày tạo */}
                                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                                    Ngày tạo:{" "}
                                                    {selectedRoom?.ngay_tao
                                                        ? format(new Date(selectedRoom.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi })
                                                        : "Không rõ"}
                                                </div>
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
                                            {/* Link khảo sát */}
                                            {selectedRoom.khao_sat?.public_link && (
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-2">Liên kết khảo sát</p>
                                                    <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50">
                                                        <code className="text-sm truncate">{selectedRoom.khao_sat.public_link}</code>
                                                        <Button
                                                            onClick={() => copyInviteCode(selectedRoom.khao_sat!.public_link!)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="ml-2 hover:bg-primary/10"
                                                        >
                                                            <Copy className="h-4 w-4 text-primary" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}


                                            {/* Link chia sẻ */}

                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-2">Liên kết mời</p>
                                                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50">
                                                    <code className="text-sm truncate">{selectedRoom.share_url}</code>
                                                    <Button
                                                        onClick={() => copyInviteCode(selectedRoom.share_url!)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="ml-2 hover:bg-primary/10"
                                                    >
                                                        <Copy className="h-4 w-4 text-primary" />
                                                    </Button>
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
                                                    members.map((member: Member) => (
                                                        <div key={member.id} className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
                                                            <span className="text-sm">{member.name} ({member.email})</span>
                                                            {selectedRoom?.isMine && member.id !== String(userId) && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-destructive hover:bg-destructive/10"
                                                                    onClick={() => selectedRoom && handleRemoveMember(selectedRoom.id, member.id)}
                                                                >
                                                                    Xoá
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Chưa có thành viên nào</span>
                                                )}
                                            </div>
                                        </TabsContent>
                                        {/* SECURITY TAB */}
<TabsContent value="security" className="space-y-4">
  {/* Lock/Unlock (owner-only) */}
  {selectedRoom?.isMine && (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedRoom.is_locked ?? false}
        onChange={async (e) => {
          if (!selectedRoom) return;
          try {
            // Lock/unlock room API
            await handleLockRoom(selectedRoom.id, e.target.checked);
          } catch {
            toast.error("Không thể thay đổi trạng thái khóa phòng");
          }
        }}
      />
      <span className="text-sm">Khóa phòng (chỉ owner mới vào)</span>
    </div>
  )}

  {/* Password lock (owner-only) */}
  {selectedRoom?.isMine && (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="checkbox"
        checked={selectedRoom.khoa ?? false} // trạng thái password lock
        onChange={async (e) => {
          if (!selectedRoom) return;

          if (e.target.checked) {
            const newPass = prompt("Nhập mật khẩu mới:");
            if (!newPass) return;

            try {
              await setRoomPasswordAPI(selectedRoom.id, token!, newPass);
              toast.success("Đã đặt mật khẩu");
              fetchRooms(); // cập nhật danh sách phòng
            } catch {
              toast.error("Không thể đặt mật khẩu");
            }
          } else {
            try {
              await removeRoomPasswordAPI(selectedRoom.id, token!);
              toast.success("Đã gỡ mật khẩu");
              fetchRooms(); // cập nhật danh sách phòng
            } catch {
              toast.error("Không thể gỡ mật khẩu");
            }
          }
        }}
      />
      <span className="text-sm">Khóa phòng bằng mật khẩu</span>
    </div>
  )}

  {/* Thông báo cho người không phải owner */}
  {!selectedRoom?.isMine && (
    <div className="text-sm text-muted-foreground">
      {selectedRoom?.is_locked
        ? "Phòng đang bị khóa, chỉ owner mới có thể vào"
        : selectedRoom?.khoa
        ? "Phòng có mật khẩu, bạn cần nhập mật khẩu để tham gia"
        : "Bạn không có quyền chỉnh sửa bảo mật phòng"}
    </div>
  )}
</TabsContent>





                                        <TabsContent value="security" className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRoom.khoa ?? false}
                                                    onChange={async (e) => {
                                                        if (e.target.checked) {
                                                            const newPass = prompt("Nhập mật khẩu mới:");
                                                            if (newPass) {
                                                                await setRoomPasswordAPI(selectedRoom.id, token!, newPass);
                                                                toast.success("Đã đặt mật khẩu");
                                                                fetchRooms();
                                                            }
                                                        } else {
                                                            await removeRoomPasswordAPI(selectedRoom.id, token!);
                                                            toast.success("Đã gỡ mật khẩu");
                                                            fetchRooms();
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm">Khóa phòng (mật khẩu)</span>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="surveys" className="space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Khảo sát đã chọn cho phòng</p>
                                            {selectedRoom && selectedRoom.khao_sat?.public_link ? (
                                                <div className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50">
                                                    <code className="text-sm truncate">{selectedRoom.khao_sat.public_link}</code>
                                                    <Button
                                                        onClick={() => copyInviteCode(selectedRoom.khao_sat!.public_link!)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="ml-2 hover:bg-primary/10"
                                                    >
                                                        <Copy className="h-4 w-4 text-primary" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Chưa có khảo sát nào được chọn</span>
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
