const express= require('express');
const router = express.Router();
const productController = require('../Controllers/product');
const isAuth = require('../Middleware/is_auth');
const isMaster = require('../Middleware/is_master');
const isCustom = require("../Middleware/is_cutomer")

router.get('/', productController.getProducts);
router.get('/products', productController.getIndex);
router.get('/products/:productID', productController.getProduct);
router.get('/cart', isAuth, isCustom, productController.getCart);
router.post('/cart', isAuth, isCustom, productController.postCart);
router.post('/delete-cart-item', isAuth, isCustom, productController.postDeleteCartProduct);
 router.get('/orders', isAuth, isCustom, productController.getOrders);

router.get('/orders/:orderID', isAuth, isCustom,productController.getInvoice)
router.get('/checkout', isAuth, isCustom, productController.getCheckout)
 module.exports = router;