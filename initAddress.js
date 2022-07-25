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
const fs = require("fs");
const VnProvinceModel = require("./models/vnProvince");
const VnDistrictModel = require("./models/vnDistrict");
const VnWardModel = require("./models/vnWard");

mongoose.connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
});

const initAddress = async () => {
    try {
        let vnAddressDBFile = fs.readFileSync(path.join(__dirname, './service/vnAddressDB.json'));
        let vnAddressDBData = JSON.parse(vnAddressDBFile);
        for (let i1 = 0; i1 < vnAddressDBData.length; i1 ++) {
            console.log(i1)
            const itemProvince = vnAddressDBData[i1];
            let vnProvince = await VnProvinceModel.findOne({
                code: itemProvince.code
            })
            if (!vnProvince) {
                vnProvince = await VnProvinceModel({
                    name: itemProvince.name,
                    code: itemProvince.code,
                    codename: itemProvince.codename,
                    divisionType: itemProvince.division_type,
                    phoneCode: itemProvince.phone_code
                }).save()
            } else {
                vnProvince = await VnProvinceModel.findByIdAndUpdate(vnProvince._id, {
                    name: itemProvince.name,
                    code: itemProvince.code,
                    codename: itemProvince.codename,
                    divisionType: itemProvince.division_type,
                    phoneCode: itemProvince.phone_code
                })
            }
            if (vnProvince) {
                const districts = Array.isArray(itemProvince.districts) ? itemProvince.districts : [];
                for (let i2 = 0; i2 < districts.length; i2++) {
                    const itemDistrict = districts[i2];
                    let vnDistrict = await VnDistrictModel.findOne({
                        code: itemDistrict.code
                    })
                    if (!vnDistrict) {
                        vnDistrict = await VnDistrictModel({
                            name: itemDistrict.name,
                            code: itemDistrict.code,
                            codename: itemDistrict.codename,
                            divisionType: itemDistrict.division_type,
                            shortCodename: itemDistrict.short_codename,
                            vnProvince: vnProvince._id
                        }).save();
                    } else {
                        vnDistrict = await VnDistrictModel.findByIdAndUpdate(vnDistrict._id, {
                            name: itemDistrict.name,
                            code: itemDistrict.code,
                            codename: itemDistrict.codename,
                            divisionType: itemDistrict.division_type,
                            shortCodename: itemDistrict.short_codename,
                            vnProvince: vnProvince._id
                        })
                    }
                    if (vnDistrict) {
                        const wards = Array.isArray(itemDistrict.wards) ? itemDistrict.wards : [];
                        for (let i3 = 0; i3 < wards.length; i3++) {
                            const itemWard = wards[i3];
                            let vnWard = await VnWardModel.findOne({
                                code: itemWard.code
                            })
                            if (!vnWard) {
                                vnWard = await VnWardModel({
                                    name: itemWard.name,
                                    code: itemWard.code,
                                    codename: itemWard.codename,
                                    divisionType: itemWard.division_type,
                                    shortCodename: itemWard.short_codename,
                                    vnDistrict: vnDistrict._id
                                }).save();
                            } else {
                                vnWard = await VnWardModel.findByIdAndUpdate(vnWard._id, {
                                    name: itemWard.name,
                                    code: itemWard.code,
                                    codename: itemWard.codename,
                                    divisionType: itemWard.division_type,
                                    shortCodename: itemWard.short_codename,
                                    vnDistrict: vnDistrict._id
                                })
                            }
                        }
                    }
                }
            }
        }
        process.exit();
    } catch (e) {
        console.log(e)
        process.exit();
    }
}


const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => {
    initAddress();
    console.log('Connected to MongoDB')
});


