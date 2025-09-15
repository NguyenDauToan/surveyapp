import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Demo = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const questions = [
    {
      id: 1,
      type: "radio",
      question: "Bạn đánh giá thế nào về chất lượng dịch vụ của chúng tôi?",
      options: ["Rất tốt", "Tốt", "Trung bình", "Kém", "Rất kém"]
    },
    {
      id: 2,
      type: "radio",
      question: "Bạn có khả năng giới thiệu dịch vụ của chúng tôi cho bạn bè không?",
      options: ["Chắc chắn có", "Có thể", "Không chắc", "Có thể không", "Chắc chắn không"]
    },
    {
      id: 3,
      type: "text",
      question: "Bạn có góp ý gì để chúng tôi cải thiện dịch vụ không?",
      placeholder: "Nhập góp ý của bạn..."
    },
    {
      id: 4,
      type: "input",
      question: "Email của bạn (tùy chọn):",
      placeholder: "email@example.com"
    }
  ];

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitSurvey = () => {
    alert("Cảm ơn bạn đã tham gia khảo sát! (Trong ứng dụng thực tế, dữ liệu sẽ được lưu vào database)");
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-4">Demo Khảo Sát</h1>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Câu hỏi {currentQuestion + 1} / {questions.length}
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">{question.question}</CardTitle>
              {question.type === "text" && (
                <CardDescription>
                  Vui lòng chia sẻ ý kiến của bạn
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {question.type === "radio" && question.options && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => handleAnswer(question.id, value)}
                >
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "text" && (
                <Textarea
                  placeholder={question.placeholder}
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  rows={4}
                />
              )}

              {question.type === "input" && (
                <Input
                  type="email"
                  placeholder={question.placeholder}
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                />
              )}

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Quay lại</span>
                </Button>

                {currentQuestion === questions.length - 1 ? (
                  <Button
                    onClick={submitSurvey}
                    className="flex items-center space-x-2"
                  >
                    <span>Gửi khảo sát</span>
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    className="flex items-center space-x-2"
                  >
                    <span>Tiếp theo</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Demo;