var express = require('express');
var router = express.Router();
const Product=require('../models/Product')
const Cart=require('../models/Cart')
const stripe = require('stripe')('sk_test_JjUgugHcOxWAbVVjcB5hwIjN00BHAya1o9');
const Order = require('../models/Order')
const multer = require('multer');
const { Products } = require('stripe/lib/resources');

/* GET home page. */






router.get('/',  async (req, res, next) => {
const successMsg = req.flash('success')[0]

  var totalProducts = null;
  if (req.isAuthenticated()) {
    if (req.user.cart) {
      totalProducts = req.user.cart.totalquantity;
    } else {
      totalProducts = 0;
    }

  }

    try {
      const products = await Product.find({});
    
      res.render('index', {products ,checkuser : req.isAuthenticated(),totalProducts: totalProducts , successMsg: successMsg  });

    } catch (error) {
      console.log(error.message);
    }
  }
)


router.get('/addToCart/:id/:price/:name' , (req,res,next)=>{

  const cartID = req.user._id;
  const newproductPrice = parseInt(req.params.price, 10)

  const newProduct = {
    _id: req.params.id,
    price: newproductPrice,
    name: req.params.name,
    quantity: 1,
  }

  Cart.findById(cartID, (error, cart) => {
    if (error) {
      console.log(error)
    }
    if (!cart) {

      const newCart = new Cart({
        _id: cartID,
        totalquantity: 1,
        totalPrice: newproductPrice,
        selectedProduct: [newProduct],
       
      })
      newCart.save((error, doc) => {
        if (error) {
          console.log(error)
        }
        console.log(doc)
      })

    }
    if(cart){
      var indexOfProduct = -1;
      for (var i = 0; i < cart.selectedProduct.length; i++) {
        if (req.params.id === cart.selectedProduct[i]._id) {
          indexOfProduct = i; 
          break;
        }
      }    
      if (indexOfProduct >= 0) {
        cart.selectedProduct[indexOfProduct].quantity = cart.selectedProduct[indexOfProduct].quantity + 1;
        cart.selectedProduct[indexOfProduct].price = cart.selectedProduct[indexOfProduct].price + newproductPrice;
        cart.totalquantity = cart.totalquantity + 1;
        cart.totalPrice = cart.totalPrice + newproductPrice;

        Cart.updateOne({ _id: cartID }, { $set: cart }, (error, doc) => {
          if (error) {
            console.log(error)
          }
          console.log(doc)
          console.log(cart)
        })

      } else {
        cart.totalquantity = cart.totalquantity + 1;
        cart.totalPrice = cart.totalPrice + newproductPrice;
        cart.selectedProduct.push(newProduct)

        Cart.updateOne({ _id: cartID }, { $set: cart }, (error, doc) => {
          if (error) {
            console.log(error)
          }
          console.log(doc)
          console.log(cart)
        })
    }}
      })
  
  res.redirect('/')
})


router.get('/shopping-cart',(req,res,next)=>{
if(!req.isAuthenticated()) {
  res.redirect('/users/signin')
  return
}
if(!req.user.cart){
  res.render('shopping-cart' , { checkuser :true , totalProducts:0})
  return
}


const userCart = req.user.cart
const totalProducts = req.user.cart.totalquantity
const index = -1
 res.render('shopping-cart' , {userCart : userCart , checkuser :true , totalProducts:totalProducts , index})
})

router.get('/increaseProduct/:index', (req,res,next)=>{
  const index = req.params.index ;
  console.log(req.params.index)
  const userCart = req.user.cart ;
  const productPrice = userCart.selectedProduct[index].price / userCart.selectedProduct[index].quantity

  userCart.selectedProduct[index].quantity = userCart.selectedProduct[index].quantity + 1 ;
  userCart.selectedProduct[index].price = userCart.selectedProduct[index].price + productPrice ;
  userCart.totalquantity = userCart.totalquantity + 1 ;
  userCart.totalPrice = userCart.totalPrice + productPrice ;
  
 Cart.updateOne({_id : userCart._id } , {$set : userCart} , (err , doc) =>{    if (err) {
      console.log(err)
    }
    console.log(doc)
    res.redirect('/shopping-cart')
  })

})
router.get('/decreaseProduct/:index', (req,res,next)=>{
  const index = req.params.index ;
  console.log(req.params.index)
  const userCart = req.user.cart ;
  const productPrice = userCart.selectedProduct[index].price / userCart.selectedProduct[index].quantity
  userCart.selectedProduct[index].quantity = userCart.selectedProduct[index].quantity - 1 ;
  userCart.selectedProduct[index].price = userCart.selectedProduct[index].price - productPrice ;
  userCart.totalquantity = userCart.totalquantity - 1 ;
  userCart.totalPrice = userCart.totalPrice - productPrice ;
  Cart.updateOne({_id : userCart._id } , {$set : userCart} , (err , doc) =>{    if (err) {
    console.log(err)
  }
  console.log(doc)
  res.redirect('/shopping-cart')
})

})

