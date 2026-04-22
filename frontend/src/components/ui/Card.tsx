// Card.tsx
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export function Card({ children, className, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 transition-colors",
        hover && "hover:border-primary/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
