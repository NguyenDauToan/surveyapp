import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Play, BarChart3, Users, CheckCircle, Plus, Settings, FileText, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getMyFormsAPI } from "@/api/Api";
import FormDetailDialog from "@/pages/FormDetail";
import { ExportModal } from "./ExportModal"; // import modal export
import { Link } from "react-router-dom";

interface HeroProps {
  isLoggedIn: boolean;
}

const Hero = ({ isLoggedIn }: HeroProps) => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  // --- Export modal state ---
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
//  phân trang 
  const token = localStorage.getItem("token"); // lấy token

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    getMyFormsAPI(token)
      .then((data) => setSurveys(data || []))
      .catch((err) => {
        console.error(" Lỗi load forms:", err);
        toast.error("Không tải được khảo sát của bạn");
      });
  }, [isLoggedIn, token]);

  const handleOpen = (id: number) => {
    setSelectedId(id);
    setOpen(true);
  };

  const openExportModal = (id: number) => {
    setSelectedSurveyId(id);
    setIsExportOpen(true);
  };

  const closeExportModal = () => {
    setSelectedSurveyId(null);
    setIsExportOpen(false);
  };

  const handleCreate = () => {
    if (!isLoggedIn) {
      toast.error("Bạn cần đăng nhập để tạo khảo sát", { duration: 1000 });
      return;
    }
    navigate("/create");
  };

  return (
    <main className="container max-w-screen-xl mx-auto px-4 py-8">
      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div onClick={handleCreate} className="block cursor-pointer">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Tạo khảo sát</p>
              <p className="text-sm text-muted-foreground">Bắt đầu tạo khảo sát mới</p>
            </CardContent>
          </Card>
        </div>
        <div
          onClick={() => {
            if (!isLoggedIn) {
              toast.error("Bạn cần đăng nhập để vào phòng khảo sát", { duration: 1000 });
              return;
            }
            navigate("/rooms");
          }}
          className="block cursor-pointer"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Phòng khảo sát</p>
              <p className="text-sm text-muted-foreground">Tạo và quản lý phòng</p>
            </CardContent>
          </Card>
        </div>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">Xuất file PDF/EXCEL</p>
            <p className="text-sm text-muted-foreground">Xem báo cáo chi tiết</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">Mẫu có sẵn</p>
            <p className="text-sm text-muted-foreground">Sử dụng mẫu khảo sát</p>
          </CardContent>
        </Card>
{/* 
      <Link to="/survey/9ffe0650-32ec-4a2f-99fe-8d6085d53e0b">
  <button className="btn">Mở khảo sát 88 public</button>
</Link> */}
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
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
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

                        {/* Export Button */}
                        <button
                          className="px-3 py-1 border rounded hover:bg-gray-200"
                          onClick={() => openExportModal(survey.id)}
                        >
                          Export
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có khảo sát nào</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/forms")}
                >
                  Xem tất cả khảo sát
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Create + Thống kê nhanh */}
        <div className="space-y-6">
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

          <Card>
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

      {/* Form Detail Dialog */}
      <FormDetailDialog id={selectedId} open={open} onOpenChange={setOpen} />

      {/* Export Modal */}
      {isExportOpen && selectedSurveyId && token && (
        <ExportModal
          surveyId={selectedSurveyId}
          onClose={closeExportModal}
          token={token}
        />
      )}
    </main>
  );
};

export default Hero;
