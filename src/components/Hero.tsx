import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Play, BarChart3, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/survey-hero.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                <span className="text-primary">Nền tảng</span> khảo sát{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  hiện đại
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Phần mềm tạo khảo sát trực tuyến miễn phí, giao diện đẹp, dễ sử dụng. 
                Nền tảng nghiên cứu thị trường hoàn toàn tự động giúp tiết kiệm thời gian và chi phí.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Đăng ký miễn phí
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl" className="group" asChild>
                <Link to="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Xem demo
                </Link>
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Phân tích thông minh</p>
                  <p className="text-xs text-muted-foreground">Báo cáo tự động</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Không giới hạn</p>
                  <p className="text-xs text-muted-foreground">Phản hồi khảo sát</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Dễ sử dụng</p>
                  <p className="text-xs text-muted-foreground">Giao diện thân thiện</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="Nền tảng khảo sát trực tuyến hiện đại với giao diện đẹp và tính năng phân tích thông minh"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              
              {/* Floating Cards */}
              <Card className="absolute -top-4 -left-4 p-4 bg-card/90 backdrop-blur-sm border shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Đang hoạt động</span>
                </div>
              </Card>
              
              <Card className="absolute -bottom-4 -right-4 p-4 bg-card/90 backdrop-blur-sm border shadow-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">2,847</p>
                  <p className="text-xs text-muted-foreground">Phản hồi hôm nay</p>
                </div>
              </Card>
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl -m-4 -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;