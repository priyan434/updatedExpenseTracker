
const {
  Users: mongodbUser,
  Currencies: mongodbCurrencies,
} = require("../database/mongodb.model");
exports.MonFindOne = async (email) => {
 
      return await mongodbUser.findOne({ email, isActive: true });
     
  };

  exports.MonCreateUser=async(data)=>{
    const currency = await mongodbCurrencies.find({
        currencyId: data.baseCurrency,
      });
      if (!currency) {
        return 'not a valid currency';
      }
      return await mongodbUser.create({
        username: data.username,
        email: data.email,
        password: data.hashedPassword,
        baseCurrency: data.baseCurrency,
        profileUrl: data.profileUrl,
        isActive: true,
      });
    }
exports.MonFindById=async()=>{
    return  mongodbUser.findOne({ _id: userId, isActive: true });
   
}
exports.MonUpdateUser=async(user, updateData)=>{
    const currency = await mongodbCurrencies.find({
        currencyId: updateData.baseCurrency,
      });
      if (!currency) {
        return "basecurreny error";
      }
      return await Users.findByIdAndUpdate(
        { _id: user.userId, isActive: true },
        {
          $set: { baseCurrency: currency[0].currencyId },
        },
        { new: true }
      );
}

  