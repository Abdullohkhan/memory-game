import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose?: () => void;
  label: string;
  children: ReactNode;
}

/** Native <dialog>: focus trap, Esc to close and a backdrop for free. */
export function Modal({ open, onClose, label, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" aria-label={label} onCancel={(e) => { e.preventDefault(); onClose?.(); }} onClick={(e) => { if (e.target === ref.current) onClose?.(); }}>
      {open && <div className="modal-body">{children}</div>}
    </dialog>
  );
}
