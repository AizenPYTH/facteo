'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Mail, Send } from 'lucide-react';

import { Skeleton } from '@/components/app/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
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
  const { scope } = useTenant();

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
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const items = query.data ?? [];

  return (
    <div className="p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Historique & activité
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Aucune activité enregistrée.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li className="relative pl-6" key={item.id}>
              <span className="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-50 text-primary">
                {item.channel === 'mail' ? <Mail size={10} /> : <Send size={10} />}
              </span>
              <p className="text-sm font-medium text-slate-900">
                Envoyé à {item.recipientEmail}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{item.subject}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} />
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
