import { createClient } from '@supabase/supabase-js';
import { extname } from 'node:path';

const mimeByExt: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function getMimeFromFileName(fileName: string) {
  const extension = extname(fileName).toLowerCase();
  return mimeByExt[extension] || 'application/octet-stream';
}

function normalizeFileName(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._/-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^\/+/, '');
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${name}`);
  }

  return value;
}

let ensuredBucket = false;

function getClient() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAssetsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'agenda-assets';
}

async function ensureBucket(client: ReturnType<typeof getClient>, bucket: string) {
  if (ensuredBucket) {
    return;
  }

  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    throw new Error(`Falha ao listar buckets do Supabase: ${listError.message}`);
  }

  const exists = (buckets || []).some((item) => item.name === bucket);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: '5MB',
    });
    if (createError) {
      throw new Error(`Falha ao criar bucket "${bucket}": ${createError.message}`);
    }
  }

  ensuredBucket = true;
}

export async function uploadAssetBufferToSupabase(options: {
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
  folder?: string;
}) {
  const client = getClient();
  const bucket = getSupabaseAssetsBucket();
  await ensureBucket(client, bucket);

  const safeName = normalizeFileName(options.fileName || `${Date.now()}-asset`);
  const folder = normalizeFileName(options.folder || 'uploads');
  const objectPath = `${folder}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await client.storage.from(bucket).upload(objectPath, options.buffer, {
    contentType: options.mimeType || getMimeFromFileName(safeName),
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Falha ao enviar arquivo para Supabase Storage: ${uploadError.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}
