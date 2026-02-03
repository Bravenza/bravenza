import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface MobileSelectOption {
  value: string;
  label: string;
}

interface MobileSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MobileSelect = React.forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({ value, onValueChange, options, placeholder, disabled, className }, ref) => {
    return (
      <div className="relative z-10">
        <select
          ref={ref}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full appearance-none items-center rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&>option]:bg-background [&>option]:text-foreground",
            !value && "text-muted-foreground",
            className
          )}
          style={{ 
            WebkitAppearance: 'none',
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          {placeholder && (
            <option value="" disabled className="bg-background text-muted-foreground">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-background text-foreground"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }
);
MobileSelect.displayName = "MobileSelect";
