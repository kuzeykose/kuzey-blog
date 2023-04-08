import ReactMarkdown from 'react-markdown';

async function getBlog(slug: string) {
  const blog = await fetch(`http://localhost:3000/api/blog/${slug}`);
  return blog.json();
}

export default async function Slug({ params }: { params: { slug: string } }) {
  const blogRes = await getBlog(params.slug);
  return (
    <main className="flex justify-center my-12">
      <article className="prose lg:prose-lg">
        <ReactMarkdown className="p-6 max-w-sm md:max-w-xl lg:max-w-6xl">{blogRes.blog}</ReactMarkdown>
      </article>
    </main>
  );
}
