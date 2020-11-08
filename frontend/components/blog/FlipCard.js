import Link from 'next/link';
import renderHTML from 'react-render-html';
import moment from 'moment';
import { API } from '../../config';

const FlipCard = ({ blog }) => {
    const showBlogCategories = blog =>
        blog.categories.map((c, i) => (
            <Link key={i} href={`/categories/${c.slug}`}>
                <a className="btn btn-primary mr-1 ml-1 mt-3">{c.name}</a>
            </Link>
        ));

    const showBlogTags = blog =>
        blog.tags.map((t, i) => (
            <Link key={i} href={`/tags/${t.slug}`}>
                <a className="btn btn-outline-primary mr-1 ml-1 mt-3">{t.name}</a>
            </Link>
        ));

    const getFeaturedImage = blog => {
        let url = blog.autoGenerated ? blog.product_imgurl : `${API}/blog/photo/${blog.slug}`;
        return url.replace(".jpg", ".SL375.jpg"); 
    }
        

    return (
        //new
        <div className="flip flip-horizontal">
            <div
                className="front"
                style={{
                    backgroundImage:
                        'url(' +
                        getFeaturedImage(blog) +
                        ')'
                }}
            >
                <h2 className="text-shadow text-center h1"></h2>
            </div>
            <div className="back text-center">
                <Link href={`/blogs/${blog.slug}`}>    
                    <h6 className="pt-3 pb-3 font-weight-bold">{blog.title}</h6>
                </Link>
                <Link href={`/blogs/${blog.slug}`}>
                     <a className="btn btn-primary pt-2">Read more</a>
                </Link>
                <p className="pt-3 pb-3 lead">{blog.postedBy ? 'Check out this purchase made by ' : ''}
                    <Link href={`/profile/${blog.postedBy ? blog.postedBy.username : ''}`}>
                         <a>{blog.postedBy ? blog.postedBy.username : ''}</a>
                     </Link>{' '}
                </p>
            </div>
        </div>
    );
};

export default FlipCard;




//old
        // <div className="lead pb-4">
        //     <header>
        //         <Link href={`/blogs/${blog.slug}`}>
        //             <a>
        //                 <h2 className="pt-3 pb-3 font-weight-bold">{blog.title}</h2>
        //             </a>
        //         </Link>
        //     </header>
        //     <section>
        //         <p className="mark ml-1 pt-2 pb-2">
        //             Written by{' '}
        //             <Link href={`/profile/${blog.postedBy.username}`}>
        //                 <a>{blog.postedBy.username}</a>
        //             </Link>{' '}
        //             | Published {moment(blog.updatedAt).fromNow()}
        //         </p>
        //     </section>
        //     <section>
        //         {showBlogCategories(blog)}
        //         {showBlogTags(blog)}
        //         <br />
        //         <br />
        //     </section>

        //     <div className="row">
        //         <div className="col-md-4">
        //             <section>
        //                 <img
        //                     className="img img-fluid"
        //                     style={{ maxHeight: 'auto', width: '100%' }}
        //                     src={getFeaturedImage(blog)}
        //                     alt={blog.title}
        //                 />
        //             </section>
        //         </div>
        //         <div className="col-md-8">
        //             <section>
        //                 <div className="pb-3">{blog.mdesc}</div>
        //                 <Link href={`/blogs/${blog.slug}`}>
        //                     <a className="btn btn-primary pt-2">Read more</a>
        //                 </Link>
        //             </section>
        //         </div>
        //     </div>
        // </div>