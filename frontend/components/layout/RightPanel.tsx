'use client'

import { useState } from 'react'
import {
  Star,
  Heart,
  Share2,
  Navigation,
  Phone,
  MessageSquare,
  Utensils,
  MapPin,
  Footprints,
  Car,
  Bike,
  Bus,
} from 'lucide-react'

interface RightPanelProps {
  providers?: any[]
  onOpenProviders?: () => void
}

const miniCards = [
  {
    id: 'doncarlos',
    name: 'Restaurante Don Carlos',
    initials: 'DC',
    rating: 4.9,
    reviews: 256,
    status: 'Abierto',
    description: 'Comida tradicional ecuatoriana',
    time: '4 min',
    detail: {
      fullName: 'Don Carlos',
      rating: 4.9,
      stars: 5,
      reviews: 256,
      status: 'Abierto',
      category: 'Comida tradicional ecuatoriana',
      experience: '15 años',
      price: '$$',
      open: '9:00 AM',
      close: '10:00 PM',
      desc: '15 años ofreciendo lo mejor de nuestra cocina casera con ingredientes frescos y de calidad.',
      verified: true,
    },
    img: 'https://picsum.photos/seed/doncarlosavatar/100/100',
    bg: 'https://picsum.photos/seed/doncarlos/400/200',
  },
  {
    id: 'esquinagourmet',
    name: 'La Esquina Gourmet',
    initials: 'EG',
    rating: 4.7,
    reviews: 189,
    status: 'Abierto',
    description: 'Cocina internacional',
    time: '6 min',
    detail: {
      fullName: 'La Esquina Gourmet',
      rating: 4.7,
      stars: 5,
      reviews: 189,
      status: 'Abierto',
      category: 'Cocina internacional',
      experience: '8 años',
      price: '$$$',
      open: '10:00 AM',
      close: '11:00 PM',
      desc: 'Cocina internacional con los mejores ingredientes importados y un toque local único.',
      verified: false,
    },
    img: 'https://picsum.photos/seed/esquinagourmetavatar/100/100',
    bg: 'https://picsum.photos/seed/esquinagourmet/400/200',
  },
  {
    id: 'saborandino',
    name: 'Sabor Andino',
    initials: 'SA',
    rating: 4.6,
    reviews: 142,
    status: 'Abierto',
    description: 'Comida típica',
    time: '8 min',
    detail: {
      fullName: 'Sabor Andino',
      rating: 4.6,
      stars: 5,
      reviews: 142,
      status: 'Abierto',
      category: 'Comida típica',
      experience: '12 años',
      price: '$',
      open: '8:00 AM',
      close: '9:30 PM',
      desc: 'Sabores auténticos de los Andes con recetas tradicionales transmitidas por generaciones.',
      verified: false,
    },
    img: 'https://picsum.photos/seed/saborandinoavatar/100/100',
    bg: 'https://picsum.photos/seed/saborandino/400/200',
  },
]

