
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIconProps {
  className?: string;
  size?: number; 
}

export function LoadingIcon({ className, size = 5 }: LoadingIconProps) {
  return <Loader2 className={cn(`h-${size} w-${size} animate-spin`, className)} />;
}
