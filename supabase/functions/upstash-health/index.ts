import { Redis } from 'https://esm.sh/@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

Deno.serve(async _req => {
  const region = Deno.env.get('DENO_REGION') ?? 'localhost';
  const key = `stg:edge:ping:${region}`;
  await redis.incr(key);
  const v = await redis.get<number>(key);
  return new Response(JSON.stringify({ region, key, count: v }), {
    status: 200,
  });
});
