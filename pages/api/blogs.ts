// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getPosts } from '../../src/blogs'

type Data = {
  title: string
  slug: string
  details: string
  date: string
  allwriten?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data[]>
) {
  const posts = getPosts()
  res.status(200).json(posts)
}
