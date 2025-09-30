import { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface Question {
  id: number;
  noi_dung: string;
  loai_cau_hoi: string;
  options?: string[];
}

interface Form {
  id?: number;
  tieu_de: string;
  mo_ta?: string;
  public_link?: string;
  questions?: Question[];
  share_token?: string;
}

interface CloneFormTabProps {
  formId: number;
  token: string;
}

export default function CloneFormTab({ formId, token }: CloneFormTabProps) {
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    setLoading(true);
    try {
      // 1️⃣ Gọi API clone form
      const cloneRes = await axios.post(
        `https://survey-server-m884.onrender.com/api/forms/${formId}/clone`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2️⃣ Lấy form và câu hỏi từ response
      const newForm: Form = cloneRes.data?.form;
      const clonedQuestions: Question[] = cloneRes.data?.cauhoi ?? [];

      if (!newForm?.id) throw new Error("Dữ liệu clone không hợp lệ");

      // 3️⃣ Loại bỏ duplicate questions
      const questions = clonedQuestions.filter(
        (q: Question, idx: number, self: Question[]) =>
          self.findIndex(x => x.id === q.id) === idx
      );

      // 4️⃣ Tạo link FE
      const FE_BASE = `${window.location.origin}/surveyapp`;
      const public_link = `${FE_BASE}/survey/${newForm.share_token}`;

      // 4.1️⃣ Cập nhật public_link vào backend
      await axios.put(
        `https://survey-server-m884.onrender.com/api/forms/${newForm.id}/update-publiclink`,
        { public_link },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Hiển thị toast thành công, nổi trên cùng, có nút đóng
      toast.success(
        <div >
          Đã tạo bản sao thành công!<br />
          Public link:{" "}
          <a
            href={public_link}
            target="_blank"
            rel="noreferrer"
            className="underline text-blue-600"
          >
            {public_link}
          </a>
        </div>,
        {
          autoClose: false,
          closeButton: true,
          position: "top-right",
        }
      );

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Lỗi khi clone khảo sát");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button
        className={`px-4 py-2 rounded-lg text-white ${loading ? "bg-gray-400" : "bg-blue-600"}`}
        onClick={handleClone}
        disabled={loading}
      >
        {loading ? "Đang tạo..." : "Tạo bản sao"}
      </button>

      {/* Toast container bắt buộc */}
      <ToastContainer newestOnTop closeButton />
    </div>
  );
}