export function RightPanel({ providers = [], onOpenProviders }: RightPanelProps) {
  const [selectedId, setSelectedId] = useState('doncarlos')
  const selected = miniCards.find((c) => c.id === selectedId) || miniCards[0]

  return (
    <aside className="hidden xl:flex xl:flex-col xl:w-[380px] bg-[#07050d] border-l border-white/5 p-4 gap-4 overflow-y-auto h-screen shrink-0 select-none">
      {/* 1. Te puede interesar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Te puede interesar</h3>
          <button className="text-[11px] text-violet-400 hover:underline">Ver más</button>
        </div>
        <div className="space-y-2">
          {miniCards.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedId(card.id)}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition cursor-pointer ${
                selectedId === card.id
                  ? 'bg-[#120f24] border-violet-500/30'
                  : 'bg-[#120f24] border-white/5 hover:border-violet-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 overflow-hidden shrink-0">
                  <img src={card.img} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{card.name}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-white/60">
                    <span className="text-yellow-400 font-semibold">{card.rating}</span>
                    <span>⭐ ({card.reviews})</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{card.status}</span>
                  </div>
                  <p className="text-[10px] text-white/40 truncate max-w-[170px]">{card.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Heart className="w-3.5 h-3.5 text-white/40 hover:text-red-500 transition cursor-pointer" />
                <span className="text-[10px] text-violet-400 flex items-center gap-0.5">
                  <Navigation className="w-2.5 h-2.5" /> {card.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Tarjeta Detallada */}
      <div className="bg-[#120f24] rounded-3xl border border-white/5 p-4 shadow-xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-violet-600/20 shrink-0">
              <img src={selected.img} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white">{selected.detail.fullName}</h4>
                {selected.detail.verified && (
                  <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">✓</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-white/60 mt-0.5">
                <span className="text-yellow-400 font-bold">{selected.detail.rating}</span>
                <span>{'⭐'.repeat(selected.detail.stars)}</span>
                <span>({selected.detail.reviews})</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{selected.detail.status}</span>
              </div>
              <p className="text-[11px] text-white/50">{selected.detail.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition"><Share2 className="w-3.5 h-3.5" /></button>
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-red-400 transition"><Heart className="w-3.5 h-3.5 fill-current" /></button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 my-3 py-2 border-y border-white/5 text-center">
          <div><span className="block text-xs font-bold text-white">{selected.detail.experience}</span><span className="text-[9px] text-white/40">Experiencia</span></div>
          <div><span className="block text-xs font-bold text-white">{selected.detail.price}</span><span className="text-[9px] text-white/40">Precio medio</span></div>
          <div><span className="block text-xs font-bold text-white">{selected.detail.open}</span><span className="text-[9px] text-white/40">Apertura</span></div>
          <div><span className="block text-xs font-bold text-white">{selected.detail.close}</span><span className="text-[9px] text-white/40">Cierre</span></div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-violet-600 text-white text-[10px] font-medium shadow-md shadow-violet-600/30">
            <Navigation className="w-3.5 h-3.5 mb-1" /> Como llegar
          </button>
          <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-medium transition">
            <Phone className="w-3.5 h-3.5 mb-1 text-emerald-400" /> Llamar
          </button>
          <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-medium transition">
            <MessageSquare className="w-3.5 h-3.5 mb-1 text-violet-400" /> Chat
          </button>
          <button className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-medium transition">
            <Utensils className="w-3.5 h-3.5 mb-1 text-indigo-400" /> Ver menú
          </button>
        </div>

        <p className="text-[11px] text-white/60 leading-relaxed">{selected.detail.desc}</p>
      </div>

      {/* 3. Módulo de Ruta Sugerida */}
      <div className="bg-[#120f24] rounded-3xl border border-white/5 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" /> Ruta sugerida
          </span>
          <span className="text-[10px] text-white/50">Llegada estimada 9:48 AM</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white">4 min <span className="text-xs text-white/50 font-normal">(350 m)</span></h4>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button className="p-1.5 bg-violet-600 text-white rounded-lg"><Footprints className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 text-white/40 hover:text-white rounded-lg transition"><Car className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 text-white/40 hover:text-white rounded-lg transition"><Bike className="w-3.5 h-3.5" /></button>
            <button className="p-1.5 text-white/40 hover:text-white rounded-lg transition"><Bus className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="relative h-28 rounded-2xl bg-[#090710] border border-white/5 overflow-hidden flex items-center justify-center mb-3">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#382b63_1px,transparent_1px)] [background-size:12px_12px]" />
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M 40 80 Q 90 30 150 60 T 280 30" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="absolute top-6 right-8 w-6 h-6 rounded-full bg-violet-600 shadow-lg shadow-violet-600/50 flex items-center justify-center text-white text-xs">
            <Utensils className="w-3 h-3" />
          </div>
          <div className="absolute bottom-5 left-10 w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-ping" />
          <div className="absolute bottom-5 left-10 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center" />
        </div>

        <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2">
          <Navigation className="w-3.5 h-3.5" /> Iniciar navegación
        </button>
      </div>
    </aside>
  )
}

export default RightPanel
