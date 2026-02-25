"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signupSchema } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

type SignupFormProps = {
  serverError?: string;
};

type SignupFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

function toFieldErrors(message: string): SignupFieldErrors {
  return { form: message };
}

export function SignupForm({ serverError }: SignupFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<SignupFieldErrors>(
    serverError ? toFieldErrors(serverError) : {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFieldError(field: keyof SignupFieldErrors) {
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
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const parsed = signupSchema.safeParse({
      name,
      email,
      password,
    });

    if (!parsed.success) {
      const nextErrors: SignupFieldErrors = {};

      for (const issue of parsed.error.issues) {
        const path = issue.path[0];

        if (path === "name" || path === "email" || path === "password") {
          nextErrors[path] ??= issue.message;
        }
      }

      if (!nextErrors.name && !nextErrors.email && !nextErrors.password) {
        nextErrors.form = "Please check the form and try again.";
      }

      setErrors(nextErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
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
        (response.ok
          ? "Account created successfully. Please log in."
          : "Unable to create your account right now.");

      if (!response.ok) {
        setErrors({ form: message });
        toast.error(message);
        return;
      }

      toast.success(message);
      router.push("/login");
      router.refresh();
    } catch {
      const message = "Unable to create your account right now.";
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          disabled={isSubmitting}
          aria-invalid={errors.name ? true : undefined}
          onChange={() => clearFieldError("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name}</p>
        ) : null}
      </div>
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
          autoComplete="new-password"
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
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
