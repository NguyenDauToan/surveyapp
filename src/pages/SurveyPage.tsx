import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import LoginDialog from "@/layout/LoginDialog";

interface PublicQuestion {
  id: number;
  type: string;
  content: string;
  props: string;
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
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authRequired, setAuthRequired] = useState(false); // 🔹 nếu cần login


  // fetch survey
  const fetchSurvey = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await axios.get(
        `https://survey-server-m884.onrender.com/api/forms/public/${shareToken}`,
        { headers }
      );
      const data: PublicSurvey = res.data;
      setSurvey(data);

      const initAnswers = data.questions.map((q) => ({
        cau_hoi_id: q.id,
        loai_cau_hoi: q.type,
        noi_dung: "",
        lua_chon: "",
      }));
      setAnswers(initAnswers);
      setAuthRequired(false); // đã fetch thành công
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setAuthRequired(true);
        setLoginOpen(true);
        return;
      }
      setErrorMsg("Không thể tải khảo sát.");
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, [shareToken]);

  const fetchSurveyAfterLogin = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(
        `https://survey-server-m884.onrender.com/api/forms/public/${shareToken}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data: PublicSurvey = res.data;
      setSurvey(data);

      const initAnswers = data.questions.map((q) => ({
        cau_hoi_id: q.id,
        loai_cau_hoi: q.type,
        noi_dung: "",
        lua_chon: "",
      }));
      setAnswers(initAnswers);
      setAuthRequired(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Không thể tải khảo sát ngay cả sau khi login.");
    }
  };

// const handleChange = (cauHoiId: number, value: string | string[] | File | null) => {
//   setAnswers((prev) =>
//     prev.map((a) =>
//       a.cau_hoi_id === cauHoiId
//         ? {
//             ...a,
//             noi_dung: typeof value === "string" ? value : a.noi_dung,
//             lua_chon: Array.isArray(value) ? JSON.stringify(value) : "",
//             file: value instanceof File ? value : undefined,
//           }
//         : a
//     )
//   );
//     setFieldErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors[cauHoiId];
//       return newErrors;
//     });
//   };

// const handleChange = (
//   cauHoiId: number,
//   value: string | File | null, // string cho radio/text, File cho file_upload
//   type?: "multiple_choice" | "file_upload" | "text"
// ) => {
//   setAnswers((prev) =>
//     prev.map((a) => {
//       if (a.cau_hoi_id !== cauHoiId) return a;

//       if (type === "multiple_choice") {
//         return {
//           ...a,
//           noi_dung: "", // không dùng noi_dung
//           lua_chon: JSON.stringify([value]), // lưu lựa chọn người dùng
//         };
//       }

//       if (type === "file_upload") {
//         return { ...a, file: value instanceof File ? value : undefined };
//       }

//       // text / textarea
//       return { ...a, noi_dung: typeof value === "string" ? value : a.noi_dung };
//     })
//   );

//   setFieldErrors((prev) => {
//     const newErrors = { ...prev };
//     delete newErrors[cauHoiId];
//     return newErrors;
//   });
// };

  // const handleSubmit = async (e: FormEvent) => {
  //   e.preventDefault();
  //   if (!survey) return;
  //   setLoading(true);
  //   setErrorMsg("");
  //   setFieldErrors({});

  //   try {
  //     const hasFile = answers.some((a) => a.loai_cau_hoi === "FILE_UPLOAD");
  //     const token = localStorage.getItem("token");

  //     const headers: any = {};
  //     if (hasFile) {
  //       if (token) headers["Authorization"] = `Bearer ${token}`;
  //     } else {
  //       headers["Content-Type"] = "application/json";
  //       if (token) headers["Authorization"] = `Bearer ${token}`;
  //     }

  //     const payload = hasFile
  //       ? (() => {
  //           const formData = new FormData();
  //           const data = { email: email || null, answers: answers.map(({ file, ...rest }) => rest) };
  //           formData.append("data", JSON.stringify(data));
  //           answers.forEach((a) => {
  //             if (a.file) formData.append(`file_${a.cau_hoi_id}`, a.file);
  //           });
  //           return formData;
  //         })()
  //       : { khao_sat_id: survey.id, email: email || null, answers };

  //     await axios.post(
  //       `https://survey-server-m884.onrender.com/api/forms/${survey.id}/submissions`,
  //       payload,
  //       { headers }
  //     );

  //     setSubmitted(true);
  //   } catch (err: any) {
  //     console.error(err);

  //     const status = err.response?.status;
  //     const msg = err.response?.data?.error || err.response?.data?.message || err.message;

  //     if (status === 400 && typeof msg === "string" && msg.startsWith("Câu hỏi")) {
  //       const match = msg.match(/Câu hỏi (\d+)/);
  //       if (match) {
  //         const qId = parseInt(match[1], 10);
  //         setFieldErrors((prev) => ({ ...prev, [qId]: "Đây là câu hỏi bắt buộc" }));
  //         setLoading(false);
  //         return;
  //       }
  //     }

  //     const friendlyMsg = mapErrorMessage(status, msg);
  //     if (friendlyMsg) setErrorMsg(friendlyMsg);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
// =================bản 2

// handleChange
const handleChange = (
  cauHoiId: number,
  value: string | File | null,
  type?: "multiple_choice" | "file_upload" | "text"
) => {
  setAnswers((prev) =>
    prev.map((a) => {
      if (a.cau_hoi_id !== cauHoiId) return a;

      if (type === "multiple_choice") {
        return { ...a, noi_dung: "", lua_chon: JSON.stringify([value]) };
      }
      if (type === "file_upload") {
        return { ...a, file: value instanceof File ? value : undefined };
      }
      return { ...a, noi_dung: typeof value === "string" ? value : a.noi_dung };
    })
  );

  setFieldErrors((prev) => {
    const newErrors = { ...prev };
    delete newErrors[cauHoiId];
    return newErrors;
  });
};

// handleSubmit
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!survey) return;
  setLoading(true);
  setErrorMsg("");
  setFieldErrors({});

  try {
    const hasFile = answers.some((a) => a.loai_cau_hoi === "upload_file");
    const token = localStorage.getItem("token");

    const headers: any = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let payload: FormData | object;

    if (hasFile) {
      const formData = new FormData();

      // Chuẩn BE-23: key "data" chứa JSON string
      const data = {
        email: email || null,
        answers: answers.map(({ file, ...rest }) => rest),
        khao_sat_id: survey.id,
      };
      formData.append("data", JSON.stringify(data));

      // file riêng
      answers.forEach((a) => {
        if (a.file) formData.append(`file_${a.cau_hoi_id}`, a.file);
      });

      payload = formData;
      // Không set Content-Type, axios tự handle
    } else {
      headers["Content-Type"] = "application/json";
      payload = { khao_sat_id: survey.id, email: email || null, answers };
    }

    await axios.post(
      `https://survey-server-m884.onrender.com/api/forms/${survey.id}/submissions`,
      payload,
      { headers }
    );

    setSubmitted(true);
  } catch (err: any) {
    console.error(err);
    setErrorMsg("Gửi khảo sát thất bại, vui lòng thử lại.");
  } finally {
    setLoading(false);
  }
};


  function mapErrorMessage(status?: number, msg?: any): string | undefined {
    const message = typeof msg === "string" ? msg : JSON.stringify(msg);

    if (status === 400) {
      if (message === "ID khảo sát không hợp lệ") return "Khảo sát không hợp lệ.";
      if (message === "Dữ liệu gửi không hợp lệ") return "Dữ liệu gửi không hợp lệ, vui lòng thử lại.";
      if (message === "Email không hợp lệ") return "Vui lòng nhập email hợp lệ.";
      if (message.startsWith("Thiếu file")) return message;
      return message;
    }

    if (status === 401) return "Bạn cần đăng nhập để xem khảo sát.";
    if (status === 403) return "Bạn không có quyền tham gia khảo sát này.";
    if (status === 404) return "Khảo sát không tồn tại.";
    if (status === 500) return "Lỗi hệ thống, vui lòng thử lại.";
    return "Lỗi không xác định.";
  }

  // ==== RENDER ====
  if (!survey && !authRequired)
    return <div className="text-center py-10">Đang tải khảo sát...</div>;

  if (authRequired && !survey)
    return (
      <div className="text-center py-10">
        <p>Bạn cần đăng nhập để xem khảo sát.</p>
        <LoginDialog
          open={loginOpen}
          onOpenChange={(open) => {
            setLoginOpen(open);
            if (!open) fetchSurveyAfterLogin();
          }}
        />
      </div>
    );

  if (submitted)
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl shadow">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Khảo sát của bạn đã được ghi lại!
        </h2>
        <p className="text-gray-700 mb-6">
          Cảm ơn bạn đã tham gia khảo sát. Chúng tôi đã lưu phản hồi của bạn thành công.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setAnswers(
              survey!.questions.map((q) => ({
                cau_hoi_id: q.id,
                loai_cau_hoi: q.type.toLowerCase(),
                noi_dung: "",
                lua_chon: "",
              }))
            );
            setEmail("");
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Gửi ý kiến phản hồi khác
        </button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl my-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">{survey.tieu_de}</h1>
      <p className="text-gray-600 mb-6">{survey.mo_ta}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {survey.questions.map((q) => {
          const props = JSON.parse(q.props || "{}");
          const ans = answers.find((a) => a.cau_hoi_id === q.id);

          return (
            <div key={q.id} className="p-4 border border-gray-200 rounded space-y-2">
              <label className="block font-medium text-gray-700">
                {q.content} {props.required && <span className="text-red-500">*</span>}
              </label>

              {q.type.toLowerCase() === "fill_blank" && (
                <input
                  type="text"
                  className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={ans?.noi_dung ?? ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder="Nhập câu trả lời..."
                />
              )}

{/* {q.type.toLowerCase() === "multiple_choice" && (
  <div className="space-y-1">
    {props.options?.map(opt => {
      const ans = answers.find(a => a.cau_hoi_id === q.id);
      return (
        <label key={opt} className="flex items-center gap-2">
          <input
            type="radio"
            name={`multiple_choice_${q.id}`}
            value={opt}
            checked={ans?.noi_dung === opt} // chỉ so sánh với noi_dung
            onChange={() => handleChange(q.id, opt, "multiple_choice", props.options)}
          />
          <span className="text-gray-700">{opt}</span>
        </label>
      );
    })}
  </div>
)} */}
{q.type.toLowerCase() === "multiple_choice" && (
  <div className="space-y-1">
    {props.options?.map((opt: string) => {
      const ans = answers.find((a) => a.cau_hoi_id === q.id);
      return (
        <label key={opt} className="flex items-center gap-2">
          <input
            type="radio"
            name={`multiple_choice_${q.id}`}
            value={opt}
            checked={ans?.lua_chon === JSON.stringify([opt])}
            onChange={() => handleChange(q.id, opt, "multiple_choice")}
          />
          <span className="text-gray-700">{opt}</span>
        </label>
      );
    })}
  </div>
)}
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

              {/* {q.type.toLowerCase() === "file_upload" && (
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
                          // onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          //   handleChange(q.id, e.target.files?.[0] || null)
                          // }
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
  handleChange(q.id, e.target.files?.[0] || null, "file_upload")
}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )} */}
{q.type.toLowerCase() === "file_upload" && (
  <div className="space-y-2">
    {ans?.file ? (
      <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
        <span className="text-sm text-gray-700">{ans.file.name}</span>
        <button
          type="button"
          className="text-red-500 text-sm"
          onClick={() => handleChange(q.id, null, "file_upload")}
        >
          Xóa
        </button>
      </div>
    ) : (
      <label className="block w-full border border-gray-300 rounded p-2 text-center cursor-pointer bg-white hover:bg-gray-50 relative overflow-hidden">
        Chọn file
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange(q.id, e.target.files?.[0] || null, "file_upload")
          }
        />
      </label>
    )}
  </div>
)}


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

      {errorMsg && <div className="text-red-600 mt-4 text-center text-sm">{errorMsg}</div>}

<LoginDialog
  open={loginOpen}
  onOpenChange={(open) => {
    setLoginOpen(open);
    if (!open) fetchSurveyAfterLogin();
  }}
  redirectTo={window.location.pathname + window.location.search} // quay về trang hiện tại
/>

    </div>
  );
}
