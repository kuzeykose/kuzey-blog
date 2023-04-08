import { blogPosts } from '../../../../../../data/blog-posts';
import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase';

type Blog = {
  title: string;
  slug: string;
  details: string;
  date: string;
  image: string;
  lang?: string;
};

export async function GET() {
  const blogs: Blog[] = blogPosts();
  blogs.forEach((blog: Blog) => setDoc(doc(db, 'blogs', blog.slug), blog));
  return NextResponse.json(blogs);
}
