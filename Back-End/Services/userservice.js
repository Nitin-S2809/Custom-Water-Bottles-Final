const userModel = require('../MODELS/userModel');

module.exports.createUser = async ({ username, email, password }) => {
    if (!username || !email || !password) {
        throw new Error('All fields are required');
    }
    else {
        const user = await userModel.create({ username, email, password }); 
        return user;
    }   
};