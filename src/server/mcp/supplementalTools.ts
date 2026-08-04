import crypto from 'node:crypto';
import { z } from 'zod';
import { decryptMessage, encryptMessage } from '../../services/cryptoService.js';
import type { ToolContext, WerseeAiTool } from '../../../supabase/functions/wersee-ai/types.js';

export type McpToolContext = ToolContext & {
  accessToken: string;
  appUrl: string;
};

const listChatsInput = z.object({ limit: z.number().int().min(1).max(100).default(30) }).strict();

const listChatsTool: WerseeAiTool<z.infer<typeof listChatsInput>> = {
  name: 'messages.chats.list',
  description: 'List chats the authenticated user participates in, with safe participant and recency metadata.',
  category: 'messages',
  riskLevel: 'read',
  requiredScopes: ['read_messages'],
  inputSchema: listChatsInput,
  inputHint: '{limit?: 1..100}',
  async execute(context, input) {
    const { data: memberships, error: membershipError } = await context.userClient
      .from('chat_participants')
      .select('chat_id,unread_count,alias')
      .eq('user_id', context.user.id)
      .limit(input.limit);
    if (membershipError) throw membershipError;
    const chatIds = (memberships || []).map((membership: any) => membership.chat_id);
    if (!chatIds.length) {
      return { summary: 'No chats found.', data: { chats: [] }, dataSource: ['public.chat_participants'] };
    }
    const [{ data: chats, error: chatsError }, { data: participants, error: participantsError }] = await Promise.all([
      context.userClient.from('chats').select('id,name,is_group,team_id,last_message,last_message_at,updated_at,metadata').in('id', chatIds),
      context.userClient.from('chat_participants').select('chat_id,user_id,alias,profile:profiles(id,name,full_name,username)').in('chat_id', chatIds),
    ]);
    if (chatsError) throw chatsError;
    if (participantsError) throw participantsError;
    const membershipByChat = new Map((memberships || []).map((row: any) => [row.chat_id, row]));
    const safeChats = (chats || []).map((chat: any) => ({
      id: chat.id,
      name: chat.name || null,
      type: chat.team_id ? 'team' : chat.is_group ? 'group' : 'direct',
      unreadCount: Number(membershipByChat.get(chat.id)?.unread_count || 0),
      alias: membershipByChat.get(chat.id)?.alias || null,
      lastMessage: chat.metadata?.last_message_encrypted ? 'Encrypted message' : chat.last_message || null,
      lastMessageAt: chat.last_message_at || chat.updated_at,
      participants: (participants || [])
        .filter((participant: any) => participant.chat_id === chat.id)
        .map((participant: any) => ({
          userId: participant.user_id,
          name: participant.profile?.full_name || participant.profile?.name || participant.profile?.username || 'Wersee user',
          alias: participant.alias || null,
        })),
    }));
    return { summary: `Found ${safeChats.length} chat${safeChats.length === 1 ? '' : 's'}.`, data: { chats: safeChats }, dataSource: ['public.chats', 'public.chat_participants', 'public.profiles'] };
  },
};

const listMessagesInput = z.object({
  chatId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(30),
}).strict();

