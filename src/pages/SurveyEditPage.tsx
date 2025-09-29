import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import SurveyCreate from "./SurveyCreate";

interface SurveyData {
  id: number;
  title: string;
  description: string;
  questions: any[];
  settings?: {
    collect_email: boolean;
  };
  end_date?: string;
}

export default function SurveyEditPage() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token"); // hoặc lấy từ redux
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || !token) return;

    const fetchSurvey = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://survey-server-m884.onrender.com/api/forms/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSurveyData(res.data);
      } catch (err: any) {
        console.error(err);
        toast.error("Không tải được khảo sát");
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [id, token]);

  if (!id || !token) return <p>Không tìm thấy khảo sát hoặc chưa đăng nhập</p>;
  if (loading) return <p>Đang tải khảo sát...</p>;
  if (!surveyData) return <p>Không tìm thấy dữ liệu khảo sát</p>;

  return <SurveyCreate existingSurvey={surveyData} />;
}
