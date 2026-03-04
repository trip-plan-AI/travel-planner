'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Cloud, CloudSun, Mic, Search, Sun, Wind } from 'lucide-react';
import { api } from '@/shared/api';
import type { Trip } from '@/entities/trip';
import { LoginModal } from '@/features/auth';
import { RegisterModal } from '@/features/auth';

type Modal = 'login' | 'register' | null;
type SearchMode = 'ai' | 'manual';

interface ManualForm {
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  budget: string;
}

interface PopularTourCard {
  id: string;
  title: string;
  desc: string;
  total: string;
  img: string;
  temp: string;
  tags: string[];
}

const QUICK_FILTERS = [
  { icon: '👍', label: 'Очень хвалят' },
  { icon: '🌊', label: 'Хочу на море' },
  { icon: '🔥', label: 'Хит сезона' },
  { icon: '⚡', label: 'Лучшее из недорогих' },
];

const FAQ_CARDS = [
  {
    id: 1,
    title: 'Как работает сервис?',
    desc: 'Наш алгоритм анализирует ваши предпочтения и подбирает оптимальные локации в РФ. Мы убрали всё лишнее, чтобы вы не тратили часы на изучение форумов и отзывов.',
    image:
      'https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?q=80&w=2064&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Используются реальные данные?',
    desc: 'Используются реальные агрегированные данные и AI-моделирование бюджета.',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Можно ли редактировать маршрут?',
    desc: 'Можно добавлять и удалять точки, изменять бюджет и настраивать маршрут под себя.',
    image:
      'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=2070&auto=format&fit=crop',
  },
];

const DEMO_TOURS: PopularTourCard[] = [
  {
    id: 'demo-1',
    title: 'Сочи Weekend',
    desc: 'Море, горы и гастрономия: короткий насыщенный маршрут для перезагрузки.',
    total: 'от 44 900 ₽',
    img: 'https://images.pexels.com/photos/9344421/pexels-photo-9344421.jpeg?auto=compress&cs=tinysrgb&w=1200',
    temp: '+12°',
    tags: ['Все', 'Активный'],
  },
  {
    id: 'demo-2',
    title: 'Алтай Explorer',
    desc: 'Трекинг, панорамы и дикая природа — для тех, кто любит активный отдых.',
    total: 'от 58 000 ₽',
    img: 'https://images.pexels.com/photos/10103738/pexels-photo-10103738.jpeg?auto=compress&cs=tinysrgb&w=1200',
    temp: '+6°',
    tags: ['Все', 'Экстрим'],
  },
  {
    id: 'demo-3',
    title: 'Карелия Winter',
    desc: 'Северные озёра, зимние активности и уютные локации для камерного отдыха.',
    total: 'от 39 500 ₽',
    img: 'https://images.pexels.com/photos/2087391/pexels-photo-2087391.jpeg?auto=compress&cs=tinysrgb&w=1200',
    temp: '-5°',
    tags: ['Все', 'Зима'],
  },
  {
    id: 'demo-4',
    title: 'Кавказ Peaks',
    desc: 'Высокогорные маршруты и захватывающие виды для любителей эмоций.',
    total: 'от 62 300 ₽',
    img: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200',
    temp: '+3°',
    tags: ['Все', 'Экстрим', 'Активный'],
  },
];

const weatherIcons = [Cloud, Sun, CloudSun, Wind];

