import { supabase } from '../config/supabase';
import type { UserProfile, AccountStatus } from '../types/models';

interface ProfileDbRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  currently_working_on: string | null;
  things_ive_done: string | null;
  profile_image_url: string | null;
  account_status: string;
  restricted_until: string | null;
  suspended_until: string | null;
  status_reason: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToUserProfile(row: ProfileDbRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio || '',
    location: row.location || '',
    currentlyWorkingOn: row.currently_working_on || '',
    thingsIveDone: row.things_ive_done || '',
    profileImageUrl: row.profile_image_url,
    accountStatus: (row.account_status as AccountStatus) || 'ACTIVE',
    restrictedUntil: row.restricted_until,
    suspendedUntil: row.suspended_until,
    statusReason: row.status_reason || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error("Couldn't load profile. Please check your connection.");
    }

    if (!data) return null;
    return mapRowToUserProfile(data as ProfileDbRow);
  },

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const normalized = username.trim().toLowerCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', normalized)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile by username:', error);
      throw new Error("Couldn't load profile. Please check your connection.");
    }

    if (!data) return null;
    return mapRowToUserProfile(data as ProfileDbRow);
  },

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const normalized = username.trim().toLowerCase();
    let query = supabase
      .from('profiles')
      .select('id')
      .ilike('username', normalized);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error checking username availability:', error);
      return false;
    }

    return !data || data.length === 0;
  },

  async saveProfile(profile: {
    id: string;
    username: string;
    displayName: string;
    bio?: string;
    location?: string;
    currentlyWorkingOn?: string;
    thingsIveDone?: string;
    profileImageUrl?: string | null;
  }): Promise<UserProfile> {
    const payload = {
      id: profile.id,
      username: profile.username.trim().toLowerCase(),
      display_name: profile.displayName.trim(),
      bio: (profile.bio || '').trim(),
      location: (profile.location || '').trim(),
      currently_working_on: (profile.currentlyWorkingOn || '').trim(),
      things_ive_done: (profile.thingsIveDone || '').trim(),
      profile_image_url: profile.profileImageUrl || null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Error saving profile:', error);
      throw new Error(error.message || "Couldn't save your profile. Please try again.");
    }

    return mapRowToUserProfile(data as ProfileDbRow);
  },

  async uploadAvatar(userId: string, imageBlob: Blob): Promise<string> {
    const bucket = supabase.storage.from('profile-images');
    const path = `${userId}/avatar.jpg`;

    const { error: uploadError } = await bucket.upload(path, imageBlob, {
      upsert: true,
      contentType: 'image/jpeg',
    });

    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      throw new Error("Couldn't upload profile picture. Please try again.");
    }

    const { data: { publicUrl } } = bucket.getPublicUrl(path);
    return `${publicUrl}?t=${Date.now()}`;
  },
};
