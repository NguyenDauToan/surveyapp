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
// SurveyCreate.tsx
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface SurveyCreateProps {
  existingSurvey: any;
}

export default function SurveyCreate({ existingSurvey }: SurveyCreateProps) {
  const token = localStorage.getItem("token");
  const [questions, setQuestions] = useState(existingSurvey.questions || []);

  const handleQuestionChange = (index: number, newContent: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].content = newContent;
    setQuestions(updatedQuestions);
  };

  const saveQuestion = async (questionId: number, content: string) => {
    if (!token) {
      toast.error("Bạn chưa đăng nhập");
      return;
    }

    try {
      const res = await axios.put(
        `https://survey-server-m884.onrender.com/api/questions/${questionId}`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Cập nhật câu hỏi thành công");
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật câu hỏi thất bại");
    }
  };

  return (
    <div>
      <h1>{existingSurvey.title}</h1>
      {questions.map((q, idx) => (
        <div key={q.id} className="mb-4">
          <input
            type="text"
            value={q.content}
            onChange={(e) => handleQuestionChange(idx, e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={() => saveQuestion(q.id, q.content)}
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
          >
            Lưu
          </button>
        </div>
      ))}
    </div>
  );
}
