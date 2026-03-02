"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePassword } from "@/lib/supabase/queries";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

type ResetPasswordFieldErrors = {
  password?: string;
  confirmPassword?: string;
  form?: string;
};

export function ResetPasswordForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<ResetPasswordFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFieldError(field: keyof ResetPasswordFieldErrors) {
    setErrors((previous) => {
      if (!previous[field] && !previous.form) return previous;
      return { ...previous, [field]: undefined, form: undefined };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!parsed.success) {
      const nextErrors: ResetPasswordFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "password" || path === "confirmPassword") {
          nextErrors[path] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(parsed.data.password);

      if (error) {
        const message = error.message || "Unable to reset password.";
        setErrors({ form: message });
        toast.error(message);
        return;
      }

      toast.success("Password updated successfully.");
      router.push("/dashboard");
    } catch {
      const message = "Unable to reset password.";
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={errors.password ? true : undefined}
          onChange={() => clearFieldError("password")}
        />
        {errors.password ? <p className="text-destructive text-sm">{errors.password}</p> : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm password
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={errors.confirmPassword ? true : undefined}
          onChange={() => clearFieldError("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-destructive text-sm">{errors.confirmPassword}</p>
        ) : null}
      </div>
      {errors.form ? (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {errors.form}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner className="size-4" />
            Updating...
          </>
        ) : (
          "Set new password"
        )}
      </Button>
    </form>
  );
}
