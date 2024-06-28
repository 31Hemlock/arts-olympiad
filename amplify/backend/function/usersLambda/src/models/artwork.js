const { ddbDocClient } = require("../lib/dynamoDBClient");
const { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand, TransactWriteCommand } = require("@aws-sdk/lib-dynamodb");
const VotesModel = require("./votes");
const { s3Client } = require("../lib/s3Client");
const { ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");



let tableName = "dynamo22205621";
let bucketName = "artsolympiadf677eab9a54848dc8788ee9110a11839185846";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + "-" + process.env.ENV;
  bucketName = bucketName + "-" + process.env.ENV;
}

async function getArtworkById(artworkId) {
  const input = {
    TableName: tableName,
    ProjectionExpression: "id, description, sport, #loc, is_approved, votes, f_name, age, is_ai_gen, model, prompt, file_type",
    ExpressionAttributeNames: { "#loc": "location" },
    Key: {
      pk: "ART",
      sk: artworkId
    }
  };
  try {
    const response = await ddbDocClient.send(new GetCommand(input));
    if (!response.Item) {
      console.log(`Artwork with ID ${artworkId} not found.`);
    }
    return response;
  } catch(error) {
    console.error("Error getting artwork from Db", error);
    throw error;
  }
}

async function createArtwork(item) {
  const input = {
    TableName: tableName,
    Item: item
  };

  try {
    await ddbDocClient.send(new PutCommand(input));
    return;
  } catch (error) {
    console.error("Error adding artwork", error);
    throw error;
  }
}

async function createArtworkAndUpdateUser(item, userId) {
  const transactItems = [
    {
      Put: {
        TableName: tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
      }
    },
    {
      Update: {
        TableName: tableName,
        Key: {
          pk: "USER",
          sk: userId
        },
        UpdateExpression: "SET has_active_submission = :true",
        ExpressionAttributeValues: {
          ":true": true
        },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)"
      }
    }
  ];

  const command = new TransactWriteCommand({ TransactItems: transactItems });

  try {
    await ddbDocClient.send(command);
    return {
      artwork: item,
      userUpdated: true
    };
  } catch (error) {
    console.error("Error adding artwork and updating user", error);
    throw error;
  }
}

async function deleteArtworkById(artworkId) {
  const input = {
    TableName: tableName,
    Key: {
      pk: "ART",
      sk: artworkId
    }
  };
  try {
    await ddbDocClient.send(new DeleteCommand(input));
    return;
  } catch(error) {
    console.error(`Error deleting artwork with id ${artworkId}`);
    throw error;
  }
}

async function deleteArtworkAndFiles(artworkId) {
  try {
    // Delete from DynamoDB
    await deleteArtworkFromDynamoDB(artworkId);

    // Delete folder from S3
    await deleteArtworkFolderFromS3(artworkId);

    return { message: "Successfully deleted artwork and associated files" };
  } catch (error) {
    console.error("Error deleting artwork and files", error);
    throw error;
  }
}

async function deleteArtworkFromDynamoDB(artworkId) {
  const transactItems = [
    {
      Delete: {
        TableName: tableName,
        Key: {
          pk: "ART",
          sk: artworkId
        },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)"
      }
    },
    {
      Update: {
        TableName: tableName,
        Key: {
          pk: "USER",
          sk: artworkId
        },
        UpdateExpression: "SET has_active_submission = :false",
        ExpressionAttributeValues: {
          ":false": false
        },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)"
      }
    }
  ];

  const command = new TransactWriteCommand({ TransactItems: transactItems });

  try {
    await ddbDocClient.send(command);
    console.log(`Successfully deleted artwork ${artworkId} and updated user status`);
  } catch (error) {
    console.error(`Error in transactional delete for artwork ${artworkId}:`, error);
    throw error;
  }
}

async function deleteArtworkFolderFromS3(artworkId) {
  const listParams = {
    Bucket: bucketName,
    Prefix: `${artworkId}/`
  };

  try {
    const listedObjects = await s3Client.send(new ListObjectsV2Command(listParams));
    if (listedObjects.Contents.length === 0) return;
    const deleteParams = {
      Bucket: bucketName,
      Delete: { Objects: [] }
    };

    listedObjects.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key });
    });

    await s3Client.send(new DeleteObjectsCommand(deleteParams));

    if (listedObjects.IsTruncated) await deleteArtworkFolderFromS3(artworkId);

  } catch (error) {
    console.error(`Error deleting S3 folder for artwork ${artworkId}`, error);
    throw error;
  }
}

