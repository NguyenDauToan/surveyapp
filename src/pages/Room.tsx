// ==============================
// RoomPage.tsx
// ==============================
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Edit, Users, User, Archive } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { archiveRoomAPI, deleteRoomAPI, removeRoomPasswordAPI, setRoomPasswordAPI, updateRoomAPI } from "@/api/Api";
import "../styles/Room.css"
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import ArchivedRooms from "./ArchivedRooms";
import ArchiveDialog from "./ArchivedRoomsDialog";
import { inviteMemberAPI, removeMemberAPI } from "@/api/Api";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { enterRoomAPI } from "@/api/Api";
import { getRoomParticipantsAPI } from "@/api/Api";
import { handleAcceptInvite, handleDeclineInvite } from "@/pages/roomInvites";
import { getUserByEmailOrUsername } from "@/api/Api";

interface Member {
    id: string;      // user_id
    name: string;    // tên người dùng (Google name)
    email: string;   // email
}

interface RoomInvite {
    id: number;
    room_id: number;
    room_name: string;
    inviter_name: string;
    status: "pending" | "accepted" | "declined";
}
interface Room {
    id: number;
    nguoi_tao_id?: string;
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

interface RoomWithIsMine extends Room {
    isMine?: boolean;
}
const RoomPage = () => {
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ ten_room: "", mo_ta: "", is_public: true, khoa: false, mat_khau: "" });
    const [editRoom, setEditRoom] = useState<Room | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [archiveDialogRoom, setArchiveDialogRoom] = useState<Room | null>(null);
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id") || "";
    const API_BASE = "https://survey-server-m884.onrender.com/api";
    const [inviteInput, setInviteInput] = useState("");
    const [selectedRoom, setSelectedRoom] = useState<RoomWithIsMine | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [invites, setInvites] = useState<RoomInvite[]>([]);
    //    =====
    const [isLocking, setIsLocking] = useState(false);

    const fetchMembers = async (roomId: number) => {
        if (!token) return;
        try {
          const res = await getRoomParticipantsAPI(roomId, token);
          setMembers(res.data.participants); // cập nhật state members
        } catch (err: any) {
          toast.error("Không lấy được danh sách thành viên");
        }
      };
    const fetchInvites = async () => {
        try {
            const res = await axios.get(`${API_BASE}/invites`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvites(res.data.data || []);
        } catch (err) {
            console.error("Lỗi fetch invites:", err);
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
        try {
            const resMy = await axios.get(`${API_BASE}/rooms`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const myData: Room[] = resMy.data.data || [];

            const resPublic = await axios.get(`${API_BASE}/lobby`);
            const publicData: Room[] = resPublic.data.data || [];

            const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
            const myRoomsWithMembers: Room[] = myData
                .filter((r) => r.trang_thai !== "archived")
                .map((r) => ({
                    ...r,
                    nguoi_tao_id: String(r.nguoi_tao_id ?? userId),
                    members: r.members?.length
                        ? r.members
                        : [
                            {
                                id: userId,
                                name: userInfo.Ten || "Bạn",
                                email: userInfo.email || "",
                            },
                        ],
                    share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                }));


            const publicRoomsWithMembers: Room[] = publicData
                .filter((r) => r.trang_thai !== "archived")
                .map((r) => ({
                    ...r,
                    members: r.members || [],
                    share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                }));

            setMyRooms(myRoomsWithMembers);
            setPublicRooms(publicRoomsWithMembers);
            // Cập nhật selectedRoom nếu nó đang mở
            if (selectedRoom) {
                const updatedRoom = [...myRoomsWithMembers, ...publicRoomsWithMembers].find(r => r.id === selectedRoom.id);
                if (updatedRoom) setSelectedRoom({ ...updatedRoom, isMine: selectedRoom.isMine });
            }
        } catch (err) {
            console.error("Lỗi khi fetch rooms:", err);
        }
    };
    const handleInviteClick = async () => {
        if (!selectedRoom) return;
        if (!inviteInput) return toast.error("Nhập email hoặc username");

        try {
            // giả sử API này trả về user theo email/username
            const res = await getUserByEmailOrUsername(inviteInput, token); // ✅
            const invitedUser = res.data; // hoặc res.data.user tùy API
            await handleInviteMember(selectedRoom.id, invitedUser.id);
            setInviteInput("");
            toast.success("Mời thành viên thành công");
            fetchRooms(); // cập nhật UI nếu cần
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Không tìm thấy người dùng");
        }
    };


    const handleInviteMember = async (roomId: number, userId: number) => {
        if (!token) return toast.error("Bạn phải đăng nhập để mời thành viên");

        try {
            const res = await inviteMemberAPI(roomId, token, userId);
            toast.success(res.data.message || "Mời thành viên thành công");

            // cập nhật UI
            fetchRooms();
            setSelectedRoom(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Không thể mời thành viên");
        }
    };

    // Lấy lại publicRooms mỗi 10s
    useEffect(() => {
        fetchRooms(); // fetch ngay khi mount
        const interval = setInterval(fetchRooms, 10000); // 10s
        return () => clearInterval(interval);
    }, []);


    // ====================== Xoá thành viên ======================
    const handleRemoveMember = async (roomId: number, memberId: string) => {
        if (!token) return toast.error("Bạn phải đăng nhập để xoá thành viên");

        try {
            await removeMemberAPI(roomId, token, memberId);

            // Cập nhật UI local
            setSelectedRoom((prev: any) => ({
                ...prev,
                members: prev.members.filter((m: Member) => m.id !== memberId),
            }));

            setMyRooms((prev) =>
                prev.map((r) =>
                    r.id === roomId
                        ? { ...r, members: r.members?.filter((m: Member) => m.id !== memberId) }
                        : r
                )
            );

            toast.success(`Đã xoá thành viên`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không thể xoá thành viên");
        }
    };


    // ================= CREATE ROOM =================
    const handleCreateRoom = async () => {
        if (!token) return toast.error("Bạn phải đăng nhập mới tạo được phòng");
        if (!newRoom.ten_room.trim()) return toast.error("Tên phòng không được để trống");

        try {
            const res = await axios.post(
                `${API_BASE}/rooms`,
                {
                    khao_sat_id: 1,
                    ten_room: newRoom.ten_room,
                    mo_ta: newRoom.mo_ta,
                    is_public: newRoom.is_public,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const roomId = res.data.data.id;

            if (newRoom.khoa && newRoom.mat_khau.trim()) {
                await setRoomPasswordAPI(roomId, token, newRoom.mat_khau);
            }

            const newCreatedRoom: Room = {
                id: roomId,
                ten_room: newRoom.ten_room,
                mo_ta: newRoom.mo_ta,
                is_public: newRoom.is_public,
                khoa: newRoom.khoa,
                mat_khau: newRoom.mat_khau,
                nguoi_tao_id: userId,
                trang_thai: "active",
                ngay_tao: new Date().toISOString(),
                share_url: `${window.location.origin}/room/${roomId}`,
                members: [
                    {
                        id: userId,
                        name: JSON.parse(localStorage.getItem("user") || "{}").Ten || "Bạn",
                        email: JSON.parse(localStorage.getItem("user") || "{}").email || ""
                    }
                ],
            };

            // Thêm vào phòng của mình
            setMyRooms(prev => [newCreatedRoom, ...prev]);

            // Nếu public, thêm luôn vào publicRooms
            if (newRoom.is_public) {
                setPublicRooms(prev => [newCreatedRoom, ...prev]);
            }

            toast.success(`Phòng "${newRoom.ten_room}" đã tạo`);
            setNewRoom({ ten_room: "", mo_ta: "", is_public: true, khoa: false, mat_khau: "" });
            setShowCreateForm(false);

        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không tạo được phòng");
        }
    };


    // ================= EDIT ROOM =================
    const openEditRoom = (room: Room) => {
        setEditRoom({ ...room, mat_khau: "" });
        setShowEditForm(true);
        setSelectedRoom(null); // 👈 thêm dòng này

    };

    const handleUpdateRoom = async () => {
        if (!token || !editRoom) return;

        try {
            // 1. Update các field chung (trừ mật khẩu)
            await updateRoomAPI(editRoom.id, token, {
                ten_room: editRoom.ten_room,
                mo_ta: editRoom.mo_ta,
                is_public: editRoom.is_public
            });

            // 2. Xử lý mật khẩu
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
    // ================= ARCHIVE ROOM =================
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

    // copyInviteCode.ts
    const copyInviteCode = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => {
                // Nếu dùng toast để thông báo
                toast.success("Đã sao chép link mời");
            })
            .catch((err) => {
                console.error("Không thể sao chép link:", err);
                toast.error("Sao chép thất bại");
            });
    };
    useEffect(() => {
        if (!selectedRoom) {
            setMembers([]);
            return;
        }

        if (selectedRoom.members && selectedRoom.members.length > 0) {
            setMembers(selectedRoom.members);
            return;
        }

        const fetchMembers = async () => {
            try {
                const membersData = await getRoomParticipantsAPI(selectedRoom.id, token);
                setMembers(membersData || []);
                setSelectedRoom(prev => prev ? { ...prev, members: membersData || [] } : prev);
            } catch (err) {
                console.error("Không lấy được danh sách thành viên:", err);
                setMembers([]);
            }
        };

        fetchMembers();
    }, [selectedRoom, token]);

    // ================= COPY & ENTER =================
    const enterRoom = async (room: Room) => {
        if (!token) return toast.error("Bạn phải đăng nhập để tham gia phòng");

        let password: string | undefined;

        try {
            if (room.khoa) {
                password = prompt("Nhập mật khẩu phòng:");
                if (!password) return toast.error("Bạn chưa nhập mật khẩu");
            }

            const res = await enterRoomAPI(room.id, password, token);

            toast.success("Bạn đã tham gia phòng thành công");

            // Lấy danh sách thành viên mới từ server
            const members = await getRoomParticipantsAPI(room.id, token);
            const updatedRoom: Room = {
                ...res.data.room,
                members,   // ✅ cập nhật members chính xác từ server
            };

            // Cập nhật myRooms
            setMyRooms(prev => {
                const exist = prev.find(r => r.id === updatedRoom.id);
                return exist
                    ? prev.map(r => r.id === updatedRoom.id ? { ...r, members: members } : r)
                    : [...prev, updatedRoom];
            });

            // Cập nhật publicRooms
            setPublicRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));

            // Hiển thị chi tiết phòng
            setSelectedRoom({ ...updatedRoom, isMine: true });

        } catch (err: any) {
            toast.error(err.message || "Không thể tham gia phòng");
        }
    };



    // ================= RENDER =================
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
                            <Button
                                onClick={() => setShowInviteDialog(true)}
                                className="flex items-center gap-2"
                                variant="outline"
                            >
                                <Users className="h-4 w-4" /> Lời mời
                            </Button>
                            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Lời mời tham gia phòng</DialogTitle>
                                        <DialogDescription>
                                            Xem danh sách lời mời và chấp nhận hoặc từ chối
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-2 mt-4">
                                        {invites.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Chưa có lời mời nào</p>
                                        ) : (
                                            invites.map((invite) => (
                                                <div
                                                    key={invite.id}
                                                    className="flex justify-between items-center p-2 bg-muted/30 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-medium">{invite.room_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Mời bởi: {invite.inviter_name}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleAcceptInvite(invite.id, token || "", setInvites)
                                                            }
                                                        >
                                                            Chấp nhận
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleDeclineInvite(invite.id, token || "", setInvites)
                                                            }
                                                        >
                                                            Từ chối
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
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
                                    <Button onClick={handleCreateRoom}>Tạo phòng</Button>
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
                                        setSelectedRoom(null); // 👈 thêm dòng này
                                    }}>Hủy</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* PHÒNG CỦA MÌNH */}
                    {myRooms
                        .filter(room => String(room.nguoi_tao_id) === String(userId))
                        .length > 0 && (
                            <>
                                <h2 className="text-2xl font-bold mb-4">Phòng của bạn</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myRooms
                                        .filter(room => String(room.nguoi_tao_id) === String(userId)) // 👈 chỉ lấy phòng mình tạo
                                        .map(room => {
                                            const isOwner = Number(room.nguoi_tao_id) === Number(userId);
                                            return (
                                                <Card
                                                    key={room.id}
                                                    className="hover:shadow-lg transition-shadow cursor-pointer"
                                                    onClick={(e) => {
                                                        if ((e.target as HTMLElement).closest(".no-detail")) return;
                                                        if (archiveDialogRoom) return; // 🔹 không mở chi tiết khi dialog lưu trữ đang mở
                                                        setSelectedRoom({ ...room, isMine: true }); // 👈 thêm isMine
                                                    }}
                                                >
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <Badge
                                                                    className={`room-state ${room.is_public ? "bg-primary text-white" : "bg-red-500 text-white"
                                                                        }`}
                                                                >
                                                                    {room.is_public ? "Công khai" : "Riêng tư"}
                                                                </Badge>
                                                                <CardTitle>{room.ten_room}</CardTitle>
                                                                <CardDescription>{room.mo_ta}</CardDescription>
                                                            </div>

                                                            <div className="flex gap-1">
                                                                {isOwner && (
                                                                    <>
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openEditRoom(room);
                                                                            }}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="no-detail"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setArchiveDialogRoom(room);       // mở dialog lưu trữ
                                                                                setSelectedRoom(null);             // 🔹 Ẩn chi tiết phòng ngay lập tức
                                                                            }}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-destructive no-detail"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
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
                                                                {(room.members ?? []).slice(0, 3).map((member, index) => (
                                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                                        {member.name}  {/* ✅ Hoặc `${member.name} (${member.email})` */}
                                                                    </Badge>
                                                                ))}
                                                                {room.members && room.members.length > 3 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        +{room.members.length - 3} khác
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* URL + copy */}
                                                        <div className="flex justify-between items-center">
                                                            <Badge variant="outline">{room.share_url}</Badge>
                                                            <Button
                                                                onClick={() => copyInviteCode(room.share_url!)}
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground pt-2 border-t">
                                                            Ngày tạo:{" "}
                                                            {room.ngay_tao
                                                                ? format(new Date(room.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi })
                                                                : "Không rõ"}
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
                                                if (archiveDialogRoom) return; // không mở khi dialog lưu trữ đang mở
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
                                                            Thành viên ({room.members?.length ?? 0})
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(room.members ?? []).slice(0, 3).map((member, index) => (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {member.name}  {/* Hoặc: `${member.name} (${member.email})` */}
                                                            </Badge>
                                                        ))
                                                        }
                                                        {room.members && room.members.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{room.members.length - 3} khác
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* URL + Copy */}
                                                <div className="flex justify-between items-center">
                                                    <Badge variant="outline">{room.share_url}</Badge>
                                                    <Button onClick={() => copyInviteCode(room.share_url!)} variant="ghost" size="sm">
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                {/* Nút tham gia */}
                                                <Button onClick={() => enterRoom(room)} variant="default" size="sm">
                                                    Tham gia
                                                </Button>


                                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                                    Ngày tạo:{" "}
                                                    {room.ngay_tao
                                                        ? format(new Date(room.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi })
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
                                        <TabsList className="grid grid-cols-3 mb-4">
                                            <TabsTrigger value="info">Info</TabsTrigger>
                                            <TabsTrigger value="members">Members</TabsTrigger>
                                            <TabsTrigger value="security">Security</TabsTrigger>
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
                                                {selectedRoom?.isMine && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="text-xs">
                                                                + Thêm
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-sm rounded-xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Thêm thành viên</DialogTitle>
                                                                <DialogDescription>
                                                                    Nhập email hoặc username để mời tham gia phòng.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    placeholder="Nhập email hoặc username..."
                                                                    value={inviteInput}
                                                                    onChange={(e) => setInviteInput(e.target.value)}
                                                                />
                                                                <Button
                                                                    onClick={async () => {
                                                                        if (!selectedRoom || !inviteInput) return;
                                                                        try {
                                                                            const res = await getUserByEmailOrUsername(inviteInput, token);
                                                                            const invitedUser = res.data; // user từ API
                                                                            await handleInviteMember(selectedRoom.id, invitedUser.id);
                                                                            setInviteInput(""); // reset input
                                                                            await fetchMembers(selectedRoom.id); // refresh danh sách thành viên
                                                                            toast.success("Mời thành viên thành công");
                                                                        } catch (err: any) {
                                                                            toast.error(err.response?.data?.error || "Không thể mời thành viên");
                                                                        }
                                                                    }}
                                                                >
                                                                    Mời
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                            </div>

                                            <div className="space-y-2">
                                                {members.length > 0 ? (
                                                    members.map((member: Member) => (
                                                        <div key={member.id} className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
                                                            <span className="text-sm">{member.name} ({member.email})</span>
                                                            {selectedRoom?.isMine && member.id !== userId && (
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
