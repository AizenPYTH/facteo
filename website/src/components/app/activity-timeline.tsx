'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Mail, Send } from 'lucide-react';

import { Skeleton } from '@/components/app/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { fetchSentDocumentsForDocument } from '@/lib/domain/supabase/sent-documents';
import { sentDocumentsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { formatDateTime } from '@/lib/domain/format/datetime';

export function ActivityTimeline({
  documentType,
  documentId,
}: {
  documentType: 'invoice' | 'quote';
  documentId: string;
}) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: sentDocumentsQueryKeys.forDocument(
      user?.id ?? '',
      documentType,
      documentId,
    ),
    queryFn: () =>
      fetchSentDocumentsForDocument(user!.id, documentType, documentId),
    enabled: Boolean(user?.id && documentId),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  const items = query.data ?? [];

  return (
    <div className="p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Historique & activité
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          Aucune activité enregistrée.
        </p>
      ) : (
        <ul className="relative mt-5 space-y-0">
          <span
            aria-hidden
            className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200"
          />
          {items.map((item) => (
            <li className="relative pb-5 pl-7 last:pb-0" key={item.id}>
              <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 text-primary ring-2 ring-white">
                {item.channel === 'mail' ? <Mail size={10} /> : <Send size={10} />}
              </span>
              <p className="text-sm font-medium text-slate-900">
                Envoyé à {item.recipientEmail}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.subject}</p>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Clock size={11} />
                {formatDateTime(item.sentAt)} ·{' '}
                {formatDistanceToNow(new Date(item.sentAt), { addSuffix: true, locale: fr })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
