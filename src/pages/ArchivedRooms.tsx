import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getArchivedRoomsAPI, restoreRoomAPI } from "@/api/api";
import { RotateCcw } from "lucide-react";

interface Room {
  id: number;
  ten_room: string;
  mo_ta?: string;
}

export default function ArchivedRooms({ token }: { token: string }) {
  const [archivedRooms, setArchivedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArchivedRooms = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getArchivedRoomsAPI(token);
      setArchivedRooms(data);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Không lấy được danh sách phòng đã lưu trữ"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (roomId: number) => {
    if (!token) return;
    try {
      await restoreRoomAPI(roomId, token);
      toast.success("Khôi phục phòng thành công");
      fetchArchivedRooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể khôi phục phòng");
    }
  };

  useEffect(() => {
    fetchArchivedRooms();
  }, [token]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Phòng đã lưu trữ</h2>

      {loading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : archivedRooms.length === 0 ? (
        <p className="text-muted-foreground">
          Không có phòng nào trong kho lưu trữ.
        </p>
      ) : (
        <div className="space-y-3">
          {archivedRooms.map((room) => (
            <Card
              key={room.id}
              className="p-4 flex items-center justify-between border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-all duration-200"
            >
              {/* Thông tin phòng */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {room.ten_room}
                </h3>
                {room.mo_ta && (
                  <p className="text-sm text-muted-foreground">{room.mo_ta}</p>
                )}
              </div>

              {/* Nút khôi phục */}
              <Button
                onClick={() => handleRestore(room.id)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Khôi phục
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
