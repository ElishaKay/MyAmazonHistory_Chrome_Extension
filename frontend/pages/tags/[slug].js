import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useState } from 'react';

import { singleTag } from '../../actions/tag';
import { API, DOMAIN, APP_NAME, FB_APP_ID } from '../../config';
import renderHTML from 'react-render-html';
import moment from 'moment';
import Card from '../../components/blog/Card';
import FlipCard from '../../components/blog/FlipCard';

import '../../components/blog/BlogPage.css';
import HowItWorks from '../../components/tutorials/HowItWorks';
import Header from '../../components/Header';

const Tag = ({ tag, blogs, query, totalBlogs, blogsLimit, blogSkip }) => {
    const head = () => (
        <Head>
            <title>
                {tag && tag.name || 'Welcome'} | {APP_NAME}
            </title>
            <meta name="description" content={`View the best Amazon products ${tag ? 'related to '+tag.name : ''}`} />
            <link rel="canonical" href={`${DOMAIN}/categories/${query.slug}`} />
            <meta property="og:title" content={`${tag && tag.name}| ${APP_NAME}`} />
            <meta property="og:description" content={`View the best Amazon products ${tag ? 'related to '+tag.name : ''}`} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={`${DOMAIN}/categories/${query.slug}`} />
            <meta property="og:site_name" content={`${APP_NAME}`} />

            <meta property="og:image" content={`${DOMAIN}/static/images/lrgfbimg.jpg`} />
            <meta property="og:image:secure_url" content={`${DOMAIN}/static/images/lrgfbimg.jpg`} />
            <meta property="og:image:type" content="image/jpg" />
            <meta property="fb:app_id" content={`${FB_APP_ID}`} />
        </Head>
    );

    const [limit, setLimit] = useState(blogsLimit);
    const [skip, setSkip] = useState(0);
    const [size, setSize] = useState(totalBlogs);
    const [loadedBlogs, setLoadedBlogs] = useState([]);

    const loadMore = () => {
        let toSkip = skip + limit;

        singleTag(query.slug, toSkip, limit).then(data => {
            if (data.error) {
                console.log(data.error);
            } else {
                setLoadedBlogs([...data.blogs, ...loadedBlogs]);
                setSize(data.size);
                setSkip(toSkip);
            }
        });
    };

    const loadMoreButton = () => {
        return (
            size > 0 &&
            size >= limit && (
                <button onClick={loadMore} className="btn btn-outline-primary btn-lg">
                    Load more
                </button>
            )
        );
    };

    const showAllBlogs = () => {
        return blogs.map((blog, i) => {
            return (
                <div key={i} className="col-md-4">
                    <FlipCard blog={blog} />
                </div>
            );
        });
    };


    const showLoadedBlogs = () => {
        return loadedBlogs.map((blog, i) => (
            <div key={i} className="col-md-4">
                <FlipCard blog={blog} />
            </div>
        ));
    };

    return (
        <React.Fragment>
            {head()}
            {!tag ? <div><Header/> <HowItWorks/></div> :
            <Layout>
                <main>
                    <div className="container-fluid text-center">
                        <header>
                            <div className="col-md-12 pt-3">
                                <h1 className="display-4 font-weight-bold">{tag.name}</h1>
                            </div>
                        </header>
                    </div>
                </main>
                
                <div className="container">
                    <div className="row">
                        <div className="col-md-12 text-center pt-4 pb-2">
                            <p className="lead">
                                Share your Amazon history with friends and family. Use the Chrome Extension to generate your listings within minutes.
                            </p>
                             <div className="pt-3 pb-3 action">
                                 <Link prefetch={false} href="https://chrome.google.com/webstore/detail/my-amazon-history/epmjnoajehdombhjonaoifmhbkkflnli">
                                    <a target={"_blank"} className="add-to-cart btn btn-default">Get The Chrome Extension</a>
                                </Link>
                            </div>
                            <p className="lead">
                                The Amazon Wave is sweeping the world economy. Check out what other users purchased, write reviews, comment on other people's posts, 
                                and make up to 10% commission when someone purchases an Amazon Product via one of your pages. 
                            </p>
                        </div>
                    </div>
                </div>
                         
                <div className="text-center pb-5">{loadMoreButton()}</div>      


                <article className="overflow-hidden">
                    <div className="container-fluid">
                        <div className="row">{showLoadedBlogs()}{showAllBlogs()}</div>
                    </div>
            </article>
            </Layout>}
        </React.Fragment>
    );
};

Tag.getInitialProps = ({ query }) => {
    let skip = 0;
    let limit = 9;

    return singleTag(query.slug, skip, limit).then(data => {
        if (!data) {
            console.log('there was an error fetching the blog');
            return {blog: '', query: {slug: '/'}}
        } else {
            return { 
                tag: data.tag, 
                blogs: data.blogs, 
                query,
                totalBlogs: data.size,
                blogsLimit: limit,
                blogSkip: skip
            };
        }
    });
};


export default Tag;
