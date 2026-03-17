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

    return {
      id: guest.id,
      nume: guest.nume,
      prenume: guest.prenume,
      plus_one: guest.plus_one,
      intro_short: guest.intro_short,
      intro_long: guest.intro_long,
      sex: guest.sex || null,
      partner: partner ? { nume: partner.nume, prenume: partner.prenume } : null,
    };
  });

  // List all guests
  fastify.get('/api/admin/guests', { preHandler: authenticate }, async () => {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM guests ORDER BY created_at DESC'
    );
    return rows;
  });

  // Create guest
  fastify.post<{ Body: GuestBody }>('/api/admin/guests', { preHandler: authenticate }, async (request, reply) => {
    const { nume, prenume, plus_one, intro_short, intro_long, slug, partner_nume, partner_prenume, sex } = request.body;

    if (!nume || !prenume) {
      return reply.status(400).send({ error: 'Nume si prenume sunt obligatorii' });
    }

    if (intro_long && intro_long.length > 500) {
      return reply.status(400).send({ error: 'Intro lung nu poate depasi 500 de caractere' });
    }

    if (plus_one && (!partner_nume || !partner_prenume)) {
      return reply.status(400).send({ error: 'Numele partenerului este obligatoriu cand exista +1' });
    }

    // Check slug uniqueness
    if (slug) {
      const pool = getPool();
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM guests WHERE slug = ?', [slug]
      );
      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Slug-ul este deja folosit' });
      }
    }

    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Create main guest
      const [result] = await conn.execute<ResultSetHeader>(
        'INSERT INTO guests (nume, prenume, plus_one, intro_short, intro_long, slug, sex) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nume, prenume, plus_one ?? false, intro_short || null, intro_long || null, slug || null, sex || null]
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

      await conn.commit();
      return reply.status(201).send({ id: mainId });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  });

  // Update guest
  fastify.put<{ Params: { id: string }; Body: GuestBody }>('/api/admin/guests/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params;
    const { nume, prenume, plus_one, intro_short, intro_long, slug, partner_nume, partner_prenume, sex } = request.body;

    if (!nume || !prenume) {
      return reply.status(400).send({ error: 'Nume si prenume sunt obligatorii' });
    }

    if (intro_long && intro_long.length > 500) {
      return reply.status(400).send({ error: 'Intro lung nu poate depasi 500 de caractere' });
    }

    if (plus_one && (!partner_nume || !partner_prenume)) {
      return reply.status(400).send({ error: 'Numele partenerului este obligatoriu cand exista +1' });
    }

    // Check slug uniqueness (exclude self)
    if (slug) {
      const pool = getPool();
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM guests WHERE slug = ? AND id != ?', [slug, id]
      );
      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Slug-ul este deja folosit' });
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
        'UPDATE guests SET nume = ?, prenume = ?, plus_one = ?, intro_short = ?, intro_long = ?, slug = ?, sex = ? WHERE id = ?',
        [nume, prenume, plus_one ?? false, intro_short || null, intro_long || null, slug || null, sex || null, id]
      );

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
