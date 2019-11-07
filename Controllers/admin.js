 const Product = require('../models/product');
 const { validationResult } = require('express-validator/check')
const fileHelper = require('../utilities/file');
const ITEMS_PER_PAGE = 3;


exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product',
        { pageTitle: 'Add Product',
            editing: false,
            hasError: false,
            errorMessage: null,
            validationErr: []
        }
    );
};

exports.postAddProduct = (req, res, next) => 
{
    const title = req.body.title;
    console.log(title);
    const image = req.files;
    var imageURL;
    var imageURL2;
    var imageURL3 ;
    const description = req.body.description;
    const price = req.body.price;
     const errors = validationResult(req);
    

     if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
             pageTitle: 'Add Product',
             editing: false,
             hasError: true,
             product: {
                 title : title,
                 description: description,
                 price: price,
             },
             errorMessage: errors.array()[0].msg,
             validationErr: errors.array()
         });
     }

        if (image.length < 3) {
            return res.status(422).render('admin/edit-product', {
                pageTitle: 'Add Product',
                editing: false,
                hasError: true,
                product: {
                    title: title,
                    description: description,
                    price: price,
                },
                errorMessage: "Please attach an image",
                validationErr: []
            });
        }
        
        console.log("Hey HAHAA  ")
        imageURL = "/" + image[0].path;
        imageURL2 = "/" + image[1].path;
        imageURL3 = "/" + image[2].path;
        console.log("URL is here!!")
        console.log(imageURL)
             console.log(imageURL2)
                  console.log(imageURL3)
        // if(!title || !imageURL || !description || !price )
        //     {   
        //         console.log("NULLIFY");
        //         res.redirect('/admin/adminproduct'); 
        //     }
        // else if (title && imageURL && description && price)
        
            console.log("SumLIFY");
            const product = new Product({
                title: title, 
                price: price,
                description: description,
                imageURL: imageURL,
                imageURL2: imageURL2,
                imageURL3: imageURL3,
                userID: req.user
               });

            product.save()
                    .then(result => {
                            console.log("Created a Product Successfully");
                            res.redirect("/admin/adminproduct");
                        })
                    .catch(err => {
                        console.log(err)
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        return next(error)
                    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode= req.query.edit;
    if(editMode!="true"){
        return res.redirect('/')
    }
    const prodID = req.params.productID;

    Product.findById({_id: prodID})
            .then(product => {
                                if(!product)
                                {
                                    res.redirect('/')
                                }
                                res.render('admin/edit-product',{
                                        pageTitle: 'Edit Product',
                                        editing: editMode,
                                        hasError: false,
                                        product: product,
                                        errorMessage: null,
                                        validationErr: []
                                         });
                        })
            .catch(err => {
                console.log(err)
                  const error = new Error(err);
                  error.httpStatusCode = 500;
                  return next(error)
            });
};

exports.postEditProduct = (req, res, next) => {
    const prodID = req.body.productID
    const updatedTitle = req.body.title;
     const image = req.files;
    var updatedImageURL;
    var updatedImageURL2;
    var updatedImageURL3;
    const updatedDescription = req.body.description;
    const updatedPrice = req.body.price;
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
         //console.log(errors.array())
         return res.status(422).render('admin/edit-product', {
                                                                pageTitle: 'Edit Product',
                                                                editing: true,
                                                                hasError: true,
                                                                product: {
                                                                    title: updatedTitle,
                                                                    imageURL: updatedImageURL,
                                                                    imageURL2: updatedImageURL2,
                                                                    imageURL3: updatedImageURL3,
                                                                    description: updatedDescription,
                                                                    price: updatedPrice,
                                                                    _id: prodID
                                                                 },
                                                                    errorMessage: errors.array()[0].msg,
                                                                    validationErr: errors.array()
         });
     }
    var len = image.length;
    console.log(len)
    if(len>0)
    {
        updatedImageURL = "/" + image[0].path;
        if (len>1) 
        {
            updatedImageURL2 = "/" + image[1].path;
            if (len>2)
            {
                updatedImageURL3 = "/" + image[2].path;
            }
        }
    }
    
    
    Product.findById(prodID)
                .then(product => {
                                        if(product.userID.toString()!==req.user._id.toString())
                                        {
                                            return res.redirect('/')
                                        }
                                        if(updatedImageURL)
                                        {
                                            var address = product.imageURL.toString().replace('/', '');
                                             console.log(address) 
                                            fileHelper.deleteFile(address);
                                            product.imageURL = updatedImageURL;
                                        }
                                        if(updatedImageURL2)
                                        {
                                             var address = product.imageURL2.toString().replace('/', '');
                                             fileHelper.deleteFile(address);
                                             product.imageURL2 = updatedImageURL2;
                                        }
                                        if(updatedImageURL3)
                                        {
                                              var address = product.imageURL3.toString().replace('/', '');
                                              fileHelper.deleteFile(address);
                                             product.imageURL3 = updatedImageURL3;
                                        }
                                        console.log(req.user._id)
                                        product.title = updatedTitle
                                        product.description = updatedDescription;
                                        product.price = updatedPrice;
                                        product.userID = req.user;
                                        
                                        return product.save()
                                                        .then(result => {
                                                            res.redirect('/');
                                                        })
                                                        .catch(err =>  console.log(err))
                })
                .catch(err => {
                    console.log(err)
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error)
                });
};

exports.getAdminProducts = (req, res, next) => {
    console.log(req.session)
    const page = +req.query.page || 1;
    var totalItems;
    Product.find({userID: req.user._id})
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            // console.log(totalItems)
            return Product.find({ userID: req.user._id })
                            .skip((page - 1) * ITEMS_PER_PAGE)
                            .limit(ITEMS_PER_PAGE)  
        })
        .then(products => {
                                res.render('admin/products', {
                                    prods: products,
                                    pageTitle: "Admin Product",
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

exports.deleteProduct = (req, res, next) => {
     var currentPage = +req.query.page || 1;
    const prodID = req.params.productID;
    Product.findById(prodID)
                .then(prod => {     
                                    var address = prod.imageURL.toString().replace('/', '');
                                    fileHelper.deleteFile(address);
                                    var address = prod.imageURL2.toString().replace('/', '');
                                    fileHelper.deleteFile(address);
                                    var address = prod.imageURL3.toString().replace('/', '');
                                    fileHelper.deleteFile(address);
                                    return Product
                                        .deleteOne({
                                            _id: prodID,
                                            userID: req.user._id
                                        })
                                        
                })
               .then(product => {
                     res.status(200).json({
                         message: 'Success!!'
                     });
               })
                .catch(err => {
                    console.log(err)
                    res.status(500).json({message: "Deletion of the product failed!"})
                });
    };

