'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/providers/AuthProvider'
import { api } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import { Menu, Save, Plus, Loader2, Briefcase, Tag, Phone, DollarSign, CheckCircle, MessageCircle, X, Clock, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Provider, Service } from '@/types'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })
const MapClickHandler = dynamic(() => import('react-leaflet').then(m => {
  const { useMapEvents } = m
  return function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
      click(e) {
        onClick(e.latlng.lat, e.latlng.lng)
      }
    })
    return null
  }
}), { ssr: false })

const CATEGORIES: Record<string, string[]> = {
  'Tecnología': ['Internet y redes', 'Reparación de laptops', 'Celulares', 'Software', 'Cámaras de seguridad'],
  'Salud y bienestar': ['Fisioterapia', 'Medicina general', 'Psicología', 'Odontología', 'Nutrición'],
  'Veterinaria': ['Consulta veterinaria', 'Peluquería canina', 'Emergencias mascotas'],
  'Hogar': ['Plomería', 'Electricidad', 'Jardinería', 'Limpieza', 'Pintura'],
  'Gastronomía': ['Restaurante', 'Comida rápida', 'Panadería', 'Catering'],
  'Belleza': ['Peluquería', 'Barbería', 'Uñas', 'Maquillaje'],
  'Educación': ['Tutorías', 'Idiomas', 'Música', 'Tecnología'],
  'Ropa y arreglos': ['Costura', 'Arreglo de ropa', 'Zapatería'],
  'Trámites y asesoría': ['Contabilidad', 'Legal', 'Seguros', 'Inmobiliaria'],
}

const SUGGESTED_TAGS: Record<string, string[]> = {
  'Internet y redes': ['internet', 'wifi', 'router', 'conectividad', 'instalación', 'reparación', 'red'],
  'Reparación de laptops': ['laptop', 'computadora', 'hardware', 'software', 'mantenimiento', 'diagnóstico', 'repuestos'],
  'Celulares': ['celular', 'smartphone', 'pantalla', 'batería', 'reparación', 'accesorios'],
  'Software': ['programas', 'instalación', 'licencias', 'antivirus', 'office', 'sistema operativo'],
  'Cámaras de seguridad': ['cámaras', 'vigilancia', 'instalación', 'circuito cerrado', 'alarmas'],
  'Fisioterapia': ['fisioterapia', 'rehabilitación', 'dolor muscular', 'espalda', 'lesiones', 'masajes'],
  'Medicina general': ['medicina', 'consulta', 'diagnóstico', 'salud', 'exámenes'],
  'Psicología': ['psicología', 'terapia', 'ansiedad', 'estrés', 'salud mental'],
  'Odontología': ['odontología', 'dientes', 'limpieza', 'ortodoncia', 'caries'],
  'Nutrición': ['nutrición', 'dieta', 'alimentación', 'saludable', 'bajar de peso'],
  'Consulta veterinaria': ['veterinaria', 'mascotas', 'perros', 'gatos', 'consulta', 'vacunas'],
  'Peluquería canina': ['peluquería', 'mascotas', 'baño', 'corte', 'perros'],
  'Emergencias mascotas': ['emergencia', 'mascotas', 'urgencia', 'veterinaria', '24 horas'],
  'Plomería': ['plomería', 'tuberías', 'fugas', 'baño', 'cocina', 'reparación'],
  'Electricidad': ['electricidad', 'instalación', 'luces', 'cortocircuito', 'reparación', 'mantenimiento'],
  'Jardinería': ['jardinería', 'jardín', 'poda', 'plantas', 'césped', 'mantenimiento'],
  'Limpieza': ['limpieza', 'hogar', 'oficina', 'desinfección', 'profunda'],
  'Pintura': ['pintura', 'paredes', 'interiores', 'exteriores', 'brocha'],
  'Restaurante': ['restaurante', 'comida', 'almuerzo', 'cena', 'menú'],
  'Comida rápida': ['comida rápida', 'hamburguesas', 'pizza', 'entregas', 'domicilio'],
  'Panadería': ['panadería', 'pan', 'pasteles', 'repostería', 'encargos'],
  'Catering': ['catering', 'eventos', 'buffet', 'recepciones', 'empresarial'],
  'Peluquería': ['peluquería', 'corte', 'tintura', 'peinado', 'tratamiento'],
  'Barbería': ['barbería', 'corte', 'barba', 'perfilado', 'estilo'],
  'Uñas': ['uñas', 'manicure', 'pedicure', 'acrílicas', 'gel'],
  'Maquillaje': ['maquillaje', 'eventos', 'social', 'profesional', 'novias'],
  'Tutorías': ['tutoría', 'clases', 'matemáticas', 'física', 'química', 'apoyo'],
  'Idiomas': ['idiomas', 'inglés', 'clases', 'conversación', 'gramática'],
  'Música': ['música', 'instrumentos', 'clases', 'guitarra', 'piano'],
  'Tecnología': ['tecnología', 'programación', 'web', 'diseño', 'informática'],
  'Costura': ['costura', 'arreglos', 'ropa', 'bastillas', 'creaciones'],
  'Arreglo de ropa': ['arreglos', 'ropa', 'bastillas', 'cierres', 'remiendos'],
  'Zapatería': ['zapatos', 'reparación', 'suelas', 'tapas', 'lustre'],
  'Contabilidad': ['contabilidad', 'impuestos', 'declaraciones', 'facturación', 'nómina'],
  'Legal': ['legal', 'abogado', 'consultoría', 'contratos', 'trámites'],
  'Seguros': ['seguros', 'autos', 'vida', 'hogar', 'salud'],
  'Inmobiliaria': ['inmobiliaria', 'propiedades', 'venta', 'alquiler', 'asesoría'],
}

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

