const jwt = require('jsonwebtoken');
require('dotenv').config();
const {SERVER_ERROR, NOT_AUTHORIZED}=require("../Codes")
const secretkey = process.env.JWT_SECRET

const auth = (req, res, next) => {
    try {
        const token = req.header('x-auth-token')
        if (!token) res.status(400).send("invalid user")
        const data = jwt.verify(token, secretkey)
        if(data.type=="auth"){
            req.user = data.userId
            next()
        }
        else{
            res.status(400).send({message:NOT_AUTHORIZED.message,success:false,code:NOT_AUTHORIZED.code})
        }
    } catch (error) {
        res.status(500).send({message:SERVER_ERROR.message,success:false,code:SERVER_ERROR.code})
    }
}

module.exports = { auth }