import { supabase } from '../lib/supabase';

export const CHAT_ATTACHMENT_BUCKET = 'chat-attachments';
export const CHAT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
export const CHAT_ATTACHMENT_ACCEPT =
  'image/*,audio/*,video/mp4,video/webm,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip';

export type ChatAttachmentKind =
  | 'image'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'spreadsheet'
  | 'document'
  | 'file';

export interface ChatAttachment {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  kind: ChatAttachmentKind;
  duration?: number;
  width?: number;
  height?: number;
  signedUrl?: string;
}

type MessageWithAttachments = {
  attachments?: unknown;
  image_url?: string | null;
  audio_url?: string | null;
  [key: string]: unknown;
};

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
]);

const extensionMimeTypes: Record<string, string> = {
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  ogg: 'audio/ogg',
  pdf: 'application/pdf',
  png: 'image/png',
  txt: 'text/plain',
  webm: 'video/webm',
  webp: 'image/webp',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
};

const getExtension = (name: string) => name.split('.').pop()?.toLowerCase() || '';

export const resolveChatFileMimeType = (file: Pick<File, 'name' | 'type'>) =>
  file.type || extensionMimeTypes[getExtension(file.name)] || 'application/octet-stream';

export const getChatAttachmentKind = (mimeType: string, fileName = ''): ChatAttachmentKind => {
  const extension = getExtension(fileName);
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    extension === 'xls' ||
    extension === 'xlsx' ||
    extension === 'csv'
  ) {
    return 'spreadsheet';
  }
  if (mimeType.includes('word') || extension === 'doc' || extension === 'docx' || extension === 'txt') {
    return 'document';
  }
  return 'file';
};

export const validateChatAttachment = (file: File) => {
  if (file.size <= 0) throw new Error('This file is empty.');
  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) throw new Error('Files can be up to 25 MB.');

  const mimeType = resolveChatFileMimeType(file);
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error('This file type is not supported in chats.');
  }
  return mimeType;
};

const safeFileName = (name: string) => {
  const extension = getExtension(name);
  const base = name
    .replace(/\.[^.]+$/, '')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80) || 'attachment';
  return extension ? `${base}.${extension}` : base;
};

export const uploadChatAttachment = async ({
  file,
  chatId,
  userId,
  duration,
}: {
  file: File | Blob;
  chatId: string;
  userId: string;
  duration?: number;
}): Promise<ChatAttachment> => {
  const inferredName = file instanceof File ? file.name : `voice-message-${Date.now()}.webm`;
  const uploadFile =
    file instanceof File
      ? file
      : new File([file], inferredName, { type: file.type || 'audio/webm' });
  const mimeType = validateChatAttachment(uploadFile);
  const path = `${chatId}/${userId}/${crypto.randomUUID()}-${safeFileName(uploadFile.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(CHAT_ATTACHMENT_BUCKET)
    .upload(path, uploadFile, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: signedData, error: signedError } = await supabase.storage
    .from(CHAT_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (signedError) {
    await supabase.storage.from(CHAT_ATTACHMENT_BUCKET).remove([path]);
    throw signedError;
  }

  return {
    path,
    name: uploadFile.name,
    mimeType,
    size: uploadFile.size,
    kind: getChatAttachmentKind(mimeType, uploadFile.name),
    duration,
    signedUrl: signedData.signedUrl,
  };
};

export const storagePathFromUrl = (url?: string | null) => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${CHAT_ATTACHMENT_BUCKET}/`;
  const signedMarker = `/storage/v1/object/sign/${CHAT_ATTACHMENT_BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  const signedIndex = url.indexOf(signedMarker);
  const path =
    markerIndex >= 0
      ? url.slice(markerIndex + marker.length)
      : signedIndex >= 0
        ? url.slice(signedIndex + signedMarker.length).split('?')[0]
        : null;
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

const parseMessageAttachments = (message: MessageWithAttachments): ChatAttachment[] => {
  const attachments = Array.isArray(message.attachments)
    ? message.attachments.filter((item): item is ChatAttachment => Boolean(item && typeof item === 'object' && 'path' in item))
    : [];

  const legacyImagePath = storagePathFromUrl(message.image_url);
  if (legacyImagePath && !attachments.some((attachment) => attachment.path === legacyImagePath)) {
    attachments.push({
      path: legacyImagePath,
      name: legacyImagePath.split('/').pop() || 'Image',
      mimeType: extensionMimeTypes[getExtension(legacyImagePath)] || 'image/jpeg',
      size: 0,
      kind: 'image',
    });
  }

  const legacyAudioPath = storagePathFromUrl(message.audio_url);
  if (legacyAudioPath && !attachments.some((attachment) => attachment.path === legacyAudioPath)) {
    attachments.push({
      path: legacyAudioPath,
      name: legacyAudioPath.split('/').pop() || 'Voice message',
      mimeType: extensionMimeTypes[getExtension(legacyAudioPath)] || 'audio/webm',
      size: 0,
      kind: 'audio',
    });
  }

  return attachments;
};

export const hydrateChatMessageAttachments = async <T extends MessageWithAttachments>(
  messages: T[],
): Promise<Array<T & { resolvedAttachments: ChatAttachment[] }>> => {
  const attachmentsByMessage = messages.map(parseMessageAttachments);
  const paths = Array.from(
    new Set(attachmentsByMessage.flat().map((attachment) => attachment.path).filter(Boolean)),
  );

  const signedUrlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENT_BUCKET)
      .createSignedUrls(paths, 60 * 60);

    if (!error) {
      for (const signedFile of data || []) {
        if (signedFile.path && signedFile.signedUrl) {
          signedUrlByPath.set(signedFile.path, signedFile.signedUrl);
        }
      }
    }
  }

  return messages.map((message, index) => ({
    ...message,
    resolvedAttachments: attachmentsByMessage[index].map((attachment) => ({
      ...attachment,
      signedUrl: signedUrlByPath.get(attachment.path) || attachment.signedUrl,
    })),
  }));
};

export const serializableChatAttachment = ({ signedUrl: _signedUrl, ...attachment }: ChatAttachment) => attachment;

export const formatChatFileSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unit = units[0];
  for (let index = 1; size >= 1024 && index < units.length; index += 1) {
    size /= 1024;
    unit = units[index];
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${unit}`;
};
