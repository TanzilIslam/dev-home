"use client";

import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { resendVerificationEmail } from "@/lib/supabase/queries";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type ResendFieldErrors = {
  email?: string;
  form?: string;
};

export function ResendVerificationForm() {
  const [errors, setErrors] = useState<ResendFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  function clearFieldError(field: keyof ResendFieldErrors) {
    setErrors((previous) => {
      if (!previous[field] && !previous.form) return previous;
      return { ...previous, [field]: undefined, form: undefined };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    const parsed = forgotPasswordSchema.safeParse({ email });

    if (!parsed.success) {
      const nextErrors: ResendFieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "email") {
          nextErrors.email ??= issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await resendVerificationEmail(parsed.data.email);

      if (error) {
        const message = error.message || "Unable to resend verification email.";
        setErrors({ form: message });
        toast.error(message);
        return;
      }

      setIsEmailSent(true);
      toast.success("Verification email sent.");
    } catch {
      const message = "Unable to resend verification email.";
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEmailSent) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="bg-primary/10 mb-4 inline-flex size-12 items-center justify-center rounded-full">
          <MailCheck className="text-primary size-6" />
        </div>
        <h3 className="text-base font-semibold">Check your email</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          We sent a new verification link to your inbox. Click the link to activate your account.
        </p>
        <div className="bg-muted mt-4 w-full rounded-md px-4 py-3">
          <p className="text-muted-foreground text-xs">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              type="button"
              className="text-foreground font-medium underline"
              onClick={() => setIsEmailSent(false)}
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={errors.email ? true : undefined}
          onChange={() => clearFieldError("email")}
        />
        {errors.email ? <p className="text-destructive text-sm">{errors.email}</p> : null}
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
            Sending...
          </>
        ) : (
          "Resend verification email"
        )}
      </Button>
    </form>
  );
}
