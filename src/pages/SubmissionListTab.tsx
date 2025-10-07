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
<div className="space-y-4 mt-4">
  {submissions.map((sub, index) => (
    <div
      key={sub.id}
      className={` p-2 transition-all duration-150 ${
        index !== submissions.length - 1 ? "border-b border-gray-400" : ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-1 mb-2  p-1">
        <div>
          <p className=" text-[#087d54] font-medium">
            {sub.user?.ten || "Ẩn danh"}
            
          </p>
          <span className="text-gray-600 pl-2 text-sm">
              {sub.email || "Không có email"}
            </span>
        </div>
        <div className="text-sm text-gray-700 sm:mt-0 flex flex-wrap gap-x-3">
          <span>
            <strong>Lần gửi:</strong> {sub.lan_gui}
          </span>
          <span>
            <strong>Ngày:</strong> {new Date(sub.ngay_gui).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Answers */}
      <div className="text-sm space-y-1">
        {sub.answers.map((a, idx) => {
          let display: string | JSX.Element = "-";
          if (a.noi_dung) {
            display = a.noi_dung.startsWith("http") ? (
              <a
                href={a.noi_dung}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
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
            <div
              key={idx}
              className="flex items-start gap-2 bg-[#fff] rounded-md px-3 py-1.5 hover:bg-blue-50 transition"
            >
              <span className="text-blue-500 text-sm font-semibold">{idx + 1}.</span>
              <span className="text-gray-800">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  ))}

  {/* Pagination */}
  {total > limit && (
    <div className="flex justify-center items-center gap-3 mt-4">
      <button
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 transition"
      >
        ← Trước
      </button>
      <span className="px-4 py-1 bg-blue-500 text-white rounded-md text-sm font-medium">
        {page}
      </span>
      <button
        disabled={page * limit >= total}
        onClick={() => setPage((p) => p + 1)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 transition"
      >
        Sau →
      </button>
    </div>
  )}
</div>


  );
}
