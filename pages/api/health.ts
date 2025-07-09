import type { NextApiRequest, NextApiResponse } from 'next';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({ 
    status: 'OK', 
    apiKeyConfigured: !!STABILITY_API_KEY 
  });
} 