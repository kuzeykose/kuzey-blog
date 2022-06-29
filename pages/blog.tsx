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
        <Link href={blog.slug}>
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

export async function getStaticProps() {
  const res = await fetch('http://localhost:3000/api/blogs')
  const posts = await res.json()

  return {
    props: {
      posts,
    },
  }
}

export default Blog;
