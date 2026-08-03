import { redirect } from 'next/navigation';

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const client = typeof params.client === 'string' ? params.client : '';
  const qs = new URLSearchParams({ create: '1' });
  if (client) {
    qs.set('client', client);
  }
  redirect(`/app/quotes?${qs.toString()}`);
}
