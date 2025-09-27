import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function PublicForm() {
  const { shareToken } = useParams();
  const API_BASE = "http://localhost:8080";

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/forms/public/${shareToken}`)
      .then((res) => setForm(res.data))
      .catch((err) => setMessage("Không tải được form"));
  }, [shareToken]);

  const updateAnswer = (qid, data) =>
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...data } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;

    const answerArray = form.questions.map((q) => ({
      cau_hoi_id: q.id,
      loai_cau_hoi: q.type,
      noi_dung: answers[q.id]?.noiDung || "",
      lua_chon: Array.isArray(answers[q.id]?.luaChon)
        ? JSON.stringify(answers[q.id].luaChon)
        : answers[q.id]?.luaChon || "",
    }));

    const formData = new FormData();
    formData.append("khao_sat_id", form.id);
    formData.append("answers", JSON.stringify(answerArray));

    // File upload
    form.questions.forEach((q) => {
      if (q.type === "UPLOAD_FILE" && answers[q.id]?.file) {
        formData.append(`file_${q.id}`, answers[q.id].file);
      }
    });

    try {
      setSubmitting(true);
      await axios.post(`${API_BASE}/api/surveys/${form.id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Gửi thành công!");
    } catch {
      setMessage("Gửi thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return <div>Đang tải form...</div>;

  const renderQuestion = (q) => {
    switch (q.type) {
      case "FILL_BLANK":
        return (
          <input
            type="text"
            value={answers[q.id]?.noiDung || ""}
            onChange={(e) => updateAnswer(q.id, { noiDung: e.target.value })}
          />
        );
      case "MULTIPLE_CHOICE":
        return (
          <div>
            {(q.props?.options || []).map((opt) => (
              <label key={opt}>
                <input
                  type="checkbox"
                  checked={answers[q.id]?.luaChon?.includes(opt) || false}
                  onChange={(e) => {
                    const prev = answers[q.id]?.luaChon || [];
                    const next = e.target.checked
                      ? [...prev, opt]
                      : prev.filter((o) => o !== opt);
                    updateAnswer(q.id, { luaChon: next });
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        );
      case "UPLOAD_FILE":
        return (
          <input
            type="file"
            accept={(q.props?.file_types || []).join(",")}
            onChange={(e) => updateAnswer(q.id, { file: e.target.files[0] })}
          />
        );
      default:
        return <p>Loại câu hỏi không hỗ trợ: {q.type}</p>;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{form.tieu_de}</h1>
      <p>{form.mo_ta}</p>
      <form onSubmit={handleSubmit}>
        {form.questions.map((q, idx) => (
          <div key={q.id} style={{ marginBottom: 20 }}>
            <label>
              {idx + 1}. {q.content}
            </label>
            {renderQuestion(q)}
          </div>
        ))}
        <button type="submit" disabled={submitting}>
          {submitting ? "Đang gửi..." : "Gửi"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
