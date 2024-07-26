const Joi = require("joi");
const {
  Expenses,
  SplitExpense,

} = require("../database/user.model");
const {
  GET_ALL_EXPENSE,
  INVALID_INPUT,
  ADD_EXPENSE,
  ADD_EXPENSE_ERROR,
  UPDATE_EXPENSE,
  UPDATE_EXPENSE_ERROR,
  DELETE_EXPENSE,
  DELETE_EXPENSE_ERROR,
  EXPENSE_NOT_FOUND,
  EXPENSE_FOUND,
  SERVER_ERROR,
  INVALID_USER,
  INVALID_EXPENSE_ID,
  NO_FEILDS_TO_UPDATE,
  INVALID_EXPENSE_DETAILS,
  INVALID_AMOUNT,
  INVALID_BASECURRENCY,
  EMPTY_EXPENSE,
  AMOUNT_BASE,
  EXPENSE_PATTERN_BASE,
  INVALID_DATE,
  INVALID_BASECURRENCY_BASE,
  Sequelize_query_SequelizeForeignKeyConstraintError,
  DATE_REQUIRED,
  CURRENCY_REQUIRED,
  AMOUNT_REQUIRED,
  EXPENSE_DETAILS_REQUIRED,
} = require("../Codes");
const { Op } = require("sequelize");

