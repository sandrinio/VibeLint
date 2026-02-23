import type { FastifyInstance, FastifyReply } from 'fastify';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export default async function fsRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/fs/browse — open native OS folder picker, return absolute path
  fastify.post('/api/fs/browse', async (_request, reply: FastifyReply) => {
    if (process.platform !== 'darwin') {
      return reply.status(501).send({ error: 'Folder picker is only supported on macOS.' });
    }

    try {
      const { stdout } = await execFileAsync('osascript', [
        '-e',
        'POSIX path of (choose folder)',
      ]);
      const folderPath = stdout.trim().replace(/\/$/, ''); // strip trailing slash
      return { path: folderPath };
    } catch {
      // User cancelled the dialog (osascript exits with code 1)
      return reply.status(204).send();
    }
  });
}
