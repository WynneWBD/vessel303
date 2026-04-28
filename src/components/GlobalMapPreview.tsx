'use client'

import dynamic from 'next/dynamic'
import MapSkeleton from './MapSkeleton'
import { useLanguage } from '@/contexts/LanguageContext'

const GlobalMapDynamic = dynamic(() => import('./GlobalMapML'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

export default function GlobalMapPreview() {
  const { lang } = useLanguage()

  return (
    <div className="h-full w-full overflow-hidden bg-[#241F1B]">
      <GlobalMapDynamic lang={lang} previewMode />
    </div>
  )
}