exports.getAllExpense = async (req, res) => {
  const userId = req.user;
  try {
    if (!userId) {
      return res
        .status(400)
        .send({
          message: INVALID_USER.message,
          success: false,
          code: INVALID_USER.code,
        });
    }

    const expenses = await Expenses.findAll({
      where: { userId: userId, isActive: true },
      include: [
        {
          model: SplitExpense,
          as: "splitExpenses",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    return res.status(200).json({
      message: GET_ALL_EXPENSE.message,
      success: true,
      code: GET_ALL_EXPENSE.code,
      data: {
        expenses,
      },
    });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return res
      .status(500)
      .send({
        message: SERVER_ERROR.message,
        success: false,
        code: SERVER_ERROR.code,
      });
  }
};

exports.addExpense = async (req, res) => {
  const userId = req.user;
  const addExpenseSchema = Joi.object({
    date: Joi.date().iso().required(),
    expense: Joi.string().min(3).pattern(/^\S*$/).required(),
    currencyId: Joi.number().min(1).max(3).required(),
    amount: Joi.number().min(1).required(),
    userIds: Joi.array().items(Joi.number()).optional(),
  });

  try {
    const { date, amount, expense, currencyId, userIds = [] } = req.body;

    const { error } = addExpenseSchema.validate(req.body);
    if (error) {
      const errorDetails = error.details[0];
      const errorMap = {
        "date": {
          "any.required": DATE_REQUIRED,
          "date.format":INVALID_DATE ,
       
        },
        "amount": {
          "number.min": INVALID_AMOUNT,
          "number.base":AMOUNT_BASE,
          "any.required":AMOUNT_REQUIRED
        },
        "expense": {
          "string.min": INVALID_EXPENSE_DETAILS,
          "string.pattern.base":EXPENSE_PATTERN_BASE ,
          "string.empty": EMPTY_EXPENSE,
          "any.required":EXPENSE_DETAILS_REQUIRED,

        },
        "currencyId": {
          "number.base": INVALID_BASECURRENCY_BASE,
          "number.min": INVALID_BASECURRENCY,
          "number.max": INVALID_BASECURRENCY,
        "any.required":CURRENCY_REQUIRED
        }
      };

      const errorResponse = errorMap[errorDetails.path[0]]?.[errorDetails.type] || INVALID_INPUT;
      return res.status(400).send({
        message: errorResponse.message,
        success: false,
        code: errorResponse.code,
      });
    }
 

    if (!userId) {
      return res
        .status(400)
        .send({
          message: INVALID_USER.message,
          success: false,
          code: INVALID_USER.code,
        });
    }

    const newExpense = await Expenses.create({
      userId: userId,
      date: date,
      amount,
      expense,
      currencyId,
    });

    if (!newExpense) {
      return res
        .status(400)
        .send({
          message: ADD_EXPENSE_ERROR.message,
          success: false,
          code: ADD_EXPENSE_ERROR.code,
        });
    }

    if (userIds.length > 0) {
      const expId = newExpense.expId;
      const expo = await Expenses.findOne({
        where: {
          expId,
          userId,
          isActive: true,
        },
      });

      if (!expo) {
        return res
          .status(400)
          .send({
            message: EXPENSE_NOT_FOUND,
            success: false,
            code: EXPENSE_NOT_FOUND.code,
          });
      }

      const numberOfSplits = userIds.length + 1;
      const splitAmount = expo.amount / numberOfSplits;
      const splitPromises = userIds.map((splitUserId) => {
        return SplitExpense.create({
          expId: expId,
          userId: splitUserId,
          splitAmount: splitAmount,
          isActive: true,
        });
      });

      if (!userIds.includes(userId)) {
        splitPromises.push(
          SplitExpense.create({
            expId: expId,
            userId: userId,
            splitAmount: splitAmount,
            isActive: true,
          })
        );
      }

      await Promise.all(splitPromises);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const totalMoneyLent = await SplitExpense.sum("splitAmount", {
        where: {
          expId: expId,
          userId: {
            [Op.ne]: userId,
          },
          isActive: true,
        },
      });

      const allExpenses = await Expenses.findAll({
        where: {
          userId: userId,
          isActive: true,
        },
        include: [
          {
            model: SplitExpense,
            as: "splitExpenses",
            where: { isActive: true },
            required: false,
          },
        ],
      });

      return res.status(201).json({
        message: ADD_EXPENSE.message,
        success: true,
        code: ADD_EXPENSE.code,
        data: {
          expenses: allExpenses,
        },
      });
    }
    const allExpenses = await Expenses.findAll({
      where: { userId: userId, isActive: true },
      include: [
        {
          model: SplitExpense,
          as: "splitExpenses",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    return res.status(200).json({
      message: ADD_EXPENSE.message,
      success: true,
      code: ADD_EXPENSE.code,
      data: {
        expenses: allExpenses,
      },
    });
  } catch (error) {

    if(error.name==="SequelizeForeignKeyConstraintError"){
      return res.status(400).send({message:Sequelize_query_SequelizeForeignKeyConstraintError.message,success:false,code:Sequelize_query_SequelizeForeignKeyConstraintError.code})
    }
    return res
      .status(500)
      .send({
        message: SERVER_ERROR.message,
        success: false,
        code: SERVER_ERROR.code,
      });
  }
};

exports.updateExpense = async (req, res) => {
  const id = req.params.id;
  const fieldsToUpdate = req.body;
  const userId = req.user;

  const updateExpenseSchema = Joi.object({
    date: Joi.date().iso().optional(),
    expense: Joi.string().min(3).optional().pattern(/^\S*$/),
    currencyId: Joi.number().min(1).max(3).optional(),
    amount: Joi.number().min(1).optional(),
    removeUserIds: Joi.array().items(Joi.number()).optional(),
    addUserIds: Joi.array().items(Joi.number()).optional(),
  });

  if (!userId) {
    return res
      .status(400)
      .send({
        message: INVALID_USER.message,
        success: false,
        code: INVALID_USER.code,
      });
  }

  if (!id) {
    return res
      .status(400)
      .send({
        message: INVALID_EXPENSE_ID.message,
        success: false,
        code: INVALID_EXPENSE_ID.code,
      });
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res
      .status(400)
      .send({
        message: NO_FEILDS_TO_UPDATE.message,
        success: false,
        code: NO_FEILDS_TO_UPDATE.code,
      });
  }

  try {
    const { error, value } = updateExpenseSchema.validate(fieldsToUpdate);
    if (error) {
      const errorDetails = error.details[0];
      const errorMap = {
        "date": {
          
          "date.format":INVALID_DATE ,
       
        },
        "amount": {
          "number.min": INVALID_AMOUNT,
          "number.base":AMOUNT_BASE,
        
        },
        "expense": {
          "string.min": INVALID_EXPENSE_DETAILS,
          "string.pattern.base":EXPENSE_PATTERN_BASE ,
          "string.empty": EMPTY_EXPENSE,
          

        },
        "currencyId": {
          "number.base": INVALID_BASECURRENCY_BASE,
          "number.min": INVALID_BASECURRENCY,
          "number.max": INVALID_BASECURRENCY,
        
        }
      };

      const errorResponse = errorMap[errorDetails.path[0]]?.[errorDetails.type] || INVALID_INPUT;
      return res.status(400).send({
        message: errorResponse.message,
        success: false,
        code: errorResponse.code,
      });
    }
 
    const expenses = await Expenses.findOne({
      where: {
        userId,
        expId: id,
        isActive: true,
      },
    });

    if (!expenses) {
      return res
        .status(400)
        .send({
          message: EXPENSE_NOT_FOUND.message,
          success: false,
          code: EXPENSE_NOT_FOUND.code,
        });
    }

    const {
      amount: updatedAmount,
      date,
      expense,
      currencyId,
      removeUserIds = [],
      addUserIds = [],
    } = fieldsToUpdate;

    await expenses.update({
      date,
      amount: updatedAmount,
      expense,
      currencyId,
    });

    if (removeUserIds.length > 0) {
      await SplitExpense.update(
        { isActive: false },
        {
          where: {
            expId: id,
            userId: {
              [Op.in]: removeUserIds,
            },
          },
        }
      );
    }

    const activeSplitExpenses = await SplitExpense.findAll({
      where: {
        expId: id,
        isActive: true,
      },
    });

    if (activeSplitExpenses.length === 0 && addUserIds.length > 0) {
      const newNumberOfSplits = addUserIds.length + 1;
      const splitAmount = updatedAmount / newNumberOfSplits;

      await Promise.all(
        activeSplitExpenses.map((split) =>
          split.update({ splitAmount: splitAmount })
        )
      );
      const splitExpenspromise = await Promise.all(
        addUserIds.map((userId) =>
          SplitExpense.create({
            expId: id,
            userId: userId,
            splitAmount: splitAmount,
            isActive: true,
          })
        )
      );

      splitExpenspromise.push(
        SplitExpense.create({
          expId: id,
          userId: userId,
          splitAmount: splitAmount,
          isActive: true,
        })
      );
    } else {
      const newNumberOfSplits = activeSplitExpenses.length + addUserIds.length;
      const splitAmount = updatedAmount / newNumberOfSplits;

      await Promise.all(
        activeSplitExpenses.map((split) =>
          split.update({ splitAmount: splitAmount })
        )
      );

      const splitExpenspromise = await Promise.all(
        addUserIds.map((userId) =>
          SplitExpense.create({
            expId: id,
            userId: userId,
            splitAmount: splitAmount,
            isActive: true,
          })
        )
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));

    const updatedExpenseWithSplits = await Expenses.findOne({
      where: { expId: id },
      include: [
        {
          model: SplitExpense,
          as: "splitExpenses",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    return res.status(200).json({
      message: UPDATE_EXPENSE.message,
      success: true,
      code: UPDATE_EXPENSE.code,
      data: {
        expenses: updatedExpenseWithSplits,
      },
    });
  } catch (error) {
    if(error.name==="SequelizeForeignKeyConstraintError"){
      return res.status(400).send({message:Sequelize_query_SequelizeForeignKeyConstraintError.message,success:false,code:Sequelize_query_SequelizeForeignKeyConstraintError.code})
    }
    return res
      .status(500)
      .send({
        message: SERVER_ERROR.message,
        success: false,
        code: SERVER_ERROR.code,
      });
  }
};

exports.deleteExpense = async (req, res) => {
  const id = req.params.id;
  const userId = req.user;

  if (!userId) {
    return res
      .status(400)
      .send({
        message: INVALID_USER.message,
        success: false,
        code: INVALID_USER.code,
      });
  }

  if (!id) {
    return res
      .status(400)
      .send({
        message: INVALID_EXPENSE_ID,
        success: false,
        code: INVALID_EXPENSE_ID.code,
      });
  }

  try {
    const expense = await Expenses.findOne({
      where: {
        userId,
        expId: id,
        isActive: true,
      },
    });

    if (!expense) {
      return res
        .status(400)
        .send({
          message: EXPENSE_NOT_FOUND.message,
          success: false,
          code: EXPENSE_NOT_FOUND.code,
        });
    }

    const updatedExpense = await expense.update({ isActive: false });

    if (updatedExpense) {
      const splitexpenses = await SplitExpense.findAll({
        where: {
          expId: id,
          isActive: true,
        },
      });
      splitexpenses.map((split) => split.update({ isActive: false }));

      const allExpenses = await Expenses.findAll({
        where: {
          userId: userId,
          isActive: true,
        },
        include: [
          {
            model: SplitExpense,
            as: "splitExpenses",
            where: { isActive: true },
            required: false,
          },
        ],
      });
      return res.status(200).send({
        message: DELETE_EXPENSE.message,
        success: true,
        code: DELETE_EXPENSE.code,
        data: {
          expenses: allExpenses,
        },
      });
    } else {
      return res.status(400).send({
        message: DELETE_EXPENSE_ERROR.message,
        success: false,
        code: DELETE_EXPENSE_ERROR.code,
      });
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    
    return res
      .status(500)
      .send({
        message: SERVER_ERROR.message,
        success: false,
        code: SERVER_ERROR.code,
      });
  }
};

exports.fetchExpenseById = async (req, res) => {
  const id = req.params.id;
  
  const userId = req.user;


  if (!userId) {
    return res
      .status(400)
      .send({
        message: INVALID_USER.message,
        success: false,
        code: INVALID_USER.code,
      });
  }

  if (!id) {
    return res
      .status(400)
      .send({
        message: INVALID_EXPENSE_ID.message,
        success: false,
        code: INVALID_EXPENSE_ID.code,
      });
  }

  try {
    const expense = await Expenses.findOne({
      where: {
        userId,
        expId: id,
        isActive: true,
      },
      include: [
        {
          model: SplitExpense,
          as: "splitExpenses",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!expense) {
      return res
        .status(404)
        .send({
          messsage: EXPENSE_NOT_FOUND.message,
          success:false,
          code: EXPENSE_NOT_FOUND.code,
        });
    }

    return res.status(200).send({
      message: EXPENSE_FOUND.message,
      success: true,
      data: {
        expense,
      },
    });
  } catch (error) {

   
    return res
      .status(500)
      .send({
        message: SERVER_ERROR.message,
        success: false,
        code: SERVER_ERROR.code,
      });
  }
};
