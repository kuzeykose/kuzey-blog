import { GithubLogo, XLogo } from '@phosphor-icons/react/dist/ssr'

const socials = [
    { name: 'GitHub', href: 'https://github.com/kuzeykose', Icon: GithubLogo },
    { name: 'X', href: 'https://x.com/kuzeyks', Icon: XLogo },
]

export default function Page() {
    return (
        <section>
            <h1 className="font-semibold text-2xl mb-2 tracking-tighter">
                Kuzey Kose
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Software engineer based in New York.
            </p>

            <p className="mb-8">
                I like building things — especially the systems and tools that
                make software easier to reason about. I&apos;m drawn to
                multi-tenant platforms, developer tools, and the odd detour
                into compilers when a problem asks for one.
            </p>

            <ul className="mb-8 space-y-2 text-neutral-700 dark:text-neutral-300">
                <li>
                    These days I&apos;m building a high-scalability platform at{' '}
                    <a
                        href="https://unplugdining.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        unPLUG
                    </a>
                    , helping restaurants boost first-party revenue by unifying
                    digital ordering, loyalty, and payments to maximize guest
                    lifetime value.
                </li>
                <li>
                    Every week I go live on{' '}
                    <a
                        href="https://www.youtube.com/@KuzeyK%C3%B6se/streams"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        YouTube
                    </a>{' '}
                    <em>in Turkish</em> — coding, projects, news, etc.
                </li>
            </ul>

            <hr className="my-8 border-neutral-200 dark:border-neutral-800" />

            <p className="mb-8">
                This is my space to share what I&apos;m working on, or thinking
                through. It&apos;s my way of seeing and shaping.
            </p>

            <div className="flex flex-row gap-2">
                {socials.map(({ name, href, Icon }) => (
                    <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={name}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 transition-all hover:text-neutral-900 hover:border-orange-600 dark:hover:text-neutral-100 dark:hover:border-orange-600 focus-visible:outline-none focus-visible:border-orange-600 focus-visible:ring-2 focus-visible:ring-orange-600"
                    >
                        <Icon size={16} weight="bold" />
                    </a>
                ))}
            </div>
        </section>
    );
}
