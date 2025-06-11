import { BlogPosts } from 'app/components/posts'

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        Kuzey Kose
      </h1>
      <p className="mb-4">
        I am software engineer with a passion for building scalable systems, intuitive user interfaces, and open-source tools.
        I enjoy working at the intersection of frontend and backend technologies, with a strong focus on developer experience, performance, and maintainability.
      </p>
      <p className="mb-4">
        Outside of work, I also enjoy live streaming my builds on YouTube and Twitch, contributing to open-source, and sharing what I learn with the community.
      </p>
      <div className="my-8">
        {/* <BlogPosts /> */}
      </div>
    </section>
  )
}
