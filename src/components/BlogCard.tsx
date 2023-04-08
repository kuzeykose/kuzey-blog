import React from 'react';

type BlogCard = {
  image: string;
  date: string;
  title: string;
  description: string;
};

export const BlogCard = ({ image, date, title, description }: BlogCard) => {
  return (
    <div className="flex flex-col gap-6 lg:gap-14 lg:flex-row my-6">
      <img className="lg:max-w-[450px]" src={image} />
      <div className="flex flex-col justify-center max-w-[450px] gap-1 lg:max-w-fit lg:gap-3">
        <time className="font-semibold text-xl lg:text-2xl">{date}</time>
        <h3 className="font-medium text-4xl">{title}</h3>
        <p className=" lg:text-xl">{description}</p>
      </div>
    </div>
  );
};

export default BlogCard;
