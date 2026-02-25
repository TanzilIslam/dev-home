"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

type LoginFormProps = {
  serverError?: string;
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

function toFieldErrors(message: string): LoginFieldErrors {
  return { form: message };
}

export function LoginForm({ serverError }: LoginFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<LoginFieldErrors>(
    serverError ? toFieldErrors(serverError) : {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFieldError(field: keyof LoginFieldErrors) {
    setErrors((previous) => {
      if (!previous[field] && !previous.form) {
        return previous;
      }

      return {
        ...previous,
        [field]: undefined,
        form: undefined,
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const parsed = loginSchema.safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      const nextErrors: LoginFieldErrors = {};

      for (const issue of parsed.error.issues) {
        const path = issue.path[0];

        if (path === "email" || path === "password") {
          nextErrors[path] ??= issue.message;
        }
      }

      if (!nextErrors.email && !nextErrors.password) {
        nextErrors.form = "Please check the form and try again.";
      }

      setErrors(nextErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      const message =
        payload?.message ??
        (response.ok ? "Logged in successfully." : "Unable to log in right now.");

      if (!response.ok) {
        setErrors({ form: message });
        toast.error(message);
        return;
      }

      toast.success(message);
      router.push("/dashboard");
      router.refresh();
    } catch {
      const message = "Unable to log in right now.";
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          disabled={isSubmitting}
          aria-invalid={errors.password ? true : undefined}
          onChange={() => clearFieldError("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password}</p>
        ) : null}
      </div>
      {errors.form ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.form}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner className="size-4" />
            Logging in...
          </>
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  );
}
