'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { clientUpload } from '@/lib/clientApi';

interface Props {
  value: string;
  onChange: (url: string) => void;
  error?: boolean;
}

type Mode = 'url' | 'upload';

export default function ThumbnailUploader({ value, onChange, error }: Props) {
  const [mode, setMode] = useState<Mode>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setUploadError('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File tối đa 5MB');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await clientUpload<{ success: boolean; url: string }>('/admin/media/upload', fd);
      onChange(res.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const baseInput =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
  const errInput = error ? 'border-red-400 dark:border-red-400' : '';

  return (
    <div className="space-y-3">
      {/* Tab toggle */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
        {(['url', 'upload'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setUploadError(''); }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
              mode === m
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {m === 'url' ? 'Nhập URL' : 'Tải ảnh lên'}
          </button>
        ))}
      </div>

      {mode === 'url' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={`${baseInput} ${errInput}`}
        />
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 transition ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
          }`}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Đang tải lên...
            </div>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Kéo thả hoặc <span className="text-blue-500">nhấn để chọn ảnh</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">JPG, PNG, WebP, GIF · Tối đa 5MB</p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

      {/* Preview */}
      {value && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-900">
            <Image src={value} alt="Thumbnail preview" fill className="object-cover" unoptimized />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
