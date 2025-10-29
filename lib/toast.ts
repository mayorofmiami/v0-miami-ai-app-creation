import { toast as sonnerToast } from "sonner"

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      className: "bg-green-500/10 border-green-500/20 text-green-500",
    })
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      className: "bg-red-500/10 border-red-500/20 text-red-500",
    })
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      className: "bg-miami-blue/10 border-miami-blue/20 text-miami-blue",
    })
  },
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      className: "bg-miami-pink/10 border-miami-pink/20 text-miami-pink",
    })
  },
  dismiss: (id: string | number) => {
    sonnerToast.dismiss(id)
  },
}
