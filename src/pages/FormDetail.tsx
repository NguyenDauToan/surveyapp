// src/components/FormDetailDialog.tsx
import { useEffect, useState } from "react";
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
import { Edit, Copy, Trash } from "lucide-react"
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
  const navigate = useNavigate();

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-5 ">
      <DialogHeader className="py-4 bg-gradient-to-r from-[#2fbdaf] to-[#30d8c7] rounded-t-lg mx-[-24px] mt-[-24px] p-5 shadow-sm ">
  <DialogTitle className="text-2xl font-semibold text-white text-center tracking-wide drop-shadow-sm">
    Chi tiết khảo sát
  </DialogTitle>
</DialogHeader>


        <Tabs
          value={tab}
          onValueChange={(value: string) => setTab(value as TabType)}
          className="mt-6 "
        >
<TabsList className="bg-[#efeaea7e] rounded-lg p-1 shadow-inner  shadow-gray-300 flex justify-between items-center">
  {/* Tabs bên trái */}
  <div className="flex space-x-2 ">
    <TabsTrigger
  value="detail"
  className="px-4 py-2 rounded-lg text-gray-500 data-[state=active]:bg-[#38e5d4]"
>
  Chi tiết khảo sát
</TabsTrigger>

<TabsTrigger
  value="dashboard"
  className="px-4 py-2 rounded-lg text-gray-500 data-[state=active]:bg-[#38e5d4]"
>
  Responses Dashboard
</TabsTrigger>

<TabsTrigger
  value="submission"
  className="px-4 py-2 rounded-lg text-gray-500 data-[state=active]:bg-[#38e5d4]"
>
  Danh sách phản hồi
</TabsTrigger>
  </div>

  {/* Các nút bên phải */}
 <div className="flex space-x-2 items-center">
  {form && (
    <div className="relative group">
      <button
        onClick={() =>
          navigate(`/survey/edit/${form.id}`, { state: { survey: form } })
        }
        className="px-2 py-2 rounded-lg text-gray-600 hover:text-blue-600"
      >
        <Edit size={20} />
      </button>
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap 
                       bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 
                       group-hover:opacity-100 transition-opacity">
        Chi tiết khảo sát
      </span>
    </div>
  )}

  {form && (
    <div className="relative group">
      <CloneFormTab formId={form.id} token={token} />
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap 
                       bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 
                       group-hover:opacity-100 transition-opacity">
        Tạo bản sao
      </span>
    </div>
  )}

  {form && (
    <div className="relative group">
      <DeleteFormButton id={form.id} />
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap 
                       bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 
                       group-hover:opacity-100 transition-opacity">
        Xóa khảo sát
      </span>
    </div>
  )}
</div>

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
                    <a
                      href={form.public_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gray-50 text-blue-600 hover:underline cursor-pointer rounded-md border px-3 py-2"
                    >
                      {form.public_link}
                    </a>
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
                          className=" p-2  shadow hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between">
                             <p className="font-medium text-gray-800 mb-1">
                            Câu {idx + 1}: {q.content}
                          </p>
                          <p className="text-sm text-gray-500 mb-2">Loại câu hỏi: {q.type}</p>
                          </div>
                         
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
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border border-gray-200 p-4">
                <p className="text-gray-500 text-center">
                  Chưa có dữ liệu hoặc chưa đăng nhập
                </p>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FormDetailDialog;
