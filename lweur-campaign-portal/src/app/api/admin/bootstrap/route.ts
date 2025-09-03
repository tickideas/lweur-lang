import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/*
  Secure one-off SUPER_ADMIN bootstrap endpoint.
  Usage (recommended – rely on env, avoid sending password over network):

  Set env vars in Coolify:
    ADMIN_BOOTSTRAP_SECRET=<strong random>
    ADMIN_BOOTSTRAP_EMAIL=admin@example.org
    ADMIN_BOOTSTRAP_PASSWORD=<Strong#AtLeast12Chars>
    ADMIN_BOOTSTRAP_FIRST_NAME=Super (optional)
    ADMIN_BOOTSTRAP_LAST_NAME=Admin (optional)

  Then call once (HTTPS):
    curl -X POST https://your-domain/api/admin/bootstrap \
      -H "x-bootstrap-secret: <strong random>"

  Optional JSON body if you prefer providing values per-call (HTTPS only!):
    {
      "email": "admin@example.org",
      "password": "Strong#Password123",
      "firstName": "Super",
      "lastName": "Admin",
      "force": true   // rotate password / elevate role
    }

  Header:
    x-bootstrap-secret: must match ADMIN_BOOTSTRAP_SECRET

  Safety:
    - Requires secret header
    - Idempotent unless `force` or password/env changes
    - Will not log plaintext password
*/

interface BootstrapBody {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  force?: boolean;
  reset?: boolean; // alias for force
}

function json(status: number, data: any) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  const providedSecret = req.headers.get('x-bootstrap-secret');
  const envSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

  if (!envSecret) {
    return json(500, { ok: false, error: 'ADMIN_BOOTSTRAP_SECRET not configured on server.' });
  }
  if (!providedSecret || providedSecret !== envSecret) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }

  let body: BootstrapBody = {};
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      body = await req.json();
    }
  } catch {
    // ignore malformed body; we'll rely on env instead
  }

  const email = (body.email || process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const password = body.password || process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  const firstName = body.firstName || process.env.ADMIN_BOOTSTRAP_FIRST_NAME || 'Super';
  const lastName = body.lastName || process.env.ADMIN_BOOTSTRAP_LAST_NAME || 'Admin';
  const force = body.force || body.reset || false;

  if (!email) return json(400, { ok: false, error: 'Email required (env or body).' });
  if (!password) return json(400, { ok: false, error: 'Password required (env or body).' });
  if (password.length < 12) return json(400, { ok: false, error: 'Password must be >= 12 chars.' });

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });

    if (existing) {
      if (force) {
        const passwordHash = await bcrypt.hash(password, 12);
        const updated = await prisma.admin.update({
          where: { id: existing.id },
          data: { role: 'SUPER_ADMIN', passwordHash, firstName, lastName, isActive: true }
        });
        return json(200, { ok: true, action: 'updated', email: updated.email, role: updated.role });
      }

      if (existing.role !== 'SUPER_ADMIN') {
        const elevated = await prisma.admin.update({
          where: { id: existing.id },
          data: { role: 'SUPER_ADMIN' }
        });
        return json(200, { ok: true, action: 'elevated', email: elevated.email, role: elevated.role });
      }

      return json(200, { ok: true, action: 'noop', email: existing.email, role: existing.role });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.admin.create({
      data: { email, passwordHash, firstName, lastName, role: 'SUPER_ADMIN', isActive: true }
    });
    return json(201, { ok: true, action: 'created', email: created.email, role: created.role });
  } catch (e) {
    return json(500, { ok: false, error: 'Internal error' });
  }
}
