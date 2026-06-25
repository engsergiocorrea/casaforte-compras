export type ActionResult = { success: boolean; error?: string }

export type FormActionState = ActionResult & {
  fieldErrors?: Record<string, string[]>
}

export const initialFormActionState: FormActionState = { success: false }
