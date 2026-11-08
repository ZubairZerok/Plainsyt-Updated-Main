import { useState } from 'react';
import { CalendarDays, CheckCircle2, MapPin, Ticket, User, Mail, Phone, Building2, X } from 'lucide-react';
import type { UpcomingEvent, UserProfile } from '../types';
import { cn, Modal } from './Primitives';

interface Props {
  open: boolean;
  event: UpcomingEvent | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onConfirmRegistration: (eventId: string, registrationData: {
    name: string;
    email: string;
    phone: string;
    organization: string;
    passType: 'in-person' | 'virtual';
    note?: string;
  }) => Promise<boolean>;
}

export function EventRegistrationModal({
  open,
  event,
  currentUser,
  onClose,
  onConfirmRegistration,
}: Props) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState(currentUser?.organization || '');
  const [passType, setPassType] = useState<'in-person' | 'virtual'>('in-person');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  if (!open || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) return;

    const regId = `REG-${crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    const saved = await onConfirmRegistration(event.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      organization: organization.trim(),
      passType,
      note: note.trim(),
    });
    if (!saved) return;
    setTicketId(regId);
    setSubmitted(true);
  };

  const handleFinish = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal open onClose={onClose} className="max-w-lg" labelledBy="event-registration-title" centerOnMobile>
      <div className="relative w-full overflow-hidden rounded-2xl border border-canvas-border bg-canvas shadow-tactile-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#061621]/15 bg-[#03EF62] px-5 py-4 text-[#061621]">
          <div className="flex items-center gap-2.5">
            <Ticket className="size-5" />
            <div>
              <h2 id="event-registration-title" className="font-bangla text-[18px] font-bold leading-tight">
                ইভেন্ট রেজিস্ট্রেশন · Event Registration
              </h2>
              <p className="font-mono text-[11px] opacity-80">
                {event.dateMonth} {event.dateDay} · {event.location}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-lg bg-[#061621]/10 text-[#061621] hover:bg-[#061621]/20"
          >
            <X className="size-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto size-14 text-[#03EF62]" />
            <h3 className="mt-3 font-bangla text-[20px] font-bold text-pine-950">
              রেজিস্ট্রেশন সফল হয়েছে!
            </h3>
            <p className="mt-1 font-bangla text-[14px] text-pine-900/70">
              আপনার পাস ও টিকিট ব্যাকএন্ডে সংরক্ষিত হয়েছে।
            </p>

            <div className="mt-4 rounded-xl border border-dashed border-[#061621]/30 bg-pine-50 p-4 font-mono text-left">
              <div className="flex justify-between text-[11.5px] text-accent-fg">
                <span>TICKET ID</span>
                <span className="font-bold text-pine-950">#{ticketId}</span>
              </div>
              <p className="mt-1 font-bangla text-[15px] font-semibold text-pine-950">
                {event.title}
              </p>
              <div className="mt-2 text-[12px] text-pine-900/80">
                <p>👤 {name} ({organization || 'Participant'})</p>
                <p>📍 {event.location} ({passType === 'in-person' ? 'সরাসরি ভেন্যুতে' : 'ভার্চুয়াল লাইভ'})</p>
                <p>📞 {phone}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="mt-5 w-full rounded-xl border border-[#061621] bg-[#03EF62] py-2.5 font-bangla text-[14px] font-bold text-[#061621] shadow-tactile-xs hover:opacity-95"
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5 max-h-[80vh] overflow-y-auto">
            <div className="rounded-xl border border-canvas-border bg-canvas-subtle p-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent-fg">
                Selected Event
              </span>
              <p className="mt-0.5 font-bangla text-[15px] font-bold text-pine-950">
                {event.title}
              </p>
              <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-pine-700">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> {event.dateMonth} {event.dateDay}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {event.location}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bangla text-[13px] font-semibold text-pine-900">
                আপনার পুরো নাম *
              </label>
              <div className="flex items-center rounded-xl border border-pine-900/20 bg-canvas-card px-3 focus-within:border-[#03EF62]">
                <User className="size-4 text-accent-fg" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: হাসান জুবায়ের"
                  className="h-10 flex-1 bg-transparent px-2 font-bangla text-[14px] text-pine-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bangla text-[13px] font-semibold text-pine-900">
                  মোবাইল নম্বর *
                </label>
                <div className="flex items-center rounded-xl border border-pine-900/20 bg-canvas-card px-3 focus-within:border-[#03EF62]">
                  <Phone className="size-4 text-accent-fg" />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="h-10 flex-1 bg-transparent px-2 font-mono text-[13px] text-pine-900 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-bangla text-[13px] font-semibold text-pine-900">
                  ইমেইল অ্যাড্রেস *
                </label>
                <div className="flex items-center rounded-xl border border-pine-900/20 bg-canvas-card px-3 focus-within:border-[#03EF62]">
                  <Mail className="size-4 text-accent-fg" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="h-10 flex-1 bg-transparent px-2 font-mono text-[13px] text-pine-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bangla text-[13px] font-semibold text-pine-900">
                প্রতিষ্ঠান / বিশ্ববিদ্যালয় (Institution)
              </label>
              <div className="flex items-center rounded-xl border border-pine-900/20 bg-canvas-card px-3 focus-within:border-[#03EF62]">
                <Building2 className="size-4 text-accent-fg" />
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="যেমন: BAU / BARI / উদ্যোক্তা"
                  className="h-10 flex-1 bg-transparent px-2 font-bangla text-[14px] text-pine-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-bangla text-[13px] font-semibold text-pine-900">
                অংশগ্রহণের মাধ্যম · Attendance Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPassType('in-person')}
                  className={cn(
                    'rounded-xl border p-2.5 text-center font-bangla text-[13px] font-medium transition',
                    passType === 'in-person'
                      ? 'border-[#061621] bg-[#03EF62] text-[#061621] font-bold shadow-tactile-xs'
                      : 'border-canvas-border bg-canvas-card text-pine-900 hover:bg-canvas-subtle',
                  )}
                >
                  সরাসরি ভেন্যুতে
                </button>
                <button
                  type="button"
                  onClick={() => setPassType('virtual')}
                  className={cn(
                    'rounded-xl border p-2.5 text-center font-bangla text-[13px] font-medium transition',
                    passType === 'virtual'
                      ? 'border-[#061621] bg-[#03EF62] text-[#061621] font-bold shadow-tactile-xs'
                      : 'border-canvas-border bg-canvas-card text-pine-900 hover:bg-canvas-subtle',
                  )}
                >
                  অনলাইন লাইভ স্ট্রিম
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bangla text-[13px] font-semibold text-pine-900">
                আয়োজকদের জন্য কোনো প্রশ্ন বা বার্তা (ঐচ্ছিক)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="আপনার মন্তব্য লিখুন…"
                className="w-full rounded-xl border border-pine-900/20 bg-canvas-card p-3 font-bangla text-[13.5px] text-pine-900 outline-none focus:border-[#03EF62]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-canvas-border">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl px-4 font-bangla text-[13px] font-medium text-pine-900/70 hover:bg-canvas-subtle"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl border border-[#061621] bg-[#03EF62] px-5 font-bangla text-[14px] font-bold text-[#061621] shadow-tactile-xs hover:opacity-95"
              >
                রেজিস্ট্রেশন নিশ্চিত করুন
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
