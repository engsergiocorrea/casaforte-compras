'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { enviarPedidoPorWhatsapp } from '@/app/(app)/pedidos/[id]/whatsapp-actions'
import type { Fornecedor } from '@/types/database'

export function EnviarWhatsappDialog({
  pedidoId,
  fornecedores,
}: {
  pedidoId: string
  fornecedores: Fornecedor[]
}) {
  const [open, setOpen] = useState(false)
  const [fornecedorId, setFornecedorId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const fornecedorSelecionado = fornecedores.find((f) => f.id === fornecedorId)

  function handleConfirm() {
    if (!fornecedorId) {
      toast.error('Selecione um fornecedor.')
      return
    }

    startTransition(async () => {
      const result = await enviarPedidoPorWhatsapp(pedidoId, fornecedorId)
      if (result.success) {
        toast.success('Pedido enviado por WhatsApp.')
        setOpen(false)
        setFornecedorId('')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Erro ao enviar pedido por WhatsApp.')
      }
    })
  }

  if (fornecedores.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Envio ao fornecedor</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
            Enviar por WhatsApp
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar pedido por WhatsApp</DialogTitle>
              <DialogDescription>
                Selecione o fornecedor que receberá o link do documento deste pedido via WhatsApp.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select value={fornecedorId} onValueChange={(value) => setFornecedorId(value ?? '')}>
                <SelectTrigger id="fornecedor" className="w-full">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome_fantasia}
                      {fornecedor.telefone_whatsapp ? ` · ${fornecedor.telefone_whatsapp}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fornecedorSelecionado && !fornecedorSelecionado.telefone_whatsapp ? (
                <p className="text-sm text-destructive">
                  Este fornecedor não possui telefone de WhatsApp cadastrado.
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={isPending || !fornecedorId}>
                {isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
