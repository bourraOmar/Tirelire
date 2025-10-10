const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const {JWT_SECRET, JWT_EXPIRES_IN} = require('../config/config');

class AuthService {
  async register(userData) {
    const { email, password, firstName, lastName} = userData;
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User already exists');

    const user = await User.create({ email, password, firstName, lastName });
    return this.generateToken(user);
  }
  
  async login(email, password) {
    const user = await User.findOne({ email });
    const match = await user.comparePassword(password);
    console.log(match);
    console.log(user);
    
    if(!user && !match) {
      throw new Error('Invalid email or password');
    }
    return this.generateToken(user);
  }

  generateToken(user) {
    const payload = {id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN});
    return {
      token, 
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }
}

module.exports = new AuthService();