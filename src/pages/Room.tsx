import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Copy, Trash2, UserPlus } from "lucide-react";
import { createRoomAPI, getMyRooms } from "@/api/Api";
import { toast } from "sonner";

interface Room {
    id: number;
    ten_room: string;
    mo_ta?: string | null;
    members: string[];
    ngay_tao: string;
    share_url: string;
}

const RoomPage = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ ten_room: "", mo_ta: "" });
    const [inviteEmail, setInviteEmail] = useState("");
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
    const token = localStorage.getItem("token");

    const fetchRooms = async () => {
        if (!token) return;
        try {
            const res = await getMyRooms(token);
            setRooms(res || []);
        } catch (err: any) {
            toast.error(err.message || "Không lấy được danh sách phòng");
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleCreateRoom = async () => {
        if (!token) {
            toast.error("Bạn phải đăng nhập mới tạo được phòng");
            return;
        }
        if (!newRoom.ten_room.trim()) {
            toast.error("Tên phòng không được để trống");
            return;
        }

        try {
            const formId = 1;
            await createRoomAPI(formId, newRoom.ten_room, true, token, newRoom.mo_ta);
            toast.success(`Phòng "${newRoom.ten_room}" đã tạo`);
            setNewRoom({ ten_room: "", mo_ta: "" });
            setShowCreateForm(false);
            fetchRooms();
        } catch (err: any) {
            toast.error(err.message || "Không tạo được phòng");
        }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (!token) return;
        try {
            await fetch(`https://survey-server-m884.onrender.com/api/rooms/${roomId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Xóa phòng thành công");
            fetchRooms();
        } catch (err: any) {
            toast.error(err.message || "Không xóa được phòng");
        }
    };

    const handleInviteUser = (roomId: number) => {
        if (!inviteEmail.trim()) return;

        setRooms(prev =>
            prev.map(room =>
                room.id === roomId
                    ? { ...room, members: [...room.members, inviteEmail] }
                    : room
            )
        );
        toast.success(`Đã mời ${inviteEmail} vào phòng`);
        setInviteEmail("");
        setSelectedRoom(null);
    };

    const copyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast("Mã mời đã sao chép vào clipboard");
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý phòng</h1>
                            <p className="text-muted-foreground">Tạo và quản lý các phòng khảo sát của bạn</p>
                        </div>
                        <Button
                            onClick={() => {
                                if (!token) {
                                    toast.error("Bạn phải đăng nhập mới tạo được phòng");
                                    return;
                                }
                                setShowCreateForm(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Tạo phòng mới
                        </Button>
                    </div>

                    {showCreateForm && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>Tạo phòng mới</CardTitle>
                                <CardDescription>Điền thông tin để tạo phòng khảo sát mới</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Tên phòng</label>
                                    <Input
                                        placeholder="Nhập tên phòng..."
                                        value={newRoom.ten_room}
                                        onChange={e => setNewRoom({ ...newRoom, ten_room: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Mô tả</label>
                                    <Input
                                        placeholder="Nhập mô tả phòng..."
                                        value={newRoom.mo_ta}
                                        onChange={e => setNewRoom({ ...newRoom, mo_ta: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleCreateRoom}>Tạo phòng</Button>
                                    <Button onClick={() => setShowCreateForm(false)} variant="outline">
                                        Hủy
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map(room => (
                            <Card key={room.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{room.ten_room}</CardTitle>
                                            <CardDescription className="mt-1">{room.mo_ta}</CardDescription>
                                        </div>
                                        <Button
                                            onClick={() => handleDeleteRoom(room.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Thành viên ({room.members.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {room.members.slice(0, 3).map((member, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">{member}</Badge>
                                            ))}
                                            {room.members.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">+{room.members.length - 3} khác</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Mã mời:</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{room.share_url}</Badge>
                                            <Button onClick={() => copyInviteCode(room.share_url)} variant="ghost" size="sm">
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t">
                                        {selectedRoom === room.id ? (
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Nhập email người dùng..."
                                                    value={inviteEmail}
                                                    onChange={e => setInviteEmail(e.target.value)}
                                                    type="email"
                                                />
                                                <div className="flex gap-2">
                                                    <Button onClick={() => handleInviteUser(room.id)} size="sm">Mời</Button>
                                                    <Button onClick={() => setSelectedRoom(null)} size="sm" variant="outline">Hủy</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => setSelectedRoom(room.id)}
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Mời thành viên
                                            </Button>
                                        )}
                                    </div>

                                    <div className="text-xs text-muted-foreground pt-2 border-t">
                                        Tạo ngày: {room.ngay_tao}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {rooms.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">Chưa có phòng nào</h3>
                            <p className="text-muted-foreground mb-4">Tạo phòng đầu tiên để bắt đầu</p>

                            {/* Wrap button trong div để căn giữa */}
                            <div className="flex justify-center">
                                <Button
                                    onClick={() => {
                                        if (!token) {
                                            toast.error("Bạn phải đăng nhập mới tạo được phòng");
                                            return;
                                        }
                                        setShowCreateForm(true);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tạo phòng mới
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default RoomPage;
