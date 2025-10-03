import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Archive as ArchiveIcon, Search, X } from "lucide-react";
import axios from "axios";
import ArchivedSurveys from "./ArchivedSurveys";


interface ArchivedSurvey {
  id: string;
  title: string;
  description: string;
  questions: number;
  responses: number;
  deletedAt: string;
  createdAt: string;
}

export default function ArchivedSurveysDialog() {
  const API_BASE = "https://survey-server-m884.onrender.com/api";

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [archivedSurveys, setArchivedSurveys] = useState<ArchivedSurvey[]>([]);

  const filteredSurveys = archivedSurveys.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;

    axios.get(`${API_BASE}/surveys?trang_thai=archived`)
      .then(res => {
        setArchivedSurveys(res.data.data.map((s: any) => ({
          id: s.id,
          title: s.tieu_de,
          description: s.mo_ta || "",
          questions: s.questions_count || 0,
          responses: s.responses_count || 0,
          deletedAt: s.updatedAt || s.ngay_tao,
          createdAt: s.ngay_tao
        })));
      })
      .catch(err => console.log(err));
  }, [open]);

  const handleRestore = async (id: string) => {
    await axios.post(`${API_BASE}/surveys/${id}/restore`);
    setArchivedSurveys(prev => prev.filter(s => s.id !== id));
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`${API_BASE}/surveys/${id}`);
    setArchivedSurveys(prev => prev.filter(s => s.id !== id));
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <ArchiveIcon className="h-4 w-4" /> Kho Survey
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50" />
      <DialogPrimitive.Content className="fixed top-1/2 left-1/2 w-[95%] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6 shadow-lg focus:outline-none">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArchiveIcon className="h-6 w-6" /> Kho Survey
          </h2>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="sm"><X className="h-4 w-4" /></Button>
          </DialogPrimitive.Close>
        </div>

        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ArchivedSurveys
          surveys={filteredSurveys}
          onRestore={handleRestore}
          onDelete={handleDelete}
        />
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  );
}
