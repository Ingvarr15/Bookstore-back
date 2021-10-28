const { check, validationResult } = require('express-validator')

const validation = [
  check('email')
    .optional()
    .isEmail(),
  check('password')
    .optional()
    .isLength({ min: 5 }),
  check('username')
    .optional()
    .isLength({ min: 5 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let errorsObj = errors.array()
      let message
      if (errorsObj[0].param === 'email') {
        message = 'Invalid email address'
      }
      if (errorsObj[0].param === 'password') {
        message = 'Password should be longer than 5 symbols'
      }
      if (errorsObj[0].param === 'username') {
        message = 'Username should be longer than 5 symbols'
      }
      return res.status(400).json({ message })
    }
    next();
  },
];

module.exports = validation;