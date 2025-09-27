// src/components/SubmissionDetailTab.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSubmissionDetailAPI } from "@/api/Api";

interface SubmissionDetailTabProps {
  formId: number;
  subId: number;
  token?: string;
}

interface AnswerItem {
  cau_hoi_id: number;
  noi_dung: string;
  lua_chon: string; // JSON string nếu chọn nhiều
}

interface SubmissionDetail {
  id: number;
  form_id: number;
  email: string;
  user_id: number;
  user: { id: number; ten: string; email: string };
  ngay_gui: string;
  lan_gui: number;
  answers: AnswerItem[];
}

export default function SubmissionDetailTab({
  formId,
  subId,
  token,
}: SubmissionDetailTabProps) {
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!formId || !subId || !token) return;
    setLoading(true);
    getSubmissionDetailAPI(formId, subId, token)
      .then((res) => setData(res))
      .catch(() => toast.error("Không thể tải chi tiết phản hồi"))
      .finally(() => setLoading(false));
  }, [formId, subId, token]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-6 w-6 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    );

  if (!data)
    return <p className="text-muted-foreground">Chưa có dữ liệu phản hồi</p>;

  return (
    <div className="space-y-4 mt-4">
      <div className="border p-4 rounded-lg bg-muted/10">
        <h4 className="font-semibold mb-2">Thông tin người gửi</h4>
        <p>
          <strong>Người dùng:</strong> {data.user?.ten || "Ẩn danh"}
        </p>
        <p>
          <strong>Email:</strong> {data.email || "Không có"}
        </p>
        <p>
          <strong>Ngày gửi:</strong>{" "}
          {new Date(data.ngay_gui).toLocaleString()}
        </p>
        <p>
          <strong>Lần gửi:</strong> {data.lan_gui}
        </p>
      </div>

      <div className="border p-4 rounded-lg bg-muted/10">
        <h4 className="font-semibold mb-2">Câu trả lời</h4>
        {data.answers.map((ans) => {
          let content = ans.noi_dung;
          // nếu lua_chon có dữ liệu JSON → hiển thị mảng
          if (ans.lua_chon) {
            try {
              const choices = JSON.parse(ans.lua_chon);
              if (Array.isArray(choices)) {
                content = choices.join(", ");
              }
            } catch {}
          }

          // nếu là file link (pdf, png...) → hiển thị link
          const isFile =
            content &&
            (content.endsWith(".pdf") ||
              content.endsWith(".png") ||
              content.endsWith(".jpg") ||
              content.endsWith(".jpeg"));

          return (
            <div
              key={ans.cau_hoi_id}
              className="flex justify-between text-sm py-1 border-b last:border-b-0"
            >
              <span>Câu hỏi ID {ans.cau_hoi_id}</span>
              <span>
                {isFile ? (
                  <a
                    href={content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {content.split("/").pop()}
                  </a>
                ) : (
                  content || "(Không trả lời)"
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
