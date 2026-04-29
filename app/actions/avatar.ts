// PASS-36-AVATAR-ACTION
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadAvatar(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const file = formData.get('avatar') as File | null;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  if (file.size > MAX_BYTES) {
    return { error: 'File too large. Max 2 MB.' };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: 'Only JPEG, PNG, or WebP images are allowed.' };
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      cacheControl: '0',
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const cacheBustedUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('players')
    .update({ avatar_url: cacheBustedUrl })
    .eq('id', user.id);

  if (updateError) {
    return { error: `Profile update failed: ${updateError.message}` };
  }

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/profile/edit');

  return { success: true, url: cacheBustedUrl };
}

export async function removeAvatar() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data: files } = await supabase.storage
    .from('avatars')
    .list(user.id);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from('avatars').remove(paths);
  }

  const { error: updateError } = await supabase
    .from('players')
    .update({ avatar_url: null })
    .eq('id', user.id);

  if (updateError) {
    return { error: `Profile update failed: ${updateError.message}` };
  }

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/profile/edit');

  return { success: true };
}
