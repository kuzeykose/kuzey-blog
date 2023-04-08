import BlogCard from '@/components/BlogCard';

export default function Home() {
  return (
    <main>
      <section className="mt-32 flex flex-col items-center lg:block">
        <div className="flex flex-col gap-6">
          <h1 className="text-6xl font-bold">Hello 👋🏼 I am Kuzey</h1>
          <p className="md:w-[370px]">
            This website about things I created, places I visited, things I develop, videos I made, books I read &
            experience I felt.
          </p>
        </div>
      </section>

      <section className="mt-32 flex flex-col items-center lg:block">
        <h2 className="font-semibold text-6xl">Latest Blogs</h2>
        <BlogCard
          image={'https://storage.googleapis.com/my-blog-d3a4b.appspot.com/images/restful-api-with-go.webp'}
          date={'Dec 30, 2021'}
          title={'Restful API with Go (Gin)'}
          description={
            'In this blog, we are developing a restful api with you. Little bit of instruction about what is rest isc rucial. Then, continuing with the developing API is our main task. What is Rest API?'
          }
        />
      </section>
    </main>
  );
}
