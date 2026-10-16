import { useEffect, useRef } from 'react';
export default function ConfirmDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="confirm-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-line bg-surface p-7 text-ink shadow-card backdrop:bg-ink/30 backdrop:backdrop-blur-sm"><h2 id="confirm-title">Clear your ingredient swaps?</h2><p className="mt-3 text-muted">This removes all ingredients from your substitution list. You can add new ones any time.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button className="btn-secondary" autoFocus onClick={onClose}>Keep ingredients</button><button className="btn" onClick={onConfirm}>Clear list</button></div></dialog>;
}
