import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl text-foreground">SurveyPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nền tảng khảo sát trực tuyến hàng đầu Việt Nam. 
              Tạo khảo sát chuyên nghiệp, thu thập ý kiến hiệu quả.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Sản phẩm</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Tạo khảo sát</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Trắc nghiệm online</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Khảo sát khách hàng</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Khảo sát nội bộ</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Phân tích dữ liệu</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Dịch vụ</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Nghiên cứu thị trường</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Khảo sát định tính</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Khảo sát định lượng</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Tư vấn chiến lược</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Đào tạo</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Liên hệ</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">info@surveypro.vn</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">+84 28 1234 5678</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">
                  Tầng 10, Tòa nhà ABC<br />
                  123 Nguyễn Văn Cừ, Q.1<br />
                  TP. Hồ Chí Minh
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 SurveyPro. Tất cả quyền được bảo lưu.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Hỗ trợ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;