import type { SVGProps } from "react";

export function Spokes({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      className={["spokes", className].filter(Boolean).join(" ")}
      fill="none"
      viewBox="0 0 24 24"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <path
          d="M12 3v3"
          key={index}
          opacity={(index + 1) / 12}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          transform={`rotate(${index * 30} 12 12)`}
        />
      ))}
    </svg>
  );
}
