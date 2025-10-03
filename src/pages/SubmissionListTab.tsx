// src/components/SubmissionListTab.tsx
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getFormSubmissionsAPI } from "@/api/Api";

interface SubmissionListTabProps {
  formId: number;
  token?: string;
  limit?: number; // số bản ghi mỗi trang
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

interface Answer {
  cau_hoi_id: number;
  noi_dung: string;
  lua_chon: string;
}

interface Submission {
  id: number;
  email: string;
  user_id: number | null;
  user: { id: number; ten: string; email: string } | null;
  ngay_gui: string;
  lan_gui: number;
  answers: Answer[];
}

export default function SubmissionListTab({
  formId,
  token,
  limit = 10,
  startDate,
  endDate,
}: SubmissionListTabProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSubmissions = useCallback(async () => {
    if (!formId || !token) return;
    setLoading(true);
    try {
      const res = await getFormSubmissionsAPI(formId, token, page, limit, startDate, endDate);
      setSubmissions(res.submissions || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh sách phản hồi");
    } finally {
      setLoading(false);
    }
  }, [formId, token, page, limit, startDate, endDate]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    );

  if (!submissions.length)
    return <p className="text-muted-foreground text-center mt-4">Chưa có phản hồi nào</p>;

  return (
    <div className="space-y-6 mt-4">
      {submissions.map((sub) => (
        <div key={sub.id} className="border rounded-lg bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3">
            <p className="text-gray-700 text-sm">
              <strong>Email:</strong> {sub.email || "Ẩn danh"} |{" "}
              <strong>Người dùng:</strong> {sub.user?.ten || "Ẩn danh"}
            </p>
            <p className="text-gray-500 text-sm mt-1 sm:mt-0">
              <strong>Lần gửi:</strong> {sub.lan_gui} |{" "}
              <strong>Ngày gửi:</strong> {new Date(sub.ngay_gui).toLocaleString()}
            </p>
          </div>

          {/* Answers */}
          <div className="mt-2 space-y-1 text-sm">
            {sub.answers.map((a, idx) => {
              let display: string | JSX.Element = "-";
              if (a.noi_dung) {
                display = a.noi_dung.startsWith("http") ? (
                  <a
                    href={a.noi_dung}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {a.noi_dung}
                  </a>
                ) : (
                  a.noi_dung
                );
              } else if (a.lua_chon) {
                try {
                  const parsed = JSON.parse(a.lua_chon);
                  display = Array.isArray(parsed) ? parsed.join(", ") : parsed;
                } catch {
                  display = a.lua_chon;
                }
              }

              return (
                <div key={idx} className="flex gap-2">
                  <span className="font-medium text-gray-700">•</span>
                  <span>{display}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
          >
            Trước
          </button>
          <span className="px-3 py-1 border rounded bg-gray-50">{page}</span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
