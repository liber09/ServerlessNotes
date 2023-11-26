const { sendResponse } = require("../../../responses");
const AWS = require('aws-sdk');
const middy = require("@middy/core");
const db = new AWS.DynamoDB.DocumentClient();
const { validateToken } = require('../../middleware/auth');

const deleteNote = async(event,context)=>{
   
    if(event?.error && event?.error === '401'){
        return sendResponse(401, {success: false, message: 'invalid token'});
    }
    const request = JSON.parse(event.body);
    
    if(!request){
        return sendResponse(400, {success:false, message:"Id parameter is missing!"})
    }

    try {
        const { Item } = await db.get({
            TableName: 'notesDb',
            Key: { noteId: request.noteId }
        }).promise();

        if (!Item) {
            return sendResponse(404, { success: false, message: "There is no note with id " + request.noteId });
        }

        if (Item.isDeleted) {
            return sendResponse(404, { success: false, message: "Note is already deleted" });
        }

        if (request.userName !== Item.userName) {
            return sendResponse(403, { success: false, message: "You can only delete your own notes!" });
        }

        const date = new Date().toISOString();
        const modifiedAt = date;

        await db.update({
            TableName: 'notesDb',
            Key: { noteId: request.noteId },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: "SET #isDeleted = :isDeleted, #modifiedAt = :modifiedAt",
            ExpressionAttributeNames: {
                "#isDeleted": "isDeleted",
                "#modifiedAt": "modifiedAt"
            },
            ExpressionAttributeValues: {
                ":isDeleted": true,
                ":modifiedAt": modifiedAt
            }
        }).promise();

        return sendResponse(200, { message: "The note with id: " + request.noteId + " is now in the trash" });
    } catch (error) {
        console.error('Error deleting note:', error);
        return sendResponse(500, { success: false, message: "Sorry, could not delete note" });
    }
};

const handler = middy(deleteNote).use(validateToken)
module.exports = {handler};