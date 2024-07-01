const { ddbDocClient } = require("../lib/dynamoDBClient");
const { DeleteCommand, GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SignUpCommand, ConfirmSignUpCommand, CognitoIdentityProviderClient, 
  AuthFlowType, InitiateAuthCommand, DeleteUserCommand, ForgotPasswordCommand,
  GlobalSignOutCommand, } = require("@aws-sdk/client-cognito-identity-provider");

let tableName = "dynamo22205621";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + "-" + process.env.ENV;
}

const client = new CognitoIdentityProviderClient({});


async function getUserById(userId) {
  // Validation checks mostly for debugging
  if (!userId) {
    throw new Error("Absent userId: userId is required.");
  }
  if (typeof userId !== "string") {
    throw new Error("Invalid userId: userId must be a string.");
  }
  if (userId.length <= 5) {
    throw new Error("Invalid userId: userId must be longer than 5 characters.");
  }

  const input = {
    TableName: tableName,
    Key: {
      pk: "USER",
      sk: userId
    },
    ProjectionExpression: "id, f_name, l_name, birthdate, #loc, age, email, g_f_name, g_l_name, voted_id, can_submit_art, has_active_submission",
    ExpressionAttributeNames: { "#loc": "location" },
  };
  try {
    const response = await ddbDocClient.send(new GetCommand(input));
    return response;
  } catch (error) {
    console.error("Error getting user from Db", error);
    throw error;
  }
}

async function createCognitoUser(email, password, f_name) {
  try {
    const command = new SignUpCommand({
      ClientId: "26h0ul3gca5v4kevgl13dhhsur", 
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "given_name", Value: f_name }
      ] 
    }); 
    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("error creating cognito user");
    throw error;
  }
}

async function createUser(signUpResult, userDetails) {
  try {
    const user = {
      pk: "USER",
      sk: signUpResult.UserSub,
      id: signUpResult.UserSub, // uuid created for User name if not specified
      f_name: userDetails.f_name,
      l_name: userDetails.l_name,
      birthdate: userDetails.birthdate,
      has_active_submission: false,
      can_submit_art: false 
    };

    const input = {
      TableName: tableName,
      Item: user
    };

    await ddbDocClient.send(new PutCommand(input));
    return user.id;
  } catch (error) {
    console.error("error saving user info to db");
    throw error;
  }
}

async function confirmCognitoUser(email, verificationCode) {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: "26h0ul3gca5v4kevgl13dhhsur", //change clientId to web
      Username: email,
      ConfirmationCode: verificationCode
    });
    return await client.send(command);
  } catch (error) {
    console.error("error with verification code or interacting with cognito");
    throw error;
  }
}

async function signIn(email, password) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
      ClientId: "26h0ul3gca5v4kevgl13dhhsur", // ** double check clientId
    });

    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("error signing into cognito");
    throw error;
  }
}

async function globalSignOut(accessToken) {
  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken
    });
    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("Error signing out from Cognito");
    throw error;
  }
}

async function getNewTokens(refreshToken) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
      ClientId: "26h0ul3gca5v4kevgl13dhhsur", // ** double check clientId
    });

    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("error signing into cognito");
    throw error;
  }
}

async function deleteCognitoUser(token) {
  try {
    const command = new DeleteUserCommand({ AccessToken: token });
    return await client.send(command);
  } catch (error) {
    console.error("error deleting cognito user");
    throw error;
  }
}

async function forgotPassword(username) {
  try {
    const input = {
      ClientId: "26h0ul3gca5v4kevgl13dhhsur",
      Username: username,
    };
    const command = new ForgotPasswordCommand(input);
    return await client.send(command);
  } catch (error) {
    console.error("Error initiating the forgot password flow.");
    throw error;
  }
}

async function deleteUserData(userId) {
  try {
    const input = {
      TableName: tableName,
      Key: {
        pk: "USER",
        sk: userId
      }
    };
    await ddbDocClient.send(new DeleteCommand(input));
  } catch (error) {
    console.error("error deleting pk:USER from db");
    throw error;
  }
}

async function updateUserById(userId, fieldName, fieldValue) {
  const input = {
    TableName: tableName,
    Key: {
      pk: "USER",
      sk: userId
    },
    ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
    UpdateExpression: "set #fieldName = :fieldValue",
    ExpressionAttributeNames: {
      "#fieldName": fieldName
    },
    ExpressionAttributeValues: {
      ":fieldValue": fieldValue,
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    const response = await ddbDocClient.send(new UpdateCommand(input));
    return response;
  } catch(error) {
    console.error("error updating user in db");
    throw error;
  }
}

module.exports = {
  getUserById,
  createCognitoUser,
  createUser,
  confirmCognitoUser,
  signIn,
  globalSignOut,
  deleteCognitoUser,
  forgotPassword,
  deleteUserData,
  updateUserById,
  getNewTokens
};