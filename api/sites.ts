import { Pool } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
  regions: ['fra1'],  // fra1 = Frankfurt: pick the Vercel region nearest your Neon DB
};

let pool: Pool | undefined;
let poolCreatedAt: string | undefined;
let poolTimeout: ReturnType<typeof setTimeout> | undefined;
let poolTimeoutResolve: (() => void) | undefined;

export default async (req: Request, event: any) => {
  console.log(`Handling request`);

  if (pool) {
    // tear down the keep-awake mechanism we created last time
    console.log(`Using pool created at: ${poolCreatedAt}`);
    clearTimeout(poolTimeout);
    poolTimeoutResolve!();
    
  } else {
    console.log(`Creating new pool`);
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    poolCreatedAt = new Date().toISOString();
  };

  // keep the runtime awake until ...
  event.waitUntil(new Promise<void>(resolve => { poolTimeoutResolve = resolve; }));

  // ... there are no requests for 30s, when we end the pool and let the runtime sleep
  poolTimeout = setTimeout(async () => {
    console.log(`Ending pool`);
    const endingPool = pool;
    pool = undefined;
    await endingPool?.end();
    poolTimeoutResolve!();
  }, 30000);

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

  const { totalCount, idleCount, waitingCount } = pool;
  return new Response(JSON.stringify({poolCreatedAt, totalCount, idleCount, waitingCount, longitude, latitude, sites }, null, 2));
}
