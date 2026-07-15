import { redirect } from 'next/navigation';

export default function NewQuotePage() {
  redirect('/app/quotes?create=1');
}
