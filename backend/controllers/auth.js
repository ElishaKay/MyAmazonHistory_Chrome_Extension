const User = require('../models/user');
const Blog = require('../models/blog');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const { errorHandler } = require('../helpers/dbErrorHandler');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
// sendgrid
const sgMail = require('@sendgrid/mail'); // SENDGRID_API_KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var ActiveCampaign = require("activecampaign");
const request = require('request');
const ac = new ActiveCampaign(process.env.ACTIVE_CAMPAIGN_HOST, process.env.ACTIVE_CAMPAIGN_KEY);

//environment variables need to be set to your API key and url root
const requestOptions = (method) => {
    return  { 
        method: method,
    headers: {
        "Api-Token" : process.env.KEY
    },
    url: `${process.env.HOST}/api/3/` };
}


exports.preSignup = (req, res) => {
    const { name, email, password } = req.body;
    User.findOne({ email: email.toLowerCase() }, (err, userResult) => {
        if (userResult) {
            return res.status(400).json({
                error: 'Email is taken'
            });
        }

        let username = email.split('@')[0];
        let profile = `${process.env.CLIENT_URL}/profile/${username}`;

        const user = new User({ name, email, password, profile, username });
        user.save((err, user) => {
            if (err) {
                return res.status(401).json({
                    error: errorHandler(err)
                });
            }
            
            var contact_add = ac.api("contact/add", {email});

            contact_add.then(function(result) {
                console.log('succesfully added contact',result);

                var eventdata = {
                    tags: 'installed-scraper-king',
                    email
                };

                ac.api('contact/tag/add', eventdata).then(function(result) {
                    console.log('success', result);
                    return res.json({
                        message: `A confirmation email has been sent to ${email}. You may now login.`
                    });
                }, function(err) {
                    console.log('failure', err);
                });     
            }, function(result) {
                console.log(result);
            });

        });

    });
};

// exports.signup = (req, res) => {
//     // console.log(req.body);
//     User.findOne({ email: req.body.email }).exec((err, user) => {
//         if (user) {
//             return res.status(400).json({
//                 error: 'Email is taken'
//             });
//         }

//         const { name, email, password } = req.body;
//         let username = shortId.generate();
//         let profile = `${process.env.CLIENT_URL}/profile/${username}`;

//         let newUser = new User({ name, email, password, profile, username });
//         newUser.save((err, success) => {
//             if (err) {
//                 return res.status(400).json({
//                     error: err
//                 });
//             }
//             // res.json({
//             //     user: success
//             // });
//             res.json({
//                 message: 'Signup success! Please signin.'
//             });
//         });
//     });
// };

exports.signup = (req, res) => {
    const token = req.body.token;
    if (token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function(err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Signup again'
                });
            }

            const { name, email, password } = jwt.decode(token);

            let username = email.split('@')[0];
            let profile = `${process.env.CLIENT_URL}/profile/${username}`;

            const user = new User({ name, email, password, profile, username });
            user.save((err, user) => {
                if (err) {
                    return res.status(401).json({
                        error: errorHandler(err)
                    });
                }
                return res.json({
                    message: 'Singup success! Please signin'
                });
            });
        });
    } else {
        return res.json({
            message: 'Something went wrong. Try again'
        });
    }
};

exports.signin = (req, res) => {
    const { email, password } = req.body;
    // check if user exist
    User.findOne({ email }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup.'
            });
        }
        // authenticate
        if (!user.authenticate(password)) {
            return res.status(400).json({
                error: 'Email and password do not match.'
            });
        }
        // generate a token and send to client
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.cookie('token', token, { expiresIn: '1d' });
        const { _id, username, name, email, role } = user;
        return res.json({
            token,
            user: { _id, username, name, email, role }
        });
    });
};

exports.signout = (req, res) => {
    res.clearCookie('token');
    res.json({
        message: 'Signout success'
    });
};

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET // req.user
});

exports.authMiddleware = (req, res, next) => {
    const authUserId = req.user._id;
    User.findById({ _id: authUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        req.profile = user;
        next();
    });
};

exports.adminMiddleware = (req, res, next) => {
    const adminUserId = req.user._id;
    User.findById({ _id: adminUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }

        if (user.role !== 1) {
            return res.status(400).json({
                error: 'Admin resource. Access denied'
            });
        }

        req.profile = user;
        next();
    });
};

exports.canUpdateDeleteBlog = (req, res, next) => {
    const slug = req.params.slug.toLowerCase();
    Blog.findOne({ slug }).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString();
        if (!authorizedUser) {
            return res.status(400).json({
                error: 'You are not authorized'
            });
        }
        next();
    });
};

exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: 'User with that email does not exist'
            });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: '30d' });

        // email
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Password reset link`,
            html: `
            <p>Please use the following link to reset your password:</p>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>This email may contain sensitive information</p>
            <p>https://myamazonhistory.com</p>
        `
        };
        // populating the db > user > resetPasswordLink
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ error: errorHandler(err) });
            } else {
                sgMail.send(emailData).then(sent => {
                    return res.json({
                        message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10min.`
                    });
                });
            }
        });
    });
};

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Try again'
                });
            }
            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'Something went wrong. Try later'
                    });
                }
                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        });
                    }
                    res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        });
    }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
    const idToken = req.body.tokenId;
    client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID }).then(response => {
        // console.log(response)
        const { email_verified, name, email, jti } = response.payload;
        if (email_verified) {
            User.findOne({ email }).exec((err, user) => {
                if (user) {
                    // console.log(user)
                    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                    res.cookie('token', token, { expiresIn: '1d' });
                    const { _id, email, name, role, username } = user;
                    return res.json({ token, user: { _id, email, name, role, username } });
                } else {
                    let username = shortId.generate();
                    let profile = `${process.env.CLIENT_URL}/profile/${username}`;
                    let password = jti;
                    user = new User({ name, email, profile, username, password });
                    user.save((err, data) => {
                        if (err) {
                            return res.status(400).json({
                                error: errorHandler(err)
                            });
                        }
                        const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                        res.cookie('token', token, { expiresIn: '1d' });
                        const { _id, email, name, role, username } = data;
                        return res.json({ token, user: { _id, email, name, role, username } });
                    });
                }
            });
        } else {
            return res.status(400).json({
                error: 'Google login failed. Try again.'
            });
        }
    });
};
