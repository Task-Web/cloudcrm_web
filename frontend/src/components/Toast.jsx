import { useEffect } from "react";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";

export const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} color="#04844B" />,
    error: <XCircle size={20} color="#EA001E" />,
    warning: <AlertCircle size={20} color="#fe9339" />,
    info: <Info size={20} color="#0176D3" />,
  };

  return (
    <div className={`toast toast-${type}`}>
      {icons[type]}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ padding: 4 }}>
        <X size={16} />
      </button>
    </div>
  );
};
