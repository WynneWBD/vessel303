import { redirect } from 'next/navigation'
import { VISUAL_EDITOR_HOME_HERO_HREF } from '@/lib/admin-visual-links'

export const dynamic = 'force-dynamic'

export default async function PageVisualEditorPage() {
  redirect(VISUAL_EDITOR_HOME_HERO_HREF)
}
