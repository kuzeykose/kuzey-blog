const BlogPost = (props: any) => {
  return (
    <>
      <div>{props.blog.title}</div>
      <article>{props.blog.allwriten}</article>
      <div>{props.blog.date}</div>
    </>
  )
};


export async function getStaticProps(context: any) {
  const blogId = context.params.blogId

  const res = await fetch(`https://kuzey-blog.vercel.app/api/blog/${blogId}`);
  const blog = await res.json()

  return {
    props: blog
  }
}

export async function getStaticPaths() {
  const res = await fetch('https://kuzey-blog.vercel.app/api/blogs')
  let blogs = await res.json()

  return {
    paths: blogs.map((item: any) => { return { params: { blogId: item.slug } } }),
    fallback: false
  };
}

export default BlogPost;
