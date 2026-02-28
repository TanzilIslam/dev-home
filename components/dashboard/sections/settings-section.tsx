"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { updateProfile, changePassword } from "@/lib/api/client";
import { profileSchema, changePasswordSchema } from "@/lib/auth/validation";
import { showRequestError } from "@/lib/form-error-handler";
import { clearFieldError, toValidationErrors, type FormErrorMap } from "@/lib/form-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormErrorText } from "@/components/ui/form-error-text";
import { Spinner } from "@/components/ui/spinner";

type SettingsSectionProps = {
  user: { email: string; name: string | null };
};

const PROFILE_FIELDS = ["name"] as const;
const PASSWORD_FIELDS = ["currentPassword", "newPassword", "confirmPassword"] as const;

export function SettingsSection({ user }: SettingsSectionProps) {
  const [name, setName] = useState(user.name ?? "");
  const [profileErrors, setProfileErrors] = useState<FormErrorMap<(typeof PROFILE_FIELDS)[number]>>({});
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<FormErrorMap<(typeof PASSWORD_FIELDS)[number]>>({});
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProfileSubmitting) {
      return;
    }

    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) {
      setProfileErrors(toValidationErrors(PROFILE_FIELDS, parsed.error));
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
      showRequestError(error, PROFILE_FIELDS, setProfileErrors, "Unable to update profile right now.");
    } finally {
      setIsProfileSubmitting(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPasswordSubmitting) {
      return;
    }

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      setPasswordErrors(toValidationErrors(PASSWORD_FIELDS, parsed.error));
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
      showRequestError(error, PASSWORD_FIELDS, setPasswordErrors, "Unable to change password right now.");
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
                  clearFieldError(setProfileErrors, "name");
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
                  clearFieldError(setPasswordErrors, "currentPassword");
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
                  clearFieldError(setPasswordErrors, "newPassword");
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
                  clearFieldError(setPasswordErrors, "confirmPassword");
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
