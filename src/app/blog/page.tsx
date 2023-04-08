import { BlogCard } from '@/components/BlogCard';
import Link from 'next/link';

type Blog = {
  title: string;
  slug: string;
  details: string;
  date: string;
  image: string;
  lang?: string;
};

async function getBlogs() {
  try {
    const blogs = await fetch('https://kuzey-blog.vercel.app/api/blog');
    return blogs.json();
  } catch (error) {
    console.log(error);
  }
}

export default async function Blog() {
  const blogs = await getBlogs();
  return (
    <main>
      <div className="flex flex-col items-center gap-6 my-12">
        {blogs.map((blog: Blog) => (
          <Link href={`/blog/${blog.slug}`} key={blog.slug}>
            <BlogCard
              image={`https://storage.googleapis.com/my-blog-d3a4b.appspot.com/images/${blog.image}`}
              date={blog.date}
              title={blog.title}
              description={blog.details}
            />
          </Link>
        ))}
      </div>
    </main>
  );
}
