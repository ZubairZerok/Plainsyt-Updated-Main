import { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

interface DeleteCommentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isReply?: boolean;
}

export function DeleteCommentAlertModal({
  isOpen,
  onClose,
  onConfirm,
  isReply = false,
}: DeleteCommentAlertModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="মন্তব্য মুছে ফেলার নিশ্চিতকরণ"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[360px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071f2d] p-5 shadow-2xl transition-all scale-100 animate-in zoom-in-95 duration-150 text-center font-bangla"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          aria-label="বন্ধ করুন"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto mb-3.5 flex size-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 ring-8 ring-rose-50/50 dark:ring-rose-950/20">
          <Trash2 className="size-5" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
          {isReply ? 'রিপ্লাইটি মুছে ফেলতে চান?' : 'মন্তব্যটি মুছে ফেলতে চান?'}
        </h3>
        <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
          এই {isReply ? 'রিপ্লাইটি' : 'মন্তব্যটি'} স্থায়ীভাবে মুছে ফেলা হবে এবং এটি আর ফিরিয়ে আনা যাবে না।
        </p>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition active:scale-95 cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            মুছে ফেলুন
          </button>
        </div>
      </div>
    </div>
  );
}
