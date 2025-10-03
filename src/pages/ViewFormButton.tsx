import { Button } from "@/components/ui/button";

interface ViewFormButtonProps {
  publicLink: string;
}

export default function ViewFormButton({ publicLink }: ViewFormButtonProps) {
  return (
    <Button
      onClick={() => window.open(publicLink, "_blank")}
      className="bg-green-600 text-white ml-2"
    >
      Xem khảo sát
    </Button>
  );
}