router.get('/deleteProduct/:index', (req,res,next)=>{
  const index = req.params.index ;
  const userCart = req.user.cart ;
  console.log(userCart)

  if(userCart.selectedProduct.length <=1){
    Cart.deleteOne({_id : userCart._id} , (err , doc)=>{
      if(err){
        console.log(err)
      }
      console.log(doc)

      res.redirect('/shopping-cart');
    })
  } else{


  userCart.totalPrice = userCart.totalPrice - userCart.selectedProduct[index].price ;
  userCart.totalquantity = userCart.totalquantity - userCart.selectedProduct[index].quantity ;
  userCart.selectedProduct.splice(index , 1) ;
  Cart.updateOne({_id : userCart._id} , {$set : userCart} , (err , doc)=>{
    if(err){
      console.log(err)
    }
    console.log(doc)
    res.redirect('/shopping-cart')
  })
  }

})

router.get('/checkout', (req,res,next)=>{
  const errorMsg = req.flash('error')[0]
 const totalProducts = req.user.cart.totalquantity;
const totalPrice =  req.user.cart.totalPrice;
  res.render('checkout' , { checkuser :true ,
     totalProducts:totalProducts,
      totalPrice:totalPrice ,
    errorMsg : errorMsg
    })

})
router.post('/checkout', (req,res,next)=>{
  stripe.charges.create(
    {
       amount : req.user.cart.totalPrice ,
       currency : "usd" ,
       source : "tok_mastercard" ,
       description : "charge for test@example.com"
    },
    function(err, charge){
      if (err) {

        console.log(err.raw._message)
      req.flash('error' ,  err.raw._message)


        res.redirect('/checkout')  
       }
   
      req.flash('success', 'successfuly bought product')

      const order = new Order({
        user : req.user._id ,
        cart : req.user.cart ,
        address : req.body.address ,
        name : req.body.name ,
        contact : req.body.contact  , 
        paymentId : charge.id ,
        orderPrice : req.user.cart.totalPrice ,
      }) ;

      order.save((err , resualt)=>{
        if(err){
          console.log(err) ;
        } 
        console.log(resualt) ;

        Cart.deleteOne({_id : req.user.cart._id} , (err , doc)=>{
          if(err){
            console.log(err)
          }
          console.log(doc)
          res.redirect('/')
        })


      })



      

})

})
router.get('/addProduct',   (req, res, next) => {
  if(!req.isAuthenticated()) {
    res.redirect('/users/signin')
    return
  }
  res.render('addProduct' , { checkuser :true , totalProducts:0})

})
 

router.post('/addProduct', multer({ storage : multer.diskStorage({ destination: function (req, file, cb) { cb(null, 'public/images')},
filename: function (req, file, cb){cb(null, Date.now() +'-'+ file.originalname  )}
})
}).single('imagePath')  , (req, res, next) => {
  let product = new Product ({
    user : req.user._id ,
  imagePath : req.file.filename,
  productName :req.body.productName,
  storageCapacity : req.body.storageCapacity,
  numberOfSIM : req.body.numberOfSIM,
  cameraResolution : req.body.cameraResolution,
  displaySize : req.body.displaySize,
  price : req.body.price,
 
})
product.save((err , resultat)=>{
  if(err){
    console.log(err) ;
  } 
  console.log(resultat) ;
  req.flash('success', 'successfuly added ')
  res.redirect('/')
})
 

})
router.get('/detailProduct/:id', async  (req, res, next) => {
  id= req.params.id
  console.log(id)
  try {
    const products = await Product.findById(id);
  
console.log(products)
  res.render('detailProduct' , { products ,checkuser :true , totalProducts:0 , })
} catch (error) {
  console.log(error.message);
}

})
 
router.get('/myProduct',  async (req, res, next) => {
  user = req.user._id 
console.log(user)
  if(!req.isAuthenticated()) {
    res.redirect('/users/signin')
    return
  }
  try {
    const products = await Product.find({user});
  
    res.render('myProduct', {products ,checkuser : req.isAuthenticated(),totalProducts: totalProducts });

  } catch (error) {
    console.log(error.message);
  }
}
)

router.get('/delete/:id',  async (req, res, next) => {
 id = req.params.id

console.log(id)
  if(!req.isAuthenticated()) {
    res.redirect('/users/signin')
    return
  }
  try {

    const productss = await Product.deleteOne({id : id});
    const products = await Product.find({user});

    console.log('true');

    res.render('myProduct', {products ,productss,checkuser : req.isAuthenticated(),totalProducts: totalProducts });

  } catch (error) {
    console.log(error.message);
  }
}
)
router.get('/updateProduct/:id',async (req,res,next)=>{
  id= req.params.id
  console.log(id)
  try {
    const products = await Product.findById(id);
  
console.log(products)
res.render('updateProduct',{checkuser : req.isAuthenticated(),totalProducts: totalProducts , products})
} catch (error) {
  console.log(error.message);
}

})

router.post('/updateProduct', multer({ storage : multer.diskStorage({ destination: function (req, file, cb) { cb(null, 'public/images')},
filename: function (req, file, cb){cb(null, Date.now() +'-'+ file.originalname  )}
})
}).single('imagePath')  ,async (req, res, next) => {

  
  productName =req.body.productName,
  storageCapacity = req.body.storageCapacity,
  numberOfSIM = req.body.numberOfSIM,
  cameraResolution = req.body.cameraResolution,
  displaySize = req.body.displaySize,
  price = req.body.price


  try {

    const productss = await Product.updateOne({productName,storageCapacity,numberOfSIM,cameraResolution,displaySize,price});
    const products = await Product.find({user});

    console.log('true');
    res.render('myProduct',{checkuser : req.isAuthenticated(),totalProducts: totalProducts , products})
    console.log(Products);

  } catch (error) {
    console.log(error.message);
  }
  
  })
  
module.exports = router;
