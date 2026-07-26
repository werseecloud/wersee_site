import {
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import type { ChatAttachment } from '../../services/chatFiles';
import { formatChatFileSize } from '../../services/chatFiles';
import { AudioPlayer } from './AudioPlayer';

interface ChatAttachmentCardProps {
  attachment: ChatAttachment;
  compact?: boolean;
}

const attachmentIcon = {
  document: FileText,
  file: FileArchive,
  image: ImageIcon,
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  video: Film,
} as const;

export function ChatAttachmentCard({ attachment, compact = false }: ChatAttachmentCardProps) {
  const url = attachment.signedUrl;

  if (attachment.kind === 'image' && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="chat-attachment-image group/image mt-2 block overflow-hidden rounded-[18px]"
        aria-label={`Open image ${attachment.name}`}
      >
        <img
          src={url}
          alt={attachment.name}
          className="max-h-72 w-full object-cover transition-transform duration-500 group-hover/image:scale-[1.015]"
          referrerPolicy="no-referrer"
        />
      </a>
    );
  }

  if (attachment.kind === 'audio' && url) {
    return (
      <div className="mt-2 min-w-[240px] max-w-full">
        <AudioPlayer src={url} />
      </div>
    );
  }

  if (attachment.kind === 'video' && url) {
    return (
      <video
        className="mt-2 max-h-72 w-full rounded-[18px] bg-black"
        src={url}
        controls
        preload="metadata"
        playsInline
      >
        <track kind="captions" />
      </video>
    );
  }

  const Icon = attachmentIcon[attachment.kind] || FileArchive;
  const actionLabel =
    attachment.kind === 'spreadsheet'
      ? 'Open spreadsheet'
      : attachment.kind === 'pdf'
        ? 'Open PDF'
        : 'Open file';

  return (
    <a
      href={url || undefined}
      target="_blank"
      rel="noreferrer"
      download={attachment.kind === 'file' ? attachment.name : undefined}
      aria-disabled={!url}
      className={`chat-file-card mt-2 flex items-center gap-3 rounded-[18px] border p-3 transition-transform active:scale-[0.985] ${
        compact ? 'min-w-[220px]' : 'min-w-[260px] max-w-full'
      } ${url ? '' : 'pointer-events-none opacity-60'}`}
    >
      <span className="chat-file-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{attachment.name}</span>
        <span className="mt-0.5 block text-[11px] opacity-55">
          {[actionLabel, formatChatFileSize(attachment.size)].filter(Boolean).join(' · ')}
        </span>
      </span>
      {attachment.kind === 'file' ? (
        <Download className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      ) : (
        <ExternalLink className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      )}
    </a>
  );
}
