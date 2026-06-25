'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type ActionResult = { success: boolean; error?: string }

export function ConfirmActionButton({
  label,
  title,
  description,
  action,
  variant = 'outline',
  successMessage,
  disabled = false,
}: {
  label: string
  title: string
  description: string
  action: () => Promise<ActionResult>
  variant?: 'outline' | 'destructive'
  successMessage: string
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        toast.success(successMessage)
      } else {
        toast.error(result.error ?? 'Não foi possível concluir a ação.')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant={variant} size="sm" disabled={isPending || disabled} />}
      >
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
