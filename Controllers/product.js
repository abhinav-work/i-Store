const Product = require('../models/product');
const Order = require('../models/orders');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 3; 
var stripe = require('stripe')('sk_test_7clOI8ek0c5UOHpQK0aUgx5U00kSbCvUxy'); 
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    var totalItems;
    Product.find()
                .countDocuments()
                .then(numProducts => {
                        totalItems = numProducts;
                        // console.log(totalItems)
                        return Product.find()
                                        .skip((page-1) * ITEMS_PER_PAGE)
                                        .limit(ITEMS_PER_PAGE)
                })
                .then(products => {
                    res.render('shop/product-list', {
                        prods: products,
                        pageTitle: "Shop",
                        totalProducts: totalItems,
                        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                        hasPreviousPage: page>1,
                        nextPage: page+1,
                        previousPage: page-1,
                        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                        currentPage: page
                    });
                })
            .catch(err => {
                console.log(err)
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error)
            });
};
exports.getProduct = (req, res, next) => {
   const id = req.params.productID;
    Product.findById({_id: id})
            .then(product =>{
                                res.render('shop/product-detail', {
                                             product: product, 
                                             pageTitle: "Products"
                                             })
                            })
            .catch(err => {
                console.log(err)
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error)
            });
   console.log(id); 
};

exports.getIndex = (req, res, next) => {
     const page = +req.query.page || 1;
     var totalItems;
     Product.find()
         .countDocuments()
         .then(numProducts => {
             totalItems = numProducts;
            //  console.log(totalItems)
             return Product.find()
                 .skip((page - 1) * ITEMS_PER_PAGE)
                 .limit(ITEMS_PER_PAGE)
         })
        .then(products => {
                                res.render('shop/index', {
                                prods: products,
                                pageTitle: "Home",
                                totalProducts: totalItems,
                                    hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                                    hasPreviousPage: page > 1,
                                    nextPage: page + 1,
                                    previousPage: page - 1,
                                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                                    currentPage: page
                                    });
                                })
        .catch(err => {
                console.log(err)
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error)
            });
};

exports.getCart = (req, res, next) => {
    req.user
            .populate('cart.items.productId')
            .execPopulate()
            .then(user => {
                                const products = user.cart.items;
                                var totalValue = 0;
                                products.forEach(element => {
                                    totalValue = totalValue + (element.productId.price * element.quantity) 
                                }); 
                                console.log(totalValue);
                                  res.render('shop/cart', {
                                      pageTitle: "Cart",
                                      product: products,
                                      cartValue: totalValue  
                                  });
            })
            .catch(err => {
                console.log(err)
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error)
            });
  
};

exports.postCart = (req, res, next) => {
    const prodID = req.body.productID;
    Product.findById(prodID)
            .then( product=> {
                    return req.user.addToCart(product)})
            .then(result => console.log(result))
            .catch(err => {
                console.log(err)
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error)
            });
   res.redirect('/cart');
};

exports.postDeleteCartProduct = (req, res, next) => {
    const prodID = req.body.productID;
    req.user
        .deleteFromCart(prodID)    
        .then(result => {
            res.redirect("/cart");
        })
        .catch(err => {
            console.log(err)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        });
};

exports.postOrder = (req, res, next) => {
        const token = req.body.stripeToken;
        var totalValue = 0;
        req.user
                .populate('cart.items.productId')
                .execPopulate()
                .then(user => {

                     
                     user.cart.items.forEach(element => {
                         totalValue = totalValue + (element.productId.price * element.quantity)
                     });

                    const products = user.cart.items.map(i => {
                        
                        return { product: { ...i.productId._doc }, quantity: i.quantity }  })
                    const order = new Order({
                            user: {
                                name: req.user.name,
                                userID: req.user._id,
                                email: req.user.email
                                    },
                            products: products,
                            date: Date.now(),
                            grandTotal: totalValue
                            })
                user.cleanCart();
                return order.save();
                })
                .then(result => {
                        const charge = stripe.charges.create({
                            amount: totalValue * 100,
                            currency: "inr",
                            description: "order",
                            source: token,
                            metadata: {order_id: result._id.toString() }
                        })
                        res.redirect('/orders');
                })
                .catch(err => {
                    console.log(err)
                    // const error = new Error(err);
                    // error.httpStatusCode = 500;
                    // return next(error)
                });
};

