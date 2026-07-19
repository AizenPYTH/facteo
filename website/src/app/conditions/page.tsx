import { redirect } from 'next/navigation';

/** Alias court → page CGU canonique. */
export default function ConditionsRedirect() {
  redirect('/conditions-utilisation');
}
