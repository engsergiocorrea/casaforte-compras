'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { gerarImagensFaltando } from '@/app/(app)/catalogo/actions'

// Busca na internet a foto dos materiais que estão sem foto.
export function GerarImagensButton({ semImagem }: { semImagem: number }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  if (semImagem === 0) return null

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          toast.info('Procurando fotos nas lojas… pode levar um minuto.')
          const r = await gerarImagensFaltando()
          if (!r.success) {
            toast.error(r.error ?? 'Não foi possível buscar as fotos.')
          } else {
            toast.success(
              r.faltam && r.faltam > 0
                ? `${r.geradas} foto(s) encontrada(s). Faltam ${r.faltam}: clique de novo para continuar.`
                : `${r.geradas} foto(s) encontrada(s).`
            )
          }
          router.refresh()
        })
      }
    >
      <Sparkles className="size-4" />
      {pending ? 'Procurando fotos…' : `Buscar fotos (${semImagem})`}
    </Button>
  )
}