exports.getCheckout = (req, res, next) =>{
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            var totalValue = 0;
            products.forEach(element => {
                totalValue = totalValue + (element.productId.price * element.quantity)
            });
            console.log(totalValue);
            res.render('shop/checkout', {
                pageTitle: "Checkout",
                product: products,
                cartValue: totalValue
            });
        })
        .catch(err => {
            console.log(err)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        });
}

 exports.getOrders = (req, res, next) => {
            Order.find({'user.userID': req.user._id})
                .then(orders => {
                               
                                  res.render('shop/orders', {
                                        orders: orders,
                                        pageTitle: "Orders"
                                  });
                })
                .catch(err => {
                    console.log(err)
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error)
                });
};
exports.getInvoice = (req, res, next) => {
        const OrderID = req.params.orderID;
        const invoiceName = 'invoice - ' + OrderID  + '.pdf';
        const invoicePath = path.join('data', 'Invoices', invoiceName)
        Order.findById(OrderID)
                .then(order=>{
                    var count=1;
                    var i = 1;
                    if(!order)
                    {
                        console.log('out')
                        return next(new Error('No Orders Found'))
                    }
                   
                    if(order.user.userID.toString()!==req.user._id.toString())
                    {
                        return next(new Error('Unauthorised'))
                    }
                    
                    const pdfDoc = new PDFDocument();
                     res.setHeader('Content-Type', 'application/pdf');
                     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + ' "')
 
                     pdfDoc.pipe(fs.createWriteStream(invoicePath));
                     pdfDoc.pipe(res)
                      pdfDoc.moveTo(30, 110).lineTo(580, 110)
                     pdfDoc.fontSize(26).text('Invoice', {
                         underline: true,
                         align: 'center'
                     })
                    pdfDoc.moveDown()

                    const orderLabel = "Order - #" + order._id;
                    const width = pdfDoc.widthOfString(orderLabel)-100
                    const height = pdfDoc.currentLineHeight();
                    pdfDoc.font('Helvetica-Bold').fontSize(18).highlight(55, 126, width, height).text(orderLabel)
                     pdfDoc.moveDown()

                    pdfDoc.fontSize(14).text('Customer Name - ', {
                           continued: true
                    }).font('Helvetica').text(order.user.name)
                    pdfDoc.font('Helvetica-Bold').moveDown()
                    pdfDoc.fontSize(12).text('Dated - ', {
                        continued: true
                    }).font('Helvetica').text(order.date)

                       count = count+3;
                    pdfDoc.font('Helvetica-Bold').text("SNo. " + "  Product Name", 45, (count * 30) + 150)
                    pdfDoc.text("Price  x  Quantity", 425, (count * 30) + 150)
                    count++;
                    pdfDoc.font('Helvetica')
                     order.products.forEach(prods => {
                                    pdfDoc.text(i + ".        " + prods.product.title, 50, (count*30) + 150)
                                    pdfDoc.text(" - Rs. " + prods.product.price + " x  " + prods.quantity, 420, (count * 30) + 150)
                                     count++;
                                     i++;
                                })
                    pdfDoc.moveTo(45,   (count * 30) + 142).lineTo(550,  (count * 30) + 142).lineWidth(1).stroke()
                    pdfDoc.text("Total", 100, (count * 30) + 150);
                    pdfDoc.text(" - Rs. " + order.grandTotal, 420, (count * 30) + 150)
                    count++;
                    pdfDoc.moveTo(45, (count * 30) + 142).lineTo(550, (count * 30) + 142).lineWidth(1).stroke()
                     pdfDoc.end()
                     
            })
           .catch(err => {
               console.log(err)
               const error = new Error(err);
               error.httpStatusCode = 500;
               return next(error)
           });
        
    }

// FILE METHODS

// exports.getOrders = (req, res, next) => {
//     res.render('shop/orders',
//         { pageTitle: "Orders" }
//     );
// };
// exports.getCheckout = (req, res, next) => {
//     res.render('shop/checkout',
//         { pageTitle: "Checkout "}
//     );
// };

// exports.getCart = (req, res, next) => {
//     Cart.getCartProducts(cart =>{
//         Product.fetchAll(products => {
//             const cartProducts = [];
//             for(product of products)
//                     {
//                         const cartProductData = cart.products.find(prods => prods.id === product.id);
//                         if(cartProductData)
//                         {
//                             cartProducts.push({productData: product, qty: cartProductData.qty});
//                         }
//                     }
//             res.render('shop/cart', {
//                 pageTitle: "Your Cart",
//                 product: cartProducts});
//          });
               
//     })
// };




