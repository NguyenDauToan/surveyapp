// src/pages/SurveyEditPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation  } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import Header from "@/components/Header";
import { Plus, Trash2, Save } from "lucide-react";

interface Question {
  id: string;
  type: "text" | "multiple-choice" | "rating" | "yes-no" | "file-upload";
  title: string;
  required: boolean;
  options?: string[];
}

interface Survey {
  title: string;
  description: string;
  questions: Question[];
}

interface QuestionProps {
  required?: boolean;
  options?: string[];
}

const SurveyEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateSurvey = location.state?.survey; // nhận dữ liệu từ Dialog

  const [survey, setSurvey] = useState<Survey>({
    title: "",
    description: "",
    questions: [],
  });

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: "text",
    title: "",
    required: false,
    options: [],
  });
  const [loading, setLoading] = useState(false);
  const [surveyLink, setSurveyLink] = useState<string | null>(null);

  const token = localStorage.getItem("token") || undefined;

  const questionTypes = [
    { value: "text", label: "Câu hỏi mở" },
    { value: "multiple-choice", label: "Trắc nghiệm" },
    { value: "rating", label: "Đánh giá sao" },
    { value: "yes-no", label: "Có/Không" },
    { value: "file-upload", label: "Tải ảnh lên" },
  ];

  // ================== Load survey hiện có ==================
  useEffect(() => {
    if (stateSurvey) {
      setSurvey({
        title: stateSurvey.title || "",
        description: stateSurvey.description || "",
        questions: (stateSurvey.questions || []).map((q: any) => ({
          id: q.id.toString(),
          title: q.content || q.title || "",
          type: q.type || "text",
          required: q.required || false,
          options: q.options?.map((o: any) => o.noi_dung || o) || [],
        })),
      });
      setSurveyLink(stateSurvey.public_link || null);
      return; // không load API
    }

    if (!id || !token) return;

    setLoading(true);
    axios.get(`https://survey-server-m884.onrender.com/api/forms/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        const data = res.data;

        const questions: Question[] = (data.cau_hois || []).map((q: any) => {
          let props: QuestionProps = {};
          try { props = q.props_json ? JSON.parse(q.props_json) : {}; } 
          catch { props = {}; }

          return {
            id: q.id.toString(),
            title: q.noi_dung || "",
            // === Chỉnh ở đây: giữ nguyên loại, format FE ===
            type: q.loai_cau_hoi.toLowerCase().replace("_", "-"),
            required: props.required || false,
            options: props.options || [],
          };
        });

        const mappedSurvey = {
          title: data.tieu_de || "",
          description: data.mo_ta || "",
          questions,
        };

        setSurvey(mappedSurvey);
        setSurveyLink(data.public_link || null);
      })
      .catch(err => {
        console.error(err.response?.data || err.message);
        toast.error("Không thể tải khảo sát");
      })
      .finally(() => setLoading(false));
  }, [id, token, stateSurvey]);


  // ================== Add/Remove question ==================
  const addQuestion = () => {
    if (!newQuestion.title) return toast.error("Nhập nội dung câu hỏi");
    const question: Question = {
      id: Date.now().toString(),
      type: newQuestion.type as Question["type"],
      title: newQuestion.title,
      required: newQuestion.required || false,
      options: newQuestion.type === "multiple-choice" ? newQuestion.options || [] : undefined,
    };
    setSurvey(prev => ({ ...prev, questions: [...prev.questions, question] }));
    setNewQuestion({ type: "text", title: "", required: false, options: [] });
    toast.success("Thêm câu hỏi thành công!");
  };

  const removeQuestion = (id: string) => {
    setSurvey(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }));
    toast.success("Đã xóa câu hỏi!");
  };

  // ================== Save survey ==================
  const saveSurvey = async () => {
    if (!survey.title) return toast.error("Nhập tiêu đề khảo sát");
    if (survey.questions.length === 0) return toast.error("Chưa có câu hỏi nào");

    try {
      const oldQuestionIds = (stateSurvey?.questions || []).map((q: any) => Number(q.id));
      const updatedQuestions = survey.questions.map((q, index) => {
        const isOld = oldQuestionIds.includes(Number(q.id));
        return {
          id: isOld ? Number(q.id) : undefined,
          content: q.title,
          // === Chỉnh ở đây: giữ nguyên type, format backend ===
          loai_cau_hoi: q.type.toUpperCase().replace("-", "_"),
          thu_tu: index,
          props: { required: q.required, ...(q.options ? { options: q.options } : {}) }
        };
      });

      const deletedQuestions = (stateSurvey?.questions || [])
        .filter(q => !survey.questions.some(sq => Number(sq.id) === Number(q.id)))
        .map(q => ({ id: Number(q.id), delete: true }));

      const payload = {
        title: survey.title,
        description: survey.description,
        settings: { shuffleQuestions: true, theme: "light" },
        end_date: stateSurvey?.end_date || new Date().toISOString(),
        questions: [...updatedQuestions, ...deletedQuestions]
      };

      console.log("Payload sent:", JSON.stringify(payload, null, 2));

      const res = await axios.put(
        `https://survey-server-m884.onrender.com/api/forms/${id}/updateform`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        toast.success("Cập nhật khảo sát thành công!");
        if (res.data.public_link) setSurveyLink(res.data.public_link);
      } else {
        toast.error(res.data.message || "Lỗi khi lưu khảo sát");
      }

    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error(err.response?.data?.message || err.message || "Lỗi khi lưu khảo sát");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4">Chỉnh sửa khảo sát</h1>

        <Card className="mb-6">
          <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tiêu đề khảo sát</Label>
              <Input value={survey.title} onChange={e => setSurvey({...survey, title: e.target.value})} />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea value={survey.description} onChange={e => setSurvey({...survey, description: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        {/* Add Question */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Thêm câu hỏi mới</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Loại câu hỏi</Label>
              <select
                value={newQuestion.type}
                onChange={e => setNewQuestion(prev => ({ ...prev, type: e.target.value as Question['type'], options: e.target.value === 'multiple-choice' ? [''] : [] }))}
                className="border rounded px-2 py-1 w-full"
              >
                {questionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <Label>Nội dung câu hỏi</Label>
              <Input value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} />
            </div>

            {newQuestion.type === "multiple-choice" && (
              <div>
                <Label>Các lựa chọn</Label>
                {newQuestion.options?.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 mb-1">
                    <Input value={opt} onChange={e => {
                      const opts = [...(newQuestion.options || [])];
                      opts[idx] = e.target.value;
                      setNewQuestion(prev => ({ ...prev, options: opts }));
                    }} />
                    <Button variant="ghost" onClick={() => {
                      const opts = (newQuestion.options || []).filter((_, i) => i !== idx);
                      setNewQuestion(prev => ({ ...prev, options: opts }));
                    }}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
                <Button onClick={() => setNewQuestion(prev => ({ ...prev, options: [...(prev.options || []), ""] }))}>Thêm lựa chọn</Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={newQuestion.required} onChange={e => setNewQuestion(prev => ({ ...prev, required: e.target.checked }))}/>
              <Label>Bắt buộc</Label>
            </div>


            <Button onClick={addQuestion} className="w-full"><Plus className="h-4 w-4 mr-2"/>Thêm câu hỏi</Button>
          </CardContent>
        </Card>

        {/* Questions list */}
     {survey.questions.map((q, idx) => (
  <div key={q.id} className="border p-4 rounded mb-2 flex flex-col gap-2">
    <div className="flex justify-between items-center">
      <span className="font-medium">{idx + 1}.</span>
      <Button variant="ghost" onClick={() => removeQuestion(q.id)}>
        <Trash2 className="h-4 w-4"/>
      </Button>
    </div>

    {/* Input để sửa tiêu đề */}
    <input
      type="text"
      value={q.title}
      onChange={e => {
        const newTitle = e.target.value;
        setSurvey(prev => ({
          ...prev,
          questions: prev.questions.map(qq =>
            qq.id === q.id ? { ...qq, title: newTitle } : qq
          )
        }));
      }}
      className="border p-1 rounded w-full"
    />

    {/* Nếu là multiple-choice thì show options */}
    {q.type === "multiple-choice" && (
      <div className="flex flex-col gap-1 ml-4">
        {q.options?.map((o, i) => (
          <input
            key={i}
            type="text"
            value={o}
            onChange={e => {
              const newOptions = [...(q.options || [])];
              newOptions[i] = e.target.value;
              setSurvey(prev => ({
                ...prev,
                questions: prev.questions.map(qq =>
                  qq.id === q.id ? { ...qq, options: newOptions } : qq
                )
              }));
            }}
            className="border p-1 rounded w-full"
          />
        ))}
        <Button
          size="sm"
          onClick={() => {
            setSurvey(prev => ({
              ...prev,
              questions: prev.questions.map(qq =>
                qq.id === q.id
                  ? { ...qq, options: [...(qq.options || []), ""] }
                  : qq
              )
            }));
          }}
        >
          Thêm option
        </Button>
      </div>
    )}

    {/* Checkbox required */}
    <label className="flex items-center gap-2 mt-1">
      <input
        type="checkbox"
        checked={q.required}
        onChange={e => {
          const required = e.target.checked;
          setSurvey(prev => ({
            ...prev,
            questions: prev.questions.map(qq =>
              qq.id === q.id ? { ...qq, required } : qq
            )
          }));
        }}
      />
      Bắt buộc
    </label>
  </div>
))}


        {/* Action */}
        <div className="flex gap-4 justify-end">
          {surveyLink && <a href={surveyLink} target="_blank" className="text-blue-500 underline">Xem khảo sát</a>}
          <Button onClick={saveSurvey}><Save className="h-4 w-4 mr-2"/>Lưu khảo sát</Button>
        </div>
      </main>
    </div>
  );
};

export default SurveyEditPage;
