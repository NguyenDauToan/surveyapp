import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFormDetail, updateForm, deleteForm } from "@/api/Api";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Question {
  id: number;
  content: string;
  type: string;
  options?: string[];
  answer?: string;
}

interface Survey {
  id: number;
  title: string;
  description: string;
  ngay_tao: string;
  trang_thai: string;
  questions: Question[];
}

export default function MySurveys() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    loadDetail();
  }, []);

  const loadDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("Bạn cần đăng nhập để xem khảo sát");
      // ⚡ Hardcode id để test
      const id = 1;
      const data = await getFormDetail(id, token);
      setSurvey(data);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tải chi tiết khảo sát");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!survey) return;
    if (!confirm("Bạn có chắc muốn xoá khảo sát này?")) return;
    try {
      const token = localStorage.getItem("token")!;
      await deleteForm(survey.id, token);
      toast.success("Đã xoá khảo sát");
      setSurvey(null);
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xoá khảo sát");
    }
  };

  const handleEdit = () => {
    if (!survey) return;
    setEditingSurvey(survey);
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingSurvey) return;
    try {
      const token = localStorage.getItem("token")!;
      await updateForm(
        editingSurvey.id,
        {
          title: editingSurvey.title,
          description: editingSurvey.description,
        },
        token
      );
      toast.success("Cập nhật thành công");
      setSurvey(editingSurvey);
      setOpenEdit(false);
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại");
    }
  };

  if (loading) return <p className="text-center py-10">⏳ Đang tải...</p>;

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📋 Chi tiết khảo sát</h1>

      {!survey ? (
        <p className="text-muted-foreground">Không tìm thấy khảo sát.</p>
      ) : (
        <Card className="rounded-2xl shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              {survey.title}
            </CardTitle>
            <p className="text-sm text-gray-500">{survey.description}</p>
            <p className="text-xs text-gray-400 mt-1">
              Ngày tạo: {new Date(survey.ngay_tao).toLocaleDateString()} | Trạng
              thái:{" "}
              <span className="font-medium text-primary">{survey.trang_thai}</span>
            </p>
          </CardHeader>

          <CardContent>
            {/* Danh sách câu hỏi */}
            <div className="mt-4 space-y-4">
              <h2 className="font-semibold text-lg text-gray-700">
                Danh sách câu hỏi
              </h2>
              {survey.questions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có câu hỏi nào.
                </p>
              ) : (
                survey.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 border rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <p className="font-medium text-gray-800">
                      Câu {idx + 1}: {q.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Loại câu hỏi: <span className="font-medium">{q.type}</span>
                    </p>

                    {q.options && q.options.length > 0 && (
                      <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                        {q.options.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    )}

                    {q.answer && (
                      <p className="mt-2 text-sm text-green-600 font-medium">
                        ✅ Đáp án: {q.answer}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-3">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Sửa
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-lg"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xoá
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog edit form */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl bg-white p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ✏️ Chỉnh sửa khảo sát
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Cập nhật <span className="font-medium text-primary">tiêu đề</span> và{" "}
              <span className="font-medium text-primary">mô tả</span> khảo sát của bạn.
            </p>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            {/* Tiêu đề */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
              <Input
                className="rounded-xl border-gray-300 focus:border-primary focus:ring-primary transition"
                value={editingSurvey?.title || ""}
                onChange={(e) =>
                  setEditingSurvey((prev) =>
                    prev ? { ...prev, title: e.target.value } : prev
                  )
                }
                placeholder="Nhập tiêu đề khảo sát..."
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mô tả</label>
              <Input
                className="rounded-xl border-gray-300 focus:border-primary focus:ring-primary transition"
                value={editingSurvey?.description || ""}
                onChange={(e) =>
                  setEditingSurvey((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
                placeholder="Nhập mô tả khảo sát..."
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-xl px-4"
              onClick={() => setOpenEdit(false)}
            >
              ❌ Hủy
            </Button>
            <Button
              className="rounded-xl px-4 bg-primary text-white hover:bg-primary/90 shadow-md"
              onClick={handleUpdate}
            >
              💾 Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
