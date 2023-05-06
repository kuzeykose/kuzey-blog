export default async function Home() {
  return (
    <main>
      <section>
        <div className="flex justify-center mt-12">
          <div className="flex flex-col gap-6">
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
    </main>
  );
}
