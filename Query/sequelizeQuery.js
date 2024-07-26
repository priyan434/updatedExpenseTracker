const { Users } = require("../database/user.model");


exports.SeqFindOne = async (email) => {
    console.log("email",email);
  try {
    const data = await Users.findOne({
      where: { email, isActive: 1 },
    });
    console.log("DATA",data);
    return data;
  } catch (error) {
    console.error("Error in SeqFindOne:", error);
    throw error;
  }
};

exports.SeqCreateUser = async (data) => {
  try {
    return await Users.create({
      username: data.username,
      email: data.email,
      password: data.hashedPassword,
      baseCurrency: data.baseCurrency,
      profileUrl: data.profileUrl,
      isActive: true,
    });
  } catch (error) {
    console.error("Error in SeqCreateUser:", error);
    throw error;
  }
};

exports.SeqFindById = async (userId) => {
  try {
    const data = await Users.findOne({
      where: { id: userId, isActive: true },
      attributes: { exclude: ["password"] },
    });
    return data;
  } catch (error) {
    console.error("Error in SeqFindById:", error);
    throw error;
  }
};

exports.SeqUpdateUser = async (userId, updateData) => {
  try {
    const user = await Users.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = await user.update(updateData);
    return updatedUser;
  } catch (error) {
    console.error("Error in SeqUpdateUser:", error);
    throw error;
  }
};
