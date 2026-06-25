import Image from 'next/image'

export function SiteLocked() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#c8102e] to-[#006341] px-6 text-white">
      <div className="max-w-sm w-full text-center">
        <Image
          src="/icon.png"
          alt="Porra"
          width={88}
          height={88}
          className="rounded-2xl mx-auto mb-6 shadow-lg"
        />
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-black mb-3">Acceso cerrado</h1>
        <p className="text-sm text-white/90 leading-relaxed mb-6">
          La porra está cerrada y nadie puede entrar ahora mismo.
        </p>
        <div className="bg-white/15 rounded-2xl px-5 py-4 backdrop-blur-sm">
          <p className="text-base font-black mb-1">👉 La culpa es de Rier</p>
          <p className="text-sm text-white/90">Preguntadle a él.</p>
        </div>
      </div>
    </div>
  )
}
