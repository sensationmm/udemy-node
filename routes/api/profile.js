const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load models
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => res.json({
  msg: 'Profile works'
}));

// @route   GET api/profile
// @desc    Return current user's profile
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.user.id })
    .populate('user', [ 'name', 'avatar' ])
    .then(profile => {
      if(!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => {
      res.status(404).json(err);
    });
});

// @route   GET api/profile/all
// @desc    Return all profiles
// @access  Public
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find()
    .populate('user', [ 'name', 'avatar' ])
    .then(profiles => {
      if(profiles.length === 0) {
        errors.noprofile = 'There are no profiles to show';
        return res.status(404).json(errors);
      }

      res.json(profiles);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/profile/user/:user_id
// @desc    Return a profile by id
// @access  Public
router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate('user', [ 'name', 'avatar' ])
    .then(profile => {
      if(!profile) {
        errors.noprofile = 'This user does not exist';
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   GET api/profile/handle/:handle
// @desc    Return a profile by handle
// @access  Public
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', [ 'name', 'avatar' ])
    .then(profile => {
      if(!profile) {
        errors.noprofile = 'This handle does not exist';
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/profile
// @desc    Create user/edit profile
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateProfileInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  // Get fields
  const profileFields = {};

  profileFields.user = req.user.id;

  if(req.body.handle) profileFields.handle = req.body.handle;  
  if(req.body.company) profileFields.company = req.body.company;  
  if(req.body.website) profileFields.website = req.body.website;  
  if(req.body.location) profileFields.location = req.body.location;  
  if(req.body.bio) profileFields.bio = req.body.bio;  
  if(req.body.status) profileFields.status = req.body.status;  
  if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;  
  // Skills - split into array
  if(typeof req.body.skills !== undefined) {
    profileFields.skills = req.body.skills.split(',');
  }
  // Social
  profileFields.social = {};
  if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if(profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id},
          { $set: profileFields },
          { new: true }
        )
        .then(profile => res.json(profile));
      } else {
        // Create
        // Check if handle exists
        Profile.findOne({ handle: profileFields.handle })
          .then(profile => {
            if(profile) {
              errors.handle = 'That handle already exists';
              res.status(400).json(errors);
            }

            //Save Profile
            new Profile(profileFields)
              .save()
              .then(profile => res.json(profile))
              .catch(err => console.log(err));
          })
      }
    });
});

// @route   POST api/profile/experience
// @desc    Add profile experience
// @access  Private
router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to experience array
      profile.experience.unshift(newExp);

      profile.save().then(profile => {
        res.json(profile);
      })
    });
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Remove profile experience
// @access  Private
router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  let errors = {};

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);

      if(removeIndex < 0) {
        errors.experience = 'Experience not found';
        res.status(400).json(errors);
      }

      profile.experience.splice(removeIndex, 1);

      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/profile/education
// @desc    Add profile education
// @access  Private
router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);

  // Check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to experience array
      profile.education.unshift(newEdu);

      profile.save().then(profile => {
        res.json(profile);
      })
    });
});

// @route   DELETE api/profile/education/:edu_id
// @desc    Remove profile education
// @access  Private
router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  let errors = {};

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);

      if(removeIndex < 0) {
        errors.experience = 'Education not found';
        res.status(400).json(errors);
      }

      profile.education.splice(removeIndex, 1);

      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err));
});

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOneAndRemove({ user: req.user.id })
    .then(() => {
      User.findOneAndRemove({ _id: req.user.id })
        .then(() => res.json({ success: true }))
        .catch(err => res.status(404).json(err));
    })
    .catch(err => res.status(404).json(err));
});

module.exports = router;