const listMessagesTool: WerseeAiTool<z.infer<typeof listMessagesInput>> = {
  name: 'messages.list',
  description: 'Read recent text messages from one chat the authenticated user participates in.',
  category: 'messages',
  riskLevel: 'read',
  requiredScopes: ['read_messages'],
  inputSchema: listMessagesInput,
  inputHint: '{chatId: uuid,limit?: 1..100}',
  async execute(context, input) {
    const { data: membership } = await context.userClient.from('chat_participants').select('chat_id')
      .eq('chat_id', input.chatId).eq('user_id', context.user.id).maybeSingle();
    if (!membership) throw new Error('CHAT_ACCESS_DENIED');
    const { data, error } = await context.userClient.from('messages')
      .select('id,chat_id,sender_id,content,is_encrypted,type,parent_id,created_at,sender:profiles(id,name,full_name,username)')
      .eq('chat_id', input.chatId).order('created_at', { ascending: false }).limit(input.limit);
    if (error) throw error;
    const messages = await Promise.all((data || []).reverse().map(async (message: any) => ({
      id: message.id,
      senderId: message.sender_id,
      senderName: message.sender?.full_name || message.sender?.name || message.sender?.username || 'Wersee user',
      content: message.is_encrypted ? await decryptMessage(message.content || '', input.chatId) : message.content || '',
      type: message.type || 'text',
      parentId: message.parent_id || null,
      createdAt: message.created_at,
    })));
    return { summary: `Loaded ${messages.length} message${messages.length === 1 ? '' : 's'}.`, data: { chatId: input.chatId, messages }, dataSource: ['public.messages'] };
  },
};

const sendMessageInput = z.object({
  chatId: z.string().uuid(),
  text: z.string().trim().min(1).max(8000),
  parentId: z.string().uuid().nullable().optional(),
}).strict();

const sendMessageTool: WerseeAiTool<z.infer<typeof sendMessageInput>> = {
  name: 'messages.send',
  description: 'Send one end-to-end encrypted Wersee chat message after an exact, one-time confirmation.',
  category: 'messages',
  riskLevel: 'high',
  requiredScopes: ['send_messages'],
  alwaysConfirm: true,
  inputSchema: sendMessageInput,
  inputHint: '{chatId: uuid,text: string,parentId?: uuid}',
  async preview(context, input) {
    const { data: membership } = await context.userClient.from('chat_participants').select('chat_id')
      .eq('chat_id', input.chatId).eq('user_id', context.user.id).maybeSingle();
    if (!membership) throw new Error('CHAT_ACCESS_DENIED');
    return {
      title: 'Send Wersee message',
      summary: `Send one message to chat ${input.chatId}.`,
      affectedResources: [{ type: 'chat', id: input.chatId, label: `Chat ${input.chatId}` }],
      recipients: [`Chat ${input.chatId}`],
      publicVisibility: false,
      estimatedCount: 1,
      reversible: false,
      confirmationText: `Confirm sending: “${input.text.slice(0, 160)}${input.text.length > 160 ? '…' : ''}”`,
    };
  },
  async execute(context, input) {
    const { data: membership } = await context.userClient.from('chat_participants').select('chat_id')
      .eq('chat_id', input.chatId).eq('user_id', context.user.id).maybeSingle();
    if (!membership) throw new Error('CHAT_ACCESS_DENIED');
    const encryptedContent = await encryptMessage(input.text, input.chatId);
    const { data, error } = await context.userClient.from('messages').insert({
      chat_id: input.chatId,
      sender_id: context.user.id,
      content: encryptedContent,
      parent_id: input.parentId || null,
      is_encrypted: true,
      type: 'text',
    }).select('id,chat_id,sender_id,type,created_at').single();
    if (error) throw error;
    if (!input.parentId) {
      await context.userClient.from('chats').update({
        updated_at: new Date().toISOString(),
        last_message: 'Encrypted message',
        last_message_at: new Date().toISOString(),
        metadata: { last_message_encrypted: true },
      }).eq('id', input.chatId);
    }
    void context.userClient.functions.invoke('chat-push', { body: { messageId: data.id } });
    return { summary: 'Sent the encrypted Wersee message.', resource: { type: 'message', id: data.id, label: 'Sent message', route: 'chats' }, data: { message: data }, dataSource: ['public.messages'] };
  },
};

const storageListInput = z.object({
  bucketId: z.string().trim().min(1).max(120).default('business_storage'),
  path: z.string().trim().max(500).default(''),
  limit: z.number().int().min(1).max(100).default(50),
}).strict().refine((input) => !input.path.split('/').includes('..'), 'Parent-directory paths are not allowed.');

