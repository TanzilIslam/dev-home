import { toast } from "sonner";
import { SupabaseError } from "@/lib/supabase/queries";
import { firstFieldErrors, type FormErrorMap } from "@/lib/form-utils";

export function showRequestError<TFields extends string>(
  error: unknown,
  fields: readonly TFields[],
  setErrors: (nextErrors: FormErrorMap<TFields>) => void,
  fallbackMessage: string,
) {
  if (error instanceof SupabaseError) {
    const mapped = firstFieldErrors(fields, error.fieldErrors);
    setErrors({
      ...mapped,
      form: error.message,
    });
    toast.error(error.message);
    return;
  }

  setErrors({ form: fallbackMessage } as FormErrorMap<TFields>);
  toast.error(fallbackMessage);
}
