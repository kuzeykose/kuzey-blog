import { youtubeConfig } from '@/youtube-config';
import axios from 'axios';

async function getLatestVideo() {
  const videos = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      channelId: 'UCDMddhql2pRQ48EQW2q1HVQ',
      maxResults: 2,
      order: 'date',
      type: 'videos',
      key: youtubeConfig.key,
    },
  });
  return videos;
}

export default async function About() {
  const latestBlog = await getLatestVideo();
  console.log(latestBlog);

  return (
    <section className="mt-32 flex flex-col items-center lg:block">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-6xl font-bold">Hello 👋🏼 I am Kuzey</h1>
        <p>
          Believe nothing, no matter where you read it, or who said it, no matter if I have said it, unless it agrees
          with your own reason and your own common sense. - Buddha
        </p>
      </div>
      <div>
        <hr className="my-12" />
      </div>
      <div>
        <h2 className="font-semibold text-6xl">Latest Videos</h2>
        <div className="flex gap-12">
          {latestBlog.data.items.map((item: any) => (
            <iframe width="1280" height="300" src={`https://www.youtube.com/embed/${item.id.videoId}`}></iframe>
          ))}
        </div>
      </div>
    </section>
  );
}