async function updateVoteArtworkbyId(artworkId, decrement=false) {
  operator = (decrement === true) ? "-" : "+";

  const input = {
    TableName: tableName,
    Key: {
      pk: "ART",
      sk: artworkId
    },
    UpdateExpression: `SET votes = votes ${operator} :value`,
    ExpressionAttributeValues: {
      ":value": 1,
    },
    ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
    ReturnValues: "ALL_NEW"
  }; 

  try {
    const response = await ddbDocClient.send(new UpdateCommand(input));
    return response;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

async function incrementVoteArtworkById(artworkId) {
  VotesModel.incrementTotalVotes();
  return updateVoteArtworkbyId(artworkId)
}

async function decrementVoteArtworkById(artworkId) {
  VotesModel.decrementTotalVotes();
  return updateVoteArtworkbyId(artworkId, decrement=true)
}

async function approveArtworkById(artworkId, approvalStatus) {
  const isApproved = approvalStatus === true;
  const gsi1pkVal = isApproved ? 1 : 0;

  const input = {
    TableName: tableName,
    Key: {
      pk: "ART",
      sk: artworkId
    }
  };

  let result = await ddbDocClient.send(new GetCommand(input));
  const { sport, location, timestamp } = result.Item;

  console.log(isApproved);
  console.log(gsi1pkVal);
  input.UpdateExpression = "set is_approved = :approvalVal, gsi1pk = :gsi1pk, gsi2pk = :gsi2pk, gsi2sk = :gsi2sk, gsi3pk = :gsi3pk, gsi3sk = :gsi3sk";

  input.ExpressionAttributeValues = {
    ":approvalVal": isApproved,
    ":gsi1pk": gsi1pkVal, 
    ":gsi2pk": sport,
    ":gsi2sk": `${location}#${timestamp}`,
    ":gsi3pk": location,
    ":gsi3sk": `${sport}#${timestamp}`,
  },
  input.ReturnValues = "ALL_NEW";

  try {
    const response = await ddbDocClient.send(new UpdateCommand(input));
    return response;
  } catch(error) {
    console.error(error.message);
    throw error;
  }
}

async function queryArtworks(input, startKey=null) {
  if (startKey) {
    input.ExclusiveStartKey = startKey;
  }

  try {
    const response =  await ddbDocClient.send(new QueryCommand(input));
    return {
      items: response.Items,
      lastKey: response.LastEvaluatedKey
    };
  } catch (error) {
    console.log("error with querying artworks" + error);
    throw error;
  }
}

// helper functions
function buildQueryInputs(params, limitPerQuery) {
  const inputs = [];

  const isApproved = params["is_approved"];
  const sports = params["sport"];
  const locations = params["location"];
  const orderBy = params["order_by"];

  if (isApproved) {
    const gsi1pkValue = isApproved[0] === "true" ? 1 : 0; 
    inputs.push(addInput({
      indexName: "gsi1-index",
      keyConditionExpr: "gsi1pk = :v_is_approved",
      exprAtrValue: {":v_is_approved" : gsi1pkValue},
      limit: limitPerQuery,
      orderBy: orderBy
    }));
  } else if (sports && locations) {
    for (const sport of sports) {
      for (const location of locations) {
        inputs.push(addInput({
          indexName: "gsi2-index",
          keyConditionExpr: "gsi2pk = :v_sport AND begins_with(gsi2sk, :v_location)",
          exprAtrValue: {":v_sport" : sport, ":v_location": location},
          limit: limitPerQuery,
          orderBy: orderBy
        }));
      }
    }
  } else if (sports) {
    for (const sport of sports) {
      inputs.push(addInput({
        indexName: "gsi2-index",
        keyConditionExpr: "gsi2pk = :v_sport",
        exprAtrValue: {":v_sport" : sport},
        limit: limitPerQuery,
        orderBy: orderBy
      }));
    }
  } else if (locations) {
    for (const location of locations) {
      inputs.push(addInput({
        indexName: "gsi3-index",
        keyConditionExpr: "gsi3pk = :v_location",
        exprAtrValue: {":v_location" : location},
        limit: limitPerQuery,
        orderBy: orderBy
      }));
    }
  }
  return inputs;
}

function addInput({indexName, keyConditionExpr, exprAtrValue, limit=20, orderBy}) {
  const scanIndexForward = (Array.isArray(orderBy) ? orderBy[0] : orderBy) !== "descending";
  const input = {
    TableName: tableName,
    ProjectionExpression: "sk, id, description, sport, #loc, is_approved, votes, f_name, l_name, age, is_ai_gen, model, prompt, file_type",
    ExpressionAttributeNames: { "#loc": "location" },
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpr,
    ExpressionAttributeValues: exprAtrValue,
    Limit: limit,
    ScanIndexForward: scanIndexForward
  };
  return input;
}

module.exports = {
  getArtworkById,
  createArtwork,
  createArtworkAndUpdateUser,
  deleteArtworkById,
  deleteArtworkAndFiles,
  incrementVoteArtworkById,
  decrementVoteArtworkById,
  approveArtworkById,
  queryArtworks,
  buildQueryInputs
};
