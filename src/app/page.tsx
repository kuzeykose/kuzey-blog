import BlogCard from '@/components/BlogCard';
import Link from 'next/link';
import Image from 'next/image';

// async function getLatestBlog() {
//   const blogs = await fetch('http://localhost:3000/api/latest-blog');
//   return blogs.json();
// }

export default async function Home() {
  // const latestBlog = await getLatestBlog();
  return (
    <main className="">
      <section className="">
        <div className="relative flex justify-center mt-12">
          {/* <div className="absolute lg:left-[10%]">
            <Image src="/monet-waterlilies.jpg" alt="monet" width={600} height={200} />
          </div> */}
          <div className="flex flex-col gap-6 top-[20%] lg:left-[40%] lg:top-[10%]">
            <h1 className="text-6xl font-bold">
              <span className="bg-yellow-200">Hello 👋🏼</span> I am Kuzey
            </h1>
            <p className="md:w-[420px]">
              <span className="bg-yellow-200">This website is about things I created</span>
              <span>, places I visited,</span>
              <span className="bg-yellow-200"> things I develop, videos I made</span>
              <span>, books I read &</span>
              <span className="bg-yellow-200"> experience I felt.</span>
            </p>
          </div>
        </div>
      </section>

      {/* <section className="flex flex-col items-center lg:block">
        <h2 className="font-semibold text-6xl">Latest Blogs</h2>
        <Link href={`/blog/${latestBlog.slug}`}>
          <BlogCard
            image={`https://storage.googleapis.com/my-blog-d3a4b.appspot.com/images/${latestBlog.image}`}
            date={latestBlog.date}
            title={latestBlog.title}
            description={latestBlog.details}
          />
        </Link>
      </section> */}
    </main>
  );
}
