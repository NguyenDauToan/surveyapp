import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface CloneFormButtonProps {
  formId: number;
  token: string;
}

export default function CloneFormButton({ formId, token }: CloneFormButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `https://survey-server-m884.onrender.com/api/forms/${formId}/clone`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newForm = res.data.data;
      toast.success(res.data.message || "Clone form thành công!");

      // 👉 mở luôn khảo sát bản sao trong tab mới
      if (newForm.public_link) {
        window.open(newForm.public_link, "_blank");
      }
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
      {loading ? "Đang tạo..." : "Nhân bản & Mở khảo sát"}
    </Button>
  );
}
