'use client'
import { useState, type InputHTMLAttributes } from 'react'
import { useFormStatus } from 'react-dom'

export function CampoSenha({ rotulo = 'Senha', ...input }: { rotulo?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [ver, setVer] = useState(false)
  return (
    <label className="cfl-campo">
      <span>{rotulo}</span>
      <div className="cfl-senha">
        <input className="cfl-in" type={ver ? 'text' : 'password'} autoComplete="current-password" {...input} />
        <button type="button" className="cfl-ver" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}>
          {ver ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </label>
  )
}

// Funciona com server action (useFormStatus) e com onSubmit (prop carregando).
export function BotaoEntrar({ carregando, texto = 'Entrar', textoCarregando = 'Entrando…' }: { carregando?: boolean; texto?: string; textoCarregando?: string }) {
  const { pending } = useFormStatus()
  const ocupado = carregando || pending
  return (
    <button className="cfl-btn" type="submit" disabled={ocupado}>
      {ocupado ? textoCarregando : texto}
    </button>
  )
}
