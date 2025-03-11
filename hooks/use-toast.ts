
import { useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: 'info',
    visible: false,
  });
  
  function showToast(message: string, type: ToastType = 'info') {
    setToast({
      message,
      type,
      visible: true,
    });
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast(current => ({
        ...current,
        visible: false,
      }));
    }, 3000);
  }
  
  function hideToast() {
    setToast(current => ({
      ...current,
      visible: false,
    }));
  }
  
  return {
    toast,
    showToast,
    hideToast,
  };
}
