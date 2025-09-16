import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store"; // import kiểu root state của Redux

export default function RequireAdmin() {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user || !user.role) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}
