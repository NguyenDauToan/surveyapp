import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getArchivedRoomsAPI, restoreRoomAPI } from "@/api/Api";
import { RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface ArchivedRoom {
  id: number;
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

interface Props {
  token: string;
  onRestore: (room: ArchivedRoom) => void;
}

export default function ArchivedRooms({ token, onRestore }: Props) {
  const [archivedRooms, setArchivedRooms] = useState<ArchivedRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const fetchArchivedRooms = async () => {
    if (!token) return;
    try {
      setLoading(true);
  
      // Lấy dữ liệu từ API
      const res = await getArchivedRoomsAPI(token);
  
      // res.data.data chính là mảng room từ backend
      const roomsData = res.data.data || [];
  
      // Map ra kiểu ArchivedRoom
      const rooms: ArchivedRoom[] = roomsData.map((r: any) => ({
        id: r.id,
        ten_room: r.ten_room,
        mo_ta: r.mo_ta || "",
        members: r.members || [],
        ngay_tao: r.ngay_tao || r.createdAt || "",
        share_url: r.share_url || `${window.location.origin}/room/${r.id}`,
        trang_thai: "archived",
        nguoi_tao_id: r.nguoi_tao_id,
        is_public: r.is_public,
        khoa: r.khoa,
      }));
  
      setArchivedRooms(rooms);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không lấy được danh sách phòng đã lưu trữ");
    } finally {
      setLoading(false);
    }
  };
  

  const handleRestore = async (roomId: number) => {
    if (!token) return;
    try {
      setRestoringId(roomId);
      await restoreRoomAPI(roomId, token);

      const restoredRoom = archivedRooms.find(r => r.id === roomId);
      if (restoredRoom) {
        onRestore({ ...restoredRoom, trang_thai: "active" });
        setArchivedRooms(prev => prev.filter(r => r.id !== roomId));
        toast.success("Khôi phục phòng thành công");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể khôi phục phòng");
    } finally {
      setRestoringId(null);
    }
  };

  useEffect(() => {
    fetchArchivedRooms();
  }, [token]);

  const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return "?";
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Phòng đã lưu trữ</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : archivedRooms.length === 0 ? (
        <p className="text-muted-foreground">Không có phòng nào trong kho lưu trữ.</p>
      ) : (
        <div className="space-y-3">
          {archivedRooms.map(room => (
            <Card
              key={room.id}
              className="p-4 flex items-center justify-between border border-gray-200 shadow-sm rounded-xl hover:shadow-lg transition-shadow duration-200"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground">{room.ten_room}</h3>
                {room.mo_ta && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs">{room.mo_ta}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Thành viên: {room.members?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ngày tạo: {room.ngay_tao ? new Date(room.ngay_tao).toLocaleDateString() : "?"} (
                  {getDaysAgo(room.ngay_tao)} ngày trước)
                </p>
              </div>

              <Button
                onClick={() => handleRestore(room.id)}
                className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors duration-200"
                disabled={restoringId === room.id}
              >
                <RotateCcw className={`h-4 w-4 ${restoringId === room.id ? "animate-spin" : ""}`} />
                {restoringId === room.id ? "Đang khôi phục..." : "Khôi phục"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
