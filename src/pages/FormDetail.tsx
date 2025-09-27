// src/components/FormDetailDialog.tsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getFormDetail } from "@/api/Api";
import DashboardTab from "./DashboardTab";
import SubmissionListTab from "./SubmissionListTab";

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
  const token = useSelector((state: RootState) => state.auth.token);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabType>("detail");

  // Lấy chi tiết form
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

        <Tabs
          value={tab}
          onValueChange={(value: string) => setTab(value as TabType)}
          className="mt-4"
        >
          <TabsList>
            <TabsTrigger value="detail">Chi tiết khảo sát</TabsTrigger>
            <TabsTrigger value="dashboard">Responses Dashboard</TabsTrigger>
            <TabsTrigger value="submission">Danh sách phản hồi</TabsTrigger>
          </TabsList>

          {/* Tab 1: Chi tiết khảo sát */}
          <TabsContent value="detail">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !form ? (
              <p className="text-center text-muted-foreground">
                Không tìm thấy khảo sát
              </p>
            ) : (
              <div className="space-y-6 mt-4">
                <div className="space-y-3">
                  <Label>Tiêu đề</Label>
                  <Input value={form.title} readOnly />
                  <Label>Mô tả</Label>
                  <Textarea value={form.description} readOnly />
                    <Label>Link {form.public_link}</Label>        
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
          </TabsContent>

          {/* Tab 2: Dashboard */}
          <TabsContent value="dashboard">
            <div className="mt-4">
              {id && token ? (
                <DashboardTab formId={id} token={token} />
              ) : (
                <p className="text-muted-foreground">
                  Chưa có dữ liệu hoặc chưa đăng nhập
                </p>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Submission List */}
          <TabsContent value="submission">
            <div className="mt-4">
              {id && token ? (
                <SubmissionListTab formId={id} token={token} />
              ) : (
                <p className="text-muted-foreground">
                  Chưa có dữ liệu hoặc chưa đăng nhập
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FormDetailDialog;
