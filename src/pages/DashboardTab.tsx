import { useEffect, useState } from "react";
import { getFormDashboardAPI } from "@/api/Api";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardProps {
  formId: number;
  token: string;
}

interface QuestionStat {
  content: string;
  question_id: number;
  type: string;
  stats: any;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardTab({ formId, token }: DashboardProps) {
  const [data, setData] = useState<QuestionStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!formId || !token) return;

    setLoading(true);
    getFormDashboardAPI(formId, token)
      .then((res) => {
        setData(res.results?.length ? res.results : []);
      })
      .catch(() => {
        toast.error("Không thể tải dashboard");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [formId, token]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-6 w-6 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    );

  if (!data.length)
    return <p className="text-muted-foreground">Chưa có dữ liệu thống kê</p>;

  return (
    <div className="space-y-6 mt-4">
      {data.map((q) => {
        // MULTIPLE_CHOICE / TRUE_FALSE → PieChart
        let chartData: any[] = [];
        if (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.type) && q.stats) {
          const total = q.stats.reduce(
            (sum: number, s: any) => sum + s.count,
            0
          );
          chartData = q.stats.map((s: any) => {
            let option = s.option;
            if (Array.isArray(option)) {
              option = option.flat(Infinity).join(", ");
            }
            const percent = total > 0 ? (s.count / total) * 100 : 0;
            return {
              ...s,
              optionText: option,
              percent,
            };
          });
        }

        return (
          <div
            key={q.question_id}
            className="border p-4 rounded-lg bg-muted/10"
          >
            <h4 className="font-semibold mb-2">{q.content}</h4>

            {/* MULTIPLE_CHOICE / TRUE_FALSE */}
            {chartData.length > 0 && (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="optionText"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ optionText, percent }) =>
                        `${optionText}: ${percent.toFixed(0)}%`
                      }
                    >
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: string, props: any) => {
                        const payload = props?.payload;
                        if (!payload) return ["-", "-"];
                        return [
                          `${payload.count} (${payload.percent.toFixed(1)}%)`,
                          payload.optionText,
                        ];
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* RATING */}
            {q.type === "RATING" && q.stats && (
              <div className="w-full h-40">
                <p className="text-sm mb-2">
                  Avg: {q.stats.avg}, Min: {q.stats.min}, Max: {q.stats.max}
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.stats.histogram}>
                    <XAxis dataKey="rating" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* FILL_BLANK */}
            {q.type === "FILL_BLANK" && q.stats?.length > 0 && (
              <ul className="list-disc list-inside text-sm">
                {q.stats.map((s: any, idx: number) => (
                  <li key={idx}>
                    {s.answer} – {s.count} lần
                  </li>
                ))}
              </ul>
            )}

            {/* FILE_UPLOAD */}
            {q.type === "FILE_UPLOAD" && q.stats?.length > 0 && (
              <ul className="list-disc list-inside text-sm">
                {q.stats.map((s: any, idx: number) => (
                  <li key={idx}>
                    <a
                      href={s.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      File của user {s.user_id}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
