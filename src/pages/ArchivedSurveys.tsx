import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2, Calendar, Users, FileText } from "lucide-react";

export interface ArchivedSurvey {
  id: string;
  title: string;
  description: string;
  questions: number;
  responses: number;
  deletedAt: string;
  createdAt: string;
}

interface ArchivedSurveysProps {
  surveys: ArchivedSurvey[];
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ArchivedSurveys({ surveys, onRestore, onDelete }: ArchivedSurveysProps) {
  if (surveys.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Không có khảo sát nào
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {surveys.map(survey => (
        <Card key={survey.id} className="border-destructive/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{survey.title}</CardTitle>
                <CardDescription>{survey.description}</CardDescription>
              </div>
              <Badge variant="destructive">Đã xóa</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> {survey.questions} câu hỏi
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {survey.responses} phản hồi
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" /> Xóa ngày: {new Date(survey.deletedAt).toLocaleDateString('vi-VN')}
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => onRestore(survey.id)}>
                <RotateCcw className="h-3 w-3" /> Khôi phục
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(survey.id)}>
                <Trash2 className="h-3 w-3" /> Xóa vĩnh viễn
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
