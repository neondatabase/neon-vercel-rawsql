import { Pool } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
  regions: ['fra1'],  // fra1 = Frankfurt: pick the Vercel region nearest your Neon DB
};

export default async (req: Request, ctx: any) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const longitude = parseFloat(req.headers.get('x-vercel-ip-longitude') ?? '-122.47');
  const latitude = parseFloat(req.headers.get('x-vercel-ip-latitude') ?? '37.81');
  const { rows: sites } = await pool.query(`
    SELECT 
      id_no, name_en, category,
      'https://whc.unesco.org/en/list/' || id_no || '/' AS link,
      location <-> st_makepoint($1, $2) AS distance
    FROM whc_sites_2021
    ORDER BY distance
    LIMIT 10`, 
    [longitude, latitude]
  );
  ctx.waitUntil(pool.end());

  return new Response(JSON.stringify({ longitude, latitude, sites }, null, 2));
}
