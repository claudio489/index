import React, { useState, useEffect, useRef } from 'react'
import { useUserProfileStore } from '@/stores/userProfileStore'
import type { UserProfile } from '@/stores/userProfileStore'
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore'
import { supabaseDivespot } from '@/lib/supabaseDivespot'
import { Camera, Save, User, Award, Settings, Phone, Mail, Calendar, MapPin, Ruler, Globe, Loader2 } from 'lucide-react'

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        const maxSize = 400
        let { width, height } = img
        if (width > height) {
          if (width > maxSize) { height *= maxSize / width; width = maxSize }
        } else {
          if (height > maxSize) { width *= maxSize / height; height = maxSize }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('No se pudo procesar la imagen')); return }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen')),
          'image/jpeg',
          0.8
        )
      }
      img.onerror = () => reject(new Error('No se pudo leer la imagen'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

export const ProfileForm: React.FC = () => {
  const { profile, setProfile, isLoading, syncProfile, lastError } = useUserProfileStore()
  const userId = useDivespotAuthStore((s) => s.userId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    certifications: [],
    diveLevel: '',
    trainingCenter: '',
    instructor: '',
    preferredLanguage: 'es',
    units: 'metric',
    photoUrl: '',
  })

  const [certInput, setCertInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate || '',
        certifications: profile.certifications || [],
        diveLevel: profile.diveLevel || '',
        trainingCenter: profile.trainingCenter || '',
        instructor: profile.instructor || '',
        preferredLanguage: profile.preferredLanguage || 'es',
        units: profile.units || 'metric',
        photoUrl: profile.photoUrl || '',
      })
    }
  }, [profile])

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setPhotoError('')
    setUploadingPhoto(true)
    try {
      const compressed = await compressImage(file)
      const path = `${userId}/avatar.jpg`

      const { error: uploadError } = await supabaseDivespot.storage
        .from('avatars')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: urlData } = supabaseDivespot.storage.from('avatars').getPublicUrl(path)
      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`

      handleChange('photoUrl', photoUrl)
      setProfile({ ...formData, photoUrl })
    } catch (err: any) {
      setPhotoError(err.message || 'Error al subir la foto')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const addCertification = () => {
    if (certInput.trim()) {
      const newCerts = [...(formData.certifications || []), certInput.trim()]
      handleChange('certifications', newCerts)
      setCertInput('')
    }
  }

  const removeCertification = (index: number) => {
    const newCerts = (formData.certifications || []).filter((_, i) => i !== index)
    handleChange('certifications', newCerts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfile(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSync = async () => {
    await syncProfile()
  }

  const inputClass = "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
  const labelClass = "block text-sm font-medium text-white/70 mb-1.5"

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
            <p className="text-white/50 text-sm">Gestiona tu informacion de buceo</p>
          </div>
        </div>
      </div>

      {lastError && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          Error: {lastError}
        </div>
      )}

      {saved && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
          <Save className="w-4 h-4" /> Perfil guardado correctamente
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto de perfil */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center border-2 border-dashed border-white/20 overflow-hidden">
              {uploadingPhoto ? (
                <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
              ) : formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-white/30" />
              )}
            </div>
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium">Foto de perfil</h3>
            <p className="text-white/40 text-sm">
              {uploadingPhoto ? 'Subiendo...' : 'Sube una foto para tu perfil'}
            </p>
            {photoError && <p className="text-red-400 text-xs mt-1">{photoError}</p>}
          </div>
        </div>

        {/* Informacion basica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              <User className="w-4 h-4 inline mr-1" /> Nombre completo *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className={inputClass}
              placeholder="Juan Perez"
            />
          </div>
          <div>
            <label className={labelClass}>
              <Mail className="w-4 h-4 inline mr-1" /> Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={inputClass}
              placeholder="juan@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>
              <Phone className="w-4 h-4 inline mr-1" /> Telefono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={inputClass}
              placeholder="+34 600 000 000"
            />
          </div>
          <div>
            <label className={labelClass}>
              <Calendar className="w-4 h-4 inline mr-1" /> Fecha de nacimiento
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Informacion de buceo */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" /> Informacion de Buceo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nivel de buceo</label>
              <select
                value={formData.diveLevel}
                onChange={(e) => handleChange('diveLevel', e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-gray-900">Seleccionar...</option>
                <option value="open_water" className="bg-gray-900">Open Water</option>
                <option value="advanced" className="bg-gray-900">Advanced Open Water</option>
                <option value="rescue" className="bg-gray-900">Rescue Diver</option>
                <option value="divemaster" className="bg-gray-900">Divemaster</option>
                <option value="instructor" className="bg-gray-900">Instructor</option>
                <option value="technical" className="bg-gray-900">Technical Diver</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                <MapPin className="w-4 h-4 inline mr-1" /> Centro de formacion
              </label>
              <input
                type="text"
                value={formData.trainingCenter}
                onChange={(e) => handleChange('trainingCenter', e.target.value)}
                className={inputClass}
                placeholder="PADI Dive Center"
              />
            </div>
            <div>
              <label className={labelClass}>Instructor</label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => handleChange('instructor', e.target.value)}
                className={inputClass}
                placeholder="Nombre del instructor"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Ruler className="w-4 h-4 inline mr-1" /> Sistema de unidades
              </label>
              <div className="flex gap-2">
                {(['metric', 'imperial'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleChange('units', unit)}
                    className={`flex-1 py-2.5 rounded-lg border transition-all ${
                      formData.units === unit
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {unit === 'metric' ? 'Metrico (m, C, bar)' : 'Imperial (ft, F, psi)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Certificaciones */}
          <div>
            <label className={labelClass}>
              <Award className="w-4 h-4 inline mr-1" /> Certificaciones
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                className={`${inputClass} flex-1`}
                placeholder="Anadir certificacion (ej: Nitrox, Deep Diver...)"
              />
              <button
                type="button"
                onClick={addCertification}
                className="px-4 py-2.5 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                Anadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.certifications || []).map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="hover:text-red-400 transition-colors"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Preferencias */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-white font-medium flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-cyan-400" /> Preferencias
          </h3>
          <div>
            <label className={labelClass}>
              <Globe className="w-4 h-4 inline mr-1" /> Idioma preferido
            </label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => handleChange('preferredLanguage', e.target.value)}
              className={inputClass}
            >
              <option value="es" className="bg-gray-900">Espanol</option>
              <option value="en" className="bg-gray-900">English</option>
              <option value="fr" className="bg-gray-900">Francais</option>
              <option value="de" className="bg-gray-900">Deutsch</option>
              <option value="it" className="bg-gray-900">Italiano</option>
            </select>
          </div>
        </div>

        {/* Botones de accion */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isLoading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isLoading}
            className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/15 transition-all disabled:opacity-50"
          >
            Sincronizar
          </button>
        </div>
      </form>
    </div>
  )
}