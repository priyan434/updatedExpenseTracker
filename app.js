const express = require('express')
const app = express()
const routers = require('./Routers/Router')
const mongodbRouters=require('./Routers/mongdbRouters')
let dbConnectionStatus = false;
var cors = require('cors');
require("dotenv").config()
const { SequelizeConnectionError } = require('./Codes');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())
app.use((req, res, next) => {
  if (!dbConnectionStatus) {
    return res.status(500).send({
    message:SequelizeConnectionError.message,
    success:false,
    code:SequelizeConnectionError.code
    });
  }
  next();
});
if(process.env.DATABASE==="mongodb"){
  app.use('/', mongodbRouters)
}
else{
  app.use('/', routers)
}


app.get('/', (req, res) => {
  res.send('Hello World!')
})

 
module.exports = { app, setDbConnectionStatus: (status) => dbConnectionStatus = status };