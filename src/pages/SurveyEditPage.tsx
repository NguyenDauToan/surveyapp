import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const SurveyEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const [surveyData, setSurveyData] = useState<any>(null);
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    if (!id) return;

    const fetchSurvey = async () => {
      try {
        const res = await axios.get(`https://survey-server-m884.onrender.com/api/forms/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSurveyData(res.data.data);
      } catch (err: any) {
        console.error(err);
        toast.error("Không tải được khảo sát");
      }
    };

    fetchSurvey();
  }, [id, token]);

  if (!surveyData) return <p>Đang tải khảo sát...</p>;

  return <SurveyCreate existingSurvey={surveyData} />;
};

export default SurveyEditPage;
