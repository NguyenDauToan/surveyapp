import React, { useState } from "react";
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://survey-server-m884.onrender.com/api",
});

export const SurveyExportPage = ({ formId }: { formId: number }) => {
  const token = localStorage.getItem("token"); // lấy token đã login sẵn
  const [job, setJob] = useState<{ job_id: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);

  const handleExport = async () => {
    if (!token) return alert("Bạn cần đăng nhập trước");

    setLoading(true);
    try {
      // 1️⃣ Tạo export job
      const res = await axiosClient.post(
        `/forms/${formId}/export`,
        {
          format: "csv",
          range_from: "2025-01-01T00:00:00Z",
          range_to: "2025-12-31T23:59:59Z",
          include_attachments: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJob(res.data);

      // 2️⃣ Polling job status
      const interval = setInterval(async () => {
        try {
          const statusRes = await axiosClient.get(`/exports/${res.data.job_id}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "text",
            validateStatus: (status) => status === 200 || status === 202,
          });

          if (statusRes.status === 202) {
            setJob({ job_id: res.data.job_id, status: "processing" });
          } else if (statusRes.status === 200) {
            setJob({ job_id: res.data.job_id, status: "done" });
            setCsvData(statusRes.data);
            clearInterval(interval);
            setLoading(false);
          }
        } catch (err) {
          console.error("Lỗi kiểm tra export:", err);
          clearInterval(interval);
          setLoading(false);
        }
      }, 2000);
    } catch (err) {
      console.error("Export job lỗi:", err);
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `survey_${formId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleExport}
        disabled={loading || job?.status === "processing"}
      >
        {loading ? "Đang export..." : job?.status === "processing" ? "Processing..." : "Export Survey CSV"}
      </button>

      {job && (
        <div className="mt-4 p-4 border rounded">
          <p>Job ID: {job.job_id}</p>
          <p>Status: {job.status}</p>
        </div>
      )}

      {csvData && (
        <div className="mt-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleDownloadCSV}
          >
            Download CSV
          </button>
        </div>
      )}
    </div>
  );
};
