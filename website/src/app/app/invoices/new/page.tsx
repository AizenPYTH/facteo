import { redirect } from 'next/navigation';

export default function NewInvoicePage() {
  redirect('/app/invoices?create=1');
}
