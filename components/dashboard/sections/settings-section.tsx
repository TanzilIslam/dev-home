"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ApiRequestError, updateProfile, changePassword } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type SettingsSectionProps = {
  user: { email: string; name: string | null };
};

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or less."),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.").max(72, "New password must be 72 characters or less."),
  confirmPassword: z.string().min(1, "Please confirm your new password."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ProfileErrors = {
  name?: string;
  form?: string;
};

type PasswordErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

function FormErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="text-sm text-destructive">{message}</p>;
}

export function SettingsSection({ user }: SettingsSectionProps) {
  // Profile form state
  const [name, setName] = useState(user.name ?? "");
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProfileSubmitting) {
      return;
    }

    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) {
      const nextErrors: ProfileErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "name") {
          nextErrors.name ??= issue.message;
        }
      }
      setProfileErrors(nextErrors);
      return;
    }

    setProfileErrors({});
    setIsProfileSubmitting(true);

    try {
      const updatedUser = await updateProfile({ name: parsed.data.name });
      if (updatedUser) {
        setName(updatedUser.name ?? "");
      }
      toast.success("Profile updated successfully.");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fieldErrors) {
          const nextErrors: ProfileErrors = {};
          if (error.fieldErrors.name) {
            nextErrors.name = error.fieldErrors.name[0];
          }
          setProfileErrors(nextErrors);
        } else {
          setProfileErrors({ form: error.message });
        }
        toast.error(error.message);
      } else {
        const message = "Unable to update profile right now.";
        setProfileErrors({ form: message });
        toast.error(message);
      }
    } finally {
      setIsProfileSubmitting(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPasswordSubmitting) {
      return;
    }

    const parsed = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextErrors: PasswordErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof PasswordErrors;
        if (path === "currentPassword" || path === "newPassword" || path === "confirmPassword") {
          nextErrors[path] ??= issue.message;
        }
      }
      setPasswordErrors(nextErrors);
      return;
    }

    setPasswordErrors({});
    setIsPasswordSubmitting(true);

    try {
      await changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fieldErrors) {
          const nextErrors: PasswordErrors = {};
          if (error.fieldErrors.currentPassword) {
            nextErrors.currentPassword = error.fieldErrors.currentPassword[0];
          }
          if (error.fieldErrors.newPassword) {
            nextErrors.newPassword = error.fieldErrors.newPassword[0];
          }
          if (error.fieldErrors.confirmPassword) {
            nextErrors.confirmPassword = error.fieldErrors.confirmPassword[0];
          }
          setPasswordErrors(nextErrors);
        } else {
          setPasswordErrors({ form: error.message });
        }
        toast.error(error.message);
      } else {
        const message = "Unable to change password right now.";
        setPasswordErrors({ form: message });
        toast.error(message);
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="profile-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="profile-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setProfileErrors((prev) => ({ ...prev, name: undefined, form: undefined }));
                }}
                disabled={isProfileSubmitting}
                aria-invalid={profileErrors.name ? true : undefined}
              />
              <FormErrorText message={profileErrors.name} />
            </div>
            {profileErrors.form ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {profileErrors.form}
              </p>
            ) : null}
            <Button type="submit" disabled={isProfileSubmitting}>
              {isProfileSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium">
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined, form: undefined }));
                }}
                disabled={isPasswordSubmitting}
                aria-invalid={passwordErrors.currentPassword ? true : undefined}
              />
              <FormErrorText message={passwordErrors.currentPassword} />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordErrors((prev) => ({ ...prev, newPassword: undefined, form: undefined }));
                }}
                disabled={isPasswordSubmitting}
                aria-invalid={passwordErrors.newPassword ? true : undefined}
              />
              <FormErrorText message={passwordErrors.newPassword} />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined, form: undefined }));
                }}
                disabled={isPasswordSubmitting}
                aria-invalid={passwordErrors.confirmPassword ? true : undefined}
              />
              <FormErrorText message={passwordErrors.confirmPassword} />
            </div>
            {passwordErrors.form ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {passwordErrors.form}
              </p>
            ) : null}
            <Button type="submit" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
