import type {
  RESTPostAPIChannelAttachmentCompleteRequest,
  RESTPostAPIChannelAttachmentUploadResponse,
  RESTPostAPIMessageUploadedAttachment,
} from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import type { Client } from '../../client/Client.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { FluxerError } from '../../errors/FluxerError.js';

export type UploadFileForSend = {
  id: number;
  filename: string;
  data: ArrayBuffer | Uint8Array | Buffer;
  /** MIME type sent on the plan request and used for singlepart PUT. */
  contentType: string;
};

function asBytes(data: ArrayBuffer | Uint8Array | Buffer): Uint8Array<ArrayBuffer> {
  const src = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
  const out = new Uint8Array(src.byteLength);
  out.set(src);
  return out;
}

async function putBlob(url: string, body: Blob, contentType?: string): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: contentType ? { 'Content-Type': contentType } : undefined,
    body,
  });
  if (!res.ok) {
    throw new FluxerError(`Presigned upload failed: ${res.status}`, {
      code: ErrorCodes.AttachmentUploadFailed,
    });
  }
}

/** Plan → PUT → `uploadedAttachments` for `send()`. */
export async function uploadAttachmentsForSend(
  client: Client,
  channelId: string,
  files: UploadFileForSend[],
): Promise<RESTPostAPIMessageUploadedAttachment[]> {
  const plan = await client.rest.post<RESTPostAPIChannelAttachmentUploadResponse>(
    Routes.channelAttachments(channelId),
    {
      body: {
        attachments: files.map((f) => ({
          id: f.id,
          filename: f.filename,
          file_size: f.data.byteLength,
          content_type: f.contentType,
        })),
      },
      auth: true,
    },
  );

  const multipart: RESTPostAPIChannelAttachmentCompleteRequest['uploads'] = [];
  const uploaded: RESTPostAPIMessageUploadedAttachment[] = [];

  for (const item of plan.attachments) {
    const file = files.find((f) => f.id === item.id);
    if (!file) {
      throw new FluxerError(`No file data for planned attachment id ${item.id}`, {
        code: ErrorCodes.InvalidAttachmentInput,
      });
    }
    const bytes = asBytes(file.data);

    if (item.upload_mode === 'singlepart') {
      await putBlob(
        item.upload_url,
        new Blob([bytes], { type: file.contentType }),
        item.content_type,
      );
    } else {
      for (const part of item.parts) {
        const start = (part.part_number - 1) * item.part_size;
        const chunk = bytes.subarray(start, Math.min(start + item.part_size, bytes.byteLength));
        await putBlob(part.upload_url, new Blob([asBytes(chunk)]));
      }
      multipart.push({ upload_filename: item.upload_filename, upload_id: item.upload_id });
    }

    uploaded.push({
      id: item.id,
      filename: item.filename,
      upload_filename: item.upload_filename,
      file_size: item.file_size,
      content_type: item.content_type,
    });
  }

  if (multipart.length) {
    await client.rest.post(Routes.channelAttachmentsComplete(channelId), {
      body: { uploads: multipart },
      auth: true,
    });
  }
  return uploaded;
}
