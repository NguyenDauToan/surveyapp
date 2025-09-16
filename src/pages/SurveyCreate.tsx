import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Eye, Save, Type, List, Star, ToggleLeft } from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";
import { createSurveyAPI, addQuestionAPI } from "@/api/Api";


interface Question {
  id: string;
  type: 'text' | 'multiple-choice' | 'rating' | 'yes-no';
  title: string;
  required: boolean;
  options?: string[];
}

interface Survey {
  title: string;
  description: string;
  questions: Question[];
}

const SurveyCreate = () => {
  const [survey, setSurvey] = useState<Survey>({
    title: "",
    description: "",
    questions: []
  });
  const [surveyLink, setSurveyLink] = useState<string | null>(null);

  const [maxResponses, setMaxResponses] = useState<number | null>(null);
  const [isLimited, setIsLimited] = useState(false); // Có bật giới hạn hay không
  const [showPreview, setShowPreview] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'text',
    title: '',
    required: false,
    options: []
  });

  const form = useForm<Survey>({
    defaultValues: survey
  });

  const questionTypes = [
    { value: 'text', label: 'Câu hỏi mở', icon: Type },
    { value: 'multiple-choice', label: 'Trắc nghiệm', icon: List },
    { value: 'rating', label: 'Đánh giá sao', icon: Star },
    { value: 'yes-no', label: 'Có/Không', icon: ToggleLeft }
  ];

  const addQuestion = () => {
    if (!newQuestion.title) {
      toast.error("Vui lòng nhập tiêu đề câu hỏi");
      return;
    }

    const question: Question = {
      id: Date.now().toString(),
      type: newQuestion.type as Question['type'],
      title: newQuestion.title,
      required: newQuestion.required || false,
      options: newQuestion.type === 'multiple-choice' ? newQuestion.options || [] : undefined
    };

    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, question]
    }));

    setNewQuestion({
      type: 'text',
      title: '',
      required: false,
      options: []
    });

    toast.success("Đã thêm câu hỏi thành công!");
  };

  const removeQuestion = (id: string) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
    toast.success("Đã xóa câu hỏi!");
  };

  const saveSurvey = async () => {
    if (!survey.title) return toast.error("Nhập tiêu đề");
    if (survey.questions.length === 0) return toast.error("Chưa có câu hỏi");

    const token = localStorage.getItem("token");
    if (!token) return toast.error("Cần đăng nhập");

    try {
      const newSurvey = await createSurveyAPI(token, {
        title: survey.title,
        description: survey.description,
        is_active: true,
      });
      const formId = newSurvey.ID || newSurvey.id;
      if (!formId) throw new Error("Không lấy được ID khảo sát");

      for (const q of survey.questions) {
        const payload = {
          type: q.type.toUpperCase(),
          content: q.title,
          props: { required: q.required, options: q.options || [] }
        };
        await addQuestionAPI(formId, payload, token);
      }

      toast.success("Đã lưu khảo sát và câu hỏi vào database!");

      // Tạo link khảo sát
      const link = `${window.location.origin}/survey/${formId}`;
      setSurveyLink(link);

    } catch (err: any) {
      toast.error(err.message || "Lỗi khi lưu khảo sát");
    }
  };

  const addOption = () => {
    if (newQuestion.type === 'multiple-choice') {
      setNewQuestion(prev => ({
        ...prev,
        options: [...(prev.options || []), '']
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tạo khảo sát mới</h1>
          <p className="text-muted-foreground">Thiết kế khảo sát của bạn với các câu hỏi đa dạng</p>
        </div>

        <div className="grid gap-6">
          {/* Survey Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề khảo sát</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề khảo sát..."
                  value={survey.title}
                  onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả ngắn về mục đích khảo sát..."
                  value={survey.description}
                  onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="limitResponses"
                  checked={isLimited}
                  onChange={(e) => {
                    setIsLimited(e.target.checked);
                    if (!e.target.checked) setMaxResponses(null);
                  }}
                />
                <Label htmlFor="limitResponses">Giới hạn số lần trả lời</Label>
              </div>

              {isLimited && (
                <div className="mt-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Nhập số lần trả lời tối đa"
                    value={maxResponses || ''}
                    onChange={(e) => setMaxResponses(Number(e.target.value))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions List */}

          {/* Add Question */}
          <Card>
            <CardHeader>
              <CardTitle>Thêm câu hỏi mới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Loại câu hỏi</Label>
                <Select
                  value={newQuestion.type}
                  onValueChange={(value) => setNewQuestion(prev => ({ ...prev, type: value as Question['type'], options: value === 'multiple-choice' ? [''] : [] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Câu hỏi</Label>
                <Input
                  placeholder="Nhập nội dung câu hỏi..."
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {newQuestion.type === 'multiple-choice' && (
                <div>
                  <Label>Các lựa chọn</Label>
                  <div className="space-y-2">
                    {newQuestion.options?.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Lựa chọn ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm lựa chọn
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={newQuestion.required}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, required: e.target.checked }))}
                />
                <Label htmlFor="required">Câu hỏi bắt buộc</Label>
              </div>

              <Button onClick={addQuestion} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Thêm câu hỏi
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách câu hỏi ({survey.questions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {survey.questions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!
                </p>
              ) : (
                <div className="space-y-4">
                  {survey.questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Câu {index + 1}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {questionTypes.find(t => t.value === question.type)?.label}
                            </span>
                            {question.required && (
                              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                                Bắt buộc
                              </span>
                            )}
                          </div>
                          <p className="font-medium">{question.title}</p>
                          {question.options && (
                            <ul className="mt-2 space-y-1">
                              {question.options.map((option, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground ml-4">
                                  • {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Xem trước
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Xem trước khảo sát</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">{survey.title || "Tiêu đề khảo sát"}</h2>
                    <p className="text-muted-foreground">{survey.description || "Mô tả khảo sát"}</p>
                  </div>
                  {survey.questions.map((question, index) => (
                    <div key={question.id} className="space-y-2">
                      <Label className="text-base font-medium">
                        {index + 1}. {question.title}
                        {question.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {question.type === 'text' && (
                        <Textarea placeholder="Nhập câu trả lời..." disabled />
                      )}
                      {question.type === 'multiple-choice' && (
                        <div className="space-y-2">
                          {question.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input type="radio" disabled />
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === 'rating' && (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-6 w-6 text-muted-foreground" />
                          ))}
                        </div>
                      )}
                      {question.type === 'yes-no' && (
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <input type="radio" disabled />
                            <span>Có</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="radio" disabled />
                            <span>Không</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            {surveyLink && (
              <div className="mt-4 p-4 border rounded bg-green-50 text-green-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="flex-1">
                  Khảo sát đã tạo thành công! Nhấn nút để sao chép link:
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    readOnly
                    value={surveyLink}
                    className="border px-2 py-1 rounded w-64 text-sm"
                  />
                  <button
                    className="bg-primary text-white px-3 py-1 rounded hover:bg-primary/80 transition"
                    onClick={() => {
                      navigator.clipboard.writeText(surveyLink);
                      toast.success("Đã sao chép link vào clipboard!");
                    }}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            )}
            <Button onClick={saveSurvey}>
              <Save className="h-4 w-4 mr-2" />
              Lưu khảo sát
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SurveyCreate;