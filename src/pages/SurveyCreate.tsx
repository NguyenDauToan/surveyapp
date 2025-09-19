import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Eye, Save, Type, List, Star, ToggleLeft } from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";
import { createSurveyAPI, addQuestionAPI } from "@/api/Api";

interface Question {
  id: string;
  type: "text" | "multiple-choice" | "rating" | "yes-no";
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
    questions: [],
  });
  const [surveyLink, setSurveyLink] = useState<string | null>(null);

  const [maxResponses, setMaxResponses] = useState<number | null>(null);
  const [isLimited, setIsLimited] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: "text",
    title: "",
    required: false,
    options: [],
  });

  // ================== SETTINGS ==================
  const [settings, setSettings] = useState({
    max_responses: null as number | null,
    collect_email: false,
    show_progress: false,
    shuffle_questions: false,
    start_at: null as string | null,
    expire_at: null as string | null,
    language: "vi",
  });

  const questionTypes = [
    { value: "text", label: "Câu hỏi mở", icon: Type },
    { value: "multiple-choice", label: "Trắc nghiệm", icon: List },
    { value: "rating", label: "Đánh giá sao", icon: Star },
    { value: "yes-no", label: "Có/Không", icon: ToggleLeft },
  ];

  const addQuestion = () => {
    if (!newQuestion.title) {
      toast.error("Vui lòng nhập tiêu đề câu hỏi");
      return;
    }
    const question: Question = {
      id: Date.now().toString(),
      type: newQuestion.type as Question["type"],
      title: newQuestion.title,
      required: newQuestion.required || false,
      options: newQuestion.type === "multiple-choice" ? newQuestion.options || [] : undefined,
    };
    setSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }));
    setNewQuestion({ type: "text", title: "", required: false, options: [] });
    toast.success("Đã thêm câu hỏi thành công!");
  };

  const removeQuestion = (id: string) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
    toast.success("Đã xóa câu hỏi!");
  };

  const mapType = (type: string) => {
    switch (type) {
      case "text":
        return "fill_blank";
      case "multiple-choice":
        return "multiple_choice";
      case "rating":
        return "rating";
      case "yes-no":
        return "true_false";
      default:
        return "fill_blank";
    }
  };

  const saveSurvey = async () => {
    console.log("📌 [saveSurvey] Start saving survey");
    console.log("📌 [saveSurvey] Survey state:", survey);
    console.log("📌 [saveSurvey] Settings:", settings);

    if (!survey.title) return toast.error("Nhập tiêu đề");
    if (survey.questions.length === 0) return toast.error("Chưa có câu hỏi");

    const rawToken = localStorage.getItem("token");
    const token = rawToken && rawToken !== "null" && rawToken !== "undefined" ? rawToken : undefined;
    console.log("📌 [saveSurvey] Token:", token);

    try {
      // ===== Tạo khảo sát =====
      const newSurvey = await createSurveyAPI(token || "", {
        title: survey.title,
        description: survey.description,
        is_active: true,
        settings: {
          ...settings,
          max_responses: isLimited ? maxResponses : null,
        },
      });

      const formId = newSurvey.ID || newSurvey.id;
      if (!formId) throw new Error("Không lấy được ID khảo sát");

      console.log("✅ [saveSurvey] Survey created:", newSurvey);
      console.log("📌 [saveSurvey] formId gửi lên:", formId);

      // Luôn lấy edit_token từ response để gửi khi thêm câu hỏi
      const editToken = newSurvey.edit_token;
      console.log("📌 [saveSurvey] editToken:", editToken);

      // ===== Thêm câu hỏi =====
      for (const q of survey.questions) {
        const payload = {
          type: mapType(q.type),
          content: q.title,
          props: JSON.stringify({
            required: q.required,
            options: q.options || [],
          }),
        };

        try {
          console.log("➡️ [saveSurvey] Add question payload:", payload);

          // Nếu survey mới tạo mà owner_id chưa có → dùng editToken
          const useEditToken = !token || !newSurvey.owner_id ? newSurvey.edit_token : undefined;

          const addedQuestion = await addQuestionAPI(formId, payload, token && newSurvey.owner_id ? token : undefined, useEditToken);

          console.log(`✅ [saveSurvey] Added question: ${q.title}`, addedQuestion);
        } catch (err: any) {
          console.error("❌ [saveSurvey] Add question error:", {
            question: q.title,
            status: err.status,
            data: err.data,
            message: err.message,
          });
          toast.error(`Lỗi khi thêm câu hỏi "${q.title}": ${err.data?.message || err.message}`);
          return; // dừng nếu có lỗi
        }
      }

      toast.success("🎉 Đã lưu khảo sát và câu hỏi vào database!");
      const link = `${window.location.origin}/survey/${formId}`;
      setSurveyLink(link);
      console.log("📌 [saveSurvey] Survey link:", link);

    } catch (err: any) {
      console.error("❌ [saveSurvey] Save survey error:", {
        status: err.status,
        data: err.data,
        message: err.message,
      });
      toast.error(err.data?.message || err.message || "Lỗi khi lưu khảo sát");
    }
  };


  const addOption = () => {
    if (newQuestion.type === "multiple-choice") {
      setNewQuestion((prev) => ({
        ...prev,
        options: [...(prev.options || []), ""],
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options?.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const removeOption = (index: number) => {
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tạo khảo sát mới</h1>
          <p className="text-muted-foreground">Thiết kế khảo sát của bạn với các câu hỏi đa dạng</p>
        </div>

        <div className="grid gap-6">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tiêu đề khảo sát</Label>
                <Input value={survey.title} onChange={e => setSurvey({ ...survey, title: e.target.value })} />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Textarea value={survey.description} onChange={e => setSurvey({ ...survey, description: e.target.value })} />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={isLimited}
                  onChange={e => {
                    setIsLimited(e.target.checked);
                    if (!e.target.checked) setSettings(prev => ({ ...prev, max_responses: null }));
                  }}
                />
                <Label>Giới hạn số lần trả lời</Label>
              </div>
              {isLimited && (
                <Input
                  type="number"
                  min={1}
                  placeholder="Nhập số lần trả lời tối đa"
                  value={settings.max_responses || ""}
                  onChange={e => setSettings(prev => ({ ...prev, max_responses: Number(e.target.value) }))}
                />
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt nâng cao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.collect_email}
                  onChange={e => setSettings(prev => ({ ...prev, collect_email: e.target.checked }))}
                />
                Thu thập email người trả lời
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_progress}
                  onChange={e => setSettings(prev => ({ ...prev, show_progress: e.target.checked }))}
                />
                Hiển thị tiến độ khảo sát
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.shuffle_questions}
                  onChange={e => setSettings(prev => ({ ...prev, shuffle_questions: e.target.checked }))}
                />
                Xáo trộn thứ tự câu hỏi
              </label>
              <div>
                <Label>Ngôn ngữ</Label>
                <Select value={settings.language} onValueChange={v => setSettings(prev => ({ ...prev, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="p-4 border rounded bg-green-50 text-green-700 flex flex-col sm:flex-row gap-2">
                <p className="flex-1">Khảo sát đã tạo thành công!</p>
                <div className="flex gap-2 items-center">
                  <input readOnly value={surveyLink} className="border px-2 py-1 rounded w-64 text-sm" />
                  <button
                    className="bg-primary text-white px-3 py-1 rounded"
                    onClick={() => {
                      navigator.clipboard.writeText(surveyLink);
                      toast.success("Đã sao chép link!");
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