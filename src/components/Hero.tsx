import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Play, BarChart3, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/survey-hero.jpg";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, FileText, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner"; // hoặc alert()
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getMyFormsAPI } from "@/api/Api";
import FormDetailDialog from "@/pages/FormDetail";

interface CreateSurveyCardProps {
  isLoggedIn: boolean; // state đăng nhập
}
const Hero = ({ isLoggedIn }: CreateSurveyCardProps) => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<any[]>([]);
  // Gọi API lấy khảo sát gần đây
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    getMyFormsAPI(token)
      .then((data) => {
        setSurveys(data || []);
      })
      .catch((err) => {
        console.error("❌ Lỗi load forms:", err);
        toast.error("Không tải được khảo sát của bạn");
      });
  }, [isLoggedIn]);

  const handleOpen = (id: number) => {
    setSelectedId(id);
    setOpen(true);
  };

  const handleClick = () => {
    if (!isLoggedIn) {
      toast.error("Bạn cần đăng nhập để tạo khảo sát", { duration: 1000 });
      return;
    }
    navigate("/create");
  };


  return (
    <main className="container max-w-screen-xl mx-auto px-4 py-8">
      {/* Quick Actions */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div onClick={handleClick} className="block cursor-pointer">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold">Tạo khảo sát</p>
                <p className="text-sm text-muted-foreground">
                  Bắt đầu tạo khảo sát mới
                </p>
              </CardContent>
            </Card>
          </div>
          <div onClick={() => {
            if (!isLoggedIn) {
              toast.error("Bạn cần đăng nhập để vào phòng khảo sát", { duration: 1000 });
              return;
            }
            navigate("/rooms");
          }} className="block cursor-pointer">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Phòng khảo sát</h3>
                <p className="text-sm text-muted-foreground">Tạo và quản lý phòng</p>
              </CardContent>
            </Card>
          </div>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Xuất file PDF/EXCEL</h3>
              <p className="text-sm text-muted-foreground">Xem báo cáo chi tiết</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Mẫu có sẵn</h3>
              <p className="text-sm text-muted-foreground">Sử dụng mẫu khảo sát</p>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Recent Surveys */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Khảo sát gần đây</CardTitle>
              <CardDescription>Quản lý các khảo sát của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {surveys.length > 0 ? (
                  surveys.map((survey) => (
                    <div
                      key={survey.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{survey.title}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {survey.created_at
                              ? new Date(survey.created_at).toLocaleDateString("vi-VN")
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            survey.status === "active"
                              ? "default"
                              : survey.status === "archived"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {survey.status === "active"
                            ? "Đang hoạt động"
                            : survey.status === "archived"
                              ? "Đã lưu trữ"
                              : "Khác"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpen(survey.id)}
                        >
                          Xem
                        </Button>
                        <FormDetailDialog id={selectedId} open={open} onOpenChange={setOpen} />

                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có khảo sát nào</p>
                )}

              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => navigate("/forms")}>
                  Xem tất cả khảo sát
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Create */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tạo nhanh</CardTitle>
              <CardDescription>Tạo khảo sát đơn giản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tiêu đề khảo sát</label>
                <Input placeholder="Nhập tiêu đề..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mô tả</label>
                <Textarea placeholder="Mô tả ngắn gọn..." rows={3} />
              </div>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tạo khảo sát
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tổng khảo sát</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phản hồi hôm nay</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Đang hoạt động</span>
                  <span className="font-semibold">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default Hero;