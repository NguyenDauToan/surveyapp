import { Toaster } from "sonner"; // hoặc từ components/ui/sonner nếu bạn đã wrapper
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useParams } from "react-router-dom"; 

import Index from "./pages/Index";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";
import LoginDialog from "./layout/LoginDialog";
import SurveyCreate from "./pages/SurveyCreate";
import MySurveys from "./pages/MySurveys";
import Room from "./pages/Room";
import Archive from "./pages/ArchivedRoomsDialog";

// import { SurveyPage } from "./pages/SurveyPage";
import SurveyPage from "./pages/SurveyPage";
import RequireAdmin from "./routes/RequireAdmin";
import Admin from "./layout/admin/AdminLayout";

import CloneSurveyPage from "./pages/CloneSurveyPage";
import IndexPage from "./components/indexPage";
import FormDetail from "./pages/FormDetail";

const queryClient = new QueryClient();
// function SurveyPageWrapper() {
//   const { id } = useParams(); // lấy id từ /survey/:id
//   return <SurveyPage surveyId={Number(id)} />; // truyền vào SurveyPage
// }
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
          <Route path="/form/:id" element={<FormDetail />} />
            {/* <Route path="/surveyapp/survey/:id" element={<SurveyPage />} /> */}
        {/* <Route path="/fill-survey/:shareToken" element={<SurveyPage />} /> */}
          <Route path="/survey/:id" element={<SurveyPage />} /> {/* route survey */}
        {/* <Route path="/forms/public/:shareToken" element={<PublicForm />} /> */}

        {/* <Route path="/survey/:id" element={<SurveyPageWrapper />} /> */}
        <Route path="/survey/:id/clone" element={<CloneSurveyPage />} />

       
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
