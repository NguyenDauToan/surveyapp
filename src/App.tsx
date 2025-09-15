import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";
import LoginDialog from "./layout/LoginDialog";
import SurveyCreate from "./pages/SurveyCreate";
import MySurveys from "./pages/MySurveys";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/demo" element={<Demo />} />
        <Route
          path="/login"
          element={<LoginDialog open={true} onOpenChange={() => { }} />}
        />
        <Route path="/my-surveys" element={<MySurveys />} />

        <Route path="/create" element={<SurveyCreate />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
