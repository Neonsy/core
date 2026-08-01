/** Attachment upload / message attachment SDK options. */

/** Edits to an existing message attachment (by `id`) when editing a message. */
export interface MessageAttachmentEdit {
  id: number | string;
  filename?: string;
  uploadFilename?: string;
  fileSize?: number;
  contentType?: string;
  title?: string | null;
  description?: string | null;
  flags?: number;
}

/** Convert {@link MessageAttachmentEdit} entries to wire attachment objects. */
export function toMessageAttachmentEditWire(
  attachments: readonly MessageAttachmentEdit[],
): Array<Record<string, unknown>> {
  return attachments.map((a) => {
    const out: Record<string, unknown> = { id: a.id };
    if (a.filename !== undefined) out.filename = a.filename;
    if (a.uploadFilename !== undefined) out.upload_filename = a.uploadFilename;
    if (a.fileSize !== undefined) out.file_size = a.fileSize;
    if (a.contentType !== undefined) out.content_type = a.contentType;
    if (a.title !== undefined) out.title = a.title;
    if (a.description !== undefined) out.description = a.description;
    if (a.flags !== undefined) out.flags = a.flags;
    return out;
  });
}

/** Plan item for {@link Channel.requestAttachmentUploads}. */
export interface AttachmentUploadPlanItem {
  id: number;
  filename: string;
  fileSize: number;
  contentType: string;
}

/** Convert plan items to the attachments request wire body. */
export function toAttachmentUploadPlanBody(attachments: readonly AttachmentUploadPlanItem[]): {
  attachments: Array<Record<string, unknown>>;
} {
  return {
    attachments: attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      file_size: a.fileSize,
      content_type: a.contentType,
    })),
  };
}

/** Multipart complete item for {@link Channel.completeAttachmentUploads}. */
export interface AttachmentUploadCompleteItem {
  uploadFilename: string;
  uploadId: string;
}

/** Convert complete items to the attachments/complete wire body. */
export function toAttachmentUploadCompleteBody(uploads: readonly AttachmentUploadCompleteItem[]): {
  uploads: Array<{ upload_filename: string; upload_id: string }>;
} {
  return {
    uploads: uploads.map((u) => ({
      upload_filename: u.uploadFilename,
      upload_id: u.uploadId,
    })),
  };
}

/** Part in a multipart upload plan response. */
export interface AttachmentUploadPartPayload {
  partNumber: number;
  uploadUrl: string;
}

/** Singlepart plan response item. */
export interface AttachmentUploadSinglepartPayload {
  id: number;
  filename: string;
  uploadFilename: string;
  fileSize: number;
  contentType: string;
  uploadMode: 'singlepart';
  uploadUrl: string;
}

/** Multipart plan response item. */
export interface AttachmentUploadMultipartPayload {
  id: number;
  filename: string;
  uploadFilename: string;
  fileSize: number;
  contentType: string;
  uploadMode: 'multipart';
  uploadId: string;
  partSize: number;
  parts: AttachmentUploadPartPayload[];
}

export type AttachmentUploadPlanResponseItem =
  | AttachmentUploadSinglepartPayload
  | AttachmentUploadMultipartPayload;

/** CamelCase response from {@link Channel.requestAttachmentUploads}. */
export interface AttachmentUploadPlanResponse {
  attachments: AttachmentUploadPlanResponseItem[];
}

/** CamelCase response from {@link Channel.completeAttachmentUploads}. */
export interface AttachmentUploadCompleteResponse {
  uploads: Array<{ uploadFilename: string }>;
}

/** Map wire attachment plan response → camelCase. */
export function toAttachmentUploadPlanResponse(data: {
  attachments: Array<{
    id: number;
    filename: string;
    upload_filename: string;
    file_size: number;
    content_type: string;
    upload_mode: 'singlepart' | 'multipart';
    upload_url?: string;
    upload_id?: string;
    part_size?: number;
    parts?: Array<{ part_number: number; upload_url: string }>;
  }>;
}): AttachmentUploadPlanResponse {
  return {
    attachments: data.attachments.map((item) => {
      const base = {
        id: item.id,
        filename: item.filename,
        uploadFilename: item.upload_filename,
        fileSize: item.file_size,
        contentType: item.content_type,
      };
      if (item.upload_mode === 'multipart') {
        const parts = (item.parts ?? []).map((p) => ({
          partNumber: p.part_number,
          uploadUrl: p.upload_url,
        }));
        return {
          ...base,
          uploadMode: 'multipart' as const,
          uploadId: item.upload_id ?? '',
          partSize: item.part_size ?? 0,
          parts,
        };
      }
      return {
        ...base,
        uploadMode: 'singlepart' as const,
        uploadUrl: item.upload_url ?? '',
      };
    }),
  };
}
