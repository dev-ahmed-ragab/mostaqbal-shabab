'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  User,
  AtSign,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ProfileEditor({
  userId,
  initialName,
  initialUsername,
  initialAvatar,
}: {
  userId: string;
  initialName: string;
  initialUsername: string;
  initialAvatar: string;
}) {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      let finalAvatar = avatarUrl;
      if (avatarFile && supabase) {
        const ext = avatarFile.name.split('.').pop() || 'png';
        const path = `${userId}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatar = data.publicUrl;
      }

      if (!supabase) throw new Error('not configured');

      const { error } = await supabase.rpc('update_own_profile', {
        p_full_name: name.trim() || null,
        p_username: username.trim() || null,
        p_avatar_url: finalAvatar || null,
      });
      if (error) throw error;

      setAvatarUrl(finalAvatar);
      setAvatarFile(null);
      setMsg({ type: 'ok', text: 'تم حفظ التغييرات.' });
    } catch (err) {
      const m = err instanceof Error ? err.message : 'تعذر الحفظ.';
      setMsg({ type: 'err', text: m });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ type: 'err', text: 'كلمة المرور 8 أحرف على الأقل.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'err', text: 'كلمتا المرور غير متطابقتين.' });
      return;
    }
    if (!supabase) {
      setPwMsg({ type: 'err', text: 'الخدمة غير مهيأة.' });
      return;
    }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPwMsg({ type: 'ok', text: 'تم تغيير كلمة المرور.' });
    } catch (err) {
      const m = err instanceof Error ? err.message : 'تعذر التغيير.';
      setPwMsg({ type: 'err', text: m });
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User className="w-8 h-8" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-tl-xl bg-[#133063] text-white"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
          <div className="text-xs text-slate-500">
            اضغط على الكاميرا لاختيار صورة (png/jpg).
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستخدم</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
              dir="ltr"
            />
            <AtSign className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              msg.type === 'ok'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {msg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#133063] hover:bg-[#0d234a] text-white font-bold text-xs shadow-md transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#00a3e0]" />}
          حفظ التغييرات
        </button>
      </form>

      <div className="pt-6 border-t border-slate-200">
        <h3 className="text-sm font-extrabold text-[#133063] mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#00a3e0]" />
          تغيير كلمة المرور
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="كلمة مرور جديدة (8 أحرف على الأقل)"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
            dir="ltr"
          />
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="تأكيد كلمة المرور"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a3e0]/30"
            dir="ltr"
          />
          {pwMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                pwMsg.type === 'ok'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {pwMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{pwMsg.text}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={changingPw}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-[#133063] font-bold text-xs transition disabled:opacity-50"
          >
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-[#00a3e0]" />}
            تغيير كلمة المرور
          </button>
        </form>
      </div>
    </div>
  );
}
