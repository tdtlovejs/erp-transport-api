require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require("bcrypt");
const UserModel = require("./models/user");
const {ROLE_EMPLOYEE, ROLE_SUPERADMIN, LANGUAGE_EN} = require("./utils/constants");
const PersonModel = require("./models/person");
const httpStatus = require("./utils/httpStatus");
const {validateEmail} = require("./utils/functions");

function getArgs () {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach( arg => {
            // long arg
            if (arg.slice(0,2) === '--') {
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2,longArg[0].length);
                const longArgValue = longArg.length > 1 ? longArg[1] : true;
                args[longArgFlag] = longArgValue;
            }
            // flags
            else if (arg[0] === '-') {
                const flags = arg.slice(1,arg.length).split('');
                flags.forEach(flag => {
                    args[flag] = true;
                });
            }
        });
    return args;
}
const args = getArgs();

if (
    !args.hasOwnProperty("username")
    || !args.hasOwnProperty("role")
    || !args.hasOwnProperty('password')
    || !args.hasOwnProperty('email')
) {
    console.log('Required params : username, role, password, email!');
    process.exit();
}



const username = args.username;
const role = args.role;
const password = args.password;
const email = args.email;
const firstName = args.firstName ?? "";
const lastName = args.lastName ?? "";

if (!validateEmail(email)) {
    console.log('Email format!');
    process.exit();
}

mongoose.connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
});

const initUser = async () => {
    try {
        let checkUsername = await UserModel.findOne({
            username: username
        })
        if (checkUsername) {
            console.log('This username has already existed!')
            process.exit();
        }

        let checkEmail = await PersonModel.findOne({
            email: email
        })
        if (checkEmail) {
            console.log('Email already existed!')
            process.exit();
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userSaved = await UserModel({
            username: username,
            password: hashedPassword,
            enabled: true,
            role: role,
        }).save();
        const personSaved = await PersonModel({
            email: email,
            firstName: firstName,
            lastName: lastName,
            user: userSaved ? userSaved._id : null,
        }).save();

        if (userSaved) {
            await UserModel.findByIdAndUpdate(userSaved._id, {
                person: personSaved._id
            });
        }
        console.log('Create account successfully!')
        console.log(personSaved);
        process.exit();
    } catch (e) {
        console.log(e)
        process.exit();
    }
}


const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => {
    initUser();
    console.log('Connected to MongoDB')
});


