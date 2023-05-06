import SocialMedia from '@/components/SocialMedia';
import { youtubeConfig } from '@/youtube-config';
import axios from 'axios';

// async function getLatestVideo() {
//   try {
//     const videos = await axios.get('https://www.googleapis.com/youtube/v3/search', {
//       params: {
//         channelId: 'UCDMddhql2pRQ48EQW2q1HVQ',
//         maxResults: 1,
//         order: 'date',
//         type: 'videos',
//         key: youtubeConfig.key,
//       },
//     });
//     return videos;
//   } catch (error) {
//     return { data: { items: [] } };
//   }
// }

export default async function About() {
  // const latestBlog = await getLatestVideo();

  return (
    <section className="flex flex-col items-center lg:block mt-20">
      <div className="flex justify-center">
        <div className="space-y-24">
          <div className="w-[350px] md:w-[550px] space-y-4">
            <h1 className="text-4xl font-bold">Hello 👋🏼</h1>
            <p className="text-lg">
              My name is Kuzey. I am a software engineer. <br /> I live in New York City.
            </p>
            <p className="text-lg">
              Some of my interests are creating content on YouTube, crossfit, design, and building things.
            </p>
            <p className="text-lg">
              At live streams, software engineering, coding, and computer science are the main targets. If you are
              interested in my life, you can see my videos.
            </p>
          </div>

          <SocialMedia />
          {/* <div className="space-y-4">
            <h2 className="font-bold text-4xl">Lates video!</h2>
            {latestBlog?.data?.items?.map((item: any) => (
              <iframe
                key={item.id.videoId}
                width="auto"
                src={`https://www.youtube.com/embed/${item.id.videoId}`}
              ></iframe>
            ))}
          </div> */}
        </div>
      </div>
    </section>
  );
}
