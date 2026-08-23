import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  label,
  helperText,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(!open);
    } else if (e.key === "ArrowDown" && open) {
      e.preventDefault();
      const currentIndex = options.findIndex((o) => o.value === value);
      const next = options[(currentIndex + 1) % options.length];
      onChange(next.value);
    } else if (e.key === "ArrowUp" && open) {
      e.preventDefault();
      const currentIndex = options.findIndex((o) => o.value === value);
      const prev = options[(currentIndex - 1 + options.length) % options.length];
      onChange(prev.value);
    }
  }

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="label mb-2 block">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-[10px] border border-line bg-surface-2 px-4 py-3.5 text-left text-sm text-ink transition-colors hover:border-line-bright focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal-dim"
      >
        {selected?.icon && (
          <span className="text-base">{selected.icon}</span>
        )}
        <span className="flex-1">{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          className={`text-ink-ghost transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-line-bright bg-surface-2 shadow-lg backdrop-blur-sm"
          >
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  option.value === value
                    ? "bg-signal/10 text-signal"
                    : "text-ink hover:bg-surface-3"
                }`}
              >
                {option.icon && (
                  <span className="text-base">{option.icon}</span>
                )}
                <span className="flex-1">{option.label}</span>
                {option.value === value && (
                  <Check size={14} className="text-signal" />
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {helperText && (
        <p className="mt-1.5 font-mono text-[0.65rem] text-ink-ghost">
          {helperText}
        </p>
      )}
    </div>
  );
}
