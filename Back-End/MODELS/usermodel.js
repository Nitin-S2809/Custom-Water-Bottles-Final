const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({ 
    username: { type: String, required: true, minlength : [3, 'Username must be at least 3 characters long'] },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true , select: false ,minlength : [6, 'Password must be at least 6 characters long'] },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    role: {
        type: String,
        enum: ['user', 'supplier', 'admin'],
        default: 'user'
    }
});

userSchema.index(
    { role: 1 },
    {
        name: 'user_role_index'
    }
);

userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password
    );};
userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ id: this._id, role: this.role || 'user' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return token;
};
userSchema.statics.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;