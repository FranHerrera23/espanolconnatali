import { BlobPreconditionFailedError, get, head, put } from '@vercel/blob';

const path = id => `natali-pilot/v1/${id}.json`;

export const pilotBlob = {
  async read(id) {
    const pathname = path(id);
    for (let attempt = 0; attempt < 3; attempt++) {
      const blob = await get(pathname, { access: 'private', useCache: false });
      if (!blob) return null;
      const metadata = await head(blob.blob.url);
      // The download ETag is an HTTP header. Conditional writes use the storage ETag.
      const normalize = etag => etag?.replace(/^W\//, '').replace(/^"|"$/g, '');
      if (metadata.etag && normalize(blob.blob.etag) === normalize(metadata.etag)) {
        return { record: await new Response(blob.stream).json(), revision: metadata.etag };
      }
      await blob.stream.cancel();
    }
    throw new Error('Could not read a consistent pilot profile revision');
  },
  async write(id, record, revision) {
    try {
      await put(path(id), JSON.stringify(record), {
        access: 'private', contentType: 'application/json', allowOverwrite: revision !== null,
        ...(revision === null ? {} : { ifMatch: revision }),
      });
      return true;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError || (revision === null && /already exists/i.test(error.message))) return false;
      throw error;
    }
  },
};
