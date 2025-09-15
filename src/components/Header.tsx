import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import LoginDialog from "@/layout/LoginDialog";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/authSlice";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

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
          <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Khảo sát của tôi
          </a>

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

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-3">
            <a href="#" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Tạo khảo sát
            </a>
            <a href="#" className="block text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Khảo sát của tôi
            </a>


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
    </header>
  );
};

export default Header;
