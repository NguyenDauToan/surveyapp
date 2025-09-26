import { useEffect, useState } from "react";
import { getFormDetail, updateForm } from "@/api/Api"; // Thêm import updateForm
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  id: number | null;
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

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
  const [isEditing, setIsEditing] = useState(false); // Trạng thái sửa
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sửa khảo sát" : "Chi tiết khảo sát"}</DialogTitle>
        </DialogHeader>

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