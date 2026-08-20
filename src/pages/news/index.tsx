import Post from './post'
import { sortedPosts } from '~/utils/data/news'
import './news.scss'

// Unlike /about and /contact this page carries no sup label above the
// heading: the sup would read "News" directly above an h1 reading "News".
const News = () => (
    <section id="news" className="news-area innerpage-single-area">
        <div className="container">
            <header className="news-header">
                <h1 className="news-header-main">News</h1>
                <p className="news-header-body">
                    What we have shipped, and what has changed on the networks we run.
                </p>
            </header>

            <div className="news-feed">
                {sortedPosts().map(post => (
                    <Post key={post.id} post={post} />
                ))}
            </div>
        </div>
    </section>
)

export default News
