import { toast as sonnerToast, type ExternalToast } from "sonner"

export const toast = {
  success: (message: string, options?: ExternalToast) => {
    sonnerToast.success(message, {
      ...options,
      className: "bg-green-500/10 border-green-500/20 text-green-500",
    })
  },
  error: (message: string, options?: ExternalToast) => {
    sonnerToast.error(message, {
      ...options,
      className: "bg-red-500/10 border-red-500/20 text-red-500",
    })
  },
  info: (message: string, options?: ExternalToast) => {
    sonnerToast.info(message, {
      ...options,
      className: "bg-miami-blue/10 border-miami-blue/20 text-miami-blue",
    })
  },
  loading: (message: string, options?: ExternalToast) => {
    return sonnerToast.loading(message, {
      ...options,
      className: "bg-miami-pink/10 border-miami-pink/20 text-miami-pink",
    })
  },
  dismiss: (id: string | number) => {
    sonnerToast.dismiss(id)
  },
}
