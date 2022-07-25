const express = require("express");
const invoiceRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const invoiceController = require("../controllers/invoice");


invoiceRoutes.get(
    "/list",
    auth,
    asyncWrapper(invoiceController.list),
);

invoiceRoutes.post(
    "/create",
    auth,
    asyncWrapper(invoiceController.create)
);

invoiceRoutes.post(
    "/change-status/:id",
    auth,
    asyncWrapper(invoiceController.changeStatus)
)

invoiceRoutes.get(
    '/export-pdf/:id',
    auth,
    asyncWrapper(invoiceController.exportPdf)
)

invoiceRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(invoiceController.show),
);

invoiceRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(invoiceController.edit)
);

invoiceRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(invoiceController.delete)
);

invoiceRoutes.get(
    "/total-amount-by-year",
    // auth,
    asyncWrapper(invoiceController.getTotalAmountByYear)
);

invoiceRoutes.get(
    "/send-pdf-to-client/:id",
    auth,
    asyncWrapper(invoiceController.sendPdfToClient)
);


module.exports = invoiceRoutes;
