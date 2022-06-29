import Link from "next/link";

const Blog = ({ posts }: any) => {
  return (
    <div
      style={{
        maxWidth: "850px",
        width: "100%",
        margin: "0 auto",
      }}
    >
      {posts.map((blog: any) => (
        <Link key={blog.slug} href={blog.slug}>
          <div
            key={blog.slug}
            style={{
              borderStyle: "solid",
              borderWidth: 1,
              borderColor: "red",
              margin: 6,
              padding: 12,
              cursor: "pointer",
            }}
          >
            <h5>{blog.title}</h5>
            <p>{blog.details}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

Blog.getInitialProps = async (ctx: any) => {
  const res = await fetch('https://kuzey-blog-3cgg9kcg1-kosekuzey.vercel.app/api/blogs')
  const posts = await res.json()

  return {
    props: {
      posts,
    },
  }
}

export default Blog;
