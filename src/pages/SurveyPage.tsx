import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

interface PublicQuestion {
  id: number;
  type: string;
  content: string;
  props: string; // JSON string chứa options, required,...
}

interface PublicSurvey {
  id: number;
  tieu_de: string;
  mo_ta: string;
  questions: PublicQuestion[];
  settings: {
    collect_email: boolean;
  };
}

interface Answer {
  cau_hoi_id: number;
  loai_cau_hoi: string;
  noi_dung: string;
  lua_chon: string;
  file?: File;
}

export default function SurveyPage() {
  const { id: shareToken } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({}); // 🔹 lỗi theo câu hỏi

  // Fetch survey public
  useEffect(() => {
    async function fetchSurvey() {
      try {
        const res = await axios.get(
          `https://survey-server-m884.onrender.com/api/forms/public/${shareToken}`
        );
        const data: PublicSurvey = res.data;
        setSurvey(data);

        // Khởi tạo answers
        const initAnswers = data.questions.map((q) => ({
          cau_hoi_id: q.id,
          loai_cau_hoi: q.type.toLowerCase(),
          noi_dung: "",
          lua_chon: "",
        }));
        setAnswers(initAnswers);
      } catch (err) {
        console.error(err);
        setErrorMsg("Không thể tải khảo sát.");
      }
    }
    fetchSurvey();
  }, [shareToken]);

  const handleChange = (cauHoiId: number, value: string | string[] | File | null) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.cau_hoi_id === cauHoiId
          ? {
              ...a,
              noi_dung: typeof value === "string" ? value : a.noi_dung,
              lua_chon: Array.isArray(value) ? JSON.stringify(value) : "",
              file: value instanceof File ? value : undefined,
            }
          : a
      )
    );

    // 🔹 reset lỗi khi người dùng nhập lại
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[cauHoiId];
      return newErrors;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!survey) return;
    setLoading(true);
    setErrorMsg("");
    setFieldErrors({}); // reset lỗi cũ

    try {
      const hasFile = answers.some((a) => a.loai_cau_hoi === "file_upload");

      if (hasFile) {
        const formData = new FormData();
        const data = { email: email || null, answers: answers.map(({ file, ...rest }) => rest) };
        formData.append("data", JSON.stringify(data));
        answers.forEach((a) => {
          if (a.file) formData.append(`file${a.cau_hoi_id}`, a.file);
        });

        await axios.post(
          `https://survey-server-m884.onrender.com/api/forms/${survey.id}/submissions`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await axios.post(
          `https://survey-server-m884.onrender.com/api/forms/${survey.id}/submissions`,
          { khao_sat_id: survey.id, email: email || null, answers },
          { headers: { "Content-Type": "application/json" } }
        );
      }

      alert("Gửi khảo sát thành công!");
    } catch (err: any) {
      console.error(err);

      const status = err.response?.status;
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;

      // 🔹 xử lý lỗi câu hỏi bắt buộc
      if (status === 400 && typeof msg === "string" && msg.startsWith("Câu hỏi")) {
        const match = msg.match(/Câu hỏi (\d+)/);
        if (match) {
          const qId = parseInt(match[1], 10);
          setFieldErrors((prev) => ({
            ...prev,
            [qId]: "Đây là câu hỏi bắt buộc",
          }));
          setLoading(false);
          return;
        }
      }

      const friendlyMsg = mapErrorMessage(status, msg);
      setErrorMsg(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!survey) return <div className="text-center py-10">Đang tải khảo sát...</div>;

  // hiển thị lỗi chung
  function mapErrorMessage(status?: number, msg?: any): string {
    const message = typeof msg === "string" ? msg : JSON.stringify(msg);

    if (status === 400) {
      if (message === "ID khảo sát không hợp lệ") return "Khảo sát không hợp lệ.";
      if (message === "Dữ liệu gửi không hợp lệ") return "Dữ liệu gửi không hợp lệ, vui lòng thử lại.";
      if (message === "Email không hợp lệ") return "Vui lòng nhập email hợp lệ.";
      if (message.startsWith("Thiếu file")) return message;
      return message;
    }

    if (status === 401) {
      if (message === "Khảo sát này yêu cầu đăng nhập") {
        return "Khảo sát này yêu cầu đăng nhập.";
      }
      return "Bạn chưa được phép thực hiện hành động này.";
    }

    if (status === 403) {
      if (message === "Khảo sát đã đạt giới hạn số phản hồi")
        return "Khảo sát đã đạt giới hạn số phản hồi.";
      return "Bạn không có quyền tham gia khảo sát này.";
    }

    if (status === 404) {
      if (message === "Khảo sát không tồn tại") return "Khảo sát không tồn tại.";
      return "Không tìm thấy khảo sát.";
    }

    if (status === 500) {
      if (message === "Cấu hình khảo sát không hợp lệ")
        return "Cấu hình khảo sát không hợp lệ, vui lòng liên hệ quản trị.";
      if (message === "Không thể kiểm tra số phản hồi")
        return "Lỗi khi kiểm tra số phản hồi, vui lòng thử lại.";
      if (message === "Không thể lưu phản hồi")
        return "Không thể lưu phản hồi, vui lòng thử lại.";
      return "Lỗi hệ thống, vui lòng thử lại.";
    }

    return "Lỗi không xác định.";
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl my-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">{survey.tieu_de}</h1>
      <p className="text-gray-600 mb-6">{survey.mo_ta}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        {survey.settings.collect_email && (
          <div>
            <label className="block font-medium mb-1">Email (tùy chọn)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="abc@example.com"
            />
          </div>
        )}

        {/* Câu hỏi */}
        {survey.questions.map((q) => {
          const props = JSON.parse(q.props || "{}");
          const ans = answers.find((a) => a.cau_hoi_id === q.id);

          return (
            <div key={q.id} className="p-4 border border-gray-200 rounded space-y-2">
              <label className="block font-medium text-gray-700">
                {q.content} {props.required && <span className="text-red-500">*</span>}
              </label>
              <p className="text-sm text-gray-500">Loại: {q.type}</p>

              {/* Fill blank */}
              {q.type.toLowerCase() === "fill_blank" && (
                <input
                  type="text"
                  className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={ans?.noi_dung ?? ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder="Nhập câu trả lời..."
                />
              )}

              {/* Multiple choice */}
              {q.type.toLowerCase() === "multiple_choice" && (
                <div className="space-y-1">
                  {props.options?.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={JSON.parse(ans?.lua_chon || "[]").includes(opt)}
                        onChange={(e) => {
                          const prev = JSON.parse(ans?.lua_chon || "[]");
                          if (e.target.checked) prev.push(opt);
                          else prev.splice(prev.indexOf(opt), 1);
                          handleChange(q.id, prev);
                        }}
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Single choice */}
              {q.type.toLowerCase() === "single_choice" && (
                <div className="space-y-1">
                  {props.options?.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`single_choice_${q.id}`}
                        value={opt}
                        checked={ans?.noi_dung === opt}
                        onChange={() => handleChange(q.id, opt)}
                      />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {q.type.toLowerCase() === "true_false" && (
                <div className="flex gap-4">
                  {["Có", "Không"].map((val) => (
                    <label key={val} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`true_false_${q.id}`}
                        value={val}
                        checked={ans?.noi_dung === val}
                        onChange={() => handleChange(q.id, val)}
                      />
                      <span className="text-gray-700">{val}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Rating */}
              {q.type.toLowerCase() === "rating" && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill={Number(ans?.noi_dung) >= star ? "yellow" : "gray"}
                      className="w-6 h-6 cursor-pointer transition-colors hover:fill-yellow-400"
                      onClick={() => handleChange(q.id, String(star))}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.025 9.384c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.957z" />
                    </svg>
                  ))}
                </div>
              )}

              {/* Upload file */}
              {q.type.toLowerCase() === "file_upload" && (
                <div className="space-y-2">
                  {ans?.file ? (
                    <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm text-gray-700">{ans.file.name}</span>
                      <button
                        type="button"
                        className="text-red-500 text-sm"
                        onClick={() => handleChange(q.id, "")}
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <label className="block w-full border border-gray-300 rounded p-2 text-center cursor-pointer bg-white hover:bg-gray-50">
                        Chọn file
                        <input
                          type="file"
                          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleChange(q.id, e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* 🔹 lỗi riêng cho câu hỏi */}
              {fieldErrors[q.id] && (
                <p className="text-red-500 text-sm">{fieldErrors[q.id]}</p>
              )}
            </div>
          );
        })}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Đang gửi..." : "Gửi khảo sát"}
        </button>
      </form>

      {/* 🔹 lỗi chung */}
      {errorMsg && (
        <div className="text-red-600 mt-4 text-center text-sm">{errorMsg}</div>
      )}
    </div>
  );
}
