// src/pages/FormDetail.tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import FormDetailDialog from "../FormDetail";
const FormDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [open, setOpen] = useState(true);

  return (
    <FormDetailDialog
      id={id ? Number(id) : null}
      open={open}
      onOpenChange={setOpen}
    />
  );
};

export default FormDetail;
