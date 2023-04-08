import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

export async function GET() {
  const blogsRef = collection(db, 'blogs');
  const api_blogs = await getDocs(blogsRef);
  const blogs = api_blogs.docs.map((doc) => doc.data());

  //@ts-ignore
  blogs.sort((a: any, b: any) => new Date(b.date) - new Date(a.date));
  return NextResponse.json(blogs);
}
