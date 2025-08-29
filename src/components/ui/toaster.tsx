"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            className="max-w-[90vw] w-auto min-w-[280px] px-4 py-3 rounded-full shadow-lg bg-black/90 text-white border-0 text-center"
            {...props}
          >
            <div className="flex flex-col items-center gap-1 text-center">
              {title && (
                <ToastTitle className="text-[14px] font-medium leading-5 text-center w-full">
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-[13px] leading-4 opacity-90 text-center w-full">
                  {description}
                </ToastDescription>
              )}
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
