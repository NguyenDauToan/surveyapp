import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface CloneFormButtonProps {
  formId: number; // id form cần clone
  token: string;  // token người dùng hiện tại
}

export default function CloneFormButton({ formId, token }: CloneFormButtonProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClone = async () => {
    try {
      setLoading(true);

      // gọi API clone form
      const res = await axios.post(
        `http://localhost:8080/api/forms/${formId}/clone`,
        {}, // body rỗng theo API
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newForm = res.data.data;
      toast.success(res.data.message || "Clone form thành công!");

      // điều hướng sang trang chi tiết form mới
      navigate(`/form/${newForm.id}`);
    } catch (err: any) {
      console.error("Clone form error:", err);
      toast.error(err.response?.data?.message || "Lỗi khi nhân bản form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClone} disabled={loading}>
      <Save className="h-4 w-4 mr-2" />
      Nhân bản form
    </Button>
  );
}
