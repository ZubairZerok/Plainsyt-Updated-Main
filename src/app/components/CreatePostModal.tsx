import { useRef, useState } from 'react';
import {
  PenLine, Plus, Upload, X, Bold, Italic, Underline as UnderlineIcon,
  Highlighter, Heading2, List, Quote, Eye
} from 'lucide-react';
import type { Article, ArticleCategory, UserProfile } from '../types';
import { Modal, CloseButton, SectionLabel, cn } from './Primitives';
import { RichArticleParagraph } from '../utils/richText';
import { uploadImage } from '../lib/media';
import { toast } from 'sonner';

const CATS: { bn: ArticleCategory; en: string; img: Article['imageType'] }[] = [
  { bn: 'শস্য ও কৃষিবিজ্ঞান', en: 'Crops & Agronomy', img: 'floating' },
  { bn: 'এগ্রি-টেক ও ড্রোন', en: 'Agri-Tech & Drones', img: 'drone' },
  { bn: 'গবেষণা সহজ ভাষায়', en: 'Research Explained', img: 'lab' },
  { bn: 'খাদ্য ও কোল্ড চেইন', en: 'Food Cold Chain', img: 'solar' },
  { bn: 'জলবায়ু ও স্থায়িত্ব', en: 'Climate & Salinity', img: 'water' },
  { bn: 'স্টার্টআপ ও উদ্ভাবন', en: 'Startups & IoT', img: 'sensor' },
  { bn: 'মৎস্য ও প্রাণিসম্পদ', en: 'Fisheries & Livestock', img: 'fisheries' },
];

