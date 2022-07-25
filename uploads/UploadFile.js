require('dotenv').config();

const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');
const {STATUS_UPLOAD_FILE_ERROR, STATUS_UPLOAD_FILE_SUCCESS} = require("../utils/constants");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const DOCUMENT_FOLDER_ID = process.env.DOCUMENT_FOLDER_ID;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
)
oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
})

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
})

const that = module.exports = {
    setFilePublic: async (fileId) => {
        try {
            await drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            })
            return await drive.files.get({
                fileId: fileId,
                fields: 'webViewLink, webContentLink'
            });
        } catch (e) {
            console.error(e)
        }
    },
    uploadFile: async (fileData) => {
        try {
            const {
                fileName,
                mimeType,
                isLocal,
                pathLocal
            } = fileData;
            const createFile = await drive.files.create({
                requestBody: {
                    name: fileName,
                    mimeType: mimeType,
                    parents: [DOCUMENT_FOLDER_ID]
                },
                media: {
                    mimeType: mimeType,
                    body: isLocal ? fs.createReadStream(pathLocal) : fs.createReadStream(path.join(__dirname, fileName))
                }
            })
            const fileId = createFile.data.id;
            await that.setFilePublic(fileId);
            fs.unlinkSync(isLocal ? pathLocal : path.join(__dirname, fileName))
            return {
                fileData: fileData,
                status: STATUS_UPLOAD_FILE_SUCCESS,
                fileId: fileId,
            };
        } catch (e) {
            console.log('eeeee ', e)
            return {
                fileData: fileData,
                status: STATUS_UPLOAD_FILE_ERROR
            }
        }
    },
    deleteFile: async () => {
        try {
            const deleteFile = await drive.files.delete({
                fileId: '1pNYXC4VUMjsd1DJ3Gr9OeK_jANHrRGd1'
            })
            console.error(deleteFile.data, deleteFile.status)
        } catch (e) {
            console.error(e)
        }
    }
};
