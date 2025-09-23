import { useEffect, useState } from "react";
import { getFormDetail } from "@/api/Api";
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

const FormDetailDialog = ({ id, open, onOpenChange }: Props) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || !token || !open) return;
    setLoading(true);
    getFormDetail(id, token)
      .then((data) => setForm(data))
      .catch(() => toast.error("Không thể tải khảo sát"))
      .finally(() => setLoading(false));
  }, [id, token, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết khảo sát</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !form ? (
          <p className="text-center text-muted-foreground">
            Không tìm thấy khảo sát
          </p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Tiêu đề</Label>
              <Input value={form.title} readOnly />
              <Label>Mô tả</Label>
              <Textarea value={form.description} readOnly />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Danh sách câu hỏi</h3>
              <div className="space-y-4">
                {form.questions?.length > 0 ? (
                  form.questions.map((q: any, idx: number) => (
                    <div key={q.id} className="border p-4 rounded-lg bg-muted/30">
                      <p className="font-medium">
                        Câu {idx + 1}: {q.content}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Loại: {q.type}
                      </p>
                      {q.options?.length > 0 && (
                        <ul className="list-disc list-inside mt-2">
                          {q.options.map((opt: any) => (
                            <li key={opt.id}>{opt.noi_dung}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Chưa có câu hỏi nào</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FormDetailDialog;
