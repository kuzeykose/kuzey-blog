// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getPosts } from '../../../src/blogs'

type Blog = {
  blog: Data | undefined
}

type Data = {
  title: string
  slug: string
  details: string
  date: string
  allwriten?: string
}

const posts = getPosts()

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Blog>
) {
  res.status(200).json({
    blog: posts.find((post: Data) => post.slug === req.query.blogId)
  })
}
