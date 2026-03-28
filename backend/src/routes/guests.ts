import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface GuestBody {
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short?: string;
  intro_long?: string;
  slug?: string;
  partner_nume?: string;
  partner_prenume?: string;
  sex?: 'M' | 'F' | null;
  estimated_gift_min?: number | null;
  estimated_gift_max?: number | null;
  din_partea?: 'mire' | 'mireasa' | 'nasi' | 'parintii_mire' | 'parintii_mireasa' | null;
  loc_pe_scaun?: boolean;
  children?: { nume: string; prenume: string }[];
}

export async function guestRoutes(fastify: FastifyInstance) {
  // Public: get guest by slug (for personalized invitations)
  fastify.get<{ Params: { slug: string } }>('/api/guests/:slug', async (request, reply) => {
    const { slug } = request.params;
    const pool = getPool();

    // Get main guest by slug
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nume, prenume, plus_one, intro_short, intro_long, partner_id, sex FROM guests WHERE slug = ?',
      [slug]
    );

    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Invitatul nu a fost gasit' });
    }

    const guest = rows[0];
    let partner = null;

    if (guest.partner_id) {
      const [partnerRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, nume, prenume FROM guests WHERE id = ?',
        [guest.partner_id]
      );
      if (partnerRows.length > 0) {
        partner = partnerRows[0];
      }
    }

    // Fetch children
    const [childrenRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nume, prenume FROM guest_children WHERE guest_id = ? ORDER BY id ASC',
      [guest.id]
    );

    return {
      id: guest.id,
      nume: guest.nume,
      prenume: guest.prenume,
      plus_one: guest.plus_one,
      intro_short: guest.intro_short,
      intro_long: guest.intro_long,
      sex: guest.sex || null,
      partner: partner ? { nume: partner.nume, prenume: partner.prenume } : null,
      children: childrenRows.map((c) => ({ id: c.id, nume: c.nume, prenume: c.prenume })),
    };
  });

  // List all guests
  fastify.get('/api/admin/guests', { preHandler: authenticate }, async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM guests ORDER BY created_at DESC'
    );
    const [children] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM guest_children ORDER BY id ASC'
    );
    const childrenMap = new Map<number, RowDataPacket[]>();
    for (const c of children) {
      if (!childrenMap.has(c.guest_id)) childrenMap.set(c.guest_id, []);
      childrenMap.get(c.guest_id)!.push(c);
    }
    return rows.map((g) => ({ ...g, children: childrenMap.get(g.id) || [] }));
  });

  // Create guest
  fastify.post<{ Body: GuestBody }>('/api/admin/guests', { preHandler: authenticate }, async (request, reply) => {
    const { nume, prenume, plus_one, intro_short, intro_long, slug, partner_nume, partner_prenume, sex, estimated_gift_min, estimated_gift_max, din_partea, loc_pe_scaun, children } = request.body;

    if (!nume || !prenume) {
      return reply.status(400).send({ error: 'Nume si prenume sunt obligatorii' });
    }

    if (intro_long && intro_long.length > 400) {
      return reply.status(400).send({ error: 'Intro lung nu poate depasi 400 de caractere' });
    }

    if (plus_one && (!partner_nume || !partner_prenume)) {
      return reply.status(400).send({ error: 'Numele partenerului este obligatoriu cand exista +1' });
    }

    const slugNorm = typeof slug === 'string' && slug.trim() ? slug.trim() : null;

    const slugNotUniqueResponse = () =>
      reply.status(400).send({
        error: 'Slug-ul nu este unic. Un alt invitat foloseste deja acest link (slug). Alege un alt slug.',
        field: 'slug',
      });

    if (slugNorm) {
      const pool = getPool();
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM guests WHERE slug = ?',
        [slugNorm]
      );
      if (existing.length > 0) {
        return slugNotUniqueResponse();
      }
    }

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Create main guest
      const [result] = await conn.execute<ResultSetHeader>(
        'INSERT INTO guests (nume, prenume, plus_one, intro_short, intro_long, slug, sex, estimated_gift_min, estimated_gift_max, din_partea, loc_pe_scaun) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nume, prenume, plus_one ?? false, intro_short || null, intro_long || null, slugNorm, sex || null, estimated_gift_min ?? null, estimated_gift_max ?? null, din_partea || null, loc_pe_scaun === true]
      );
      const mainId = result.insertId;

      // If plus_one, create partner and link them
      if (plus_one && partner_nume && partner_prenume) {
        const [partnerResult] = await conn.execute<ResultSetHeader>(
          'INSERT INTO guests (nume, prenume, plus_one, intro_short, intro_long, slug, partner_id) VALUES (?, ?, FALSE, ?, ?, NULL, ?)',
          [partner_nume, partner_prenume, intro_short || null, intro_long || null, mainId]
        );
        const partnerId = partnerResult.insertId;

        // Link main guest to partner
        await conn.execute(
          'UPDATE guests SET partner_id = ? WHERE id = ?',
          [partnerId, mainId]
        );
      }

      // Insert children
      if (children && children.length > 0) {
        for (const child of children) {
          if (child.nume && child.prenume) {
            await conn.execute(
              'INSERT INTO guest_children (guest_id, nume, prenume) VALUES (?, ?, ?)',
              [mainId, child.nume, child.prenume]
            );
          }
        }
      }

      await conn.commit();
      return reply.status(201).send({ id: mainId });
    } catch (err) {
      await conn.rollback();
      const e = err as { code?: string; errno?: number };
      if (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) {
        return slugNotUniqueResponse();
      }
      throw err;
    } finally {
      conn.release();
    }
  });

  // Update guest
  fastify.put<{ Params: { id: string }; Body: GuestBody }>('/api/admin/guests/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const { nume, prenume, plus_one, intro_short, intro_long, slug, partner_nume, partner_prenume, sex, estimated_gift_min, estimated_gift_max, din_partea, loc_pe_scaun, children } = request.body;

    if (!nume || !prenume) {
      return reply.status(400).send({ error: 'Nume si prenume sunt obligatorii' });
    }

    if (intro_long && intro_long.length > 400) {
      return reply.status(400).send({ error: 'Intro lung nu poate depasi 400 de caractere' });
    }

    if (plus_one && (!partner_nume || !partner_prenume)) {
      return reply.status(400).send({ error: 'Numele partenerului este obligatoriu cand exista +1' });
    }

    const slugNormPut = typeof slug === 'string' && slug.trim() ? slug.trim() : null;

    if (slugNormPut) {
      const pool = getPool();
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM guests WHERE slug = ? AND id != ?',
        [slugNormPut, id]
      );
      if (existing.length > 0) {
        return reply.status(400).send({
          error: 'Slug-ul nu este unic. Un alt invitat foloseste deja acest link (slug). Alege un alt slug.',
          field: 'slug',
        });
      }
    }

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Get current guest to check existing partner
      const [currentRows] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM guests WHERE id = ?', [id]
      );
      const current = currentRows[0];
      if (!current) {
        await conn.rollback();
        return reply.status(404).send({ error: 'Invitatul nu a fost gasit' });
      }

      // Update main guest
      await conn.execute(
        'UPDATE guests SET nume = ?, prenume = ?, plus_one = ?, intro_short = ?, intro_long = ?, slug = ?, sex = ?, estimated_gift_min = ?, estimated_gift_max = ?, din_partea = ?, loc_pe_scaun = ? WHERE id = ?',
        [nume, prenume, plus_one ?? false, intro_short || null, intro_long || null, slugNormPut, sex || null, estimated_gift_min ?? null, estimated_gift_max ?? null, din_partea || null, loc_pe_scaun === true, id]
      );

      // Sync children: delete all and re-insert
      await conn.execute('DELETE FROM guest_children WHERE guest_id = ?', [id]);
      if (children && children.length > 0) {
        for (const child of children) {
          if (child.nume && child.prenume) {
            await conn.execute(
              'INSERT INTO guest_children (guest_id, nume, prenume) VALUES (?, ?, ?)',
              [id, child.nume, child.prenume]
            );
          }
        }
      }

      if (plus_one && partner_nume && partner_prenume) {
        if (current.partner_id) {
          // Update existing partner
          await conn.execute(
            'UPDATE guests SET nume = ?, prenume = ? WHERE id = ?',
            [partner_nume, partner_prenume, current.partner_id]
          );
        } else {
          // Create new partner
          const [partnerResult] = await conn.execute<ResultSetHeader>(
            'INSERT INTO guests (nume, prenume, plus_one, intro_short, intro_long, slug, partner_id) VALUES (?, ?, FALSE, ?, ?, NULL, ?)',
            [partner_nume, partner_prenume, intro_short || null, intro_long || null, id]
          );
          await conn.execute(
            'UPDATE guests SET partner_id = ? WHERE id = ?',
            [partnerResult.insertId, id]
          );
        }
      } else if (!plus_one && current.partner_id) {
        // Remove partner if plus_one unchecked
        const partnerId = current.partner_id;
        await conn.execute('UPDATE guests SET partner_id = NULL WHERE id = ?', [id]);
        await conn.execute('DELETE FROM guests WHERE id = ?', [partnerId]);
      }

      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      const e = err as { code?: string; errno?: number };
      if (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) {
        return reply.status(400).send({
          error: 'Slug-ul nu este unic. Un alt invitat foloseste deja acest link (slug). Alege un alt slug.',
          field: 'slug',
        });
      }
      throw err;
    } finally {
      conn.release();
    }
  });

  // Delete guest (also deletes partner)
  fastify.delete<{ Params: { id: string } }>('/api/admin/guests/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Get guest to find partner
      const [rows] = await conn.execute<RowDataPacket[]>(
        'SELECT partner_id FROM guests WHERE id = ?', [id]
      );
      const guest = rows[0];

      if (guest?.partner_id) {
        // Unlink partner first, then delete both
        await conn.execute('UPDATE guests SET partner_id = NULL WHERE id = ?', [id]);
        await conn.execute('UPDATE guests SET partner_id = NULL WHERE id = ?', [guest.partner_id]);
        await conn.execute('DELETE FROM guests WHERE id = ?', [guest.partner_id]);
      }

      await conn.execute('DELETE FROM guests WHERE id = ?', [id]);
      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  });
}
