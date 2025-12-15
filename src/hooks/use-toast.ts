// Simplified use-toast hook to satisfy build and provide basic feedback
import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

export const useToast = () => {
    const [toasts, setToasts] = React.useState<any[]>([])

    // Mock implementation
    const toast = ({ title, description, variant }: { title?: React.ReactNode, description?: React.ReactNode, variant?: "default" | "destructive" }) => {
        console.log(`[TOAST] ${variant || 'default'}: ${title} - ${description}`)
        // Optional: use browser alert for immediate feedback if no Toaster present
        // if (typeof window !== 'undefined') alert(`${title}\n${description}`)
    }

    return {
        toast,
        toasts,
        dismiss: (toastId?: string) => { }
    }
}
