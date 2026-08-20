import { Formatter } from '~/utils/misc/formatter'
import { hostOf, type NewsPost } from '~/utils/data/news'

// One announcement. Kept separate from the page so it can be tested without
// mounting the feed, and so a future permalink route can render one post
// without duplicating the markup.
const Post = ({ post }: { post: NewsPost }) => {
    const { date, category, title, body, thumbnail, links } = post

    return (
        <article className="news-post">
            <div className="news-post-meta">
                {/* dateTime carries the raw ISO value, so the machine-readable
                    form never depends on how the human one is rendered. */}
                <time className="news-post-date" dateTime={date}>
                    {Formatter.day(date)}
                </time>
                <span className="news-post-category">{category}</span>
            </div>

            <h2 className="news-post-title">{title}</h2>

            {/* alt="" deliberately: the artwork is an abstraction the body
                already describes in words, so descriptive alt text would
                assert something the drawing does not convey. */}
            {thumbnail && (
                <img className="news-post-thumbnail" src={thumbnail} alt="" />
            )}

            <p className="news-post-body">{body}</p>

            {links && links.length > 0 && (
                <p className="news-post-links">
                    {links.map(({ label, href }) => (
                        <a
                            key={href}
                            className="news-post-link"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {label ?? hostOf(href)}
                        </a>
                    ))}
                </p>
            )}
        </article>
    )
}

export default Post
