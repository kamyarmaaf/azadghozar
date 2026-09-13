'use client';

import { MessageCircle } from 'lucide-react';

/** No chat or verified social endpoints exist yet; never pretend a message was delivered. */
export function FloatingButtons() {
  return (
    <div className="fixed bottom-6 left-4 z-50 flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-2 shadow-lg" role="status">
      <MessageCircle className="size-5 text-amber-700" aria-hidden="true" />
      <span className="text-xs font-medium text-amber-900">چت و پشتیبانی: به‌زودی</span>
    </div>
  );
}
