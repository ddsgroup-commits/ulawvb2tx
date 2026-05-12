import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Search } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, className, id, icon, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className={cn("relative", icon && "flex items-center")}>
        {icon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={cn(
            "input",
            icon && "pl-9",
            error && "border-red-400 focus:ring-red-300",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function SearchInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("flex items-center gap-2 input cursor-text", className)}>
      <Search className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400"
        {...props}
      />
    </label>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, className, id, options, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn("input appearance-none", error && "border-red-400", className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
