import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";

interface Props {
  id: number | null;
}

const DeleteFormButton = ({ id }: Props) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleDelete = async () => {
  if (!id) return;

  const confirmDelete = window.confirm(
    "Bạn có chắc chắn muốn xóa form này? Hành động này không thể hoàn tác."
  );
  if (!confirmDelete) return;

  try {
    setLoading(true);
    const res = await axios.delete(
      `https://survey-server-m884.onrender.com/api/forms/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    toast.success(res.data.message || "Form đã xóa thành công");

    // Chuyển về trang chính
    window.location.href = "http://localhost:5173/surveyapp/";
    // hoặc nếu bạn muốn dùng react-router:
    // navigate("/surveyapp");
  } catch (error) {
    console.error(error);
    toast.error("Xóa form thất bại");
  } finally {
    setLoading(false);
  }
};


  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Đang xóa..." : "Xóa form"}
    </Button>
  );
};

export default DeleteFormButton;
