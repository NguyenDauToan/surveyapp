import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface Form {
  id: number;
  tieu_de: string;
  public_link?: string;
}

interface CloneFormTabProps {
  formId: number;
  token: string;
}

export default function CloneFormTab({ formId, token }: CloneFormTabProps) {
  const [clonedForm, setClonedForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    setLoading(true);
    try {
      // 1. Clone form
      const cloneRes = await axios.post(
        `https://survey-server-m884.onrender.com/api/forms/${formId}/clone`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newForm = cloneRes.data.data;

      // 2. Tạo public link
      const shareRes = await axios.post(
        `https://survey-server-m884.onrender.com/api/forms/${newForm.id}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const shareToken = shareRes.data.share_url.split("/").pop();
      const FE_BASE = `${window.location.origin}/surveyapp`;
      const surveyFEUrl = `${FE_BASE}/survey/${shareToken}`;

      // 3. Cập nhật public link
      await axios.put(
        `https://survey-server-m884.onrender.com/api/forms/${newForm.id}/update-publiclink`,
        { public_link: surveyFEUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Đã clone và tạo public link thành công!");
      setClonedForm({ ...newForm, public_link: surveyFEUrl });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Lỗi khi clone khảo sát");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg mb-4"
        onClick={handleClone}
        disabled={loading}
      >
        {loading ? "Đang tạo..." : "Tạo bản sao"}
      </button>

      {clonedForm && (
        <div className="p-4 border rounded-lg">
          <p className="font-semibold">Form đã clone:</p>
          <p>Tiêu đề: {clonedForm.tieu_de}</p>
          <p>
            Public link:{" "}
            <a href={clonedForm.public_link} target="_blank" className="text-blue-600 underline">
              {clonedForm.public_link}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
