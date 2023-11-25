const { sendResponse } = require("../../../responses")
const bcrypt = require('bcryptjs');
const { nanoid } = require("nanoid");
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

async function createUser(userName, hashedPassword, userId, firstName, lastName){
    try{
        await db.put({
            TableName: "users",
            Item: {
                userName: userName,
                password: hashedPassword,
                userId: userId,
                firstName: firstName,
                lastName: lastName,
            },
        }).promise();
        return {
            success: true, 
            message:"User account created successfully", 
            userId: userId}; 
    }catch (error){
        console.error(error);
    }
    return{
        success: false,
        message: "Could not create user account",
        error: error,
    };
}

async function signUp(userName, password, firstName, lastName) {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    const userId = nanoid();
  
    const result = await createUser(
      userName,
      hashedPassword,
      userId,
      firstName,
      lastName
    );
    return result;
  }
  
  exports.handler = async (event, context) => {
    const { userName, password, firstName, lastName } = JSON.parse(event.body);
  
    const signUpResult = await signUp(userName, password, firstName, lastName);
  
    return sendResponse(signUpResult.success ? 200: 400, signUpResult);
  };
