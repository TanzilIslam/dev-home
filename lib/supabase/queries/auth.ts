import { supabase } from "../client";
import type { Session } from "@supabase/supabase-js";
import { SupabaseError } from "./utils";

// ---------------------------------------------------------------------------
// Auth wrappers (centralize direct supabase.auth.* calls)
// ---------------------------------------------------------------------------

export async function signIn(params: {
  email: string;
  password: string;
}): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  return { error: error ? { message: error.message } : null };
}

export async function signUp(params: {
  email: string;
  password: string;
  name: string;
}): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { name: params.name },
    },
  });

  return { error: error ? { message: error.message } : null };
}

export async function getAuthUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string) ?? null,
  };
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void): {
  data: { subscription: { unsubscribe: () => void } };
} {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Email Verification / OAuth
// ---------------------------------------------------------------------------

export async function resendVerificationEmail(
  email: string,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  return { error: error ? { message: error.message } : null };
}

export async function verifyOtp(params: {
  tokenHash: string;
  type: "signup" | "email" | "recovery" | "invite";
}): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.verifyOtp({
    token_hash: params.tokenHash,
    type: params.type,
  });

  return { error: error ? { message: error.message } : null };
}

export async function exchangeCodeForSession(
  code: string,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  return { error: error ? { message: error.message } : null };
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export async function resetPasswordForEmail(
  email: string,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm`,
  });

  return { error: error ? { message: error.message } : null };
}

export async function updatePassword(
  newPassword: string,
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { error: error ? { message: error.message } : null };
}

// ---------------------------------------------------------------------------
// Profile / Password
// ---------------------------------------------------------------------------

export async function updateProfile(payload: {
  name: string;
}): Promise<{ id: string; email: string; name: string }> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.updateUser({
      data: { name: payload.name },
    });

    if (authError) {
      throw new SupabaseError("Failed to update profile");
    }

    return {
      id: user?.id || "",
      email: user?.email || "",
      name: payload.name,
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to update profile");
  }
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  try {
    if (payload.newPassword !== payload.confirmPassword) {
      throw new SupabaseError("Passwords do not match");
    }

    // Re-authenticate with current password before allowing change
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (!email) {
      throw new SupabaseError("Not authenticated");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: payload.currentPassword,
    });

    if (signInError) {
      throw new SupabaseError("Current password is incorrect", {
        fieldErrors: { currentPassword: ["Current password is incorrect"] },
      });
    }

    const { error } = await supabase.auth.updateUser({
      password: payload.newPassword,
    });

    if (error) {
      throw new SupabaseError("Failed to change password");
    }
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to change password");
  }
}
