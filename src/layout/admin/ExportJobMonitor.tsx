// ExportJobMonitor.tsx
import { useState } from "react";
import axios from "axios";


interface ExportJobMonitorProps {
  formId: number;
  token: string;
}

export default function ExportJobMonitor({ formId, token }: ExportJobMonitorProps) {
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleStartExport = async () => {
    if (!rangeFrom || !rangeTo) return alert("Chọn khoảng thời gian");
    setIsExporting(true);
    try {
      const res = await axios.post(
        `https://survey-server-m884.onrender.com/api/forms/${formId}/export`,
        {
          format,
          range_from: rangeFrom,
          range_to: rangeTo,
          include_attachments: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobId(res.data.job_id);
      setStatus(res.data.status); // queued
      pollJob(res.data.job_id);
    } catch (err: any) {
      console.error(err);
      alert("Không thể tạo job export");
      setIsExporting(false);
    }
  };

  const pollJob = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `https://survey-server-m884.onrender.com/api/exports/${id}`,
          { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
        );

        // Nếu trả về CSV/XLSX (HTTP 200) → download
        if (res.status === 200 && res.data) {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `form_${formId}_export.${format}`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setStatus("done");
          setIsExporting(false);
          clearInterval(interval);
        }
      } catch (err: any) {
        // Nếu server trả 202 → job vẫn processing
        if (err.response?.status === 202) {
          setStatus("processing");
        } else {
          console.error("Lỗi khi poll job:", err);
          clearInterval(interval);
          setIsExporting(false);
        }
      }
    }, 2000); // poll 2 giây/lần
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg bg-muted max-w-2xl">
      <h3 className="font-semibold text-lg">Export Job Monitor</h3>

      {/* Range + Format */}
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-sm">Từ:</label>
        <input
  type="date"
  value={rangeFrom}
  onChange={(e) => setRangeFrom(e.target.value)}
  className="border rounded px-2 py-1"
/>

<select
  value={format}
  onChange={(e) => setFormat(e.target.value as "csv" | "xlsx")}
  className="border rounded px-2 py-1"
>
  <option value="csv">CSV</option>
  <option value="xlsx">XLSX</option>
</select>

<button
  onClick={handleStartExport}
  disabled={isExporting}
  className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
>
  {isExporting ? "Đang xuất..." : "Xuất"}
</button>

      </div>

      {/* Job status */}
      {jobId && (
        <div className="text-sm">
          Job ID: <span className="font-mono">{jobId}</span> | Status:{" "}
          <span className="font-medium">{status}</span>
        </div>
      )}
    </div>
  );
}
