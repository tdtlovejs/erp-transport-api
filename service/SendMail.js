const nodemailer = require("nodemailer");
const {STATUS_UPLOAD_FILE_ERROR, STATUS_SEND_MAIL_SUCCESS, STATUS_SEND_MAIL_ERROR} = require("../utils/constants");
require('dotenv').config();

const MAIL_EMAIL = process.env.MAIL_EMAIL;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;

let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: MAIL_EMAIL,
        pass: MAIL_PASSWORD
    }
});
module.exports = {
    sendMail: async (message) => {
        const resSendMail = await transport.sendMail(message)
        console.log(resSendMail)
        if (Array.isArray(resSendMail.accepted) && resSendMail.accepted.length) {
            return {
                data: resSendMail,
                status: STATUS_SEND_MAIL_SUCCESS
            }
        } else {
            return {
                data: resSendMail,
                status: STATUS_SEND_MAIL_ERROR
            }
        }
    }
};
