import Link from "next/link";

const Blog = ({ posts }: any) => {
  console.log(posts);

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

Blog.getInitialProps = async () => {
  const res = await fetch('https://kuzey-blog.vercel.app/api/blogs')
  const posts = await res.json()

  return { posts }
}

export default Blog;
