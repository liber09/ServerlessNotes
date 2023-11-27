const { sendResponse } = require("../../../responses");
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const { validateToken } = require('../../middleware/auth');
const middy = require('@middy/core');

const restoreNote = async(event,context)=>{

    if(event?.error && event?.error === '401')
    return sendResponse(401, {success: false, message: 'invalid token'});

    const request = JSON.parse(event.body);

    if(!request.noteId){
        return sendResponse(400, {success:false, message:"Id is missing, nothing to reactivate"})
    }

    if (!request.userName) {
        return sendResponse(400, {
            success: false,
            message: "You need to tell us who you are"
        })
    }

    try{
        const { Item } = await db.get({
            TableName: 'notesDb',
            Key: { noteId: request.noteId }
        }).promise();

        if (!Item) {
            return sendResponse(404, { success: false, message: "No note found with id: " + request.noteId});
        }
        if (request.userName != Item.userName) {
            return sendResponse(401, {
                success: false,
                message: "You are not authorized to restore others notes"
            });
        }

        if(!Item.isDeleted){
            return sendResponse(404, { success: false, message: "Note is not deleted, nothing to restore" });
        }
        
        const modifiedAt = new Date().toISOString();

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
                ":isDeleted": false,
                ":modifiedAt": modifiedAt
            }
        }).promise();
        return sendResponse(200, {message: "The note with id: " + request.noteId + "is now restored"})
    }catch (error) {
        console.error('Error deleting note:', error);
        return sendResponse(500, { success: false, message: "Error restoring note", error: error });
    }
}

const handler = middy(restoreNote).use(validateToken)
module.exports = {handler};