const storageFilesListTool: WerseeAiTool<z.infer<typeof storageListInput>> = {
  name: 'storage.files.list',
  description: 'List files in the authenticated user’s current Wersee Storage gateway.',
  category: 'storage',
  riskLevel: 'read',
  requiredScopes: ['read_storage'],
  inputSchema: storageListInput,
  inputHint: '{bucketId?: string,path?: relative path,limit?: 1..100}',
  async execute(rawContext, input) {
    const context = rawContext as McpToolContext;
    const params = new URLSearchParams({ bucket: input.bucketId, prefix: input.path });
    const response = await fetch(`${context.appUrl}/api/storage/objects?${params}`, {
      headers: { Authorization: `Bearer ${context.accessToken}` },
      signal: context.signal,
    });
    const payload = await response.json().catch(() => null) as any;
    if (!response.ok) throw new Error(payload?.error?.code || 'STORAGE_LIST_FAILED');
    const objects = (payload?.objects || []).slice(0, input.limit);
    return { summary: `Found ${objects.length} stored file${objects.length === 1 ? '' : 's'}.`, data: { objects }, dataSource: ['public.storage_gateway_objects'] };
  },
};

const storageObjectInput = z.object({ objectId: z.string().uuid() }).strict();

const storageDownloadTool: WerseeAiTool<z.infer<typeof storageObjectInput>> = {
  name: 'storage.files.get_download',
  description: 'Get a short-lived or public download URL for one owned Wersee Storage object.',
  category: 'storage',
  riskLevel: 'read',
  requiredScopes: ['read_storage'],
  inputSchema: storageObjectInput,
  inputHint: '{objectId: uuid}',
  async execute(context, input) {
    const { data, error } = await context.userClient.from('storage_gateway_objects')
      .select('id,bucket_id,logical_path').eq('id', input.objectId).eq('owner_id', context.user.id).is('deleted_at', null).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('STORAGE_OBJECT_NOT_FOUND');
    const mcpContext = context as McpToolContext;
    const params = new URLSearchParams({ bucket: data.bucket_id, logicalPath: data.logical_path });
    const response = await fetch(`${mcpContext.appUrl}/api/storage/objects/resolve?${params}`, {
      headers: { Authorization: `Bearer ${mcpContext.accessToken}` },
      signal: context.signal,
    });
    const payload = await response.json().catch(() => null) as any;
    if (!response.ok || !payload?.object) throw new Error(payload?.error?.code || 'STORAGE_DOWNLOAD_FAILED');
    const object = payload.object;
    const url = object.url?.startsWith('/') ? `${mcpContext.appUrl}${object.url}` : object.url;
    return { summary: `Prepared a download for ${object.logicalPath}.`, resource: { type: 'storage_object', id: object.objectId, label: object.logicalPath, route: 'storage' }, data: { object: { ...object, url } }, dataSource: ['public.storage_gateway_objects'] };
  },
};

const storageMoveInput = z.object({
  objectId: z.string().uuid(),
  logicalPath: z.string().trim().min(1).max(500),
}).strict().refine((input) => !input.logicalPath.split('/').includes('..'), 'Parent-directory paths are not allowed.');

