const { sendResponse } = require("../../../responses");
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const { validateToken } = require('../../middleware/auth');
const middy = require('@middy/core');

const getNotes = async (event, context) => {
    if (event?.error && event?.error === '401')
        return sendResponse(401, { success: false, message: 'invalid token' });

        const userName = event.queryStringParameters && event.queryStringParameters.userName;
        if (!userName) {
            return sendResponse(400, { success: false, message: 'userName parameter is missing in the query string' });
        } 

    const params = {
        TableName: 'notesDb',
        IndexName: 'UserNameIndex',
        FilterExpression: '#userName = :userName AND #isDeleted = :isDeleted',
        ExpressionAttributeNames: {
            '#userName': 'userName',
            '#isDeleted': 'isDeleted',
        },
        ExpressionAttributeValues: {
            ':userName': userName,  
            ':isDeleted': false,    
        },
    };

    try {
        const data = await db.scan(params).promise(); 
        const notes = data.Items.map(item => ({
            noteId: item.noteId,
            title: item.title,
            text: item.text,
            createdAt: item.createdAt,
            modifiedAt: item.modifiedAt,
            userName: item.userName
        }));
        return sendResponse(200, { success: true, notes: notes });
    } catch (err) {
        return sendResponse(400, { success: false, message: "Unable to fetch data", error: JSON.stringify(err, null, 2) });
    }
};

const handler = middy(getNotes).use(validateToken);

module.exports = { handler };
