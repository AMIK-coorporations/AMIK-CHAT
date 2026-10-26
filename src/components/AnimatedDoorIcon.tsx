"use client";

import { cn } from "@/lib/utils";

type AnimatedDoorIconProps = {
  /** "in" = داخل ہونا (لاگ اِن / کھاتہ بنائیں)، "out" = باہر نکلنا (کھاتہ خروج) */
  direction: "in" | "out";
  /** true ہونے پر مکمل اینیمیشن چلتی ہے */
  active?: boolean;
  className?: string;
};

/**
 * دروازے اور چلتے ہوئے آدمی والا اینیمیٹڈ آئیکن۔
 * رنگ بٹن کے متن کا (currentColor) لیتا ہے، اس لیے بٹن کے اصل رنگ برقرار رہتے ہیں۔
 * hover پر دروازہ ہلکا کھلتا ہے؛ active پر آدمی اندر/باہر جاتا ہے۔
 */
export default function AnimatedDoorIcon({ direction, active = false, className }: AnimatedDoorIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "amik-door",
        direction === "in" ? "amik-door--in" : "amik-door--out",
        active && "amik-door--active",
        className
      )}
    >
      <svg viewBox="0 0 100 100" className="amik-door__svg">
        {/* دروازے کا فریم */}
        <path
          className="amik-door__frame"
          d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z"
        />
        {/* آدمی */}
        <g className="amik-door__figure">
          <circle cx="52.1" cy="32.4" r="6.4" />
          <path d="M50.7 62.8c-1.2 2.5-3.6 5-7.2 4-3.2-.9-4.9-3.5-4-7.8.7-3.4 3.1-13.8 4.1-15.8 1.7-3.4 1.6-4.6 7-3.7 4.3.7 4.6 2.5 4.3 5.4-.4 3.7-2.8 15.1-4.2 17.9z" />
          <g className="amik-door__arm1">
            <path d="M55.5 56.5l-6-9.5c-1-1.5-.6-3.5.9-4.4 1.5-1 3.7-1.1 4.6.4l6.1 10c1 1.5.3 3.5-1.1 4.4-1.5.9-3.5.5-4.5-.9z" />
          </g>
          <g className="amik-door__arm2">
            <path d="M34.2 43.6L45 40.3c1.7-.6 3.5.3 4 2 .6 1.7-.3 4-2 4.5l-10.8 2.8c-1.7.6-3.5-.3-4-2-.6-1.6.3-3.4 2-4z" />
          </g>
          <g className="amik-door__leg1">
            <path d="M52.1 73.2s-7-5.7-7.9-6.5c-.9-.9-1.2-3.5-.1-4.9 1.1-1.4 3.8-1.9 5.2-.9l7.9 7c1.4 1.1 1.7 3.5.7 4.9-1.1 1.4-4.4 1.5-5.8.4z" />
            <path d="M52.6 84.4l-1-12.8c-.1-1.9 1.5-3.6 3.5-3.7 2-.1 3.7 1.4 3.8 3.4l1 12.8c.1 1.9-1.5 3.6-3.5 3.7-2 0-3.7-1.5-3.8-3.4z" />
          </g>
          <g className="amik-door__leg2">
            <path d="M37.8 72.7s1.3-10.2 1.6-11.4 2.4-2.8 4.1-2.6c1.7.2 3.6 2.3 3.4 4l-1.8 11.1c-.2 1.7-1.7 3.3-3.4 3.1-1.8-.2-4.1-2.4-3.9-4.2z" />
            <path d="M29.5 82.3l9.6-10.9c1.3-1.4 3.6-1.5 5.1-.1 1.5 1.4.4 4.9-.9 6.3l-8.5 9.6c-1.3 1.4-3.6 1.5-5.1.1-1.4-1.3-1.5-3.5-.2-5z" />
          </g>
        </g>
        {/* دروازہ (کھلنے/بند ہونے والا) */}
        <g className="amik-door__panel">
          <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
          <circle cx="66" cy="50" r="3.7" className="amik-door__knob" />
        </g>
      </svg>
    </span>
  );
}
