const express = require('express');
const router = express.Router();
const path = require('path');
const productsController = require('../Controllers/admin');
const isAuth = require('../Middleware/is_auth');
const isMaster = require('../Middleware/is_master')
const { body } = require('express-validator/check');


const URL = require("url").URL;

const stringIsAValidUrl = (s) => {
    try {
        new URL(s);
        return true;
    } catch (err) {
        return false;
    }
};


router.get('/adminproduct', isAuth, isMaster, productsController.getAdminProducts);
router.get('/addproduct', isAuth, isMaster, productsController.getAddProduct);
router.post('/add-product', 
                            [   
                                body('title', 'Enter a valid Title')
                                    .isLength({ min: 3 })
                                    .isString(),
                                body('price', 'Enter a valid Price').isFloat(),
                                body('description', 'Enter a valid Description').isLength({ min: 5, max: 400 }).isString()
                            ], 
                            isAuth, productsController.postAddProduct);
router.get('/edit-product/:productID', isAuth, isMaster, productsController.getEditProduct);
router.post('/edit-product/', 
                            [
                                body('title', 'Enter a valid Title')
                                .isString()
                                .isLength({ min: 3 }),
                                body('price', 'Enter a valid Price').isFloat(),
                                body('description', 'Enter a valid Description')
                                        .isString()
                                        .isLength({ min: 5, max: 400 })
                            ],
                            isAuth, isMaster, productsController.postEditProduct);
router.delete('/delete-product/:productID', isAuth, isMaster, productsController.deleteProduct);

module.exports = router;