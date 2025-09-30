import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
  const [clonedForm, setClonedForm] = useState<Form | null>(null);
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
    const newForm = cloneRes.data?.form;
    const clonedQuestions = cloneRes.data?.cauhoi ?? [];

    if (!newForm?.id) throw new Error("Dữ liệu clone không hợp lệ");

    // 3️⃣ Loại bỏ duplicate questions (nếu cần)
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

    // 5️⃣ Cập nhật state & hiển thị toast
    setClonedForm({ ...newForm, questions, public_link });
    toast.success("Đã tạo bản sao thành công!");
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
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="font-semibold text-lg mb-2">Form đã clone:</p>
          <p>Tiêu đề: <span className="font-medium">{clonedForm.tieu_de}</span></p>
          {clonedForm.mo_ta && <p>Mô tả: {clonedForm.mo_ta}</p>}
          <p>
            Public link:{" "}
            <a
              href={clonedForm.public_link}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {clonedForm.public_link}
            </a>
          </p>

          {clonedForm.questions?.length ? (
            <div className="mt-4">
              <p className="font-semibold">Câu hỏi:</p>
              <ul className="list-disc pl-5">
                {clonedForm.questions.map(q => (
                  <li key={q.id}>{q.noi_dung} {q.loai_cau_hoi}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-gray-500">Form này chưa có câu hỏi</p>
          )}
        </div>
      )}
    </div>
  );
}
