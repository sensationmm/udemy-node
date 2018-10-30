const Validator = require('validator');
const isEmpty = require('./functions'); 

module.exports = function validatePostInput(data) {
  let errors = {};

  data.text = !isEmpty(data.text) ? data.text : '';

  if(!Validator.isLength(data.text, { min: 10, max: 300 })) {
    errors.text = 'Text must be between 10 and 300 characters';
  };

  if(Validator.isEmpty(data.text)) {
    errors.text = 'Email is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };

}