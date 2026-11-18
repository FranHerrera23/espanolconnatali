import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

const path = id => `natali-pilot/v1/${id}.json`;

export const pilotBlob = {
  async read(id) {
    const blob = await get(path(id), { access: 'private', useCache: false });
    return blob ? { record: await new Response(blob.stream).json(), revision: blob.blob.etag } : null;
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
