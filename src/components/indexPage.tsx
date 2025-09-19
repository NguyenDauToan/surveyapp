import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BarChart3, Settings, FileText, Clock } from "lucide-react";
import { useState } from "react";

const IndexPage = () => {
  const [surveys] = useState([
    { id: 1, title: "Khảo sát hài lòng khách hàng", responses: 45, status: "active", created: "2 ngày trước" },
    { id: 2, title: "Đánh giá sản phẩm mới", responses: 23, status: "draft", created: "1 tuần trước" },
    { id: 3, title: "Phản hồi nhân viên", responses: 67, status: "completed", created: "3 ngày trước" },
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
        <div className="container flex h-16 max-w-screen-xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-foreground">SurveyPro</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Cài đặt
            </Button>
            <Button variant="hero" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tạo khảo sát mới
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-screen-xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground mb-6">Quản lý và tạo khảo sát của bạn</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Tạo khảo sát</h3>
                <p className="text-sm text-muted-foreground">Bắt đầu tạo khảo sát mới</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Phòng khảo sát</h3>
                <p className="text-sm text-muted-foreground">Tạo và quản lý phòng</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Thống kê</h3>
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
                  {surveys.map((survey) => (
                    <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{survey.title}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {survey.responses} phản hồi
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {survey.created}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={survey.status === 'active' ? 'default' : survey.status === 'completed' ? 'secondary' : 'outline'}>
                          {survey.status === 'active' ? 'Đang hoạt động' : survey.status === 'completed' ? 'Hoàn thành' : 'Nháp'}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Xem
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
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
    </div>
  );
};

export default IndexPage;