'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Search, MapPin, Plus, MessageSquare, ArrowRight } from 'lucide-react'
import { useTripStore } from '@/entities/trip/model/trip.store'
import { usePointCrud } from '@/features/route-create'
import { loadYandexMaps } from '@/shared/lib/yandex-maps'
import { env } from '@/shared/config/env'
import type { RoutePoint } from '@/entities/route-point'
import type { CreatePointPayload } from '@/entities/route-point'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const ymaps: any

const RouteMap = dynamic(
  () => import('@/widgets/route-map').then((m) => m.RouteMap),
  { ssr: false, loading: () => <MapSkeleton /> },
)

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-[2.5rem] bg-gray-100 animate-pulse flex items-center justify-center">
      <p className="text-sm text-gray-400">Загрузка карты...</p>
    </div>
  )
}

// TODO: убрать после подключения авторизации
const DEV_MOCK = process.env.NODE_ENV === 'development'

function useMockPoints() {
  const [points, setPoints] = useState<RoutePoint[]>([])

  const add = async (payload: CreatePointPayload) => {
    const mock: RoutePoint = {
      id: crypto.randomUUID(),
      tripId: 'mock',
      title: payload.title,
      lat: payload.lat,
      lon: payload.lon,
      budget: payload.budget ?? null,
      visitDate: null,
      imageUrl: null,
      order: points.length,
      createdAt: new Date().toISOString(),
    }
    setPoints((prev) => [...prev, mock])
    return mock
  }

  const remove = async (id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id))
  }

  const reorder = async (orderedIds: string[]) => {
    setPoints((prev) => {
      const map = Object.fromEntries(prev.map((p) => [p.id, p]))
      return orderedIds.map((id, i) => ({ ...map[id]!, order: i }))
    })
  }

  return { points, add, remove, reorder }
}

interface GeoSuggestion {
  displayName: string
  coords: [number, number]
}

