var express = require('express');
var router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose')
const  flash  = require ( 'connect-flash' ) ; 
const passport = require('passport') ;
const { check, validationResult } = require('express-validator');
const csrf = require('csurf')
const Order = require('../models/Order')
const cart = require('../models/Cart')

router.use(csrf())

/* GET users listing. */
router.get('/signup',isNotSignin, function(req, res, next) {
  
  res.render('user/signup' , {message : req.flash('signupError')[0], token : req.csrfToken()});
});



router.post('/signup' , [
  check('email').not().isEmpty().withMessage('please enter your email'),
  check('email').isEmail().withMessage('please enter valid email'),
  check('password').not().isEmpty().withMessage('please enter your password'),
  check('password').isLength({ min: 5 }).withMessage('please enter pssword more than 5 char'),
  check('confirm-password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('password and confirm-password not matched')
    }
    return true;
  })

] , (req , res ,next)=>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   

   var validationMassages = [] ;
   for(var i=0 ; i<errors.errors.length ; i++){
     validationMassages.push(errors.errors[i].msg)
   }

   req.flash('signupError' , validationMassages) ;
   res.redirect('signup')

    return;
  }
  next() ;
} , passport.authenticate('local-signup', {
    session : false ,
    successRedirect : 'signin' ,
    failureRedirect : 'signup' ,
    failureMessage : true
}))



router.get('/profile',isSignin, function(req, res, next) {
  if(req.user.cart){
    totalProducts = req.user.cart.totalquantity
  }else{
    totalProducts = 0
  } 
  Order.find({user : req.user._id} , (err , resualt)=>{
    if(err){
      console.log(err)
    }

    console.log(resualt) ;

    const index = -1
    const userCart = req.user.cart
    console.log(userCart)
    res.render('user/profile', {checkuser : true , 
      checkProfile : true , 
        totalProducts : totalProducts,
        userOrder : resualt ,
        index,
        userCart : userCart,
        user : req.user ,

  })
  });
});

router.get('/updateProfile', isSignin,function(req, res, next) {
  res.render('user/updateProfile', {checkuser :true })

})


router.get('/signin',isNotSignin, function(req, res, next) {
  res.render('user/signin' , {message : req.flash('signinError')[0] , token : req.csrfToken()});
});
router.post('/signin'  ,[
  check('email').not().isEmpty().withMessage('please enter your email'),
  check('email').isEmail().withMessage('please enter valid email'),
  check('password').not().isEmpty().withMessage('please enter your password'),
  check('password').isLength({ min: 5 }).withMessage('please enter pssword more than 5 char'),

] ,(req , res , next)=>{

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   

   var validationMassages = [] ;
   for(var i=0 ; i<errors.errors.length ; i++){
     validationMassages.push(errors.errors[i].msg)
   }

   req.flash('signinError' , validationMassages) ;
   res.redirect('signin')

    return;
  }

  next();


}
, passport.authenticate('local-signin', {
  successRedirect : 'profile' ,
  failureRedirect : 'signin' ,
  failureFlash : true,
}))
router.get('/logout', isSignin,(req , res , next ) =>{
  req.logOut() ;
  res.redirect('/')
})
/*pour voir si il est connecter */
function isSignin(req ,res ,next){
  if ( ! req.isAuthenticated()){
    res.redirect('signin')
    return ; }
    next();
  }


  function isNotSignin (req ,res ,next){
    if ( req.isAuthenticated()){
      res.redirect('/')
      return ; }
      next();
    }
  
  

module.exports = router;
