import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.EXPORT_DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const tables = await client.query(`
  SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
`);

for (const t of tables.rows) {
  try {
    const res = await client.query(`SELECT count(*) FROM "${t.tablename}"`);
    console.log(`${t.tablename}: ${res.rows[0].count}`);
  } catch (e) {
    console.log(`${t.tablename}: ERROR (${e.message})`);
  }
}
await client.end();