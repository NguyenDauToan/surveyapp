import React, { useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import { useDispatch } from "react-redux";
import { login } from "@/redux/authSlice";
import { useNavigate } from "react-router-dom";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

interface BackendResponse {
  user?: {
    ten?: string;
    vai_tro?: boolean;
    [key: string]: any;
  };
  token?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const API_BASE = import.meta.env.VITE_API_BASE || "https://survey-server-m884.onrender.com/api";
  const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
    console.log("Credential response:", response);
    if (!response.credential) return console.error("❌ Không nhận được ID Token từ Google");

    try {
      const res = await fetch(`${API_BASE}/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: response.credential }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Backend error:", err);
        throw new Error(err);
      }

      const data = await res.json();

      if (data.user && data.token) {
        const user = {
          id: data.user.id,
          ten: data.user.ten,
          email: data.user.email,
          vai_tro: data.user.vai_tro,
          ngay_tao: data.user.ngay_tao,
          role: data.user.vai_tro ? "admin" : "user",
        };

        dispatch(login({ user, token: data.token }));

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("user_id", String(user.id));

        if (user.role === "admin") navigate("/admin");
        else navigate("/");

        onOpenChange(false);
      } else {
        alert("Đăng nhập thất bại");
      }
    } catch (err) {
      console.error("Lỗi khi đăng nhập Google:", err);
      alert("Lỗi khi đăng nhập Google");
    }
  };

  useEffect(() => {
    if (!open) return;

    const ensureGoogleScript = () => {
      if (window.google) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const existingScript = document.getElementById("google-client-script");
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.crossOrigin = "anonymous";
        script.id = "google-client-script";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
        callback: handleCredentialResponse,
        ux_mode: "popup",
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "filled_blue",
        size: "large",
        width: "300",
        text: "signin_with",
        shape: "pill",
      });
    };

    ensureGoogleScript().then(() => {
      renderGoogleButton();
    });
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      (document.activeElement as HTMLElement)?.blur();
    }, 0);
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { borderRadius: 4, width: "400px", padding: 3 } }}
    >
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
        Đăng nhập
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          ref={googleButtonRef}
          style={{ width: "100%", textAlign: "center" }}
        />

        <div
          style={{ textAlign: "center", fontSize: "0.85rem", color: "gray" }}
        >
          Dùng tài khoản Google để đăng nhập
        </div>

        <Button variant="outlined" onClick={handleClose} sx={{ mt: 2 }}>
          Hủy
        </Button>
      </DialogContent>
    </Dialog>
  );
}