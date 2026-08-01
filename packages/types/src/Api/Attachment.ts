/**
 * Presigned message attachment upload types (POST /channels/{id}/attachments).
 * Request ≠ response: plan uploads here, then reference `upload_filename` when sending.
 */

/** Single attachment to upload in request. */
export interface RESTPostAPIChannelAttachmentUploadItem {
  /** Index-based ID for this attachment. */
  id: number;
  /** Original filename. */
  filename: string;
  /** File size in bytes. */
  file_size: number;
  /** MIME type. */
  content_type: string;
}

/** Request body for POST /channels/{id}/attachments (plan upload). */
export interface RESTPostAPIChannelAttachmentUploadRequest {
  /** List of attachments to upload. */
  attachments: RESTPostAPIChannelAttachmentUploadItem[];
}

/** Singlepart upload response item (small files). */
export interface RESTPostAPIChannelAttachmentUploadSinglepart {
  /** Index-based ID. */
  id: number;
  /** Original filename. */
  filename: string;
  /** CDN filename to reference when sending. */
  upload_filename: string;
  /** File size in bytes. */
  file_size: number;
  /** MIME type. */
  content_type: string;
  /** Upload mode. */
  upload_mode: 'singlepart';
  /** Presigned URL to PUT the file. */
  upload_url: string;
}

/** Single part in multipart upload. */
export interface RESTPostAPIChannelAttachmentUploadMultipartPart {
  /** Part number (1-indexed). */
  part_number: number;
  /** Presigned URL to PUT this part. */
  upload_url: string;
}

/** Multipart upload response item (large files). */
export interface RESTPostAPIChannelAttachmentUploadMultipart {
  /** Index-based ID. */
  id: number;
  /** Original filename. */
  filename: string;
  /** CDN filename to reference when sending. */
  upload_filename: string;
  /** File size in bytes. */
  file_size: number;
  /** MIME type. */
  content_type: string;
  /** Upload mode. */
  upload_mode: 'multipart';
  /** Multipart upload ID. */
  upload_id: string;
  /** Size of each part in bytes. */
  part_size: number;
  /** List of parts to upload. */
  parts: RESTPostAPIChannelAttachmentUploadMultipartPart[];
}

/** Union of singlepart and multipart upload response items. */
export type RESTPostAPIChannelAttachmentUploadResponseItem =
  | RESTPostAPIChannelAttachmentUploadSinglepart
  | RESTPostAPIChannelAttachmentUploadMultipart;

/** Response from POST /channels/{id}/attachments. */
export interface RESTPostAPIChannelAttachmentUploadResponse {
  /** Upload instructions for each attachment. */
  attachments: RESTPostAPIChannelAttachmentUploadResponseItem[];
}

/** Single completed multipart upload. */
export interface RESTPostAPIChannelAttachmentCompleteItem {
  /** CDN filename from upload response. */
  upload_filename: string;
  /** Multipart upload ID from upload response. */
  upload_id: string;
}

/** Request body for POST /channels/{id}/attachments/complete (finalize multipart uploads). */
export interface RESTPostAPIChannelAttachmentCompleteRequest {
  /** List of completed uploads. */
  uploads: RESTPostAPIChannelAttachmentCompleteItem[];
}

/** Single completed upload confirmation. */
export interface RESTPostAPIChannelAttachmentCompleteResult {
  /** CDN filename. */
  upload_filename: string;
}

/** Response from POST /channels/{id}/attachments/complete. */
export interface RESTPostAPIChannelAttachmentCompleteResponse {
  /** Confirmed uploads. */
  uploads: RESTPostAPIChannelAttachmentCompleteResult[];
}

/** Multipart file attachment metadata (index-based id) for FormData sends. */
export interface RESTPostAPIMessageAttachmentMeta {
  /** Index-based ID. */
  id: number;
  /** Filename. */
  filename: string;
  /** Display title. */
  title?: string | null;
  /** Alt text / caption. */
  description?: string | null;
  /** MessageAttachmentFlags bitfield. */
  flags?: number;
  /** MIME type. */
  content_type?: string;
  /** Duration in seconds (audio/video). */
  duration?: number | null;
  /** Base64 waveform (voice messages). */
  waveform?: string | null;
}

/**
 * Presigned-upload attachment reference for JSON message sends
 * (`ClientUploadedAttachmentRequest` in Fluxer schema).
 */
export interface RESTPostAPIMessageUploadedAttachment {
  /** Index-based ID. */
  id: number;
  /** Original filename. */
  filename: string;
  /** CDN filename from presigned upload. */
  upload_filename: string;
  /** File size in bytes. */
  file_size: number;
  /** MIME type. */
  content_type: string;
  /** Display title. */
  title?: string | null;
  /** Alt text / caption. */
  description?: string | null;
  /** MessageAttachmentFlags bitfield. */
  flags?: number;
  /** Duration in seconds (audio/video). */
  duration?: number | null;
  /** Base64 waveform (voice messages). */
  waveform?: string | null;
}

/** Union of FormData and presigned attachment references. */
export type RESTPostAPIMessageAttachment =
  | RESTPostAPIMessageAttachmentMeta
  | RESTPostAPIMessageUploadedAttachment;

/** Type guard to check if attachment is presigned-uploaded. */
export function isUploadedAttachment(
  a: RESTPostAPIMessageAttachment,
): a is RESTPostAPIMessageUploadedAttachment {
  return 'upload_filename' in a && typeof a.upload_filename === 'string';
}
