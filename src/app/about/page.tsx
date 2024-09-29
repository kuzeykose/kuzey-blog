import SocialMedia from '@/components/SocialMedia';

export default async function About() {
  return (
    <section className="flex flex-col items-center lg:block py-20">
      <div className="flex justify-center">
        <div className="space-y-12">
          <div className="w-[350px] md:w-full space-y-4">
            <h1 className="text-4xl font-bold">Hello 👋🏼</h1>
            <p className="text-lg">My name is Kuzey. I am a software engineer, in New York City.</p>
            <p className="text-lg">
              Some of my interests are CrossFit, design, building things and{' '}
              <a target='_blank' href="https://www.twitch.tv/kuzey_kose" className="bg-violet-100 p-1 rounded hover:bg-violet-200 transition">streaming</a>. At live streams, software engineering,
              coding, and computer science are the main targets.
            </p>
          </div>
          <SocialMedia />
        </div>
      </div>
    </section>
  );
}
