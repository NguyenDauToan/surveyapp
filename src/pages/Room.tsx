// ==============================
// RoomPage.tsx
// ==============================
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Edit } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { deleteRoomAPI, updateRoomAPI } from "@/api/Api";

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
}

const RoomPage = () => {
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ ten_room: "", mo_ta: "", is_public: true, khoa: false, mat_khau: "" });
    const [editRoom, setEditRoom] = useState<Room | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id") || "";
    const API_BASE = "https://survey-server-m884.onrender.com/api";

    // ================= FETCH ROOMS =================
    const fetchRooms = async () => {
        if (!token) return;
        try {
            const resMy = await axios.get(`${API_BASE}/rooms`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 1, limit: 20 },
            });
            setMyRooms(resMy.data.data);

            const resPublic = await axios.get(`${API_BASE}/lobby`);
            setPublicRooms(resPublic.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không lấy được danh sách phòng");
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    // ================= CREATE ROOM =================
    const handleCreateRoom = async () => {
        if (!token) return toast.error("Bạn phải đăng nhập mới tạo được phòng");
        if (!newRoom.ten_room.trim()) return toast.error("Tên phòng không được để trống");
        if (newRoom.khoa && !newRoom.mat_khau.trim()) return toast.error("Phải nhập mật khẩu khi bật khoá");

        try {
            await axios.post(
                `${API_BASE}/rooms`,
                {
                    khao_sat_id: 1,
                    ten_room: newRoom.ten_room,
                    mo_ta: newRoom.mo_ta,
                    is_public: newRoom.is_public,
                    khoa: newRoom.khoa,
                    mat_khau: newRoom.khoa ? newRoom.mat_khau : undefined
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Phòng "${newRoom.ten_room}" đã tạo`);
            setNewRoom({ ten_room: "", mo_ta: "", is_public: true, khoa: false, mat_khau: "" });
            setShowCreateForm(false);
            fetchRooms();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Không tạo được phòng");
        }
    };

    // ================= EDIT ROOM =================
    const openEditRoom = (room: Room) => {
        setEditRoom({ ...room, mat_khau: "" });
        setShowEditForm(true);
    };

    const handleUpdateRoom = async () => {
        if (!token || !editRoom) return;
        if (editRoom.khoa && !editRoom.mat_khau?.trim()) return toast.error("Phải nhập mật khẩu khi bật khoá");
        try {
            await updateRoomAPI(editRoom.id, token, {
                ten_room: editRoom.ten_room,
                mo_ta: editRoom.mo_ta,
                is_public: editRoom.is_public,
                khoa: editRoom.khoa,
                mat_khau: editRoom.khoa ? editRoom.mat_khau : undefined
            });
            toast.success("Cập nhật phòng thành công");
            setEditRoom(null);
            setShowEditForm(false);
            fetchRooms();
        } catch (err: any) {
            toast.error(err.message || "Không cập nhật được phòng");
        }
    };

    // ================= DELETE ROOM =================
    const handleDeleteRoom = async (roomId: number) => {
        if (!token) return toast.error("Bạn phải đăng nhập mới xóa được phòng");
        try {
            await deleteRoomAPI(roomId, token);
            toast.success("Xóa phòng thành công");
            fetchRooms();
        } catch (err: any) {
            toast.error(err.message || "Không xóa được phòng");
        }
    };

    // ================= COPY & ENTER =================
    const copyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast("Mã mời đã sao chép vào clipboard");
    };
    const enterRoom = (roomId: number) => {
        toast.success(`Bạn đã tham gia phòng ${roomId}`);
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
                        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Tạo phòng mới
                        </Button>
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
                                    <Button variant="outline" onClick={() => setShowEditForm(false)}>Hủy</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* PHÒNG CỦA MÌNH */}
                    <h2 className="text-2xl font-bold mb-4">Phòng của bạn</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myRooms.map(room => {
                            const isOwner = Number(room.nguoi_tao_id) === Number(userId);
                            return (
                                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{room.ten_room}</CardTitle>
                                            <CardDescription>{room.mo_ta}</CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            {isOwner && (
                                                <>
                                                    <Button onClick={() => openEditRoom(room)} variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                                                    <Button onClick={() => handleDeleteRoom(room.id)} variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                </>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <Badge variant="outline">{room.share_url}</Badge>
                                        <Button onClick={() => copyInviteCode(room.share_url)} variant="ghost" size="sm"><Copy className="h-3 w-3" /></Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    {/* PHÒNG CÔNG KHAI */}
                    <h2 className="text-2xl font-bold mt-8 mb-4">Phòng công khai</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {publicRooms.map(room => (
                            <Card key={room.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{room.ten_room}</CardTitle>
                                        <CardDescription>{room.mo_ta}</CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        {/* Nếu muốn hiện nút tham gia */}
                                        <Button onClick={() => enterRoom(room.id)} variant="ghost" size="sm">
                                            Tham gia
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <Badge variant="outline">{room.share_url}</Badge>
                                    <Button onClick={() => copyInviteCode(room.share_url)} variant="ghost" size="sm">
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default RoomPage;
