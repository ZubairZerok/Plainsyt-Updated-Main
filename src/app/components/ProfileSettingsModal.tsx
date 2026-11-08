import { useEffect, useRef, useState } from 'react';
import { Camera, Crop, Palette, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';
import { COVER_GRADIENT_PRESETS } from '../utils/pureLogic';
import { Avatar, CloseButton, Modal, SectionLabel, cn } from './Primitives';
import { AvatarCropModal } from './AvatarCropModal';
import { dataUrlToBlob, uploadImage } from '../lib/media';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
}

export function ProfileSettingsModal({
  open,
  onClose,
  currentUser,
  onSaveProfile,
}: Props) {
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [website, setWebsite] = useState('');
  const [avatar, setAvatar] = useState('');
  const [coverGradient, setCoverGradient] = useState(COVER_GRADIENT_PRESETS[0].css);
  const [customStop1, setCustomStop1] = useState('#04301f');
  const [customStop2, setCustomStop2] = useState('#38b17e');
  const [customAngle, setCustomAngle] = useState(135);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !currentUser) return;
    setName(currentUser.name);
    setNameBn(currentUser.nameBn);
    setHandle(currentUser.handle);
    setRole(currentUser.role);
    setOrganization(currentUser.organization);
    setLocation(currentUser.location);
    setBio(currentUser.bio);
    setFocusArea(currentUser.focusArea);
    setWebsite(currentUser.website ?? '');
    setAvatar(currentUser.avatar);
    setCoverGradient(currentUser.coverGradient || COVER_GRADIENT_PRESETS[0].css);
  }, [open, currentUser]);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(String(reader.result));
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyCustomGradient = (c1: string, c2: string, deg: number) => {
    setCustomStop1(c1);
    setCustomStop2(c2);
    setCustomAngle(deg);
    setCoverGradient(`linear-gradient(${deg}deg, ${c1} 0%, ${c2} 100%)`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !name.trim()) return;
    const cleanHandle =
      handle.trim().replace(/^@/, '') ||
      name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.') + '.' + (crypto.getRandomValues(new Uint32Array(1))[0] % 90 + 10);
    const initials = name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const profile: UserProfile = {
      ...currentUser,
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      handle: cleanHandle,
      role: role.trim(),
      organization: organization.trim(),
      location: location.trim(),
      bio: bio.trim(),
      focusArea: focusArea.trim(),
      website: website.trim(),
      avatar: avatar.trim() || initials || 'PS',
      coverGradient,
    };

    onSaveProfile(profile);
    onClose();
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200/90 dark:border-white/10 bg-canvas-card px-3.5 py-2.5 text-[14px] text-slate-900 dark:text-white outline-none placeholder:text-slate-400 focus:border-[#03EF62] focus:ring-2 focus:ring-[#03EF62]/20 transition';

  if (!currentUser) {
    return (
      <Modal open={open} onClose={onClose} className="max-w-[480px]" labelledBy="profile-settings-title">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas shadow-2xl p-6 text-center">
          <h2 id="profile-settings-title" className="font-display text-[20px] font-bold text-slate-900 dark:text-white mb-2">
            প্রোফাইল সেটিংস
          </h2>
          <p className="font-bangla text-sm text-slate-600 dark:text-slate-300 mb-5">
            প্রোফাইল সেটিংস পরিবর্তন করতে অনুগ্রহ করে আগে আপনার অ্যাকাউন্টে লগইন করুন।
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#03EF62] px-6 py-2 text-sm font-bold text-[#061621] shadow hover:bg-[#02d955]"
          >
            বন্ধ করুন
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-[680px]" labelledBy="profile-settings-title" centerOnMobile>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-canvas-card px-5 py-4">
          <div>
            <h2 id="profile-settings-title" className="font-display text-[21px] font-semibold text-pine-900">
              Profile &amp; Appearance Settings
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              আপনার ব্যক্তিগত তথ্য ও প্রোফাইল কাস্টমাইজ করুন
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
          <form onSubmit={handleSubmit} className="max-h-[76vh] space-y-5 overflow-y-auto p-5">
            {/* Live Cover Gradient + Avatar Preview */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-sm">
              <div
                style={{ background: coverGradient }}
                className="relative h-28 w-full transition-all duration-300"
              >
                <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 font-mono text-[11px] text-white backdrop-blur-sm">
                  Live Cover Preview
                </span>
              </div>
              <div className="-mt-11 flex flex-wrap items-end justify-between gap-3 px-4 pb-4">
                <div className="flex items-end gap-3">
                  <div className="relative">
                    <Avatar
                      src={avatar || (name ? name.slice(0, 2).toUpperCase() : 'PS')}
                      name={name}
                      size="size-20"
                      className="rounded-full border-4 border-canvas-card shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      aria-label="Upload profile picture"
                      className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white dark:border-[#0b1e15] bg-[#03EF62] text-[#061621] shadow hover:bg-[#02d955] transition active:scale-95"
                    >
                      <Camera className="size-4" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="pb-1">
                    <p className="font-display text-[19px] font-bold leading-tight text-pine-950">
                      {name || 'Your Name'}
                    </p>
                    <p className="font-mono text-[11px] text-accent-fg">
                      {role || 'Role / Designation'} {organization ? `· ${organization}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setCropImageSrc(avatar);
                        setCropOpen(true);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition shadow-xs"
                    >
                      <Crop className="size-3.5 text-emerald-600 dark:text-[#03EF62]" /> ক্রপ ও জুম
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200/90 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition shadow-xs"
                  >
                    <Camera className="size-3.5 text-emerald-600 dark:text-[#03EF62]" /> ছবি আপলোড
                  </button>
                </div>
              </div>
            </div>

            {/* PFP URL input */}
            <div>
              <SectionLabel className="mb-1.5">Profile Picture URL (or upload above)</SectionLabel>
              <input
                value={avatar.startsWith('data:') ? '' : avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder={avatar.startsWith('data:') ? 'Custom uploaded photo active (paste URL to override)' : 'https://...'}
                className={inputCls}
              />
            </div>

            {/* Cover Background Gradient Picker */}
            <div className="rounded-xl border border-canvas-border bg-canvas-card p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <SectionLabel className="flex items-center gap-1.5">
                  <Palette className="size-3.5" /> Cover Background Gradient Color
                </SectionLabel>
                <span className="font-mono text-[11px] text-accent-fg">12 Presets + Custom Builder</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {COVER_GRADIENT_PRESETS.map((g) => {
                  const selected = coverGradient === g.css;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setCoverGradient(g.css)}
                      className={cn(
                        'group relative h-12 overflow-hidden rounded-lg border text-left transition',
                        selected ? 'border-pine-900 ring-2 ring-pine-600' : 'border-pine-900/20',
                      )}
                      style={{ background: g.css }}
                    >
                      <span className="absolute inset-x-1.5 bottom-1 truncate rounded bg-black/45 px-1 py-0.5 font-mono text-[11px] text-white backdrop-blur-[1px]">
                        {g.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom 2-stop color picker */}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-canvas-border pt-3">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-pine-900">
                  <Sparkles className="size-3.5 text-accent-fg" /> Custom Gradient:
                </span>
                <label className="inline-flex items-center gap-1.5 text-[12px] text-pine-900">
                  Start
                  <input
                    type="color"
                    value={customStop1}
                    onChange={(e) => applyCustomGradient(e.target.value, customStop2, customAngle)}
                    className="size-7 cursor-pointer rounded border border-pine-900/30 bg-transparent"
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 text-[12px] text-pine-900">
                  End
                  <input
                    type="color"
                    value={customStop2}
                    onChange={(e) => applyCustomGradient(customStop1, e.target.value, customAngle)}
                    className="size-7 cursor-pointer rounded border border-pine-900/30 bg-transparent"
                  />
                </label>
                <select
                  value={customAngle}
                  onChange={(e) => applyCustomGradient(customStop1, customStop2, Number(e.target.value))}
                  className="rounded-md border border-pine-900/25 bg-canvas px-2 py-1 font-mono text-[11px] text-pine-900"
                >
                  <option value={135}>135° Diagonal</option>
                  <option value={90}>90° Horizontal</option>
                  <option value={180}>180° Vertical</option>
                  <option value={45}>45° Tilt</option>
                </select>
              </div>
            </div>

            {/* Identity Fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <SectionLabel className="mb-1">Full Name (English) *</SectionLabel>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rafiq Ahmed"
                  className={inputCls}
                />
              </div>
              <div>
                <SectionLabel className="mb-1">নাম (বাংলায়)</SectionLabel>
                <input
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: হাসান জুবায়ের"
                  className={cn(inputCls, 'font-bangla')}
                />
              </div>
              <div>
                <SectionLabel className="mb-1">Designation / Role</SectionLabel>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Chief Scientific Officer"
                  className={cn(inputCls, 'font-bangla')}
                />
              </div>
              <div>
                <SectionLabel className="mb-1">Organization / Institution</SectionLabel>
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. BRRI · BAU · BARI · SAU"
                  className={inputCls}
                />
              </div>
              <div>
                <SectionLabel className="mb-1">Username Handle</SectionLabel>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="rafiq.ahmed"
                  className={cn(inputCls, 'font-mono')}
                />
              </div>
              <div>
                <SectionLabel className="mb-1">Research Focus Area</SectionLabel>
                <input
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  placeholder="জিংকসমৃদ্ধ ধান ও জলবায়ু সহনশীল কৃষি"
                  className={cn(inputCls, 'font-bangla')}
                />
              </div>
              <div>
                <SectionLabel className="mb-1">Website / ORCID / Portfolio Link</SectionLabel>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://orcid.org/..."
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <SectionLabel className="mb-1">Bio &amp; Field Summary</SectionLabel>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="আপনার গবেষণা, মাঠ পর্যায়ের কাজ ও অভিজ্ঞতা সংক্ষেপে লিখুন…"
                className={cn(inputCls, 'font-bangla resize-y')}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-white/10 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-full border border-slate-200 dark:border-white/10 px-5 text-[13.5px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="h-10 rounded-full bg-[#03EF62] px-6 text-[14px] font-bold text-[#061621] shadow-sm hover:bg-[#02d955] active:scale-95 transition disabled:opacity-40"
              >
                Save Profile
              </button>
            </div>
          </form>

        {cropImageSrc && (
          <AvatarCropModal
            open={cropOpen}
            imageSrc={cropImageSrc}
            onClose={() => setCropOpen(false)}
            onApply={async (croppedUrl) => {
              setCropOpen(false);
              if (!currentUser) return;
              const res = await uploadImage(await dataUrlToBlob(croppedUrl), currentUser.id, 512);
              if (res.ok) setAvatar(res.url);
              else toast.error(res.error);
            }}
          />
        )}
      </div>
    </Modal>
  );
}
