import { useRef, useState } from 'react';
import {
  Check, Copy, Minus, Plus, Printer, ShieldCheck, ShoppingBag, Trash2, Upload, ArrowRight, ArrowLeft, X,
} from 'lucide-react';
import type { BkashOrder, BkashOrderItem, CartItem, StoreProduct, UserProfile } from '../types';
import { BKASH_RECEIVER_NUMBER } from '../lib/supabase';
import { toBengaliNumerals } from '../utils/pureLogic';
import { SectionLabel, cn } from './Primitives';

export function CreateProductModal({
  open,
  onClose,
  currentUser,
  onCreateProduct,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onCreateProduct: (product: StoreProduct) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('পিস');
  const [tag, setTag] = useState('Agri-Tech');
  const [seller, setSeller] = useState(currentUser?.organization || currentUser?.name || '');
  const [stock, setStock] = useState('25');
  const [image, setImage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(price);
    if (!name.trim() || isNaN(numericPrice) || numericPrice <= 0) return;
    if (!currentUser?.id) {
      alert('পণ্য যোগ করতে অনুগ্রহ করে আগে লগইন করুন।');
      return;
    }
    const product: StoreProduct = {
      id: `prod-${Date.now().toString(36)}`,
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      unit: unit.trim() || 'পিস',
      tag: tag.trim() || 'Agri-Tech',
      image: image.trim(),
      sellerId: currentUser.id,
      seller: seller.trim() || currentUser.name || 'যাচাইকৃত বিক্রেতা',
      stock: Math.max(1, Number(stock) || 10),
      createdAt: new Date().toISOString(),
    };
    onCreateProduct(product);
    setName('');
    setDescription('');
    setPrice('');
    setImage('');
    onClose();
  };

  const inputCls =
    'w-full rounded-xl border border-pine-900/25 bg-canvas-card px-3 py-2 text-[14px] text-pine-900 outline-none placeholder:text-pine-900/40 focus:border-[#03EF62]';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#061621] bg-canvas shadow-tactile-lg z-10">
        <div className="flex items-center justify-between border-b border-[#061621]/15 bg-[#03EF62] px-5 py-3.5 text-[#061621]">
          <h2 className="font-bangla text-[18px] font-bold">
            নতুন পণ্য যোগ করুন · Add Product
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg bg-[#061621]/10 text-[#061621] hover:bg-[#061621]/20"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 p-5 max-h-[80vh] overflow-y-auto">
          <div>
            <SectionLabel className="mb-1">Product Title *</SectionLabel>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মাটির pH ও আর্দ্রতা মিটার / ব্রি ধান১০২ বীজ"
              className={cn(inputCls, 'font-bangla')}
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <SectionLabel className="mb-1">Price (BDT ৳) *</SectionLabel>
              <input
                required
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1450"
                className={inputCls}
              />
            </div>
            <div>
              <SectionLabel className="mb-1">Unit</SectionLabel>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="পিস / কেজি"
                className={cn(inputCls, 'font-bangla')}
              />
            </div>
            <div>
              <SectionLabel className="mb-1">Stock</SectionLabel>
              <input
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="25"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <SectionLabel className="mb-1">Product Image</SectionLabel>
            <div className="flex items-center gap-2">
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... অথবা ছবি আপলোড করুন"
                className={cn(inputCls, 'flex-1 text-[13px]')}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 items-center gap-1 rounded-xl border border-pine-900/30 bg-canvas-subtle px-3 text-[12.5px] font-semibold text-pine-900 hover:border-pine-900"
              >
                <Upload className="size-3.5" /> File
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>

          <div>
            <SectionLabel className="mb-1">Description</SectionLabel>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="পণ্যের বিবরণ ও ব্যবহারবিধি…"
              className={cn(inputCls, 'font-bangla')}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-canvas-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl px-4 text-[13px] font-semibold text-pine-900/70 hover:bg-canvas-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl border border-[#061621] bg-[#03EF62] px-5 text-[13.5px] font-bold text-[#061621] shadow-tactile-xs hover:opacity-95"
            >
              পণ্য প্রকাশ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CheckoutProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: StoreProduct[];
  currentUser: UserProfile | null;
  orders: BkashOrder[];
  onUpdateQty: (productId: string, qty: number) => void;
  onClearCart: () => void;
  onCompleteOrder: (order: BkashOrder) => void;
}

export function BkashCheckoutModal({
  open,
  onClose,
  cart,
  products,
  currentUser,
  orders,
  onUpdateQty,
  onCompleteOrder,
}: CheckoutProps) {
  const [step, setStep] = useState<'cart' | 'bkash' | 'receipt' | 'history'>('cart');
  const [buyerName, setBuyerName] = useState(currentUser?.name || '');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [notes, setNotes] = useState('');

  // bKash payment fields
  const [senderBkash, setSenderBkash] = useState('');
  const [trxId, setTrxId] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [completedOrder, setCompletedOrder] = useState<BkashOrder | null>(null);
  const [formError, setFormError] = useState('');
  const screenRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const detailedItems: BkashOrderItem[] = cart
    .map((c) => {
      const p = products.find((x) => x.id === c.productId);
      if (!p) return null;
      return {
        productId: p.id,
        name: p.name,
        unit: p.unit,
        unitPrice: p.price,
        quantity: c.quantity,
        lineTotal: p.price * c.quantity,
        image: p.image,
      };
    })
    .filter((x): x is BkashOrderItem => x !== null);

  const subtotal = detailedItems.reduce((s, i) => s + i.lineTotal, 0);
  const deliveryFee = detailedItems.length > 0 ? (zone === 'inside_dhaka' ? 60 : 120) : 0;
  const grandTotal = subtotal + deliveryFee;

  const proceedToBkash = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (detailedItems.length === 0) {
      setFormError('আপনার কার্টে কোনো পণ্য নেই।');
      return;
    }
    if (!buyerName.trim() || !/^01[3-9]\d{8}$/.test(buyerPhone.trim()) || !address.trim()) {
      setFormError('সঠিক নাম, ১১ ডিজিটের মোবাইল নম্বর (01XXXXXXXXX) এবং ঠিকানা দিন।');
      return;
    }
    setSenderBkash(buyerPhone.trim());
    setStep('bkash');
  };

  const confirmBkashPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const cleanSender = senderBkash.trim();
    if (!/^01[3-9]\d{8}$/.test(cleanSender)) {
      setFormError('আপনার সঠিক ১১ ডিজিটের বিকাশ নম্বর দিন (01XXXXXXXXX)।');
      return;
    }

    const finalTrx = trxId.trim().toUpperCase();
    if (finalTrx.length < 5) {
      setFormError('অনুগ্রহ করে বিকাশ লেনদেনের সঠিক Transaction ID (TrxID) লিখুন।');
      return;
    }

    if (orders.some((o) => o.trxId.toUpperCase() === finalTrx)) {
      setFormError('এই ট্রানজেকশন আইডিটি (TrxID) ইতিমধ্যে অন্য একটি অর্ডারে ব্যবহৃত হয়েছে। অনুগ্রহ করে সঠিক TrxID লিখুন।');
      return;
    }

    const order: BkashOrder = {
      id: `ord-${Date.now().toString(36)}`,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      buyerId: currentUser?.id || 'guest',
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      district: district.trim(),
      deliveryAddress: address.trim(),
      deliveryZone: zone,
      notes: notes.trim(),
      items: detailedItems,
      subtotalBdt: subtotal,
      deliveryFeeBdt: deliveryFee,
      totalBdt: grandTotal,
      receiverBkash: BKASH_RECEIVER_NUMBER,
      senderBkash: cleanSender,
      trxId: finalTrx,
      paymentMethod: 'bkash_checkout',
      paymentScreenshot: screenshot || undefined,
      status: 'paid_verifying',
      createdAt: new Date().toISOString(),
    };

    onCompleteOrder(order);
    setCompletedOrder(order);
    setStep('receipt');
  };

  const inputCls =
    'w-full rounded-xl border border-pine-900/25 bg-canvas-card px-3 py-2 text-[14px] text-pine-900 outline-none placeholder:text-pine-900/40 focus:border-[#03EF62]';

  return (
    <div className="fixed inset-0 z-[130] overflow-hidden" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer from Right side */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-md transform bg-canvas shadow-2xl transition-all duration-300 ease-in-out border-l border-[#061621]/20 flex flex-col">
          {/* Drawer Header */}
          <div
            className={cn(
              'flex items-center justify-between border-b px-5 py-4 transition-colors',
              step === 'bkash' ? 'bg-[#e2136e] text-white border-white/20' : 'bg-[#03EF62] text-[#061621] border-[#061621]/15',
            )}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="size-5" />
              <div>
                <h2 className="font-bangla text-[18px] font-bold leading-tight">
                  {step === 'bkash'
                    ? 'বিকাশ পেমেন্ট গেটওয়ে'
                    : step === 'receipt'
                    ? 'অর্ডার রশিদ'
                    : step === 'history'
                    ? 'পূর্ববর্তী অর্ডারসমূহ'
                    : 'আপনার কার্ট · Shopping Cart'}
                </h2>
                <p className="font-mono text-[10.5px] opacity-80">
                  {step === 'cart' && `${detailedItems.length} টি পণ্য`}
                  {step === 'bkash' && 'Direct Secure Checkout'}
                  {step === 'receipt' && 'পেমেন্ট যাচাই প্রক্রিয়াধীন · Verification Pending'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStep(step === 'history' ? 'cart' : 'history')}
                className="rounded-lg bg-black/10 px-2.5 py-1 font-mono text-[11px] font-semibold hover:bg-black/20"
              >
                {step === 'history' ? 'Cart' : `Orders (${orders.length})`}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart drawer"
                className="flex size-8 items-center justify-center rounded-lg bg-black/10 hover:bg-black/20"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body: Step 1 (Cart & Shipping) */}
          {step === 'cart' && (
            <form onSubmit={proceedToBkash} className="flex-1 overflow-y-auto p-4 space-y-4">
              {detailedItems.length === 0 ? (
                <div className="py-20 text-center">
                  <ShoppingBag className="mx-auto size-12 text-pine-600/40" />
                  <p className="mt-3 font-bangla text-[18px] font-bold text-pine-900">
                    আপনার কার্ট এখন খালি
                  </p>
                  <p className="mt-1 font-bangla text-[13.5px] text-pine-900/60">
                    কৃষি বাজার থেকে পণ্য যোগ করুন।
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <SectionLabel>Selected Items ({toBengaliNumerals(detailedItems.length)})</SectionLabel>
                    {detailedItems.map((it) => (
                      <div
                        key={it.productId}
                        className="flex items-center gap-3 rounded-xl border border-canvas-border bg-canvas-card p-3 shadow-sm"
                      >
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="size-14 rounded-lg object-cover shrink-0" />
                        ) : (
                          <span className="flex size-14 items-center justify-center rounded-lg bg-pine-100 font-mono text-[11px] text-pine-800 shrink-0">
                            PROD
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bangla text-[14px] font-semibold text-pine-900">{it.name}</p>
                          <p className="font-mono text-[12px] text-pine-600">
                            ৳{toBengaliNumerals(it.unitPrice)} / {it.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(it.productId, it.quantity - 1)}
                            className="flex size-7 items-center justify-center rounded-md border border-pine-900/30 bg-canvas hover:bg-pine-50"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono text-[13px] font-semibold">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(it.productId, it.quantity + 1)}
                            className="flex size-7 items-center justify-center rounded-md border border-pine-900/30 bg-canvas hover:bg-pine-50"
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(it.productId, 0)}
                            aria-label="Remove item"
                            className="ml-1 flex size-7 items-center justify-center rounded-md text-[#c01048] hover:bg-rose-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Details */}
                  <div className="space-y-3 rounded-xl border border-canvas-border bg-canvas-card p-4">
                    <SectionLabel>Delivery Details</SectionLabel>
                    <div>
                      <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">
                        আপনার নাম *
                      </label>
                      <input
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="আপনার পুরো নাম"
                        className={cn(inputCls, 'font-bangla')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">
                        মোবাইল নম্বর (১১ ডিজিট) *
                      </label>
                      <input
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className={cn(inputCls, 'font-mono')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">জেলা *</label>
                        <input
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="যেমন: ঢাকা / বগুড়া"
                          className={cn(inputCls, 'font-bangla')}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">ডেলিভারি এরিয়া</label>
                        <select
                          value={zone}
                          onChange={(e) => setZone(e.target.value as 'inside_dhaka' | 'outside_dhaka')}
                          className={cn(inputCls, 'font-bangla')}
                        >
                          <option value="inside_dhaka">ঢাকার ভিতরে (৳৬০)</option>
                          <option value="outside_dhaka">ঢাকার বাইরে (৳১২০)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">
                        সম্পূর্ণ ডেলিভারি ঠিকানা *
                      </label>
                      <input
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="থানা, গ্রাম/মহল্লা, বাসা নং"
                        className={cn(inputCls, 'font-bangla')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
                      <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ডেলিভারি নোট…"
                        className={cn(inputCls, 'font-bangla')}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl border border-canvas-border bg-canvas-subtle p-4 font-mono text-[13px] space-y-1.5">
                    <div className="flex justify-between text-pine-900/80">
                      <span>পণ্য মূল্য:</span>
                      <span className="font-semibold">৳{toBengaliNumerals(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-pine-900/80">
                      <span>ডেলিভারি চার্জ:</span>
                      <span className="font-semibold">৳{toBengaliNumerals(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-canvas-border pt-2 text-[16px] font-bold text-pine-950 font-display">
                      <span>মোট পরিশোধযোগ্য:</span>
                      <span>৳{toBengaliNumerals(grandTotal)}</span>
                    </div>
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-rose-50 px-3 py-2 font-bangla text-[13px] font-semibold text-[#c01048]">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03EF62] text-[15px] font-bold text-[#061621] shadow-tactile-xs hover:opacity-95 transition"
                  >
                    বিকাশে ৳{toBengaliNumerals(grandTotal)} পরিশোধে এগিয়ে যান
                    <ArrowRight className="size-4" />
                  </button>
                </>
              )}
            </form>
          )}

          {/* Drawer Body: Step 2 (bKash Payment) */}
          {step === 'bkash' && (
            <form onSubmit={confirmBkashPayment} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-xl border border-[#e2136e]/30 bg-[#fff0f6] p-4 text-[#111827]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-bold text-[#e2136e]">
                    bKash Direct Payment
                  </span>
                  <span className="font-mono text-[15px] font-extrabold text-[#e2136e]">
                    ৳{toBengaliNumerals(grandTotal)}
                  </span>
                </div>
                <p className="mt-1 font-bangla text-[13px] text-gray-700">
                  আপনার বিকাশ অ্যাকাউন্ট থেকে পেমেন্ট সম্পন্ন করে নিচের বক্সে বিকাশ নম্বর ও ট্রানজেকশন আইডি (TrxID) লিখুন।
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-canvas-border bg-canvas-card p-4">
                <div>
                  <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">
                    আপনার বিকাশ মোবাইল নম্বর *
                  </label>
                  <input
                    required
                    value={senderBkash}
                    onChange={(e) => setSenderBkash(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className={cn(inputCls, 'font-mono')}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">
                    বিকাশ Transaction ID (TrxID) *
                  </label>
                  <input
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    placeholder="যেমন: BKL94M82QX"
                    className={cn(inputCls, 'font-mono uppercase font-bold')}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bangla text-[12px] font-semibold text-pine-900">
                    পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => screenRef.current?.click()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-pine-900/30 bg-canvas-subtle px-3 text-[12px] font-semibold text-pine-900 hover:border-pine-900"
                    >
                      <Upload className="size-3.5" /> Attach Screenshot
                    </button>
                    {screenshot && <span className="font-mono text-[11px] text-[#03EF62]">✓ Attached</span>}
                    <input
                      ref={screenRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onload = () => setScreenshot(String(r.result));
                        r.readAsDataURL(f);
                      }}
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 font-bangla text-[13px] font-semibold text-[#c01048]">
                  {formError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-canvas-border px-4 font-bangla text-[13px] font-semibold text-pine-900"
                >
                  <ArrowLeft className="size-4" /> কার্টে ফিরুন
                </button>
                <button
                  type="submit"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#e2136e] text-[14.5px] font-bold text-white shadow-md hover:bg-[#c81060]"
                >
                  পেমেন্ট নিশ্চিত করুন
                </button>
              </div>
            </form>
          )}

          {/* Drawer Body: Step 3 (Receipt) */}
          {step === 'receipt' && completedOrder && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-xl border border-[#03EF62]/40 bg-[#03EF62]/10 p-4 text-center">
                <Check className="mx-auto size-12 text-[#03EF62]" />
                <h3 className="mt-2 font-bangla text-[18px] font-bold text-pine-950">
                  অর্ডার সফলভাবে গৃহীত হয়েছে!
                </h3>
                <p className="mt-1 font-bangla text-[12.5px] font-semibold text-emerald-800">
                  পেমেন্ট যাচাই প্রক্রিয়াধীন · অ্যাডমিন নিরীক্ষা শেষে ডেলিভারি শুরু হবে।
                </p>
                <p className="mt-1 font-mono text-[11px] text-pine-600">
                  Order #{completedOrder.orderNumber} · TrxID: {completedOrder.trxId}
                </p>
              </div>

              <div className="rounded-xl border border-canvas-border bg-canvas-card p-4 font-mono text-[12px] space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span>গ্রাহকের নাম:</span>
                  <span className="font-bold">{completedOrder.buyerName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>মোবাইল নম্বর:</span>
                  <span>{completedOrder.buyerPhone}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>ডেলিভারি ঠিকানা:</span>
                  <span>{completedOrder.deliveryAddress}, {completedOrder.district}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-[14px]">
                  <span>মোট পরিশোধিত:</span>
                  <span>৳{toBengaliNumerals(completedOrder.totalBdt)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-canvas-border bg-canvas-card text-[13px] font-semibold text-pine-900"
                >
                  <Printer className="size-4" /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[#03EF62] font-bangla text-[13px] font-bold text-[#061621]"
                >
                  সম্পন্ন
                </button>
              </div>
            </div>
          )}

          {/* Drawer Body: History */}
          {step === 'history' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {orders.length === 0 ? (
                <p className="py-16 text-center font-bangla text-[13.5px] text-pine-900/60">
                  আপনার কোনো পূর্ববর্তী অর্ডার নেই।
                </p>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-canvas-border bg-canvas-card p-3.5 space-y-1 font-mono text-[12px]">
                    <div className="flex justify-between font-bold text-pine-950">
                      <span>#{o.orderNumber}</span>
                      <span>৳{toBengaliNumerals(o.totalBdt)}</span>
                    </div>
                    <p className="text-pine-600 text-[11px]">TrxID: {o.trxId} · {o.createdAt.slice(0, 10)}</p>
                    <p className="font-bangla text-[12.5px] text-pine-900/80">{o.deliveryAddress}, {o.district}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
