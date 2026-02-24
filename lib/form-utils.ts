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
