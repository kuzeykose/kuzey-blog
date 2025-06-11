import {
  GithubLogoIcon,
  TwitchLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const links = {
  "https://www.twitch.tv/kuzey_kose": {
    name: "twitch",
    icon: <TwitchLogoIcon color="#6441A5" size={26} />,
  },
  "https://www.youtube.com/@kuzeykose": {
    name: "youtube",
    icon: <YoutubeLogoIcon color="#FF0000" size={26} />,
  },
  "https://github.com/kuzeykose": {
    name: "github",
    icon: <GithubLogoIcon size={26} />,
  },
  "https://x.com/kuzeyks": {
    name: "x",
    icon: <XLogoIcon size={26} />,
  },
};

export const metadata = {
  title: "About",
  description: "About me.",
};

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">About</h1>
      <p className="mb-4">
        I am Kuzey Kose, a software engineer based in New York.
      </p>

      <p className="mb-4">
        I like building things — especially scalable systems, user-friendly
        interface. I enjoy working across both frontend and backend, and I care
        a lot about performance and developer experience.
      </p>

      <p className="mb-4">
        My interests are olimpic weight lifting, crossfit, content creation{" "}
        <span className="italic">(youtube, twitch)</span> and electronics.
      </p>

      <p className="mb-4">
        This blog is my space to share what I&apos;m working on, learning about,
        or thinking through. It&apos;s my way of seeing and shaping the world —
        one project at a time.
      </p>

      <div className="space-y-2 gap-6 py-4">
        {Object.entries(links).map(([path, { name, icon }]) => {
          return (
            <Link
              key={path}
              href={path}
              className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex gap-2 align-middle relative"
              target="_blank"
            >
            {icon} {name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
