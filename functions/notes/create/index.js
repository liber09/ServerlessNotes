const { sendResponse } = require("../../../responses");
const AWS = require('aws-sdk');
const middy = require("@middy/core");
const db = new AWS.DynamoDB.DocumentClient();
const { nanoid } = require('nanoid');
const { validateToken } = require('../../middleware/auth');

const createNote = async (event, context) => {
    if(event?.error && event?.error === '401'){
        return sendResponse(401, {success: false, message: 'invalid token'});
    }
        
    const note = JSON.parse(event.body);
    let validationResponse = validateNote(note)
    if (validationResponse.length > 0){
        return { success: false, message: validationResponse }
    }

    const date = new Date().toISOString();
    note.id = nanoid();
    note.createdAt = `${date}`
    note.modifiedAt = ""
    note.isDeleted = false

    try{
        await db.put({
            TableName: 'notes',
            Item: note
        }).promise();
        return sendResponse(200, {
            success: false, 
            message: 'Successfully saved note',
            noteId: note.id}) 
    }catch(error){
        console.error(error);
    }
    return sendResponse(400, {
        success: false, 
        message: 'Could not save note',
        error: error}); 
};

async function validateNote(note){
    if(!note.userName){
        return "Who did this, give me your name?"
    }
    if (!note.title || note.title.length < 1){
        return "You need to provide a title";
    }
    if (note.title.length > 50){
        return "You should not write your enitre note in the title";
    }
    if (!note.text || note.text.length < 1){
        return "You need to provide content in your note";
    }

    if (note.text.length > 500){
        return "Your note is too long, split up on several notes. Max 500 chars.";
    }
}

const handler = middy(createNote).use(validateToken)
module.exports = { handler };

