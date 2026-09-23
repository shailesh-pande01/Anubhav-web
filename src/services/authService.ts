import { supabase } from '../config/supabase';
import type { Session, User } from '@supabase/supabase-js';

export function mapAuthError(error: unknown, isUsernameLogin: boolean = false): string {
  if (!error) return 'Something went wrong. Please try again.';

  const err = error as { message?: string; error?: string; status?: number };
  const msg = (err.message || err.error || '').toLowerCase();

  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('unable to resolve host') ||
    msg.includes('timeout')
  ) {
    return "Couldn't connect. Please check your internet connection and try again.";
  }

  if (
    msg.includes('otp_expired') ||
    msg.includes('email link is invalid or has expired') ||
    msg.includes('recovery link has expired') ||
    msg.includes('token has expired')
  ) {
    return 'This reset link has expired. Please request a new one.';
  }

  if (msg.includes('token is invalid') || msg.includes('bad_jwt')) {
    return 'This reset link is no longer valid. Please request a new one.';
  }

  if (msg.includes('weak_password') || msg.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return isUsernameLogin
      ? 'Incorrect password. Please try again.'
      : 'Invalid email or password. Please try again.';
  }

  if (msg.includes('email_not_confirmed') || msg.includes('email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }

  if (msg.includes('over_request_rate_limit') || msg.includes('too many requests')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }

  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already exists')) {
    return 'An account with this email already exists.';
  }

  return err.message || 'Something went wrong. Please try again.';
}

export const authService = {
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async signUp(email: string, password: string): Promise<string> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error('Signup failed. Please try again.');
      }

      return data.user.id;
    } catch (e) {
      throw new Error(mapAuthError(e, false));
    }
  },

  async signIn(email: string, password: string): Promise<string> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error('Login failed. Please check your credentials.');
      }

      return data.user.id;
    } catch (e) {
      throw new Error(mapAuthError(e, false));
    }
  },

  async signInWithUsername(username: string, password: string): Promise<string> {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      throw new Error('Please enter your username.');
    }

    try {
      // 1. Resolve username to email using get_email_by_username RPC
      const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_username', {
        p_username: normalizedUsername,
      });

      if (rpcError) {
        throw rpcError;
      }

      const email = typeof emailData === 'string' ? emailData.trim() : null;
      if (!email || email.toLowerCase() === 'null') {
        throw new Error('Username not found. Check your username and try again.');
      }

      // 2. Perform authentication with resolved email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password.trim(),
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error('Login failed. Please check your credentials.');
      }

      return data.user.id;
    } catch (e) {
      throw new Error(mapAuthError(e, true));
    }
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
    } catch (e) {
      throw new Error(mapAuthError(e, false));
    }
  },

  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });

      if (error) throw error;
    } catch (e) {
      throw new Error(mapAuthError(e, false));
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  /**
   * Executes a complete, secure production-ready account deletion:
   * 1. Cleans user storage objects (profile avatar and post images).
   * 2. Calls secure PostgreSQL RPC delete_user_account().
   * 3. Signs out and invalidates session.
   */
  async deleteAccount(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to delete your account.');
    }

    try {
      const userId = user.id;

      // 1. Storage cleanup while session is authenticated
      try {
        // Clean post-images
        const { data: postFiles } = await supabase.storage.from('post-images').list(userId);
        if (postFiles && postFiles.length > 0) {
          const postPaths = postFiles.map((f) => `${userId}/${f.name}`);
          await supabase.storage.from('post-images').remove(postPaths);
        }

        // Clean profile-images
        const { data: avatarFiles } = await supabase.storage.from('profile-images').list(userId);
        if (avatarFiles && avatarFiles.length > 0) {
          const avatarPaths = avatarFiles.map((f) => `${userId}/${f.name}`);
          await supabase.storage.from('profile-images').remove(avatarPaths);
        }
      } catch {
        // Non-fatal if storage cleanup encounters partial error
      }

      // 2. Invoke server-side RPC delete_user_account()
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      if (rpcError) {
        throw rpcError;
      }

      // 3. Clear session
      await supabase.auth.signOut();
    } catch (e) {
      const msg = (e as { message?: string })?.message || '';
      if (msg.includes('network') || msg.includes('fetch')) {
        throw new Error("Couldn't connect. Please check your internet connection and try again.");
      }
      throw new Error("Couldn't delete your account. Please try again.");
    }
  },
};
