import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Zap, 
  PieChart, 
  Smartphone, 
  Shield, 
  Globe, 
  Headphones,
  BarChart3,
  Users,
  Clock,
  Target
} from "lucide-react";

const Features = () => {
  const mainFeatures = [
    {
      icon: Zap,
      title: "Tạo khảo sát nhanh chóng",
      description: "Công cụ kéo thả trực quan, tạo khảo sát chuyên nghiệp chỉ trong vài phút"
    },
    {
      icon: PieChart,
      title: "Phân tích dữ liệu thông minh",
      description: "Báo cáo thời gian thực với biểu đồ đẹp mắt và thông tin chi tiết"
    },
    {
      icon: Smartphone,
      title: "Tối ưu cho mobile",
      description: "Khảo sát hiển thị hoàn hảo trên mọi thiết bị và kích thước màn hình"
    },
    {
      icon: Shield,
      title: "Bảo mật tuyệt đối",
      description: "Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn quốc tế"
    }
  ];

  const additionalFeatures = [
    { icon: Globe, label: "Hỗ trợ đa ngôn ngữ" },
    { icon: Headphones, label: "Hỗ trợ 24/7" },
    { icon: BarChart3, label: "Xuất báo cáo Excel/PDF" },
    { icon: Users, label: "Chia sẻ nhóm làm việc" },
    { icon: Clock, label: "Lập lịch gửi khảo sát" },
    { icon: Target, label: "Nhắm mục tiêu chính xác" }
  ];

  return (
    <section className="py-16 md:py-24 bg-section-bg">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tính năng <span className="text-primary">vượt trội</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tất cả công cụ bạn cần để tạo, phát hành và phân tích khảo sát chuyên nghiệp
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {mainFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card-gradient">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-card rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-semibold text-center mb-8 text-foreground">
            Và nhiều tính năng khác
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground/80">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;