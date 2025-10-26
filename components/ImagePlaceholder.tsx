import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  width?: number;
  height?: number;
  className?: string;
  text?: string;
  color?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  width = 800,
  height = 600,
  className,
  text = "AIR MAX",
  color = "bg-gray-200"
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg",
        color,
        className
      )}
      style={{ width, height }}
    >
      <div className="text-gray-600 font-bold text-xl text-center p-4">
        {text}
      </div>
    </div>
  );
};