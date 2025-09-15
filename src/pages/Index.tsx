import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SurveyBuilder from "@/components/SurveyBuilder";
import Customers from "@/components/Customers";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <SurveyBuilder />
        <Customers />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
