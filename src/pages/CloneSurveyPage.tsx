import { useParams } from "react-router-dom";
import CloneFormTab from "./CloneFormTab";

export default function CloneSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem("token"); // hoặc lấy từ redux

  if (!id || !token) return <p>Không tìm thấy khảo sát hoặc chưa đăng nhập</p>;

  return <CloneFormTab formId={Number(id)} token={token} />;
}
