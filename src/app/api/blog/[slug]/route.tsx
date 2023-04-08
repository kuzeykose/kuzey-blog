import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const blogRef = await fetch(`https://storage.googleapis.com/my-blog-d3a4b.appspot.com/${params.slug}.md`);
  const blogText = await blogRef.text().then((item) => {
    return item;
  });

  return NextResponse.json({ blog: blogText });
}
