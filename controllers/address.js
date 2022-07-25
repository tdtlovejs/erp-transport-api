const path = require('path');
const fs = require("fs");
const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {ROLE_SUPERADMIN, ROLE_ADMIN, LANGUAGE_EN, VEHICLE_STATUS_MOVING} = require("../utils/constants");
const VnProvinceModel = require("../models/vnProvince");
const VnDistrictModel = require("../models/vnDistrict");
const VnWardModel = require("../models/vnWard");
const addressController = {};

addressController.initVnAddress = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (currentUser.role !== ROLE_SUPERADMIN) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }

        let vnAddressDBFile = fs.readFileSync(path.join(__dirname, '../service/vnAddressDB.json'));
        let vnAddressDBData = JSON.parse(vnAddressDBFile);
        for (let i1 = 0; i1 < vnAddressDBData.length; i1 ++) {
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
        return res.status(httpStatus.OK).json({
            message: 'import address success!'
        });
    } catch (e) {
        next(e)
    }
}

addressController.listVnProvince = async (req, res, next) => {
    try {
        const items = await VnProvinceModel.find();
        return res.status(httpStatus.OK).json({
            items: items
        });
    } catch (e) {
        next(e)
    }
}

addressController.listVnDistrictByProvince = async (req, res, next) => {
    try {
        const {
            province
        } = req.query;
        const items = await VnDistrictModel.find({
            vnProvince: province
        });
        return res.status(httpStatus.OK).json({
            items: items
        });
    } catch (e) {
        next(e)
    }
}

addressController.listVnWardByDistrict = async (req, res, next) => {
    try {
        const {
            district
        } = req.query;
        const items = await VnWardModel.find({
            vnDistrict: district
        });
        return res.status(httpStatus.OK).json({
            items: items
        });
    } catch (e) {
        next(e)
    }
}

module.exports = addressController;
