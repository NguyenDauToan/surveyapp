
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { archiveRoomAPI, removeRoomPasswordAPI, setRoomPasswordAPI, updateRoomAPI } from "@/api/Api";
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
    created_at: string;

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
    members?: Member[];
}
interface RoomWithIsMine extends Room {
    isMine?: boolean;
    owner_id?: string;
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
    const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
    const [pendingInvitesSent, setPendingInvitesSent] = useState<RoomInvite[]>([]);
    const updatePendingCount = (invitesList: RoomInvite[]) => {
        setPendingInvitesCount(invitesList.filter(i => i.status === "pending").length);
    };
    const fetchMembers = async (roomId: number) => {
        if (!token) return;
        try {
            const res = await getRoomParticipantsAPI(roomId, token);
            setMembers(res.data.participants);
        } catch (err: any) {
            toast.error("Không lấy được danh sách thành viên");
        }
    };
    const fetchPublicRooms = async () => {
        try {
            const res = await axios.get(`${API_BASE}/lobby`);
            const rooms: Room[] = res.data.data || [];
            const roomsWithMembers = await Promise.all(
                rooms
                    .filter(r => r.trang_thai !== "archived" && r.is_public)
                    .map(async r => {
                        try {
                            const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`);
                            return {
                                ...r,
                                members: resMembers.data.participants || [],
                                share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                            };
                        } catch (err) {
                            console.error("Không lấy được member cho room", r.id, err);
                            return {
                                ...r,
                                members: [],
                                share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                            };
                        }
                    })
            );
            setPublicRooms(roomsWithMembers);
        } catch (err) {
            console.error("Lỗi khi fetch public rooms:", err);
        }
    };
    const fetchInvites = async (roomId: number) => {
        if (!token) {
            console.log("❌ fetchInvites: Không có token");
            return;
        }
        console.log("🔹 fetchInvites: Bắt đầu fetch invites cho roomId =", roomId);
        try {
            const res = await axios.get(`${API_BASE}/room-invites/${roomId}/invites`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("🔹 fetchInvites: Response data raw:", res.data);
            const invitesList =
                res.data.invites ||
                (res.data.invite ? [res.data.invite] : []) ||
                [];

            console.log("🔹 fetchInvites: invitesList sau xử lý:", invitesList);
            setInvites(invitesList);
        } catch (err: any) {
            console.error("❌ Lỗi fetch invites:", err.response?.data || err.message);
            toast.error("Không thể lấy danh sách lời mời");
        }
    };
    const handleSendInvite = async () => {
        if (!selectedRoom || !inviteInput || !token) return;

        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

            // Kiểm tra quyền gửi lời mời
            if (String(selectedRoom.owner_id || selectedRoom.nguoi_tao_id) !== String(storedUser.id)) {
                return toast.error("Bạn không có quyền gửi lời mời trong phòng này");
            }

            // Lấy thông tin người được mời
            const userRes = await getUserByEmailOrUsername(inviteInput, token);
            const invitee = userRes.data.user;

            if (!invitee) return toast.error("Không tìm thấy người dùng với email này");

            const inviteRes = await axios.post(
                `${API_BASE}/room-invites/${selectedRoom.id}/invite`,
                { user_id: invitee.id, email: inviteInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Kiểm tra phản hồi từ API
            if (inviteRes.status === 200) {
                toast.success(inviteRes.data.message || "Đã gửi lời mời thành công");
                setInviteInput(""); // Xóa input sau khi gửi

                // Cập nhật danh sách lời mời đã gửi
                setPendingInvitesSent(prev => [
                    ...prev,
                    {
                        id: inviteRes.data.invite.id,
                        room_id: selectedRoom.id,
                        room_name: selectedRoom.ten_room,
                        inviter_name: storedUser.name,
                        status: "pending",
                        created_at: new Date().toISOString(),
                    },
                ]);
                await fetchMembers(selectedRoom.id); // Làm mới danh sách thành viên
            } else {
                toast.error("Không thể gửi lời mời");
            }
        } catch (err) {
            console.error("❌ Lỗi gửi lời mời:", err.response?.data || err.message);
            if (err.response?.data?.error === "Đã gửi lời mời cho người dùng này") {
                toast.info("Người dùng này đã được mời từ trước", { duration: 1000 });
            } else {
                toast.error(err.response?.data?.error || "Không thể gửi lời mời");
            }
        }
    };
    const handleRespondInvite = async (inviteId: number, status: "accepted" | "declined") => {
        if (!token) return;
        try {
            const payload = { status: status === "declined" ? "rejected" : status };
            const res = await axios.put(`${API_BASE}/room-invites/${inviteId}/respond`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(res.data.message || "Đã phản hồi lời mời");
            setInvites(prev =>
                prev.map(inv => inv.id === inviteId ? { ...inv, status } : inv)
            );
            if (status === "accepted" && selectedRoom) {
                const res = await getRoomParticipantsAPI(selectedRoom.id, token);
                setMembers(res.data.participants);
                setSelectedRoom(prev => prev ? { ...prev, members: res.data.participants } : prev);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Không thể phản hồi lời mời");
        }
    };
    useEffect(() => {
        if (!showInviteDialog || !selectedRoom || !token) return;
        console.log("🔹 fetchInvites: Bắt đầu fetch invites cho roomId =", selectedRoom.id);
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/room-invites/${selectedRoom.id}/invites`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("🔹 fetchInvites: Response data raw: ", res.data);
                const invitesList =
                    res.data.invites ||
                    (res.data.invite ? [res.data.invite] : []) ||
                    [];
                console.log("🔹 fetchInvites: invitesList sau xử lý: ", invitesList);
                setInvites(invitesList);
                if (!invitesList.length) {
                    console.warn("⚠️ fetchInvites: Không có lời mời nào trả về");
                }
            } catch (err: any) {
                console.error("❌ Lỗi fetch invites:", err.response?.data || err.message);
                toast.error("Không thể lấy danh sách lời mời");
            }
        };
        fetchData();
    }, [showInviteDialog, selectedRoom, token]);
    const fetchRooms = async () => {
        if (!token) return;
        try {
            const resMy = await axios.get(`${API_BASE}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
            const resPublic = await axios.get(`${API_BASE}/lobby`);
            const myData: Room[] = resMy.data.data || [];
            const publicData: Room[] = resPublic.data.rooms || [];
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const myRoomsWithMembers: Room[] = await Promise.all(
                myData.map(async r => {
                    try {
                        const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`);
                        return {
                            ...r,
                            nguoi_tao_id: String(r.nguoi_tao_id ?? userId),
                            members: resMembers.data.participants || [{ id: userId, name: storedUser.Ten || "Bạn", email: storedUser.email || "" }],
                            share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                            isMine: r.nguoi_tao_id === userId,
                        };
                    } catch (err) {
                        console.error("Không lấy được member cho room", r.id, err);
                        return { ...r, members: [{ id: userId, name: storedUser.Ten || "Bạn", email: storedUser.email || "" }] };
                    }
                })
            );
            const publicRoomsWithMembers: Room[] = await Promise.all(
                publicData.map(async r => {
                    try {
                        const resMembers = await axios.get(`${API_BASE}/rooms/${r.id}/participants`, {
                            headers: { Authorization: `Bearer ${token}` }, // gửi token nếu backend cần
                        });
                        return {
                            ...r,
                            members: resMembers.data.participants || [],
                            share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
                            isMine: r.nguoi_tao_id === userId,
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
                setMembers(updated.members || []); // 👈 thêm dòng này
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
            setMyRooms(prev => [newCreatedRoom, ...prev]);
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
    useEffect(() => {
        if (!selectedRoom || !token) return;
        const interval = setInterval(() => fetchInvites(selectedRoom.id), 10000); // 10s
        return () => clearInterval(interval);
    }, [selectedRoom, token]);
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
                                        <Users className="h-4 w-4" /> Lời mời
                                        {pendingInvitesCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                                                {pendingInvitesCount}
                                            </span>
                                        )}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Lời mời tham gia phòng</DialogTitle>
                                        <DialogDescription>
                                            Xem danh sách lời mời và chấp nhận hoặc từ chối
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2 mt-4">
                                        {invites.length === 0 && pendingInvitesSent.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Chưa có lời mời nào</p>
                                        ) : (
                                            <>
                                                {invites.map(invite => (
                                                    <div key={invite.id} className={`flex justify-between items-center p-2 rounded-lg ${invite.status === "pending" ? "bg-muted/30" : "bg-green-100"}`}>
                                                        <div>
                                                            <p className="font-medium">{invite.room_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Mời bởi: {invite.inviter_name} | Trạng thái: {invite.status}
                                                            </p>
                                                        </div>
                                                        {invite.status === "pending" && (
                                                            <div className="flex gap-2">
                                                                <Button size="sm" onClick={() => handleRespondInvite(invite.id, "accepted")}>
                                                                    Chấp nhận
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleRespondInvite(invite.id, "declined")}>
                                                                    Từ chối
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {pendingInvitesSent.map(invite => (
                                                    <div key={invite.id} className="flex justify-between items-center p-2 rounded-lg bg-yellow-100">
                                                        <div>
                                                            <p className="font-medium">{invite.room_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Mời bởi: {invite.inviter_name} | Trạng thái: {invite.status} (chưa phản hồi)
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
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
                                                    }} >
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
                                                            Thành viên ({room.members?.length ?? 0})
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {room.members.slice(0, 3).map((member, index) => (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {member.name}
                                                            </Badge>
                                                        ))}
                                                        {room.members.length > 3 && (
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
                                                                <Button onClick={handleSendInvite}>
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