export function PlannerPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'popular'>('my')
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { points: storePoints, currentTrip } = useTripStore()
  const crud = usePointCrud(currentTrip?.id)
  const mock = useMockPoints()
  const active = DEV_MOCK && !currentTrip ? mock : { points: storePoints, ...crud }

  // Закрыть дропдаун при клике снаружи
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Геокодирование через Яндекс
  const geocode = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    setIsSearching(true)
    try {
      await loadYandexMaps(env.yandexMapsKey)
      const result = await ymaps.geocode(query, { results: 5, lang: 'ru_RU' })
      const items = result.geoObjects.toArray()
      const found: GeoSuggestion[] = items.map((obj: any) => ({
        displayName: obj.getAddressLine(),
        coords: obj.geometry.getCoordinates() as [number, number],
      }))
      setSuggestions(found)
      setShowDropdown(true)
    } catch {
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => geocode(value), 400)
  }

  const handleAddByQuery = async () => {
    if (!searchInput.trim()) return
    setIsSearching(true)
    try {
      await loadYandexMaps(env.yandexMapsKey)
      const result = await ymaps.geocode(searchInput, { results: 1, lang: 'ru_RU' })
      const obj = result.geoObjects.get(0)
      if (!obj) return
      const coords = obj.geometry.getCoordinates() as [number, number]
      await active.add({ title: obj.getAddressLine(), lat: coords[0], lon: coords[1] })
      setSearchInput('')
      setShowDropdown(false)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectSuggestion = async (s: GeoSuggestion) => {
    setShowDropdown(false)
    setSearchInput('')
    setSuggestions([])
    await active.add({ title: s.displayName, lat: s.coords[0], lon: s.coords[1] })
  }

  return (
    <div className="bg-white min-h-full w-full">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 w-full">

        {/* Заголовок + табы */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-brand-indigo tracking-tight mb-6">
            Маршруты
          </h2>

          <div className="flex p-1 bg-slate-50 rounded-xl w-full max-w-md">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'my'
                  ? 'bg-white text-brand-indigo shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Конструктор
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'popular'
                  ? 'bg-white text-brand-indigo shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Популярные
            </button>
          </div>
        </div>

        {activeTab === 'my' ? (
          <div className="animate-in fade-in duration-300">
            {DEV_MOCK && !currentTrip && (
              <div className="mb-4 text-center">
                <span className="inline-block bg-amber-100 border border-amber-300 text-amber-800 text-xs px-3 py-1 rounded-full">
                  DEV MODE — данные не сохраняются
                </span>
              </div>
            )}

            {/* Поисковая строка */}
            <div className="mb-8 w-full">
              <div ref={searchContainerRef} className="flex flex-col md:flex-row gap-4 w-full relative items-center">
                <div className="w-full relative group flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-sky transition-colors">
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-brand-sky border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search size={20} />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddByQuery()}
                    placeholder="Поиск места..."
                    className="w-full pl-12 pr-4 py-4 md:py-5 bg-slate-50 rounded-xl md:rounded-2xl border-none focus:ring-2 focus:ring-brand-sky/20 outline-none text-slate-800 font-bold text-base md:text-lg transition-all placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                <button
                  onClick={handleAddByQuery}
                  disabled={isSearching || !searchInput.trim()}
                  className="w-full md:w-auto px-8 py-4 md:py-5 bg-brand-amber hover:bg-amber-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-sm md:text-base shadow-xl shadow-brand-amber/30 active:scale-95 transition-all whitespace-nowrap disabled:opacity-70"
                >
                  ДОБАВИТЬ
                </button>

                {/* Дропдаун с результатами */}
                {showDropdown && searchInput.length > 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col">
                      {suggestions.length > 0 ? (
                        suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectSuggestion(s)}
                            className="flex items-center gap-3 w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-brand-sky/10 flex items-center justify-center text-slate-400 group-hover:text-brand-sky transition-colors shrink-0">
                              <MapPin size={14} />
                            </div>
                            <span className="font-bold text-slate-700 group-hover:text-brand-indigo truncate flex-1">
                              {s.displayName}
                            </span>
                            <Plus size={14} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-4 text-slate-500 text-sm font-medium text-center">
                          Ищем варианты...
                        </div>
                      )}

                      {/* Опция AI */}
                      <button
                        onClick={() => {/* TODO: TRI-32 AI чат */}}
                        className="flex items-center gap-3 w-full text-left px-5 py-5 bg-slate-50 hover:bg-slate-100 transition-colors group mt-2 border-t border-slate-100"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                          <MessageSquare size={22} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-brand-indigo uppercase tracking-wider text-xs">
                            Найти с AI
                          </span>
                          <span className="text-slate-500 text-sm font-medium">
                            AI найдет место: «{searchInput}»
                          </span>
                        </div>
                        <ArrowRight size={18} className="ml-auto text-brand-indigo transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Карта */}
            <div className="w-full aspect-[4/5] md:aspect-[21/9] rounded-[2.5rem] overflow-hidden relative border border-slate-200 shadow-inner bg-slate-50">
              <RouteMap points={active.points} />
            </div>

            {/* TODO: TRI-42 — секция бюджета и список точек */}
            {active.points.length > 0 && (
              <div className="mt-6 bg-slate-50 rounded-2xl px-6 py-4 text-sm text-slate-400 text-center border border-slate-100">
                {active.points.length} {active.points.length === 1 ? 'точка добавлена' : 'точки добавлены'} — детальный список в TRI-42
              </div>
            )}
          </div>
        ) : (
          /* TODO: TRI-43 — таб "Популярные" */
          <div className="animate-in fade-in duration-300 flex items-center justify-center min-h-[400px]">
            <p className="text-slate-400 font-medium">Популярные маршруты — скоро (TRI-43)</p>
          </div>
        )}
      </div>
    </div>
  )
}
