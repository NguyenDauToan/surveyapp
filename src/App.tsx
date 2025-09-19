import { Toaster } from "sonner"; // hoặc từ components/ui/sonner nếu bạn đã wrapper
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";
import LoginDialog from "./layout/LoginDialog";
import SurveyCreate from "./pages/SurveyCreate";
import MySurveys from "./pages/MySurveys";
import Room from "./pages/Room";

// Admin
import RequireAdmin from "./routes/RequireAdmin";
import Admin from "./layout/admin/AdminLayout";
import IndexPage from "./components/indexPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="top-right" />
        <Routes>
          {/* User routes */}
          <Route path="/" element={<Index />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/login" element={<LoginDialog open={true} onOpenChange={() => {}} />} />
          <Route path="/my-surveys" element={<MySurveys />} />
          <Route path="/create" element={<SurveyCreate />} />
          <Route path="/rooms" element={<Room />} />
          <Route path="/page" element={<IndexPage />} />

          {/* Admin routes */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<Admin />}>
             
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
