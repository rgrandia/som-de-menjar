import { useState } from 'react'

interface Props {
  onAcces: () => void
}

export default function Proteccio({ onAcces }: Props) {
  const [contrasenya, setContrasenya] = useState('')
  const [error, setError] = useState(false)

  const CONTRASENYA_CORRECTA = 'Grandia' // Canvia per la teva contrasenya

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (contrasenya === CONTRASENYA_CORRECTA) {
      onAcces()
      localStorage.setItem('acces_permes', 'true') // Recordar accés
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4">
        <div className="text-center mb-6">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Som de Menjar</h1>
          <p className="text-gray-500 text-sm mt-1">Accés privat</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={contrasenya}
              onChange={(e) => {
                setContrasenya(e.target.value)
                setError(false)
              }}
              placeholder="Contrasenya"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">
              Contrasenya incorrecta
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
