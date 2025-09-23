import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SurveyBuilder from "@/components/SurveyBuilder";
import Footer from "@/components/Footer";
import { useGoogleOAuth } from "@react-oauth/google";
import { RootState } from "@/redux/store"; // store của bạn
import { useSelector } from "react-redux";

const Index = () => {
  const user = useSelector((state: RootState) => state.auth.user); // user = null nếu chưa login

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
      <Hero isLoggedIn={!!user} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
