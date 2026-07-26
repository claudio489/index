import React, { useEffect } from 'react'
import { ProfileForm } from '@/components/ProfileForm'
import { DivespotAccountSection } from '@/components/DivespotAccountSection'
import { useUserProfileStore } from '@/stores/userProfileStore'
import { useDivespotAuthStore } from '@/stores/useDivespotAuthStore'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { loadProfile, hydrateFromServer } = useUserProfileStore()
  const userId = useDivespotAuthStore(s => s.userId)

  useEffect(() => {
    loadProfile()
    if (userId) {
      hydrateFromServer()
    }
  }, [loadProfile, hydrateFromServer, userId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Perfil de Usuario</h1>
        </div>
      </div>
      <div className="py-6">
        <ProfileForm />
        <div className="max-w-2xl mx-auto px-6 mt-6">
          <DivespotAccountSection />
        </div>
      </div>
    </div>
  )
}