'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { gerarImagensFaltando } from '@/app/(app)/catalogo/actions'

// Gera com IA a imagem dos materiais que estão sem imagem.
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
          toast.info('Gerando imagens com IA… pode levar um minuto.')
          const r = await gerarImagensFaltando()
          if (!r.success) {
            toast.error(r.error ?? 'Não foi possível gerar as imagens.')
          } else {
            toast.success(
              r.faltam && r.faltam > 0
                ? `${r.geradas} imagem(ns) gerada(s). Faltam ${r.faltam}: clique de novo para continuar.`
                : `${r.geradas} imagem(ns) gerada(s).`
            )
          }
          router.refresh()
        })
      }
    >
      <Sparkles className="size-4" />
      {pending ? 'Gerando imagens…' : `Gerar imagens com IA (${semImagem})`}
    </Button>
  )
}
