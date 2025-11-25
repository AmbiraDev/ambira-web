import { redirect } from 'next/navigation'

/**
 * Sessions listing page - redirects to feed
 * Sessions are displayed on the main feed, so we redirect there
 */
export default function SessionsPage() {
  redirect('/')
}
