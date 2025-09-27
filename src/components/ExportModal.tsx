import React, { useState, useEffect } from "react";
import axios from "axios";

export interface ExportJob {
  job_id: string;
  status: "queued" | "processing" | "completed";
}

interface ExportModalProps {
  surveyId: number;
  token: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ surveyId, token, onClose }) => {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);

  // Tạo job export
  const createExportJob = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/forms/${surveyId}/export`,
        {
          format: "csv",
          range_from: "2025-01-01T00:00:00Z",
          range_to: "2025-12-31T23:59:59Z",
          include_attachments: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newJob: ExportJob = {
        job_id: res.data.job_id,
        status: res.data.status as ExportJob["status"], // ép kiểu
      };

      setJobs((prev) => [...prev, newJob]);
    } catch (err) {
      console.error(err);
      alert("Tạo job export thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Polling job status mỗi 3s
  useEffect(() => {
    if (jobs.length === 0) return;

    const interval = setInterval(async () => {
      const updatedJobs = await Promise.all(
        jobs.map(async (job) => {
          if (job.status === "completed") return job;

          try {
            const res = await axios.get(`/api/exports/${job.job_id}`, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: "blob", // nếu completed sẽ là file CSV
              validateStatus: (status) => status === 200 || status === 202,
            });

            let newStatus: ExportJob["status"] = job.status;

            if (res.status === 200) newStatus = "completed";
            else if (res.status === 202) newStatus = "processing";

            return { ...job, status: newStatus };
          } catch (err) {
            console.error(err);
            return job;
          }
        })
      );

      setJobs(updatedJobs);
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs, token]);

  // Download file CSV
  const downloadFile = async (job_id: string) => {
    try {
      const res = await axios.get(`/api/exports/${job_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `export-${job_id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Tải file thất bại");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white p-6 rounded-2xl shadow-xl w-[40%] relative">
    <h3 className="text-xl font-bold mb-4 text-primary">Export Survey</h3>

    <button
      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg font-bold"
      onClick={onClose}
    >
      ✕
    </button>

    {/* Start Export Button */}
    <button
      className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
        loading
          ? "bg-primary/50 text-white cursor-not-allowed"
          : "bg-primary text-white hover:bg-primary/80"
      } mb-4`}
      onClick={createExportJob}
      disabled={loading}
    >
      {loading ? "Exporting..." : "Start Export"}
    </button>

    {/* Job List */}
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {jobs.length === 0 && (
        <p className="text-sm text-gray-500 text-center">Chưa có job export nào</p>
      )}

      {jobs.map((job) => (
        <div
          key={job.job_id}
          className="flex justify-between items-center p-3 border rounded-lg shadow-sm"
        >
          <div className="flex flex-col">
            <span className="text-sm font-mono text-gray-700">{job.job_id}</span>
            <span
              className={`text-xs font-medium mt-1 ${
                job.status === "queued"
                  ? "text-yellow-600"
                  : job.status === "processing"
                  ? "text-blue-600"
                  : "text-green-600"
              }`}
            >
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>

          {job.status === "completed" && (
            <button
              className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
              onClick={() => downloadFile(job.job_id)}
            >
              Download
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
</div>

  );
};
