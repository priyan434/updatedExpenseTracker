const {
  Users: mongodbUser,
  Currencies: mongodbCurrencies,
} = require("../database/mongodb.model");
const { Users } = require("../database/user.model");
const { MonFindOne, MonCreateUser, MonFindById } = require("./mongodbQuery");
const { SeqFindOne, SeqCreateUser, SeqFindById, SeqUpdateUser } = require("./sequelizeQuery");

require("dotenv").config();

exports.findOne = async (email) => {
    // console.log(email);
  if (true) {
    const data = await SeqFindOne(email);
    return data;
  }
//    else {
//     const data= MonFindOne(email);
//     return data
//   }
};

exports.createUser = async (user) => {
  if (!process.env.DATABASE === "mongodb") {
    const data =await SeqCreateUser(user);
    return data;
  }
//    else {
//     const data = MonCreateUser(user);
//     return data;
//   }
};
// exports.findById = async (userId) => {
//     if (true) {
//      const data=await SeqFindById(userId)
//      return data
//     } else {
//      const data=await MonFindById(userId)
//      return data
//     }
//   };


//   exports.updateUser = async (user, updateData) => {
//     if (true) {
//      const data=await SeqUpdateUser(user,updateData)
//      return data
//     } else {
//       const currency = await mongodbCurrencies.find({
//         currencyId: updateData.baseCurrency,
//       });
//       if (!currency) {
//         return "basecurreny error";
//       }
//       return await Users.findByIdAndUpdate(
//         { _id: userId, isActive: true },
//         {
//           $set: { baseCurrency: currency[0].currencyId },
//         },
//         { new: true }
//       );
//     }
//   };