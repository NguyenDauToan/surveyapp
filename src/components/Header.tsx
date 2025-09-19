import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Settings, Plus } from "lucide-react";
import { useState } from "react";
import LoginDialog from "@/layout/LoginDialog";
import MySurveys from "@/pages/MySurveys"; // 👈 import MySurveys
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/authSlice";
import { Link, useNavigate } from "react-router-dom";
import IndexPage from "./indexPage";
import { Navigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMySurveyOpen, setIsMySurveyOpen] = useState(false); // 👈 thêm state
  const [isIndexOpen, setIsIndexOpen] = useState(false)
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // reload về trang chủ
  };

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
      <div className="container flex h-16 max-w-screen-xl items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-xl text-foreground">SurveyPro</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/create"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Tạo khảo sát
          </Link>
          {/* 👇 sửa thành Button mở dialog */}
          <button
            onClick={() => setIsMySurveyOpen(true)}
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Khảo sát của tôi
          </button>
          <Button
            onClick={() => {
              setIsIndexOpen(true);
              navigate("/page");
            }}
          >
            Index
          </Button>
          <Link
            to="/rooms"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Phòng
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {!user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => setIsLoginOpen(true)}
              >
                Đăng nhập
              </Button>
              <Button variant="hero" size="sm">
                Đăng ký miễn phí
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-foreground">
                👋 Xin chào, {user.Ten || "User"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Dialog login */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />

      {/* Dialog MySurveys */}
      <Dialog open={isMySurveyOpen} onOpenChange={setIsMySurveyOpen}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Khảo sát của tôi</DialogTitle>
          </DialogHeader>
          <MySurveys /> {/* 👈 hiển thị luôn component MySurveys */}
        </DialogContent>
      </Dialog>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-3">
            <Link
              to="/create"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Tạo khảo sát
            </Link>
            {/* Mobile cũng mở dialog luôn */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsMySurveyOpen(true);
              }}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Khảo sát của tôi
            </button>

            <div className="pt-2 space-y-2">
              {!user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLoginOpen(true);
                  }}
                >
                  Đăng nhập
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
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

    </header>
  );
};

export default Header;
