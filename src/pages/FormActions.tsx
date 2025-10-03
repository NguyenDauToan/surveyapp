import React, { useState } from "react";
import axios from "axios";

interface FormActionsProps {
  formId: number;
  token: string;
  initialStatus: "active" | "archived" | "deleted";
  onStatusChange?: (newStatus: string) => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  formId,
  token,
  initialStatus,
  onStatusChange,
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "delete" | "archive" | "restore") => {
    if (!confirm(`Bạn có chắc chắn muốn ${action}?`)) return;

    let url = "";
    if (action === "delete") url = `/api/forms/${formId}/delete`;
    else if (action === "archive") url = `/api/forms/${formId}/archive`;
    else if (action === "restore") url = `/api/forms/${formId}/restore`;

    setLoading(true);
    try {
      const res = await axios.put(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newStatus =
        action === "delete" ? "deleted" : action === "archive" ? "archived" : "active";

      setStatus(newStatus);
      onStatusChange?.(newStatus);
      alert(res.data.message || `${action} thành công`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || `${action} thất bại`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {status === "active" && (
        <>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            disabled={loading}
            onClick={() => handleAction("delete")}
          >
            Delete
          </button>
          <button
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            disabled={loading}
            onClick={() => handleAction("archive")}
          >
            Archive
          </button>
        </>
      )}

      {(status === "archived" || status === "deleted") && (
        <button
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          disabled={loading}
          onClick={() => handleAction("restore")}
        >
          Restore
        </button>
      )}
    </div>
  );
};
