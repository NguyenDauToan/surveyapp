import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMySurveys } from "@/api/Api";
import { Eye } from "lucide-react";
import { toast } from "sonner";

interface Survey {
  id: number;
  title: string;
  description: string;
  ngay_tao: string;
  trang_thai: string;
}

export default function MySurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Bạn cần đăng nhập để xem khảo sát");
        const data = await getMySurveys(token);
        setSurveys(data);
      } catch (err: any) {
        toast.error(err.message || "Lỗi khi tải khảo sát");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Khảo sát của tôi</h1>
      {surveys.length === 0 ? (
        <p className="text-muted-foreground">Bạn chưa có khảo sát nào.</p>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <CardTitle>{survey.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">{survey.description}</p>
                <p className="text-xs text-muted-foreground">
                  Ngày tạo: {new Date(survey.ngay_tao).toLocaleDateString()} | Trạng thái:{" "}
                  <span className="font-medium">{survey.trang_thai}</span>
                </p>
                <div className="mt-3">
                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
