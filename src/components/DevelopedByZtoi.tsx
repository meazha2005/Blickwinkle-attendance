import React from "react";

interface DevelopedByZtoiProps {
  className?: string;
  prefixClassName?: string;
}

export default function DevelopedByZtoi({
  className = "",
  prefixClassName = "text-[11px] font-bold text-slate-400 tracking-wider uppercase",
}: DevelopedByZtoiProps) {
  return (
    <span className={`inline-flex items-center justify-center gap-1.5 ${prefixClassName} ${className}`}>
      <span>Developed by</span>
      <a
        href="https://ztoitech.com/"
        target="_blank"
        rel="noopener noreferrer"
        title="Visit ZTOI TECH (ztoitech.com)"
        className="font-michroma text-[#FF4D00] hover:opacity-85 hover:underline underline-offset-2 transition-all inline-block lowercase-none"
      >
        ZTOI TECH
      </a>
    </span>
  );
}
