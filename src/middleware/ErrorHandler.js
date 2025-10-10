const errorHandler = (err, req, res, next) => {
  console.log(err.stack);
  if(err.message === 'invalid email or password' || err.message === 'User already exists') {
    return res.status(400).json({ message: err.message }); 
  }
  res.status(500).json({ message: 'Something went wrong!'});
};

module.exports = errorHandler;