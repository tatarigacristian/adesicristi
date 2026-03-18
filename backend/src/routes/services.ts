import { FastifyInstance } from 'fastify';
import { getPool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import fastifyMultipart from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'node:stream/promises';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'contracts');

export async function serviceRoutes(fastify: FastifyInstance) {
  await fastify.register(fastifyMultipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // List all services
  fastify.get('/api/admin/services', { preHandler: authenticate }, async (request, reply) => {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM services ORDER BY created_at DESC');
    return rows;
  });

  // Create service
  fastify.post('/api/admin/services', { preHandler: authenticate }, async (request, reply) => {
    const pool = getPool();
    const fields: Record<string, string> = {};
    let contractPath: string | null = null;

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'contract') {
        const filename = `${Date.now()}_${part.filename}`;
        const filepath = path.join(UPLOADS_DIR, filename);
        await pipeline(part.file, fs.createWriteStream(filepath));
        contractPath = `uploads/contracts/${filename}`;
      } else if (part.type === 'field') {
        fields[part.fieldname] = part.value as string;
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO services (nume, numar_persoane, pret, avans, contract_start, contract_end, loc_la_masa, link, contract_path, telefon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fields.nume,
        parseInt(fields.numar_persoane),
        parseFloat(fields.pret),
        fields.avans ? parseFloat(fields.avans) : null,
        fields.contract_start || null,
        fields.contract_end || null,
        fields.loc_la_masa === 'true' || fields.loc_la_masa === '1' ? 1 : 0,
        fields.link || null,
        contractPath,
        fields.telefon || null,
      ]
    );

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM services WHERE id = ?', [result.insertId]);
    return reply.code(201).send(rows[0]);
  });

  // Update service
  fastify.put('/api/admin/services/:id', { preHandler: authenticate }, async (request, reply) => {
    const pool = getPool();
    const { id } = request.params as { id: string };
    const fields: Record<string, string> = {};
    let contractPath: string | null | undefined = undefined;

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'contract') {
        // Delete old file if exists
        const [existing] = await pool.query<RowDataPacket[]>('SELECT contract_path FROM services WHERE id = ?', [id]);
        if (existing[0]?.contract_path) {
          const oldPath = path.join(process.cwd(), existing[0].contract_path);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const filename = `${Date.now()}_${part.filename}`;
        const filepath = path.join(UPLOADS_DIR, filename);
        await pipeline(part.file, fs.createWriteStream(filepath));
        contractPath = `uploads/contracts/${filename}`;
      } else if (part.type === 'field') {
        fields[part.fieldname] = part.value as string;
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (fields.nume !== undefined) { updateFields.push('nume = ?'); updateValues.push(fields.nume); }
    if (fields.numar_persoane !== undefined) { updateFields.push('numar_persoane = ?'); updateValues.push(parseInt(fields.numar_persoane)); }
    if (fields.pret !== undefined) { updateFields.push('pret = ?'); updateValues.push(parseFloat(fields.pret)); }
    if (fields.avans !== undefined) { updateFields.push('avans = ?'); updateValues.push(fields.avans ? parseFloat(fields.avans) : null); }
    if (fields.contract_start !== undefined) { updateFields.push('contract_start = ?'); updateValues.push(fields.contract_start || null); }
    if (fields.contract_end !== undefined) { updateFields.push('contract_end = ?'); updateValues.push(fields.contract_end || null); }
    if (fields.loc_la_masa !== undefined) { updateFields.push('loc_la_masa = ?'); updateValues.push(fields.loc_la_masa === 'true' || fields.loc_la_masa === '1' ? 1 : 0); }
    if (fields.link !== undefined) { updateFields.push('link = ?'); updateValues.push(fields.link || null); }
    if (fields.telefon !== undefined) { updateFields.push('telefon = ?'); updateValues.push(fields.telefon || null); }
    if (contractPath !== undefined) { updateFields.push('contract_path = ?'); updateValues.push(contractPath); }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.query<ResultSetHeader>(
        `UPDATE services SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM services WHERE id = ?', [id]);
    if (!rows[0]) {
      return reply.code(404).send({ error: 'Service not found' });
    }
    return rows[0];
  });

  // Delete service
  fastify.delete('/api/admin/services/:id', { preHandler: authenticate }, async (request, reply) => {
    const pool = getPool();
    const { id } = request.params as { id: string };

    const [existing] = await pool.query<RowDataPacket[]>('SELECT contract_path FROM services WHERE id = ?', [id]);
    if (!existing[0]) {
      return reply.code(404).send({ error: 'Service not found' });
    }

    if (existing[0].contract_path) {
      const filePath = path.join(process.cwd(), existing[0].contract_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query<ResultSetHeader>('DELETE FROM services WHERE id = ?', [id]);
    return { success: true };
  });

  // Serve contract file
  fastify.get('/api/admin/services/:id/contract', { preHandler: authenticate }, async (request, reply) => {
    const pool = getPool();
    const { id } = request.params as { id: string };

    const [rows] = await pool.query<RowDataPacket[]>('SELECT contract_path, nume FROM services WHERE id = ?', [id]);
    if (!rows[0] || !rows[0].contract_path) {
      return reply.code(404).send({ error: 'Contract not found' });
    }

    const filePath = path.join(process.cwd(), rows[0].contract_path);
    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ error: 'Contract file not found' });
    }

    const filename = path.basename(rows[0].contract_path);
    return reply
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Content-Type', 'application/pdf')
      .send(fs.createReadStream(filePath));
  });
}
