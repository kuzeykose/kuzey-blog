const BlogPost = ({ blog }: any) => {
  console.log(blog)
  return (
    <>
      <div>{blog.title}</div>
      <article>{blog.allwriten}</article>
      <div>{blog.date}</div>
    </>
  )
};

BlogPost.getInitialProps = async (ctx: any) => {
  const res = await fetch(`https://kuzey-blog-3cgg9kcg1-kosekuzey.vercel.app/api/blog/${ctx.query.blogId}`);
  const json = await res.json();
  return json;
};

export default BlogPost;
