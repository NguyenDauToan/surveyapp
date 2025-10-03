import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { logout } from "@/redux/authSlice";

interface UserProfile {
  id: number;
  email: string;
  ten: string;
  ngay_tao: string;
}

interface Props {
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

export default function UserProfileModal({ open, onOpenChange }: Props) {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);

    axios.get("https://survey-server-m884.onrender.com/api/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => setUser(res.data))
      .catch(err => {
        console.error(err);
        toast.error("Không thể tải thông tin tài khoản");
      })
      .finally(() => setLoading(false));
  }, [open, token]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thông tin tài khoản</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center py-6">Đang tải...</p>
        ) : !user ? (
          <p className="text-center py-6 text-muted-foreground">Không tải được dữ liệu</p>
        ) : (
          <div className="space-y-4 mt-2">
            <p><strong>Tên:</strong> {user.ten}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Ngày tạo:</strong> {new Date(user.ngay_tao).toLocaleString()}</p>
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button variant="destructive" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
    