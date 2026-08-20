import Post from './post'
import { sortedPosts } from '~/utils/data/news'
import './news.scss'

// Follows the protocol routes' title shape rather than /about's: the sup is
// the descriptor and the h1 is the page's name, which is why the h1 can stay
// the literal "News" that the ROUTES fixture asserts.
const News = () => (
    <section id="news" className="news-area innerpage-single-area">
        <div className="container">
            <header className="news-header">
                <p className="news-header-sup">What we ship, and what changes</p>
                <h1 className="news-header-main">News</h1>
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