type DayAvailability = { open: boolean; from: string; to: string }
type Availability = Record<string, DayAvailability>

const defaultAvailability: Availability = {
  monday: { open: true, from: '08:00', to: '18:00' },
  tuesday: { open: true, from: '08:00', to: '18:00' },
  wednesday: { open: true, from: '08:00', to: '18:00' },
  thursday: { open: true, from: '08:00', to: '18:00' },
  friday: { open: true, from: '08:00', to: '18:00' },
  saturday: { open: false, from: '09:00', to: '14:00' },
  sunday: { open: false, from: '09:00', to: '14:00' },
}

const parseAvailability = (json: Record<string, unknown> | undefined | null): Availability => {
  if (!json || typeof json !== 'object') return { ...defaultAvailability }
  const result: Availability = {}
  for (const day of DAYS) {
    const d = json[day.key] as Record<string, unknown> | undefined
    result[day.key] = d && typeof d === 'object'
      ? { open: Boolean(d.open), from: String(d.from || '09:00'), to: String(d.to || '18:00') }
      : { ...defaultAvailability[day.key] }
  }
  return result
}

export default function ProviderDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingService, setCreatingService] = useState(false)
  const [providerLoadError, setProviderLoadError] = useState(false)

  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])

  const [form, setForm] = useState({
    business_name: '',
    category: '',
    subcategory: '',
    description: '',
    avatar_url: '',
    address: '',
    service_area: '',
    phone: '',
    whatsapp: '',
    contact_email: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    linkedin_url: '',
    location_lat: '',
    location_lng: '',
    price_min: '',
    price_max: '',
    response_time_hours: '',
    available_now: false,
    search_tags: [] as string[],
    service_keywords: [] as string[],
  })

  const [availability, setAvailability] = useState<Availability>({ ...defaultAvailability })

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price_estimate: '',
    price_min: '',
    price_max: '',
    tags: '',
  })

  const [showMapModal, setShowMapModal] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.180653, -78.467834])
  const [pickingLocation, setPickingLocation] = useState(false)
  const [customTagInput, setCustomTagInput] = useState('')
  const [customKeywordInput, setCustomKeywordInput] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.is_provider) {
      loadData()
    } else if (user && !user.is_provider) {
      setLoading(false)
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    setProviderLoadError(false)
    try {
      const [providerRes, servicesRes] = await Promise.all([
        api.get(`/providers/${user!.id}`),
        api.get('/providers/me/services'),
      ])
      const p = providerRes.data as Provider
      setProvider(p)
      setForm({
        business_name: p.business_name || '',
        category: p.category || '',
        subcategory: p.subcategory || '',
        description: p.description || '',
        avatar_url: p.avatar_url || '',
        address: p.address || '',
        service_area: p.service_area || '',
        phone: p.phone || '',
        whatsapp: p.whatsapp || '',
        contact_email: p.contact_email || '',
        website_url: p.website_url || '',
        facebook_url: p.facebook_url || '',
        instagram_url: p.instagram_url || '',
        tiktok_url: p.tiktok_url || '',
        linkedin_url: p.linkedin_url || '',
        price_min: p.price_min !== null ? String(p.price_min) : '',
        price_max: p.price_max !== null ? String(p.price_max) : '',
        response_time_hours: p.response_time_hours !== null ? String(p.response_time_hours) : '',
        location_lat: p.location_lat !== null ? String(p.location_lat) : '',
        location_lng: p.location_lng !== null ? String(p.location_lng) : '',
        available_now: p.available_now || false,
        search_tags: p.search_tags || [],
        service_keywords: p.service_keywords || [],
      })
      setAvailability(parseAvailability(p.availability_json))
      if (p.location_lat != null && p.location_lng != null) {
        setMapCenter([Number(p.location_lat), Number(p.location_lng)])
      }
      setServices(servicesRes.data as Service[])
    } catch {
      setProviderLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const availabilityJson: Record<string, unknown> = {}
      for (const day of DAYS) {
        availabilityJson[day.key] = { ...availability[day.key] }
      }
      const payload: Record<string, unknown> = {
        business_name: form.business_name,
        category: form.category,
        subcategory: form.subcategory || null,
        description: form.description || null,
        avatar_url: form.avatar_url || null,
        address: form.address || null,
        service_area: form.service_area || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        contact_email: form.contact_email || null,
        website_url: form.website_url || null,
        facebook_url: form.facebook_url || null,
        instagram_url: form.instagram_url || null,
        tiktok_url: form.tiktok_url || null,
        linkedin_url: form.linkedin_url || null,
        price_min: form.price_min ? Number(form.price_min) : null,
        price_max: form.price_max ? Number(form.price_max) : null,
        response_time_hours: form.response_time_hours ? Number(form.response_time_hours) : null,
        location_lat: form.location_lat ? Number(form.location_lat) : null,
        location_lng: form.location_lng ? Number(form.location_lng) : null,
        available_now: form.available_now,
        search_tags: form.search_tags,
        service_keywords: form.service_keywords,
        availability_json: availabilityJson,
      }
      await api.put('/providers/me', payload)
      toast.success('Perfil guardado correctamente')
      loadData()
    } catch {
      toast.error('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateService = async () => {
    if (!newService.name.trim()) {
      toast.error('El nombre del servicio es obligatorio')
      return
    }
    setCreatingService(true)
    try {
      await api.post('/providers/me/services', {
        name: newService.name,
        description: newService.description || null,
        price_estimate: newService.price_estimate || null,
        price_min: newService.price_min ? Number(newService.price_min) : null,
        price_max: newService.price_max ? Number(newService.price_max) : null,
        tags: newService.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      toast.success('Servicio creado correctamente')
      setNewService({ name: '', description: '', price_estimate: '', price_min: '', price_max: '', tags: '' })
      const res = await api.get('/providers/me/services')
      setServices(res.data as Service[])
    } catch {
      toast.error('Error al crear el servicio')
    } finally {
      setCreatingService(false)
    }
  }

  const deactivateService = async (serviceId: string) => {
    try {
      await api.delete(`/providers/me/services/${serviceId}`)
      toast.success('Servicio desactivado')
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_active: false } : s))
    } catch {
      toast.error('Error al desactivar el servicio')
    }
  }

  const reactivateService = async (serviceId: string) => {
    try {
      await api.put(`/providers/me/services/${serviceId}`, { is_active: true })
      toast.success('Servicio reactivado')
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_active: true } : s))
    } catch {
      toast.error('Error al reactivar el servicio')
    }
  }

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      search_tags: prev.search_tags.includes(tag)
        ? prev.search_tags.filter(t => t !== tag)
        : [...prev.search_tags, tag],
    }))
  }

  const addCustomTag = () => {
    const tag = customTagInput.trim().toLowerCase()
    if (tag && !form.search_tags.includes(tag)) {
      setForm(prev => ({ ...prev, search_tags: [...prev.search_tags, tag] }))
    }
    setCustomTagInput('')
  }

  const toggleKeyword = (kw: string) => {
    setForm(prev => ({
      ...prev,
      service_keywords: prev.service_keywords.includes(kw)
        ? prev.service_keywords.filter(k => k !== kw)
        : [...prev.service_keywords, kw],
    }))
  }

  const addCustomKeyword = () => {
    const kw = customKeywordInput.trim().toLowerCase()
    if (kw && !form.service_keywords.includes(kw)) {
      setForm(prev => ({ ...prev, service_keywords: [...prev.service_keywords, kw] }))
    }
    setCustomKeywordInput('')
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-[#0B1020] items-center justify-center">
        <Loader2 size={32} className="text-[#6D5EF8] animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!user.is_provider) {
    return (
      <div className="flex h-screen bg-[#0B1020]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-6 py-4 flex items-center justify-between flex-shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white">
              <Menu size={18} strokeWidth={1.75} />
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mx-auto mb-4">
                <Briefcase size={28} className="text-[#6D5EF8]" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Panel de Proveedor</h2>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                Esta sección es exclusiva para proveedores registrados. Si deseas ofrecer tus servicios en Pandeum, regístrate como proveedor desde tu perfil.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (providerLoadError) {
    return (
      <div className="flex h-screen bg-[#0B1020]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1E2D4A]">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white">
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
              <Briefcase size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-[#151E2F] border border-[#1E2D4A] flex items-center justify-center mx-auto mb-4">
                <Briefcase size={28} className="text-red-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No se pudo cargar tu perfil de proveedor</h2>
              <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6">
                Hubo un problema al obtener tus datos. Verifica que tu cuenta esté registrada como proveedor.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={loadData}
                  className="inline-flex items-center gap-2 bg-[#6D5EF8] hover:bg-[#5B4FE0] text-white rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-200"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const inputClass = "w-full bg-[#111827] border border-[#1E2D4A] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6D5EF8]/50 transition-all duration-200"
  const labelClass = "block text-sm font-medium text-[#9CA3AF] mb-1.5"
  const cardClass = "bg-[#111827] border border-[#1E2D4A] rounded-2xl p-5"

  return (
    <div className="flex h-screen bg-[#0B1020]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-[#1E2D4A]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-2xl hover:bg-[#151E2F] transition-all duration-200 text-[#9CA3AF] hover:text-white">
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5EF8]/20 to-[#5B4FE0]/20 flex items-center justify-center">
            <Briefcase size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
          </div>
        </header>

        <div className="flex-1 px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Panel de Proveedor</h1>
            <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed">
              Completa la información de tu negocio para que Pandeum pueda recomendarte mejor.
            </p>
          </div>

          {/* Profile Form */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#6D5EF8]/10 flex items-center justify-center">
                <Save size={18} className="text-[#6D5EF8]" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Información del Negocio</h2>
                <p className="text-xs text-[#9CA3AF]">Datos generales de tu empresa o servicio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Nombre del negocio</label>
                <input type="text" value={form.business_name} onChange={e => handleFormChange('business_name', e.target.value)} className={inputClass} placeholder="Ej: TechSolutions EC" />
              </div>

              <div>
                <label className={labelClass}>Categoría</label>
                <select
                  value={form.category}
                  onChange={e => { handleFormChange('category', e.target.value); handleFormChange('subcategory', '') }}
                  className={inputClass}
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.keys(CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Subcategoría</label>
                <select
                  value={form.subcategory}
                  onChange={e => handleFormChange('subcategory', e.target.value)}
                  className={inputClass}
                  disabled={!form.category}
                >
                  <option value="">Selecciona una subcategoría</option>
                  {form.category && CATEGORIES[form.category]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Logo o imagen del negocio</label>
                <input type="text" value={form.avatar_url} onChange={e => handleFormChange('avatar_url', e.target.value)} className={inputClass} placeholder="https://..." />
                <p className="text-[10px] text-[#9CA3AF] mt-1">Próximamente podrás subir una imagen directamente.</p>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Descripción</label>
                <textarea value={form.description} onChange={e => handleFormChange('description', e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Describe los servicios que ofreces..." />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
              <div className="flex items-center gap-2 mb-4">
                <Phone size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-white">Contacto y Ubicación</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input type="text" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} className={inputClass} placeholder="+593 99 999 9999" />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp</label>
                  <input type="text" value={form.whatsapp} onChange={e => handleFormChange('whatsapp', e.target.value)} className={inputClass} placeholder="+593 99 999 9999" />
                </div>
                <div>
                  <label className={labelClass}>Dirección</label>
                  <input type="text" value={form.address} onChange={e => handleFormChange('address', e.target.value)} className={inputClass} placeholder="Av. Principal y calle secundaria" />
                </div>
                <div>
                  <label className={labelClass}>Zona de atención</label>
                  <input type="text" value={form.service_area} onChange={e => handleFormChange('service_area', e.target.value)} className={inputClass} placeholder="Ej: Quito, Guayaquil, Cuenca" />
                </div>
                <div>
                  <label className={labelClass}>Latitud</label>
                  <input type="number" step="any" value={form.location_lat} onChange={e => handleFormChange('location_lat', e.target.value)} className={inputClass} placeholder="-0.180653" />
                </div>
                <div>
                  <label className={labelClass}>Longitud</label>
                  <input type="number" step="any" value={form.location_lng} onChange={e => handleFormChange('location_lng', e.target.value)} className={inputClass} placeholder="-78.467834" />
                </div>
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-2">Estas coordenadas permiten calcular la distancia y mostrar la ruta en el mapa.</p>
              <button
                onClick={() => setShowMapModal(true)}
                className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-[12px] font-medium bg-[#151E2F] border border-[#1E2D4A] text-white hover:border-[#6D5EF8]/50 transition-all duration-200"
              >
                <MapPin size={14} strokeWidth={1.75} />
                Seleccionar ubicación en mapa
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-white">Contacto y Redes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Correo electrónico</label>
                  <input type="email" value={form.contact_email} onChange={e => handleFormChange('contact_email', e.target.value)} className={inputClass} placeholder="contacto@negocio.com" />
                </div>
                <div>
                  <label className={labelClass}>Sitio web</label>
                  <input type="url" value={form.website_url} onChange={e => handleFormChange('website_url', e.target.value)} className={inputClass} placeholder="https://negocio.com" />
                </div>
                <div>
                  <label className={labelClass}>Facebook</label>
                  <input type="url" value={form.facebook_url} onChange={e => handleFormChange('facebook_url', e.target.value)} className={inputClass} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input type="url" value={form.instagram_url} onChange={e => handleFormChange('instagram_url', e.target.value)} className={inputClass} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className={labelClass}>TikTok</label>
                  <input type="url" value={form.tiktok_url} onChange={e => handleFormChange('tiktok_url', e.target.value)} className={inputClass} placeholder="https://tiktok.com/..." />
                </div>
                <div>
                  <label className={labelClass}>LinkedIn</label>
                  <input type="url" value={form.linkedin_url} onChange={e => handleFormChange('linkedin_url', e.target.value)} className={inputClass} placeholder="https://linkedin.com/..." />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-white">Horario de Atención</h3>
              </div>
              <div className="space-y-2">
                {DAYS.map(day => {
                  const d = availability[day.key]
                  return (
                    <div key={day.key} className="flex items-center gap-3 bg-[#151E2F] rounded-xl px-4 py-2.5 border border-[#1E2D4A]">
                      <button
                        onClick={() => setAvailability(prev => ({ ...prev, [day.key]: { ...prev[day.key], open: !prev[day.key].open } }))}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${d?.open ? 'bg-[#6D5EF8]' : 'bg-[#1E2D4A]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${d?.open ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-sm w-16 flex-shrink-0 ${d?.open ? 'text-white' : 'text-[#9CA3AF]'}`}>{day.label}</span>
                      {d?.open ? (
                        <>
                          <input
                            type="time"
                            value={d?.from || '09:00'}
                            onChange={e => setAvailability(prev => ({ ...prev, [day.key]: { ...prev[day.key], from: e.target.value } }))}
                            className="w-24 bg-[#111827] border border-[#1E2D4A] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#6D5EF8]/50 transition-all"
                          />
                          <span className="text-[#9CA3AF] text-xs">a</span>
                          <input
                            type="time"
                            value={d?.to || '18:00'}
                            onChange={e => setAvailability(prev => ({ ...prev, [day.key]: { ...prev[day.key], to: e.target.value } }))}
                            className="w-24 bg-[#111827] border border-[#1E2D4A] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#6D5EF8]/50 transition-all"
                          />
                        </>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">Cerrado</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-white">Precios y Disponibilidad</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Precio mínimo ($)</label>
                  <input type="number" value={form.price_min} onChange={e => handleFormChange('price_min', e.target.value)} className={inputClass} placeholder="10" />
                </div>
                <div>
                  <label className={labelClass}>Precio máximo ($)</label>
                  <input type="number" value={form.price_max} onChange={e => handleFormChange('price_max', e.target.value)} className={inputClass} placeholder="100" />
                </div>
                <div>
                  <label className={labelClass}>Respuesta (horas)</label>
                  <input type="number" value={form.response_time_hours} onChange={e => handleFormChange('response_time_hours', e.target.value)} className={inputClass} placeholder="2" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => handleFormChange('available_now', !form.available_now)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.available_now ? 'bg-[#6D5EF8]' : 'bg-[#1E2D4A]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${form.available_now ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-white">Disponible ahora</span>
                {form.available_now && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Visible para clientes</span>}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-white">Etiquetas de búsqueda</h3>
              </div>
              {form.subcategory && SUGGESTED_TAGS[form.subcategory] && (
                <div className="mb-3">
                  <p className="text-[11px] text-[#9CA3AF] mb-2">Sugeridas para {form.subcategory}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS[form.subcategory].map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all duration-200 ${
                          form.search_tags.includes(tag)
                            ? 'bg-[#6D5EF8]/20 border-[#6D5EF8]/50 text-white'
                            : 'bg-[#151E2F] border-[#1E2D4A] text-[#9CA3AF] hover:border-[#6D5EF8]/30 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {form.search_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.search_tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#6D5EF8]/20 border border-[#6D5EF8]/50 text-white">
                      {tag}
                      <button onClick={() => toggleTag(tag)} className="hover:text-red-400 transition-colors">
                        <X size={12} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                  className={`${inputClass} flex-1`}
                  placeholder="Agregar etiqueta personalizada..."
                />
                <button
                  onClick={addCustomTag}
                  disabled={!customTagInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#6D5EF8] hover:bg-[#5B4FE0] disabled:bg-[#1E2D4A] disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200"
                >
                  <Plus size={16} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-white">Palabras Clave de Servicios</h3>
              </div>
              {form.subcategory && SUGGESTED_TAGS[form.subcategory] && (
                <div className="mb-3">
                  <p className="text-[11px] text-[#9CA3AF] mb-2">Sugeridas para {form.subcategory}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS[form.subcategory].map(kw => (
                      <button
                        key={kw}
                        onClick={() => toggleKeyword(kw)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all duration-200 ${
                          form.service_keywords.includes(kw)
                            ? 'bg-[#6D5EF8]/20 border-[#6D5EF8]/50 text-white'
                            : 'bg-[#151E2F] border-[#1E2D4A] text-[#9CA3AF] hover:border-[#6D5EF8]/30 hover:text-white'
                        }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {form.service_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.service_keywords.map(kw => (
                    <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#6D5EF8]/20 border border-[#6D5EF8]/50 text-white">
                      {kw}
                      <button onClick={() => toggleKeyword(kw)} className="hover:text-red-400 transition-colors">
                        <X size={12} strokeWidth={2} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customKeywordInput}
                  onChange={e => setCustomKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomKeyword() } }}
                  className={`${inputClass} flex-1`}
                  placeholder="Agregar palabra clave personalizada..."
                />
                <button
                  onClick={addCustomKeyword}
                  disabled={!customKeywordInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#6D5EF8] hover:bg-[#5B4FE0] disabled:bg-[#1E2D4A] disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200"
                >
                  <Plus size={16} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#6D5EF8] hover:bg-[#5B4FE0] disabled:bg-[#1E2D4A] disabled:cursor-not-allowed text-white rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-200"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={1.75} />}
                {saving ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </div>
          </div>

          {/* Services Section */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#6D5EF8]/10 flex items-center justify-center">
                <Briefcase size={18} className="text-[#6D5EF8]" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Servicios</h2>
                <p className="text-xs text-[#9CA3AF]">Gestiona los servicios que ofreces</p>
              </div>
            </div>

            {/* Create Service Form */}
            <div className="bg-[#151E2F] rounded-2xl p-4 mb-5 border border-[#1E2D4A]">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Plus size={14} className="text-[#6D5EF8]" strokeWidth={1.75} />
                Nuevo servicio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <input type="text" value={newService.name} onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))} className={inputClass} placeholder="Nombre del servicio" />
                </div>
                <div className="md:col-span-2">
                  <textarea value={newService.description} onChange={e => setNewService(prev => ({ ...prev, description: e.target.value }))} className={`${inputClass} min-h-[60px] resize-y`} placeholder="Descripción del servicio" />
                </div>
                <div>
                  <input type="text" value={newService.price_estimate} onChange={e => setNewService(prev => ({ ...prev, price_estimate: e.target.value }))} className={inputClass} placeholder="Precio estimado (ej: desde $50)" />
                </div>
                <div>
                  <input type="number" value={newService.price_min} onChange={e => setNewService(prev => ({ ...prev, price_min: e.target.value }))} className={inputClass} placeholder="Precio mínimo" />
                </div>
                <div>
                  <input type="number" value={newService.price_max} onChange={e => setNewService(prev => ({ ...prev, price_max: e.target.value }))} className={inputClass} placeholder="Precio máximo" />
                </div>
                <div>
                  <input type="text" value={newService.tags} onChange={e => setNewService(prev => ({ ...prev, tags: e.target.value }))} className={inputClass} placeholder="Tags (ej: reparación, garantía)" />
                </div>
              </div>
              <button
                onClick={handleCreateService}
                disabled={creatingService}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-[#6D5EF8] hover:bg-[#5B4FE0] disabled:bg-[#1E2D4A] disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
              >
                {creatingService ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={1.75} />}
                {creatingService ? 'Creando...' : 'Crear servicio'}
              </button>
            </div>

            {/* Services List */}
            {services.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-[#151E2F] flex items-center justify-center mx-auto mb-3">
                  <Briefcase size={20} className="text-[#1E2D4A]" strokeWidth={1.75} />
                </div>
                <p className="text-sm text-[#9CA3AF]">No tienes servicios registrados aún.</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Crea tu primer servicio usando el formulario de arriba.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.filter(s => s.is_active).map(service => (
                  <div key={service.id} className="bg-[#151E2F] border border-[#1E2D4A] rounded-2xl p-4 hover:border-[#1E2D4A]/80 transition-all duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white">{service.name}</h4>
                        {service.description && (
                          <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">{service.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {(service.price_estimate || service.price_min || service.price_max) && (
                            <span className="text-xs text-[#6D5EF8] flex items-center gap-1">
                              <DollarSign size={10} strokeWidth={2} />
                              {service.price_estimate || (service.price_min && service.price_max ? `$${service.price_min} - $${service.price_max}` : '')}
                            </span>
                          )}
                          {service.tags.length > 0 && service.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] bg-[#111827] text-[#9CA3AF] px-2 py-0.5 rounded-lg border border-[#1E2D4A]">
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 3 && (
                            <span className="text-[10px] text-[#9CA3AF]">+{service.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deactivateService(service.id)}
                        className="flex-shrink-0 text-[10px] text-red-400 hover:text-red-300 bg-[#111827] hover:bg-[#1A2440] px-3 py-1.5 rounded-xl transition-all duration-200"
                      >
                        Desactivar
                      </button>
                    </div>
                  </div>
                ))}
                {services.filter(s => !s.is_active).length > 0 && (
                  <details className="group">
                    <summary className="text-xs text-[#9CA3AF] cursor-pointer hover:text-white transition-colors duration-200 py-2">
                      Servicios desactivados ({services.filter(s => !s.is_active).length})
                    </summary>
                    <div className="space-y-2 mt-2">
                      {services.filter(s => !s.is_active).map(service => (
                        <div key={service.id} className="bg-[#151E2F]/50 border border-[#1E2D4A]/50 rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white">{service.name}</h4>
                              {service.description && (
                                <p className="text-xs text-[#9CA3AF] mt-1">{service.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] text-[#9CA3AF]">Inactivo</span>
                              <button
                                onClick={() => reactivateService(service.id)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-[#111827] hover:bg-[#1A2440] px-3 py-1.5 rounded-xl transition-all duration-200"
                              >
                                Reactivar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowMapModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#111827] border border-[#1E2D4A] rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2D4A]">
              <h3 className="text-sm font-semibold text-white">Seleccionar ubicación</h3>
              <button onClick={() => setShowMapModal(false)} className="p-1.5 rounded-xl hover:bg-[#151E2F] text-[#9CA3AF] hover:text-white transition-all">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <div className="h-[350px] w-full">
              <MapContainer center={mapCenter} zoom={14} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onClick={(lat: number, lng: number) => {
                  setMapCenter([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))])
                  setPickingLocation(true)
                }} />
                {pickingLocation && (
                  <Marker position={mapCenter}>
                    <Popup>Ubicación seleccionada</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            <div className="px-5 py-4 border-t border-[#1E2D4A] flex items-center justify-between">
              <div className="text-xs text-[#9CA3AF]">
                {pickingLocation ? (
                  <span>Lat: {mapCenter[0]}, Lng: {mapCenter[1]}</span>
                ) : (
                  <span>Haz clic en el mapa para seleccionar tu ubicación</span>
                )}
              </div>
              <button
                onClick={() => {
                  handleFormChange('location_lat', String(mapCenter[0]))
                  handleFormChange('location_lng', String(mapCenter[1]))
                  setShowMapModal(false)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#6D5EF8] hover:bg-[#5B4FE0] text-white text-xs font-medium transition-all duration-200"
              >
                <MapPin size={13} strokeWidth={1.75} />
                Usar esta ubicación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
