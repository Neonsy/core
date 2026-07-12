import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { FluxerError } from '../../errors/FluxerError.js';
import type { MessageFileData, ResolvedMessageFile } from './types.js';

const FILE_FETCH_TIMEOUT_MS = 30_000;

async function fetchFileBuffer(url: string, index: number): Promise<ArrayBuffer> {
  if (!URL.canParse(url)) {
    throw new FluxerError(`Invalid file URL at index ${index}: ${url}`, {
      code: ErrorCodes.InvalidFileUrl,
    });
  }
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(FILE_FETCH_TIMEOUT_MS) });
  } catch (err) {
    throw new FluxerError(`Failed to fetch file from ${url}`, {
      code: ErrorCodes.FileFetchFailed,
      cause: err instanceof Error ? err : undefined,
    });
  }
  if (!res.ok) {
    throw new FluxerError(`Failed to fetch file from ${url}: ${res.status} ${res.statusText}`, {
      code: ErrorCodes.FileFetchFailed,
    });
  }
  return res.arrayBuffer();
}

/** Resolve files: fetch URLs to buffers, pass through data as-is. */
export async function resolveMessageFiles(
  files: MessageFileData[],
): Promise<ResolvedMessageFile[]> {
  const result: ResolvedMessageFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f) continue;
    const filename = f.filename ?? f.name;
    if ('url' in f && f.url) {
      result.push({ name: f.name, data: await fetchFileBuffer(f.url, i), filename });
    } else if ('data' in f && f.data != null) {
      result.push({ name: f.name, data: f.data, filename });
    } else {
      throw new FluxerError(`File at index ${i} must have either "data" or "url"`, {
        code: ErrorCodes.InvalidAttachment,
      });
    }
  }
  return result;
}
