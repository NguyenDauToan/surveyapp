import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Type, 
  CheckSquare, 
  Circle, 
  Star,
  Calendar,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Eye
} from "lucide-react";

const SurveyBuilder = () => {
  const questionTypes = [
    { icon: Type, label: "Văn bản", color: "bg-blue-100 text-blue-700" },
    { icon: CheckSquare, label: "Nhiều lựa chọn", color: "bg-green-100 text-green-700" },
    { icon: Circle, label: "Một lựa chọn", color: "bg-purple-100 text-purple-700" },
    { icon: Star, label: "Đánh giá sao", color: "bg-yellow-100 text-yellow-700" },
    { icon: Calendar, label: "Ngày tháng", color: "bg-red-100 text-red-700" },
    { icon: ImageIcon, label: "Hình ảnh", color: "bg-pink-100 text-pink-700" }
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                Công cụ tạo khảo sát
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Thiết kế khảo sát <span className="text-primary">dễ dàng</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Giao diện kéo thả trực quan, thêm câu hỏi chỉ với một cú click. 
                Tùy chỉnh giao diện, logic câu hỏi và phân nhánh thông minh.
              </p>
            </div>

            {/* Question Types */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Các loại câu hỏi có sẵn:</h3>
              <div className="grid grid-cols-2 gap-3">
                {questionTypes.map((type, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-card rounded-lg border hover:shadow-sm transition-shadow">
                    <div className={`p-2 rounded-lg ${type.color}`}>
                      <type.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group">
                <Plus className="mr-2 h-5 w-5" />
                Tạo khảo sát ngay
              </Button>
              <Button variant="outline" size="lg">
                <Eye className="mr-2 h-5 w-5" />
                Xem mẫu khảo sát
              </Button>
            </div>
          </div>

          {/* Right Content - Survey Builder Demo */}
          <div className="relative">
            <Card className="bg-card shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Khảo sát mới</CardTitle>
                  <Badge variant="outline">Đang chỉnh sửa</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Question 1 */}
                <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">Câu hỏi 1</span>
                    <Badge variant="secondary" className="text-xs">Bắt buộc</Badge>
                  </div>
                  <h4 className="font-semibold">Bạn có hài lòng với dịch vụ của chúng tôi?</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary rounded-full"></div>
                      <span className="text-sm">Rất hài lòng</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-muted rounded-full"></div>
                      <span className="text-sm">Hài lòng</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-muted rounded-full"></div>
                      <span className="text-sm">Bình thường</span>
                    </div>
                  </div>
                </div>

                {/* Question 2 */}
                <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border-l-4 border-accent">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-accent">Câu hỏi 2</span>
                    <Badge variant="outline" className="text-xs">Tùy chọn</Badge>
                  </div>
                  <h4 className="font-semibold">Bạn muốn chia sẻ thêm ý kiến gì không?</h4>
                  <div className="p-3 bg-background border rounded-md">
                    <span className="text-sm text-muted-foreground">Nhập câu trả lời của bạn...</span>
                  </div>
                </div>

                {/* Add Question Button */}
                <Button variant="outline" className="w-full" size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm câu hỏi
                </Button>
              </CardContent>
            </Card>

            {/* Floating Preview Button */}
            <Card className="absolute -bottom-6 -right-6 p-4 bg-primary text-primary-foreground shadow-xl">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Xem trước</p>
                  <p className="text-xs opacity-90">Thời gian thực</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SurveyBuilder;