const storageMoveTool: WerseeAiTool<z.infer<typeof storageMoveInput>> = {
  name: 'storage.files.move',
  description: 'Move or rename one owned Wersee Storage object after confirmation.',
  category: 'storage',
  riskLevel: 'medium',
  requiredScopes: ['write_storage'],
  inputSchema: storageMoveInput,
  inputHint: '{objectId: uuid,logicalPath: string}',
  async preview(context, input) {
    const { data } = await context.userClient.from('storage_gateway_objects').select('id,logical_path')
      .eq('id', input.objectId).eq('owner_id', context.user.id).is('deleted_at', null).maybeSingle();
    if (!data) throw new Error('STORAGE_OBJECT_NOT_FOUND');
    return { title: 'Move storage object', summary: `Move ${data.logical_path} to ${input.logicalPath}.`, affectedResources: [{ type: 'storage_object', id: data.id, label: data.logical_path }], changes: [{ field: 'logical_path', before: data.logical_path, after: input.logicalPath }], publicVisibility: false, estimatedCount: 1, reversible: true };
  },
  async execute(rawContext, input) {
    const context = rawContext as McpToolContext;
    const response = await fetch(`${context.appUrl}/api/storage/objects/${input.objectId}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${context.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ logicalPath: input.logicalPath }), signal: context.signal,
    });
    const payload = await response.json().catch(() => null) as any;
    if (!response.ok) throw new Error(payload?.error?.code || 'STORAGE_MOVE_FAILED');
    return { summary: `Moved the storage object to ${input.logicalPath}.`, resource: { type: 'storage_object', id: input.objectId, label: input.logicalPath, route: 'storage' }, data: payload, dataSource: ['public.storage_gateway_objects'] };
  },
};

const storageUploadTextInput = z.object({
  bucketId: z.string().trim().min(1).max(120).default('business_storage'),
  logicalPath: z.string().trim().min(1).max(500),
  content: z.string().min(1).max(1_000_000),
  mimeType: z.enum(['text/plain', 'text/markdown', 'application/json', 'text/csv']).default('text/plain'),
  workspaceId: z.string().uuid().nullable().optional(),
}).strict().refine((input) => !input.logicalPath.split('/').includes('..'), 'Parent-directory paths are not allowed.');

const storageUploadTextTool: WerseeAiTool<z.infer<typeof storageUploadTextInput>> = {
  name: 'storage.files.upload_text',
  description: 'Create or replace a small text, Markdown, JSON, or CSV file in Wersee Storage after confirmation.',
  category: 'storage',
  riskLevel: 'medium',
  requiredScopes: ['write_storage'],
  inputSchema: storageUploadTextInput,
  inputHint: '{bucketId?: string,logicalPath: string,content: string <= 1 MB,mimeType?: text/plain|text/markdown|application/json|text/csv,workspaceId?: uuid}',
  async preview(_context, input) {
    const sizeBytes = Buffer.byteLength(input.content, 'utf8');
    return {
      title: 'Upload text file',
      summary: `Create or replace ${input.logicalPath} (${sizeBytes} bytes).`,
      affectedResources: [{ type: 'storage_object', label: input.logicalPath }],
      changes: [{ field: 'content', before: 'Existing file, if any', after: `${sizeBytes} bytes of ${input.mimeType}` }],
      publicVisibility: false,
      estimatedCount: 1,
      reversible: false,
      confirmationText: `Confirm writing ${input.logicalPath} to Wersee Storage.`,
    };
  },
  async execute(rawContext, input) {
    const context = rawContext as McpToolContext;
    const bytes = Buffer.from(input.content, 'utf8');
    const checksum = crypto.createHash('sha256').update(bytes).digest('hex');
    const headers = { Authorization: `Bearer ${context.accessToken}`, 'Content-Type': 'application/json' };
    const initResponse = await fetch(`${context.appUrl}/api/storage/uploads/init`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bucketId: input.bucketId,
        logicalPath: input.logicalPath,
        originalFilename: input.logicalPath.split('/').pop(),
        mimeType: input.mimeType,
        originalSize: bytes.length,
        sha256: checksum,
        workspaceId: input.workspaceId || null,
      }),
      signal: context.signal,
    });
    const initialized = await initResponse.json().catch(() => null) as any;
    if (!initResponse.ok) throw new Error(initialized?.error?.code || 'STORAGE_UPLOAD_INIT_FAILED');
    if (initialized?.deduplicated && initialized?.object) {
      return { summary: `Stored ${input.logicalPath} using an existing identical file.`, resource: { type: 'storage_object', id: initialized.object.objectId, label: input.logicalPath, route: 'storage' }, data: { object: initialized.object, deduplicated: true }, dataSource: ['public.storage_gateway_objects'] };
    }

    if (initialized.provider === 'supabase') {
      const { error } = await context.userClient.storage.from(input.bucketId).uploadToSignedUrl(
        initialized.storagePath,
        initialized.signedUploadToken,
        bytes,
        { contentType: input.mimeType, upsert: true },
      );
      if (error) throw new Error('STORAGE_UPLOAD_TRANSFER_FAILED');
    } else {
      const chunkResponse = await fetch(`${context.appUrl}/api/storage/uploads/${initialized.uploadId}/chunks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'X-Chunk-Index': '0',
          'X-Slice-Offset': '0',
          'X-Chunk-Length': String(bytes.length),
          'X-Chunk-Sha256': checksum,
          'X-Slice-Sha256': checksum,
        },
        body: bytes,
        signal: context.signal,
      });
      const chunkPayload = await chunkResponse.json().catch(() => null) as any;
      if (!chunkResponse.ok) throw new Error(chunkPayload?.error?.code || 'STORAGE_UPLOAD_TRANSFER_FAILED');
    }

    const completeResponse = await fetch(`${context.appUrl}/api/storage/uploads/${initialized.uploadId}/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify(initialized.provider === 'supabase' ? { storagePath: initialized.storagePath } : {}),
      signal: context.signal,
    });
    const completed = await completeResponse.json().catch(() => null) as any;
    if (!completeResponse.ok || !completed?.object) throw new Error(completed?.error?.code || 'STORAGE_UPLOAD_COMPLETE_FAILED');
    return { summary: `Stored ${input.logicalPath}.`, resource: { type: 'storage_object', id: completed.object.objectId, label: input.logicalPath, route: 'storage' }, data: { object: completed.object }, dataSource: ['public.storage_gateway_objects'] };
  },
};

const storageDeleteTool: WerseeAiTool<z.infer<typeof storageObjectInput>> = {
  name: 'storage.files.delete',
  description: 'Delete one owned Wersee Storage object after confirmation. References may keep the underlying file retained.',
  category: 'storage',
  riskLevel: 'high',
  requiredScopes: ['delete_storage'],
  alwaysConfirm: true,
  inputSchema: storageObjectInput,
  inputHint: '{objectId: uuid}',
  async preview(context, input) {
    const { data } = await context.userClient.from('storage_gateway_objects').select('id,logical_path')
      .eq('id', input.objectId).eq('owner_id', context.user.id).is('deleted_at', null).maybeSingle();
    if (!data) throw new Error('STORAGE_OBJECT_NOT_FOUND');
    return { title: 'Delete storage object', summary: `Delete ${data.logical_path}.`, affectedResources: [{ type: 'storage_object', id: data.id, label: data.logical_path }], publicVisibility: false, estimatedCount: 1, reversible: false, confirmationText: `Confirm deletion of ${data.logical_path}.` };
  },
  async execute(rawContext, input) {
    const context = rawContext as McpToolContext;
    const response = await fetch(`${context.appUrl}/api/storage/objects/${input.objectId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${context.accessToken}` }, signal: context.signal,
    });
    const payload = await response.json().catch(() => null) as any;
    if (!response.ok) throw new Error(payload?.error?.code || 'STORAGE_DELETE_FAILED');
    return { summary: 'Deleted the storage object.', resource: { type: 'storage_object', id: input.objectId, label: input.objectId, route: 'storage' }, data: payload, dataSource: ['public.storage_gateway_objects'] };
  },
};

export const supplementalMcpTools = [
  listChatsTool,
  listMessagesTool,
  sendMessageTool,
  storageFilesListTool,
  storageDownloadTool,
  storageUploadTextTool,
  storageMoveTool,
  storageDeleteTool,
] satisfies WerseeAiTool[];
