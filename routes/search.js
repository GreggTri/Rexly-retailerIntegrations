const express = require('express')
const router = express.Router()

const searchController = require('../controllers/searchController')

//searches all retailers/vendors for products specified by user
router.post('/search', searchController.search_retailers)

router.post('/test', async (req, res, next) => {
    try{

        res.status(200).json(req.body.query)
    } catch(error){
        console.log(error);
        res.status(500).json(error)
    }
    
})

//gets next best product from a specific product
router.post('/nbp', searchController.next_best_product)

module.exports = router