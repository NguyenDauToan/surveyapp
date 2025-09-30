// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import { toast } from "sonner";
// import SurveyCreate from "./SurveyCreate";

// interface SurveyData {
//   id: number;
//   title: string;
//   description: string;
//   questions: any[];
//   settings?: {
//     collect_email: boolean;
//   };
//   end_date?: string;
// }

// export default function SurveyEditPage() {
//   const { id } = useParams<{ id: string }>();
//   const token = localStorage.getItem("token"); // hoặc lấy từ redux
//   const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!id || !token) return;

//     const fetchSurvey = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(`https://survey-server-m884.onrender.com/api/forms/${id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setSurveyData(res.data);
//       } catch (err: any) {
//         console.error(err);
//         toast.error("Không tải được khảo sát");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSurvey();
//   }, [id, token]);

//   if (!id || !token) return <p>Không tìm thấy khảo sát hoặc chưa đăng nhập</p>;
//   if (loading) return <p>Đang tải khảo sát...</p>;
//   if (!surveyData) return <p>Không tìm thấy dữ liệu khảo sát</p>;

//   return <SurveyCreate existingSurvey={surveyData} />;
// }

// src/pages/SurveyEditPage.tsx


// src/pages/SurveyEditPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

interface Question {
  id: number;
  content: string;
  props?: any;
}

interface SurveyData {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  settings?: {
    collect_email: boolean;
  };
  end_date?: string;
}

export default function SurveyEditPage() {
  const { id } = useParams<{ id: string }>();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // --- Gọi API GET form ---
  useEffect(() => {
    if (!id || !token) return;
    setLoading(true);

    axios
      .get(`https://survey-server-m884.onrender.com/api/forms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSurveyData(res.data))
      .catch(() => toast.error("Không tải được khảo sát"))
      .finally(() => setLoading(false));
  }, [id, token]);

  // --- Hàm gọi API PUT question ---
  const updateQuestionAPI = async (
    questionId: number,
    content: string,
    props?: object
  ) => {
    if (!token) throw new Error("Bạn chưa đăng nhập");

    const body: any = { content };
    if (props) body.props = props;

    const res = await axios.put(
      `https://survey-server-m884.onrender.com/api/questions/${questionId}`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data; // { message: "updated" }
  };

  // --- Handle cập nhật question ---
  const handleUpdateQuestion = async (questionId: number, newContent: string) => {
    try {
      // Ví dụ props mặc định là required=true, bạn có thể thay đổi theo UI
      await updateQuestionAPI(questionId, newContent, { required: true });
      toast.success("Cập nhật câu hỏi thành công");

      // Cập nhật local state luôn
      setSurveyData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId ? { ...q, content: newContent } : q
          ),
        };
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Cập nhật câu hỏi thất bại");
    }
  };

  if (!id || !token) return <p>Không tìm thấy khảo sát hoặc chưa đăng nhập</p>;
  if (loading) return <p>Đang tải khảo sát...</p>;
  if (!surveyData) return <p>Không tìm thấy dữ liệu khảo sát</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{surveyData.title}</h1>
      {surveyData.questions.map((q) => (
        <div key={q.id} className="mb-4">
          <input
            type="text"
            value={q.content || ""} // tránh warning null
            onChange={(e) => handleUpdateQuestion(q.id, e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
      ))}
    </div>
  );
}
