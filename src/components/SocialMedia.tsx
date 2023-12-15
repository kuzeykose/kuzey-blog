import { GithubIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YouTubeIcon } from '@/icons';
import React from 'react';

const SocialMedia = () => {
  return (
    <div className="flex gap-8">
      <a href="https://github.com/kuzeykose" target="_blank">
        <GithubIcon />
      </a>
      <a href="https://twitter.com/kuzeyks" target="_blank">
        <TwitterIcon />
      </a>

      <a href="https://www.linkedin.com/in/kuzeykose/" target="_blank">
        <LinkedinIcon />
      </a>

      <a href="https://www.youtube.com/kuzeykose" target="_blank">
        <YouTubeIcon />
      </a>
    </div>
  );
};

export default SocialMedia;
