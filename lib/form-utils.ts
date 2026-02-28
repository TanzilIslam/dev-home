import type { ZodError } from "zod";

export type FormErrorMap<TFields extends string> = Partial<Record<TFields, string>> & {
  form?: string;
};

export function firstFieldErrors<TFields extends string>(
  keys: readonly TFields[],
  errors?: Record<string, string[]>,
) {
  const mapped: FormErrorMap<TFields> = {};

  if (!errors) {
    return mapped;
  }

  for (const key of keys) {
    const fieldErrors = errors[key];
    if (fieldErrors?.length) {
      mapped[key] = fieldErrors[0] as FormErrorMap<TFields>[TFields];
    }
  }

  const formError = errors.form?.[0];
  if (formError) {
    mapped.form = formError;
  }

  return mapped;
}

export function toValidationErrors<TFields extends string>(
  fields: readonly TFields[],
  error: ZodError,
): FormErrorMap<TFields> {
  const flattened = error.flatten();
  const mapped = firstFieldErrors(
    fields,
    flattened.fieldErrors as Record<string, string[]>,
  );

  if (flattened.formErrors[0]) {
    mapped.form = flattened.formErrors[0];
  }

  return mapped;
}

export function clearFieldError<TFields extends string>(
  setErrors: (fn: (prev: FormErrorMap<TFields>) => FormErrorMap<TFields>) => void,
  ...fields: TFields[]
) {
  setErrors((prev) => {
    const next: FormErrorMap<TFields> = { ...prev, form: undefined };
    for (const field of fields) {
      delete next[field];
    }
    return next;
  });
}

export function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toNullableNumber(value: string) {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
