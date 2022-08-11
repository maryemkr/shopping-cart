const Product=require('../models/Product')


module.exports = {
    getAllProducts: async (req, res, next) => {
      try {
        const products = await Product.find({});
      
        res.render('index', {products});
      } catch (error) {
        console.log(error.message);
      }
    }
}


