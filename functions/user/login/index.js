const { sendResponse } = require("../../../responses")
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../../config")

async function getUser(userName) {
  try {
    const user = await db
      .get({
        TableName: "users",
        Key: {
          userName: userName,
        },
      })
      .promise();
    if (user?.Item) {
      return { success: true, message: "User exists", user: user.Item };
    } else {
      return { success: false, message: "Wrong username and/or password" }; // we don't want to tell the user which one is wrong of the two!
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Database error", error: error };
  }
}

async function login(userName, password) {
  const userResponse = await getUser(userName);

  if (!userResponse.success) {
    return userResponse;
  }

  const user = userResponse.user;

  const correctPassword = await bcrypt.compare(password, user.password);

  if (!correctPassword) {
    return { success: false, message: "Wrong username and/or password" };
  }

  const token = jwt.sign(
    { id: user.userId, userName: user.userName },
    jwtSecret,
    { expiresIn: 3600 }
  );
  return { success: true, message: "Login successful", token: token };
}

exports.handler = async (event, context) => {
  const { userName, password } = JSON.parse(event.body);
  const loginResponse = await login(userName, password);

  return sendResponse(loginResponse.success ? 200 : 400, loginResponse);
};