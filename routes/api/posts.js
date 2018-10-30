const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const validatePostInput = require('../../validation/post');

// Load models
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// @route   GET api/posts/test
// @desc    Tests posts route
// @access  Public
router.get('/test', (req, res) => res.json({
  msg: 'Posts works'
}));

// @route   GET api/posts
// @desc    Get all posts
// @access  Public
router.get('/', (req, res) => {
  let errors = {};

  Post.find()
    .sort({ date: -1 })
    .then(posts => {
      if(posts.length === 0) {
        errors.noprofile = 'There are no posts to show';
        return res.status(404).json(errors);
      }

      res.json(posts);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  Public
router.get('/:id', (req, res) => {
  let errors = {};

  Post.findById(req.params.id)
    .then(post => {
      if(!post) {
        errors.nopost = 'That post does not exist';
        return res.status(404).json(errors);
      }

      res.json(post);
    })
    .catch(err => res.status(404).json(err));
});

// @route   DELETE api/posts/:id
// @desc    Get post by id
// @access  Public
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  let errors = {};

  Profile.findOne({ user: req.user.id})
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(!post) {
            errors.nopost = 'That post does not exist';
            return res.status(404).json(errors);
          }

          // Check for post owner
          if(post.user.toString() !== req.user.id) {
            errors.notauthorised = 'User not authorised';
            return res.status(401).json(errors);
          }

          post.remove().then(() => {
            res.json({ success: true });
          })
          .catch(err => res.status(404).json(err));
        })
        .catch(err => res.status(404).json(err));
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.user.name,
    avatar: req.user.avatar,
    user: req.user.id
  });

  newPost.save().then(post => res.json(post));
});

// @route   POST api/posts/like/:id
// @desc    Like post
// @access  Private
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  let errors = {};

  Profile.findOne({ user: req.user.id})
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(!post) {
            errors.nopost = 'That post does not exist';
            return res.status(404).json(errors);
          }

          // Check already liked
          if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            errors.alreadyliked = 'User already liked this post';
            return res.status(400).json(errors);
          }

          // Add user if to likes array
          post.likes.unshift({ user: req.user.id });

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json(err));
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/posts/unlike/:id
// @desc    Unlike post
// @access  Private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  let errors = {};

  Profile.findOne({ user: req.user.id})
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(!post) {
            errors.nopost = 'That post does not exist';
            return res.status(400).json(errors);
          }

          // Check already liked
          if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            errors.alreadyliked = 'User has not liked this post';
            return res.status(400).json(errors);
          }

          // Remove user from likes array
          const removeIndex = post.likes
            .map(like => like.user.toString())
            .indexOf(req.user.id);
          post.likes.splice(removeIndex, 1);

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json(err));
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/posts/comment/:id
// @desc    Comment on post
// @access  Private
router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  Profile.findOne({ user: req.user.id})
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(!post) {
            errors.nopost = 'That post does not exist';
            return res.status(400).json(errors);
          }

          const newComment = {
            text: req.body.text,
            name: req.user.name,
            avatar: req.user.avatar,
            user: req.user.id
          };

          // Add comment to array
          post.comments.unshift(newComment);

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json(err));
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/posts/comment/:id/:comment_id
// @desc    Remove comment from post
// @access  Private
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  let errors = {};

  Profile.findOne({ user: req.user.id})
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if(!post) {
            errors.nopost = 'That post does not exist';
            return res.status(400).json(errors);
          }

          // Check comment exists
          if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
            errors.nocomment = 'That comment does not exist';
            return res.status(400).json(errors);
          }

          // Remove user from likes array
          const removeIndex = post.comments
            .map(comment => comment._id.toString)
            .indexOf(req.params.comment_id);
          post.comments.splice(removeIndex, 1);

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json(err));
    })
    .catch(err => res.status(404).json(err));
});

module.exports = router;
