'use client'

import { Map, Home, MessageSquare, MapPin, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { 
  Button, 
  Avatar, 
  AvatarImage, 
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

export function Header() {
  const pathname = usePathname()
  const user = { name: 'Глеб Лузан', photo: '', isLoggedIn: true }

  return (
    <header className="sticky top-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 shrink-0">
      <div className="max-w-7xl mx-auto px-8 h-full flex items-center relative">
        
        <Link 
          href="/" 
          className="absolute left-[31%] -translate-x-1/2 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="bg-[#58A5E1] text-white p-1.5 rounded-lg shadow-sm">
            <Map size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[#1E293B] text-xl tracking-tight">
            TripAI
          </span>
        </Link>

        {/* Профиль: Справа */}
        <div className=" absolute right-[14.5%] ml-auto flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-10 w-10 rounded-full p-0 border border-slate-100 hover:bg-slate-50 transition-all shadow-sm focus-visible:ring-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photo} />
                  <AvatarFallback className="bg-slate-50 text-slate-400">
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            {/* Твоя кастомная модалка */}
            <DropdownMenuContent 
              align="end" 
              sideOffset={12}
              className="w-72 rounded-[2.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-slate-100 bg-white z-[100] animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="px-4 py-3 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Профиль</p>
                <p className="text-base font-bold text-[#1E1B4B] mt-1.5 truncate">{user.name}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                {/* Элемент: Главная */}
                <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                  <Link href="/" className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group",
                    pathname === '/' ? "bg-slate-50 text-[#58A5E1]" : "text-slate-600 hover:bg-slate-50"
                  )}>
                    <div className={cn("p-2 rounded-xl transition-colors", pathname === '/' ? "bg-[#58A5E1] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white")}>
                      <Home size={18} />
                    </div>
                    <span className="font-bold text-sm">Главная</span>
                  </Link>
                </DropdownMenuItem>

                {/* Элемент: AI Гид (Акцентный) */}
                <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                  <Link href="/ai-assistant" className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group",
                    pathname === '/ai-assistant' ? "bg-purple-50 text-purple-600" : "text-slate-600 hover:bg-purple-50/50"
                  )}>
                    <div className={cn("p-2 rounded-xl shadow-sm transition-all", pathname === '/ai-assistant' ? "bg-purple-600 text-white shadow-purple-200" : "bg-purple-100 text-purple-400 group-hover:bg-purple-600 group-hover:text-white")}>
                      <MessageSquare size={18} />
                    </div>
                    <span className="font-bold text-sm">AI Гид</span>
                  </Link>
                </DropdownMenuItem>

                {/* Элемент: Маршруты */}
                <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                  <Link href="/planner" className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group",
                    pathname === '/planner' ? "bg-slate-50 text-[#58A5E1]" : "text-slate-600 hover:bg-slate-50"
                  )}>
                    <div className={cn("p-2 rounded-xl transition-colors", pathname === '/planner' ? "bg-[#58A5E1] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white")}>
                      <MapPin size={18} />
                    </div>
                    <span className="font-bold text-sm">Маршруты</span>
                  </Link>
                </DropdownMenuItem>

                {/* Элемент: Личный кабинет */}
                <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                  <Link href="/profile" className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group",
                    pathname === '/profile' ? "bg-slate-50 text-[#58A5E1]" : "text-slate-600 hover:bg-slate-50"
                  )}>
                    <div className={cn("p-2 rounded-xl transition-colors", pathname === '/profile' ? "bg-[#58A5E1] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white")}>
                      <User size={18} />
                    </div>
                    <span className="font-bold text-sm">Личный кабинет</span>
                  </Link>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-4 bg-slate-50" />

              {/* Выйти */}
              <DropdownMenuItem className="p-0 focus:bg-transparent">
                <button className="flex items-center w-full gap-3 px-3 py-2.5 rounded-2xl text-red-400 hover:bg-red-50 transition-all group">
                  <div className="p-2 rounded-xl bg-red-50 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                    <LogOut size={18} />
                  </div>
                  <span className="font-bold text-sm">Выйти</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}