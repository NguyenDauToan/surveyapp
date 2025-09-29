  import { useState, useEffect } from "react";
  import * as DialogPrimitive from "@radix-ui/react-dialog";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Archive as ArchiveIcon, Search, X, RotateCcw, Trash2 } from "lucide-react";
  import axios from "axios";
  import { toast } from "sonner";
  import { restoreRoomAPI } from "@/api/Api";

  export interface ArchivedRoom {
    id: number | string;
    ten_room: string;
    mo_ta?: string | null;
    members?: string[];
    ngay_tao?: string;
    share_url?: string;
    trang_thai?: "active" | "deleted" | "archived";
    nguoi_tao_id?: string;
    is_public?: boolean;
    khoa?: boolean;
  }

  interface ArchivedRoomsDialogProps {
    onRestore?: (room: ArchivedRoom) => void;
  }

  export default function ArchivedRoomsDialog({ onRestore }: ArchivedRoomsDialogProps) {
    const API_BASE = "http://localhost:8080/api";
    const userToken = localStorage.getItem("token") || "";
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [archivedRooms, setArchivedRooms] = useState<ArchivedRoom[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<number | string | null>(null);
    const [deletingId, setDeletingId] = useState<number | string | null>(null);

    const filteredRooms = archivedRooms.filter(r =>
      r.ten_room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.mo_ta || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchArchivedRooms = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem kho room");
        return;
      }
    
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/rooms/archived`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, limit: 20 },
        });
    
        const roomsData = res.data.data || [];
    
        const rooms: ArchivedRoom[] = roomsData.map((r: any) => ({
          id: r.id,
          ten_room: r.ten_room,
          mo_ta: r.mo_ta || "",
          members: (r.Members || r.members || []).map((m: any) => m.name || m.ten || ""),
          ngay_tao: r.ngay_tao || r.createdAt || "",
          share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
          trang_thai: "archived",
          nguoi_tao_id: r.nguoi_tao_id,
          is_public: r.is_public,
          khoa: r.khoa,
        }));
    
        setArchivedRooms(rooms);
    
      } catch (err: any) {
        if (err.response?.status === 401) {
          toast.error("Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } else {
          toast.error(err.response?.data?.message || "Không lấy được danh sách phòng đã lưu trữ");
        }
      } finally {
        setLoading(false);
      }
    };
    
    
    

    const handleRestore = async (id: number | string) => {
      const token = localStorage.getItem("token");
      if (!token) return;
    
      try {
        setRestoringId(id);
        
        // Gọi API và lấy dữ liệu backend trả về
        const res = await restoreRoomAPI(Number(id), token);
        const restoredRoom = res.data; // <- dữ liệu backend có is_public đúng
    
        // Xóa phòng khỏi archivedRooms
        setArchivedRooms(prev => prev.filter(r => String(r.id) !== String(id)));
    
        // Cập nhật FE nếu cần
        if (onRestore) onRestore(restoredRoom);
    
        toast.success("Khôi phục phòng thành công");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không thể khôi phục phòng");
      } finally {
        setRestoringId(null);
      }
    };
    

    const handleDelete = async (id: number | string) => {
      if (!userToken) return;
      if (!confirm("Bạn có chắc muốn xóa phòng này vĩnh viễn?")) return;

      try {
        setDeletingId(id);
        await axios.delete(`${API_BASE}/rooms/${id}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        setArchivedRooms(prev => prev.filter(r => String(r.id) !== String(id)));
        toast.success("Xóa phòng thành công");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không thể xóa phòng");
      } finally {
        setDeletingId(null);
      }
    };

    useEffect(() => {
      if (open) fetchArchivedRooms();
    }, [open]);

    return (
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <ArchiveIcon className="h-4 w-4" /> Kho Room
          </Button>
        </DialogPrimitive.Trigger>

        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 animate-fadeIn" />

        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 w-[95%] max-w-4xl max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg overflow-y-auto animate-slideIn">
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-background z-10 pt-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ArchiveIcon className="h-6 w-6" /> Kho Room
            </h2>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm"><X className="h-4 w-4" /></Button>
            </DialogPrimitive.Close>
          </div>

          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-full rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <p className="text-muted-foreground">Không tìm thấy phòng nào.</p>
          ) : (
            <div className="space-y-3">
              {filteredRooms.map(room => (
                <div
                  key={room.id}
                  className="p-4 flex items-center justify-between border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{room.ten_room}</h3>
                    {room.mo_ta && <p className="text-sm text-muted-foreground truncate max-w-xs">{room.mo_ta}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Thành viên: {room.members?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ngày xóa: {room.ngay_tao ? new Date(room.ngay_tao).toLocaleDateString() : "?"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRestore(room.id)}
                      className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors duration-200"
                      disabled={restoringId === room.id || deletingId === room.id}
                    >
                      <RotateCcw className={`h-4 w-4 ${restoringId === room.id ? "animate-spin" : ""}`} />
                      {restoringId === room.id ? "Đang khôi phục..." : "Khôi phục"}
                    </Button>

                    <Button
                      onClick={() => handleDelete(room.id)}
                      className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-sm transition-colors duration-200"
                      disabled={deletingId === room.id || restoringId === room.id}
                    >
                      <Trash2 className={`h-4 w-4 ${deletingId === room.id ? "animate-spin" : ""}`} />
                      {deletingId === room.id ? "Đang xóa..." : "Xóa"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Root>
    );
  }