export function LandingPage() {
  const [modal, setModal] = useState<Modal>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('ai');
  const [selectedFilter, setSelectedFilter] = useState('Все');
  const [inputRows, setInputRows] = useState(3);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [manualForm, setManualForm] = useState<ManualForm>({
    from: '',
    to: '',
    dateFrom: '',
    dateTo: '',
    budget: '',
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Адаптивный размер textarea, как в исходном прототипе
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      if (width >= 768) setInputRows(1);
      else if (width >= 375) setInputRows(2);
      else setInputRows(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Устойчивый автоплей видео-фона (mobile friendly)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.muted = true;
      video.defaultMuted = true;
      void video.play().catch(() => undefined);
    };

    tryPlay();
    window.addEventListener('touchstart', tryPlay, { passive: true });
    window.addEventListener('click', tryPlay, { passive: true });

    return () => {
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('click', tryPlay);
    };
  }, []);

  // Загружаем предзаданные маршруты для блока «Популярное сейчас»
  useEffect(() => {
    api
      .get<Trip[]>('/trips/predefined')
      .then(setTrips)
      .catch(() => setTrips([]));
  }, []);

  const filteredTrips = useMemo(() => {
    const base = trips.filter((t) => t.isPredefined);
    if (selectedFilter === 'Все') return base;
    return base.filter((t) =>
      (t.description ?? '').toLowerCase().includes(selectedFilter.toLowerCase()),
    );
  }, [trips, selectedFilter]);

  const popularCards = useMemo(() => {
    if (filteredTrips.length > 0) {
      return filteredTrips.map((trip, idx) => ({
        id: trip.id,
        title: trip.title,
        desc: trip.description ?? 'Маршрут с живописными локациями и насыщенной программой.',
        total: trip.budget ? `${trip.budget.toLocaleString('ru-RU')} ₽` : 'По запросу',
        img:
          idx % 2 === 0
            ? 'https://images.pexels.com/photos/9344421/pexels-photo-9344421.jpeg?auto=compress&cs=tinysrgb&w=1200'
            : 'https://images.pexels.com/photos/10103738/pexels-photo-10103738.jpeg?auto=compress&cs=tinysrgb&w=1200',
        temp: '+12°',
      }));
    }

    if (selectedFilter === 'Все') return DEMO_TOURS;
    return DEMO_TOURS.filter((tour) => tour.tags.includes(selectedFilter));
  }, [filteredTrips, selectedFilter]);

  const handleSearch = () => {
    setModal('register');
  };

  return (
    <>
      <div className="relative flex flex-col min-h-full bg-white">
        <section className="relative w-full h-auto md:h-screen flex flex-col items-center justify-start md:justify-center overflow-hidden py-8 md:py-0">
          <div className="absolute inset-0 z-0">
            <img
              src="/assets/video/hero-poster.jpg"
              alt="Hero background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <video
              ref={videoRef}
              key={isDesktop ? 'hd' : 'sd'}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/assets/video/hero-poster.jpg"
              className="absolute inset-0 w-full h-full object-cover"
            >
              {isDesktop ? (
                <>
                  <source src="/assets/video/hero-bg-hd.webm" type="video/webm" />
                  <source src="/assets/video/hero-bg-hd.mp4" type="video/mp4" />
                </>
              ) : (
                <>
                  <source src="/assets/video/hero-bg-small.webm" type="video/webm" />
                  <source src="/assets/video/hero-bg-small.mp4" type="video/mp4" />
                </>
              )}
            </video>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-6 text-center flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-[0.95] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] mx-auto">
              Личный <br /> <span className="text-brand-sky">тревел-гид</span>
            </h1>
            <p className="text-white text-sm md:text-lg font-medium mb-7 max-w-2xl mx-auto drop-shadow-2xl leading-relaxed">
              Планирование ещё никогда не было таким простым.
            </p>

            <div className="w-full max-w-3xl mx-auto text-center">
              <div className="flex justify-center items-center gap-2 mb-8 md:mb-10">
                <button
                  onClick={() => setSearchMode('ai')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md ${
                    searchMode === 'ai'
                      ? 'bg-white text-brand-indigo border border-white shadow-lg'
                      : 'bg-white/10 border border-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  AI-поиск
                </button>
                <button
                  onClick={() => setSearchMode('manual')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md ${
                    searchMode === 'manual'
                      ? 'bg-white text-brand-indigo border border-white shadow-lg'
                      : 'bg-white/10 border border-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Ручной
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-3xl p-1 md:p-1.5 rounded-[2rem] md:rounded-[3rem] border-2 border-white/25 shadow-2xl shadow-black/20 transition-none mx-auto">
                {searchMode === 'ai' ? (
                  <div className="bg-white rounded-[2rem] md:rounded-[2.6rem] flex items-center p-1 md:p-1.5 pr-2 md:pr-3 min-h-[64px] md:min-h-[72px] focus-within:ring-4 focus-within:ring-brand-sky/10 transition-none">
                    <div className="flex-1 relative group">
                      <textarea
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Например: Сочи за 45 000 руб на 5 дней"
                        rows={inputRows}
                          className="w-full py-3 md:py-4 !pl-8 md:!pl-10 pr-12 md:pr-14 bg-transparent outline-none text-slate-800 font-bold text-sm md:text-base placeholder:text-slate-400 placeholder:font-normal resize-none overflow-hidden leading-snug md:leading-normal"
                        />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-sky transition-colors">
                        <Mic size={22} />
                      </button>
                    </div>
                    <button
                      onClick={handleSearch}
                        className="w-12 h-12 md:w-14 md:h-14 bg-brand-amber text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 shrink-0"
                      >
                        <ArrowRight size={24} />
                      </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-[2.2rem] md:rounded-[3.5rem] p-4 md:p-8 transition-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Москва"
                        value={manualForm.from}
                        onChange={(e) => setManualForm((p) => ({ ...p, from: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 outline-none font-bold text-slate-700 placeholder:text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Алтай"
                        value={manualForm.to}
                        onChange={(e) => setManualForm((p) => ({ ...p, to: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 outline-none font-bold text-slate-700 placeholder:text-slate-400"
                      />
                      <input
                        type="date"
                        value={manualForm.dateFrom}
                        onChange={(e) => setManualForm((p) => ({ ...p, dateFrom: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 outline-none font-bold text-slate-700"
                      />
                      <input
                        type="date"
                        min={manualForm.dateFrom}
                        value={manualForm.dateTo}
                        onChange={(e) => setManualForm((p) => ({ ...p, dateTo: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 outline-none font-bold text-slate-700"
                      />
                      <input
                        type="text"
                        placeholder="100 000 ₽"
                        value={manualForm.budget}
                        onChange={(e) => setManualForm((p) => ({ ...p, budget: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 outline-none font-bold text-slate-700 placeholder:text-slate-400 md:col-span-2"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="w-auto px-12 mt-6 py-4 bg-brand-amber text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-amber/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mx-auto"
                    >
                      Добавить
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 md:mt-6 flex flex-wrap gap-2 justify-center items-center">
                {QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.label}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white text-[10px] md:text-xs font-bold hover:bg-white/20 transition-all"
                  >
                    {filter.icon} {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 bg-white w-screen left-1/2 -translate-x-1/2 font-sans">
          <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-16 text-center flex flex-col items-center">
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-10 text-center mb-12 md:mb-14">
              <div className="flex flex-col items-center">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-brand-indigo">
                  AI
                </h3>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-2">
                  Генерация за секунды
                </p>
              </div>
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <div className="flex flex-col items-center">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-500">
                  100%
                </h3>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-2">
                  Редактируемый маршрут
                </p>
              </div>
              <div className="w-px h-12 bg-slate-200 hidden md:block" />
              <div className="flex flex-col items-center">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-brand-amber">
                  24/7
                </h3>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-2">
                  В любое время
                </p>
              </div>
            </div>

            <div className="mb-14 md:mb-16 w-full max-w-[960px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-center items-start text-left gap-6 md:gap-8 mb-8 md:mb-10 w-full max-w-[1080px] mx-auto">
                <h2 className="text-3xl md:text-5xl font-black text-brand-indigo tracking-tight leading-[0.95] text-left w-full md:w-auto">
                  Популярное <br /> <span className="text-brand-sky">сейчас</span>
                </h2>
                <div className="relative -mx-4 px-4 md:mx-0 md:px-0 w-full md:w-auto max-w-full">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar md:overflow-visible md:flex-nowrap pb-2 justify-center md:justify-center pt-1">
                    {['Все', 'Активный', 'Зима', 'Экстрим'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFilter(f)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                          selectedFilter === f
                            ? 'bg-brand-sky text-white border-brand-sky shadow-lg'
                            : 'bg-white text-slate-500 border-slate-100 hover:border-brand-sky/30'
                        }`}
                      >
                        {f === 'Активный' && <span className="text-sm">⚡</span>}
                        {f === 'Зима' && <span className="text-sm">❄️</span>}
                        {f === 'Экстрим' && <span className="text-sm">⛰️</span>}
                        {f}
                      </button>
                    ))}
                    <div className="w-12 shrink-0 md:hidden" />
                  </div>
                  <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none md:hidden z-10" />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 md:gap-10 w-full max-w-[960px] mx-auto">
                {popularCards.map((trip, idx) => {
                  const Icon = weatherIcons[idx % weatherIcons.length] ?? Cloud;
                  return (
                    <article
                      key={trip.id}
                      className="group cursor-pointer w-full md:w-[calc(50%-1.25rem)] max-w-[420px]"
                    >
                      <div className="relative aspect-[4/5] md:aspect-[16/10] rounded-[2rem] overflow-hidden mb-5 md:mb-6 shadow-2xl">
                        <img
                          src={trip.img}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          alt={trip.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute top-6 left-6 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-white font-bold text-xs flex items-center gap-1.5">
                          <Icon size={14} /> {trip.temp}
                        </div>
                        <div className="absolute bottom-6 left-6 right-6 text-left">
                          <h3 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight leading-tight text-center">
                            {trip.title}
                          </h3>
                          <div className="bg-brand-amber text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                            <Search size={14} /> {trip.total}
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed px-2 text-center">
                        {trip.desc}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="pt-1 md:pt-2 w-full max-w-[960px] mx-auto text-left">
              <h2 className="text-3xl md:text-5xl font-black text-brand-indigo mb-8 md:mb-12 tracking-tight leading-[0.95] text-left">
                Ответы <br /> <span className="text-brand-sky">на вопросы</span>
              </h2>
              <div className="space-y-10 md:space-y-14">
                {FAQ_CARDS.map((card, idx) => (
                  <div
                    key={card.id}
                    className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
                  >
                    <div className="w-full md:w-1/2 aspect-square md:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
                      <img
                        src={card.image}
                        className="w-full h-full object-cover"
                        alt={card.title}
                      />
                    </div>
                    <div className="w-full md:w-1/2 text-left">
                      <h4 className="text-2xl md:text-3xl font-black text-brand-indigo mb-4 leading-tight tracking-tight">
                        {card.title}
                      </h4>
                      <p className="text-base md:text-lg text-slate-500 font-medium leading-snug md:leading-tight">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <LoginModal
        open={modal === 'login'}
        onClose={() => setModal(null)}
        onSwitchToRegister={() => setModal('register')}
      />
      <RegisterModal
        open={modal === 'register'}
        onClose={() => setModal(null)}
        onSwitchToLogin={() => setModal('login')}
      />
    </>
  );
}
