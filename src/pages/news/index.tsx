import PageHeader from '~/components/ui/pageHeader'
import Post from './post'
import { sortedPosts } from '~/utils/data/news'
import './news.scss'

// Follows /about's and /contact's title shape: the sup is the page's name and
// the h1 is a headline. The ROUTES fixture asserts that headline literally, so
// the two move together.
const News = () => (
    <section id="news" className="news-area innerpage-single-area">
        <div className="container">
            <PageHeader supTitle="News" title="What's new" />

            <div className="news-feed">
                {sortedPosts().map(post => (
                    <Post key={post.id} post={post} />
                ))}
            </div>
        </div>
    </section>
)

export default News