export function CreatePostModal({
  open,
  onClose,
  currentUser,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onPublish: (a: Article) => void;
}) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [cat, setCat] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [journal, setJournal] = useState('');
  const [doi, setDoi] = useState('');
  const [takeaways, setTakeaways] = useState<string[]>(['']);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const ready = title.trim().length > 3 && body.trim().length > 10;

  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!currentUser?.id) {
      toast.error('ছবি আপলোড করতে অনুগ্রহ করে লগইন করুন।');
      return;
    }
    setUploading(true);
    const res = await uploadImage(file, currentUser.id);
    setUploading(false);
    if (res.ok) setCoverImageUrl(res.url);
    else toast.error(res.error);
  };

  const applyFormatting = (prefix: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) {
      setBody((prev) => `${prev}${prefix}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = body.slice(start, end);
    const before = body.slice(0, start);
    const after = body.slice(end);

    if (sel) {
      const formatted = `${prefix}${sel}${suffix}`;
      setBody(`${before}${formatted}${after}`);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      const formatted = `${prefix}${suffix}`;
      setBody(`${before}${formatted}${after}`);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    }
  };

  const publish = () => {
    if (!ready) return;
    if (!currentUser?.id) {
      toast.error('প্রতিবেদন প্রকাশ করতে অনুগ্রহ করে আগে আপনার অ্যাকাউন্টে লগইন করুন।');
      return;
    }
    const c = CATS[cat];
    const authorId = currentUser.id;
    const nowIso = new Date().toISOString();
    onPublish({
      id: `art-${crypto.randomUUID()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || body.trim().slice(0, 120) + '…',
      category: c.bn,
      categoryEn: c.en,
      imageType: c.img,
      coverImageUrl: coverImageUrl.trim() || undefined,
      authorId,
      author: {
        id: authorId,
        name: currentUser.nameBn || currentUser.name || 'গবেষক',
        designation: currentUser.role || 'লেখক',
        organization: currentUser.organization || 'Plainsyt',
        avatar: currentUser.avatar || 'PS',
      },
      publishedAt: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
      createdAt: nowIso,
      readTimeMinutes: Math.max(1, Math.round(words / 160)),
      content: body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
      takeaways: takeaways.map((t) => t.trim()).filter(Boolean),
      externalLink: externalLink.trim() || undefined,
      researchBasis:
        journal.trim() || doi.trim()
          ? {
              journalOrInst: journal.trim() || 'Institutional Research',
              doiOrSource: doi.trim() || externalLink.trim(),
              keyMetric: 'Peer Reviewed',
            }
          : undefined,
      stats: { views: 1, likes: 0, commentsCount: 0, shares: 0 },
      reactionCounts: {},
      userReaction: null,
      comments: [],
    });
    setTitle('');
    setSubtitle('');
    setBody('');
    setCoverImageUrl('');
    setExternalLink('');
    setJournal('');
    setDoi('');
    setTakeaways(['']);
    onClose();
  };

  const field =
    'w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 px-3.5 py-2.5 font-bangla text-slate-900 dark:text-white outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-canvas-card transition';

  return (
    <Modal open={open} onClose={onClose} className="max-w-[760px]" labelledBy="write-title">
      <div className="rounded-t-3xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-2xl sm:rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-6 py-4">
          <div>
            <h2 id="write-title" className="flex items-center gap-2 font-display text-[22px] font-semibold text-slate-900 dark:text-white">
              <PenLine className="size-5 text-emerald-600" />
              নতুন প্রতিবেদন লিখুন (Write Article)
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              কৃষি ও প্রযুক্তি গবেষণা নিয়ে বিস্তারিত প্রতিবেদন প্রকাশ করুন
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
          <div>
            <SectionLabel className="mb-2">বিভাগ · Section</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {CATS.map((c, i) => (
                <button
                  key={c.bn}
                  type="button"
                  onClick={() => setCat(i)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                    cat === i
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100',
                  )}
                >
                  {c.bn}
                </button>
              ))}
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="শিরোনাম — স্পষ্ট, তথ্যনির্ভর *"
            className={cn(
              field,
              'rounded-none border-0 border-b border-pine-900/25 bg-transparent px-0 font-display text-[25px] font-bold',
            )}
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="উপশিরোনাম (ঐচ্ছিক)"
            className={cn(field, 'text-[15px]')}
          />

          {/* Cover Photo Upload or URL */}
          <div>
            <SectionLabel className="mb-1">Cover Photo (Upload or Image URL)</SectionLabel>
            <div className="flex gap-2">
              <input
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder={uploading ? 'আপলোড হচ্ছে…' : 'https://...'}
                className={cn(field, 'flex-1 font-sans text-[13.5px]')}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-pine-900 bg-canvas-subtle px-3 text-[12.5px] font-semibold text-pine-900 hover:bg-pine-100"
              >
                <Upload className="size-4" /> Upload Photo
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
            </div>
            {coverImageUrl && (
              <div className="relative mt-2">
                <img src={coverImageUrl} alt="Cover preview" className="h-36 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>

          {/* Formatting Toolbar for Rich Article Writing */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 dark:border-white/10 pb-2">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyFormatting('**', '**')}
                  title="বোল্ড (Bold)"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                >
                  <Bold className="size-3.5" />
                  <span className="hidden sm:inline">বোল্ড</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('*', '*')}
                  title="ইটালিক (Italic)"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs italic transition flex items-center gap-1"
                >
                  <Italic className="size-3.5" />
                  <span className="hidden sm:inline">ইটালিক</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('<u>', '</u>')}
                  title="আন্ডারলাইন (Underline)"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs underline transition flex items-center gap-1"
                >
                  <UnderlineIcon className="size-3.5" />
                  <span className="hidden sm:inline">আন্ডারলাইন</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('<mark>', '</mark>')}
                  title="হাইলাইট লাইন বা শব্দ (Highlight)"
                  className="p-1.5 rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-medium transition flex items-center gap-1"
                >
                  <Highlighter className="size-3.5 text-amber-600 dark:text-amber-400" />
                  <span>হাইলাইট</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('## ')}
                  title="উপশিরোনাম (Heading)"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                >
                  <Heading2 className="size-3.5" />
                  <span className="hidden sm:inline">শিরোনাম</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('• ')}
                  title="বুলেট তালিকা (Bullet List)"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs transition flex items-center gap-1"
                >
                  <List className="size-3.5" />
                  <span className="hidden sm:inline">বুলেট</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('> ')}
                  title="উদ্ধৃতি (Quote)"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs transition flex items-center gap-1"
                >
                  <Quote className="size-3.5" />
                  <span className="hidden sm:inline">উদ্ধৃতি</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5',
                  showPreview
                    ? 'bg-emerald-700 text-white'
                    : 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                )}
              >
                <Eye className="size-3.5" />
                <span>{showPreview ? 'এডিটর' : 'প্রিভিউ'}</span>
              </button>
            </div>

            {showPreview ? (
              <div className="min-h-[160px] p-4 rounded-xl border border-emerald-500/30 bg-white dark:bg-white/5 space-y-3 font-bangla">
                <span className="text-[11px] font-bold text-emerald-600 block uppercase tracking-wider">রেন্ডার প্রিভিউ:</span>
                {body.trim() ? (
                  body.split(/\n\s*\n/).map((p, i) => (
                    <RichArticleParagraph key={i} text={p} isFirst={i === 0} />
                  ))
                ) : (
                  <p className="text-slate-400 text-sm italic">কোনো লেখা নেই...</p>
                )}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder="মূল লেখা… অনুচ্ছেদ আলাদা করতে একটি ফাঁকা লাইন দিন। উপরে টুলবার দিয়ে বোল্ড, ইটালিক, আন্ডারলাইন বা লাইন হাইলাইট করতে পারবেন। *"
                className={cn(field, 'resize-y text-[15.5px] leading-relaxed font-sans')}
              />
            )}
          </div>

          {/* External Link & Research Citation (Clean 2-column without key metric badge) */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <SectionLabel className="mb-1">Journal / Institution</SectionLabel>
              <input
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="BRRI / BAU / Springer"
                className={cn(field, 'font-sans text-[13px]')}
              />
            </div>
            <div>
              <SectionLabel className="mb-1">DOI / Reference Link</SectionLabel>
              <input
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="doi:10.1007/... or URL"
                className={cn(field, 'font-mono text-[12.5px]')}
              />
            </div>
          </div>

          <div>
            <SectionLabel className="mb-1">External Reference URL (Optional)</SectionLabel>
            <input
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://..."
              className={cn(field, 'font-mono text-[12.5px]')}
            />
          </div>

          <div>
            <SectionLabel className="mb-1.5">মূল কথা · Takeaways</SectionLabel>
            <div className="space-y-1.5">
              {takeaways.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 font-mono text-[11px] text-accent-fg">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <input
                    value={t}
                    onChange={(e) =>
                      setTakeaways((s) => s.map((x, j) => (j === i ? e.target.value : x)))
                    }
                    placeholder={`মূল পয়েন্ট ${i + 1}`}
                    className={cn(field, 'text-[14px]')}
                  />
                  {takeaways.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTakeaways((s) => s.filter((_, j) => j !== i))}
                      className="mt-1 text-slate-400 hover:text-rose-500"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              {takeaways.length < 5 && (
                <button
                  type="button"
                  onClick={() => setTakeaways((s) => [...s, ''])}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-pine-700 hover:underline"
                >
                  <Plus className="size-3.5" /> আরও পয়েন্ট যোগ করুন
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 px-6 py-4">
          <span className="font-mono text-[12px] text-slate-500">
            {words} শব্দ · ~{Math.max(1, Math.round(words / 160))} মিনিট পাঠ
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-bangla text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={publish}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 font-bangla text-[13px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              <PenLine className="size-4" />
              প্রকাশ করুন
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
