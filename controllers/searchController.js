const walmart = require('../retailerAPIs/walmartAPI')
require('dotenv').config()

function bayesianAverage(rating, numReviews) {
    // constant values that determine the weight of the average rating and the total number of ratings
    const alpha = 20; //bias towards rating
    const beta = .3; //bias towards number of ratings
  
    // compute the Bayesian average rating by applying the formula:
    // (alpha * averageRating + beta * totalNumberOfRatings) / (alpha + beta)
    return (alpha * rating + beta * numReviews) / (alpha + beta);
}

//ENDPOINT: http://localhost:5000/api/v1/search
exports.search_retailers = async (req, res, next) => {
    /*
    query: 
    maxPrice: **OPTIONAL**
    color:    **OPTIONAL**
     */

    let query = req.body.query
    let maxPrice;
    let color;
    let listOfColors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'gray', 'black', 'white']
    let listOfFillerWords = ['i', 'looking', 'for', 'need', 'want', 'you', 'got', 'do', 'what', 'any', 'really', 'a', '\'m']

    //this is to make it so the search via walmart is better
    for(word in query){
        if (listOfColors.includes(word)){
            color = word[0].toUpperCase() + word.slice(1);
            print("this is color", color)
        }
        //get's rid of words that makes search more potent and filled with less useless words
        else if(listOfFillerWords.includes(word)){
            query = query.filter(x => x !== word)
        }
        //we want to take a number if it exists in the query message and set it as the budget
        //this has some obvious issues such as if someone is looking for a 1tb hard drive.
        //this will set the budget at one dollar and not return anything but works for most other cases
        if(!Number.isNaN(Number(word))){
            maxPrice = Number(word)
        }
    }


    var bestItems = [];
    let a = 1;
    query = query.join(' ')

    try{
        if(!query){
            console.log("[Error 400]: Search query not set. Current query is: " + query);
            res.status(404).json(`[Error 400]: Search query not set. Current query is: ${query}`)
        }
        
        var facetColor = ''
        if(color){
            facetColor = `&facet.filter=color:${color}`
        }

        //makes a loop of subsequent api calls till 25 best items are found or no more items left to choose from in API
        do{
            let url = `search?publisherId=${process.env.PUBLISHER_ID}&query=${query}&start=${a}&numItems=25&responseGroup=full&facet=on&facet.filter=availableOnline:true&facet.filter=stock:Available`
            const response_WAL = await walmart.walmartAPI(`${url}${facetColor}`, "GET")
            
            //total number of possible items to get 
            var totalCount = response_WAL.totalResults
            

            for(let i = 0; i < response_WAL.items.length; i++){

                if(typeof response_WAL.items[i] === 'undefined'){
                    console.log(`Element at index ${i} is undefined`)

                }
                if(Number(response_WAL.items[i].salePrice) <= maxPrice || !maxPrice){
                    if(response_WAL.items[i].numReviews){
                        const duplicateItemCheck = bestItems.find(item => item.itemId === response_WAL.items[i].itemId)
                        if(!duplicateItemCheck){
                            //probably can move to a remove function

                            //gets rid of useless or redundant information
                            delete response_WAL.items[i].imageEntities;
                            delete response_WAL.items[i].rhid; 
                            delete response_WAL.items[i].freight; 
                            delete response_WAL.items[i].giftOptions; 
                            delete response_WAL.items[i].clearance;
                            delete response_WAL.items[i].maxItemsInOrder;
                            delete response_WAL.items[i].preOrder;
                            delete response_WAL.items[i].bundle;
                            delete response_WAL.items[i].offerType;
                            delete response_WAL.items[i].offerId;
                            delete response_WAL.items[i].attributes;
                            delete response_WAL.items[i].categoryPath;
                            delete response_WAL.items[i].thumbnailImage;
                            delete response_WAL.items[i].bestMarketplacePrice;
                            delete response_WAL.items[i].availableOnline
                            delete response_WAL.items[i].gender
                            delete response_WAL.items[i].freeShipToStore
                            delete response_WAL.items[i].size
                            delete response_WAL.items[i].stock
                            delete response_WAL.items[i].modelNumber
                            delete response_WAL.items[i].categoryNode
                            delete response_WAL.items[i].isTwoDayShippingEligible
                            delete response_WAL.items[i].itemId
                            delete response_WAL.items[i].parentItemId
                            delete response_WAL.items[i].ninetySevenCentShipping
                            delete response_WAL.items[i].shipToStore
                            delete response_WAL.items[i].sellerInfo
                            delete response_WAL.items[i].marketplace
                            delete response_WAL.items[i].freeShippingOver35Dollars
                            delete response_WAL.items[i].shortDescription
                            delete response_WAL.items[i].longDescription
                            delete response_WAL.items[i].upc
                            delete response_WAL.items[i].variants
                            delete response_WAL.items[i].msrp
                            delete response_WAL.items[i].twoThreeDayShippingRate

                            //adds another best item to the list
                            bestItems.push(response_WAL.items[i])
                        }
                    }
                }
            }
            a += 25;
        }while(a < totalCount && bestItems.length < 13 && a < 200)

        console.log("Searched Through a total of " + a + " items to find " + bestItems.length + " Best Items");
        
        
        //sort best items from greatest to worst
        bestItems.sort((a, b) => {
            // compute the Bayesian average ratings for both products
            const bayesianAverageA = bayesianAverage(a.customerRating, a.numReviews);
            const bayesianAverageB = bayesianAverage(b.customerRating, b.numReviews);
          
            // compare the Bayesian average ratings of the products and return 1 if the rating of the first product is greater, -1 if the rating of the second product is greater, and 0 if the ratings are equal
            return bayesianAverageA < bayesianAverageB ? 1 : bayesianAverageA > bayesianAverageB ? -1 : 0;
        });
        
        
        //only gives top 4 items at a time.
        res.status(200).json(bestItems.slice(0,4))
        
    } catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}

//ENDPOINT: http://locahost:5000/api/v1/nbp
// exports.next_best_product = async (req, res, next) => {
//     //add actual request
// }