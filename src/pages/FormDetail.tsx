// src/components/FormDetailDialog.tsx
import { useEffect, useState } from "react";
import { getFormDetail, updateForm } from "@/api/Api"; // Thêm import updateForm
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getFormDetail } from "@/api/Api";
import DashboardTab from "./DashboardTab";
import SubmissionListTab from "./SubmissionListTab";
import { useNavigate } from "react-router-dom";
import CloneFormButton from "./CloneFormButton";
import ViewFormButton from "./ViewFormButton";
import CloneFormTab from "./CloneFormTab";
import DeleteFormButton from "./DeleteFormButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Props {
  id: number | null;
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

type TabType = "detail" | "dashboard" | "submission";

const FormDetailDialog = ({ id, open, onOpenChange }: Props) => {
interface AnswerDTO {
  id: number;       // ID của câu trả lời
  content: string;  // Nội dung của câu trả lời
}

interface QuestionDTO {
  id: number;
  type: string;
  content: string;
  order: number;
  props?: any;
  options?: any[];
  answers?: AnswerDTO[]; // Sử dụng AnswerDTO cho câu trả lời
}

interface FormDTO {
  id: number;
  title: string;
  description: string;
  questions: QuestionDTO[];
}

const FormDetail = ({ id, open, onOpenChange }: Props) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [form, setForm] = useState<FormDTO | null>(null); // Xác định kiểu cho form
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabType>("detail");
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false); // Trạng thái sửa
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Lấy chi tiết form
  useEffect(() => {
    if (!id || !token || !open) return;

    setLoading(true);
    getFormDetail(id, token)
      .then((data) => setForm(data))
      .catch(() => toast.error("Không thể tải khảo sát"))
      .finally(() => setLoading(false));
  }, [id, token, open]);

const handleCloneClick = () => {
  if (!id) return; // tránh lỗi nếu id null
  navigate(`/survey/${id}/clone`);
};      
    if (id && token && open) {
      setLoading(true);
      getFormDetail(id, token)
        .then((data) => {
          setForm(data);
          setTitle(data.title); // Gán giá trị cho tiêu đề
          setDescription(data.description); // Gán giá trị cho mô tả
          setIsEditing(true); // Bật chế độ sửa
        })
        .catch(() => toast.error("Không thể tải khảo sát"))
        .finally(() => setLoading(false));
    } else {
      // Reset lại khi không mở dialog
      setForm(null);
      setIsEditing(false);
    }
  }, [id, token, open]);

  const handleUpdate = async () => {
    if (!title || !description) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      await updateForm(id, { title, description }, token);
      toast.success("Cập nhật khảo sát thành công");
      setForm((prevForm) => {
        if (prevForm) {
          return { ...prevForm, title, description }; // Cập nhật form
        }
        return prevForm; // Nếu không có gì để cập nhật
      });
      setIsEditing(false); // Tắt chế độ sửa
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật khảo sát");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6 ">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Chi tiết khảo sát</DialogTitle>
          <DialogTitle>{isEditing ? "Sửa khảo sát" : "Chi tiết khảo sát"}</DialogTitle>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(value: string) => setTab(value as TabType)}
          className="mt-6"
        >
          <TabsList className="bg-gray-100 rounded-lg p-1 shadow-inner">
  <TabsTrigger value="detail" className="px-4 py-2 rounded-lg">
    Chi tiết khảo sát
  </TabsTrigger>
  <TabsTrigger value="dashboard" className="px-4 py-2 rounded-lg">
    Responses Dashboard
  </TabsTrigger>
  <TabsTrigger value="submission" className="px-4 py-2 rounded-lg">
    Danh sách phản hồi
  </TabsTrigger>
{/* Nút sửa */}
  {form && (
    <button
      onClick={() => navigate(`/survey/edit/${form.id}`)}
      className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition ml-2"
    >
      Sửa
    </button>
  )}
 {form && (
  <CloneFormTab formId={form.id} token={token} />
)}

  {form &&(
    <DeleteFormButton id={form.id} />

  )}
</TabsList>



          {/* Tab 1: Chi tiết khảo sát */}
          <TabsContent value="detail" className="mt-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !form ? (
              <p className="text-center text-muted-foreground">Không tìm thấy khảo sát</p>
            ) : (
              <div className="space-y-8">
                {/* Thông tin khảo sát */}
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Tiêu đề</Label>
                    <Input value={form.title} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label className="font-semibold">Mô tả</Label>
                    <Textarea value={form.description} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label className="font-semibold">Link khảo sát</Label>
                    <Input value={form.public_link} readOnly className="bg-gray-50 text-blue-600 hover:underline cursor-pointer" />
                  </div>
                </div>

                {/* Danh sách câu hỏi */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Danh sách câu hỏi</h3>
                  <div className="space-y-4">
                    {form.questions?.length > 0 ? (
                      form.questions.map((q: any, idx: number) => (
                        <div
                          key={q.id}
                          className="border p-4 rounded-lg bg-white shadow hover:shadow-md transition-shadow"
                        >
                          <p className="font-medium text-gray-800 mb-1">
                            Câu {idx + 1}: {q.content}
                          </p>
                          <p className="text-sm text-gray-500 mb-2">Loại: {q.type}</p>
                          {q.options?.length > 0 && (
                            <ul className="list-disc list-inside space-y-1">
                              {q.options.map((opt: any) => (
                                <li key={opt.id} className="text-gray-700">{opt.noi_dung}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Chưa có câu hỏi nào</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Dashboard */}
          <TabsContent value="dashboard" className="mt-6">
            {id && token ? (
              <DashboardTab formId={id} token={token} />
            ) : (
              <p className="text-gray-500 text-center">Chưa có dữ liệu hoặc chưa đăng nhập</p>
            )}
          </TabsContent>

          {/* Tab 3: Submission List */}
          <TabsContent value="submission" className="mt-6">
            {id && token ? (
              <SubmissionListTab formId={id} token={token} />
            ) : (
              <p className="text-gray-500 text-center">Chưa có dữ liệu hoặc chưa đăng nhập</p>
            )}
          </TabsContent>

        </Tabs>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !form ? (
          <p className="text-center text-muted-foreground">Không tìm thấy khảo sát</p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Tiêu đề</Label>
              {isEditing ? (
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              ) : (
                <Input value={form.title} readOnly />
              )}
              <Label>Mô tả</Label>
              {isEditing ? (
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              ) : (
                <Textarea value={form.description} readOnly />
              )}
            </div>

            {/* Danh sách câu hỏi */}
            <div>
              <h3 className="font-semibold mb-3">Danh sách câu hỏi</h3>
              <div className="space-y-4">
                {form.questions.length > 0 ? (
                  form.questions.map((q: QuestionDTO, idx: number) => (
                    <div key={q.id} className="border p-4 rounded-lg bg-muted/30">
                      <p className="font-medium">Câu {idx + 1}: {q.content}</p>
                      <p className="text-sm text-muted-foreground">Loại: {q.type}</p>
                      {isEditing && (
                        <Button onClick={() => {/* Hàm sửa câu hỏi */}} className="mt-2">Sửa câu hỏi</Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Chưa có câu hỏi nào</p>
                )}
              </div>
            </div>

            {/* Nút sửa và lưu */}
            <div className="flex justify-end">
              {isEditing ? (
                <Button onClick={handleUpdate}>Lưu</Button>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Sửa</Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FormDetail;