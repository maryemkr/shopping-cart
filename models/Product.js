const mongoose = require('mongoose')
const schema = mongoose.Schema ;

const productSchema = mongoose.Schema({
    user : {
        type : schema.Types.ObjectId  ,
        ref :  'User' ,
        required : true ,
    } ,

    imagePath: {
        type: String,
        required: true
    },

    productName: {
        type: String,
        required: true
    },
    storageCapacity: {
        type: Number,
        required: true
    },

    numberOfSIM: {
        type: String,
        required: true
    },

    cameraResolution: {
        type: Number,
        required: true
    },

    displaySize: {
        type: Number,
        required: true
    },


    price: {
        type: Number,
        required: true
    },
}) ;

       
    
const Product = mongoose.model('product', productSchema);
module.exports = Product;




