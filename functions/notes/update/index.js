const { sendResponse } = require("../../../responses");
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const { validateToken } = require('../../middleware/auth');
const middy = require('@middy/core');

const updateNote = async (event, context) => {

    if (event?.error && event?.error === '401'){
        return sendResponse(401, { success: false, message: 'invalid token' });
    }
        
    const request = JSON.parse(event.body);

    if (!request.noteId){
        return sendResponse(400, {
            success: false,
            message: "id is missing, nothing to update!"
        })
    }
    if (!request.title && !request.text) {
        return sendResponse(400, {
            success: false,
            message: "You need too send title and text to be able to update"
        })
    }

    if (!request.userName) {
        return sendResponse(400, {
            success: false,
            message: "You need to tell us who you are"
        })
    }

    try {
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
                message: "You are not authorized to update others notes"
            });
        }

        const modifiedAt = new Date().toISOString();

        await db.update({
            TableName: 'notesDb',
            Key: { noteId: Item.noteId },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #text = :text, #title = :title, modifiedAt = :modifiedAt',
            ExpressionAttributeValues: {
                ':text': request.text,
                ':title': request.title,
                ':modifiedAt': modifiedAt,
            },
            ExpressionAttributeNames: {
                '#text': 'text',
                '#title': 'title',
            }
        }).promise();

        return sendResponse(200, { success: true, message: "note updated, new title: " + request.title + " And new text: " + request.text })
    } catch (error) {
        return sendResponse(500, { success: false, message: "Update failed" })
    }
}

const handler = middy(updateNote).use(validateToken)
module.exports = { handler };