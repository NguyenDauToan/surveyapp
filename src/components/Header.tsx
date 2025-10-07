import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import LoginDialog from "@/layout/LoginDialog";
import MySurveys from "@/pages/MySurveys";
import UserProfileModal from "@/components/UserProfileModal"; // import modal
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/authSlice";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMySurveyOpen, setIsMySurveyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // ⚡ thêm state cho UserProfileModal
  const { user } = useSelector((state: RootState) => state.auth);

  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 max-w-screen-xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-xl text-foreground">SurveyPro</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!user ? (
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setIsLoginOpen(true)}
            >
              Đăng nhập
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-medium text-foreground cursor-pointer"
                  onClick={() => setProfileOpen(true)}
                >
                   Xin chào: {user.ten || "User"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setProfileOpen(true)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
            </>
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

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-3">
            <Link
              to="/create"
              className="block text-sm font-medium text-foreground/80 hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Tạo khảo sát
            </Link>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsMySurveyOpen(true);
              }}
              className="block text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              Khảo sát của tôi
            </button>
            <Link
              to="/settings"
              className="block text-sm font-medium text-foreground/80 hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Cài đặt
            </Link>

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
          </nav>
        </div>
      )}

      {/* Dialogs */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      <Dialog open={isMySurveyOpen} onOpenChange={setIsMySurveyOpen}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Khảo sát của tôi</DialogTitle>
          </DialogHeader>
          <MySurveys />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
