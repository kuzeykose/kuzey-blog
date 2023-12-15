import Image from 'next/image';
import Link from 'next/link';

export default async function Home() {
  return (
    <main>
      <section>
        <div className="flex justify-between py-20">
          <div className="space-y-6 py-2">
            <h1 className="text-6xl font-bold tracking-[-2px]">
              <span className="bg-yellow-200 p-1 rounded-md">Hello 👋🏼</span> Kuzey here!
            </h1>
            <p className="text-xl md:w-[500px]">
              Passionate and innovative engineer, content creator on weekends with live streams. Check{' '}
              <Link href="/about" className="bg-lime-200 px-1 rounded">
                About
              </Link>{' '}
              for more.
            </p>
          </div>
          <div className="hidden md:block w-[300px]">
            <Image width={300} height={300} alt="profile" src="/profile.jpg" className="rounded-lg" />
          </div>
        </div>
      </section>
    </main>
  );
}
