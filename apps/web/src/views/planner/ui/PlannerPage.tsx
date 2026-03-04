'use client'

import dynamic from 'next/dynamic'
import { useTripStore } from '@/entities/trip/model/trip.store'
import { usePointCrud } from '@/features/route-create'
import { RouteBuilder } from '@/widgets/route-builder'

// RouteMap грузим динамически — Yandex Maps несовместима с SSR
const RouteMap = dynamic(
  () => import('@/widgets/route-map').then((m) => m.RouteMap),
  { ssr: false, loading: () => <MapSkeleton /> },
)

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center">
      <p className="text-sm text-gray-400">Загрузка карты...</p>
    </div>
  )
}

export function PlannerPage() {
  const { points, currentTrip } = useTripStore()
  const { add, remove, reorder } = usePointCrud(currentTrip?.id)

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Левая панель — список точек */}
      <aside className="w-80 shrink-0 bg-brand-light rounded-2xl p-4 overflow-hidden flex flex-col">
        <RouteBuilder points={points} onDelete={remove} onAdd={add} onReorder={reorder} />
      </aside>

      {/* Правая панель — карта */}
      <div className="flex-1 min-h-0">
        <RouteMap points={points} />
      </div>
    </div>
  )
}
