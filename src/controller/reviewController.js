const reviewModel = require("../models/reviewModel")
const bookModel = require("../models/bookModel")
const moment = require("moment")
const mongoose = require("mongoose")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};


const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

//====================Add Review================================================

const addReview = async function (req, res) {
    try {
        let data = req.body
        bookId = req.params.bookId
        const {rating, review, reviewedBy, reviewedAt} = data

        if(!isValidObjectId(bookId)) return res.status(400).send({status:false, message:"BookId is not valid"})
       // if(!isValid(reviewedBy)) return res.status(400).send({status:false, message:"reviewedBy is required"})

        if(!isValid(reviewedAt)) return res.status(400).send({status:false, message:"reviewedAt is required"})
        if (!moment.utc(reviewedAt, "YYYY-MM-DD", true).isValid()) return res.status(400).send({ status: false, message: "enter date in valid format eg. (YYYY-MM-DD)...!" })

        if(!isValid(rating)) return res.status(400).send({status:false, message:"Rating is required"})
         if (rating < 1 || rating > 5) return res.status(400).send({ status: false, message: "rating can be between 1 to 5" })
         
        Book = await bookModel.findOne({ _id: bookId, isDeleted: false }).lean().select({ __v: 0, ISBN: 0 })
        if (!Book) {
            return res.status(404).send({ status: false, messge: "book of this BookId not found" })
        }
        let reviewCount = await reviewModel.find({ bookId: bookId, isDeleted: false }).count()
       
        
        
        data["bookId"] = bookId


        let reviewDetails = await reviewModel.create(data)

        let Object = {
            _id: reviewDetails._id, bookId: reviewDetails.bookId,
            reviewedBy: reviewDetails.reviewedBy, reviewedAt: reviewDetails.reviewedAt,
            rating: reviewDetails.rating, review: reviewDetails.review
        }

        Book["reviewsData"] = Object
        Book["reviews"] = reviewCount
        await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $set: { reviews: reviewCount } })

        return res.status(201).send({ status: true, message: "Success", data: Book })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//====================Update Review===========================================
const updateReview = async function (req, res) {
    try {
        let reviewId = req.params.reviewId
        let bookId = req.params.bookId

        let data = req.body
        if (data.reviewedAt || data.isDeleted) {
            return res.status(400).send({ status: false, message: "Only review, rating and reviewedBy can be updated" })

        }

        let { review, rating, reviewedBy } = data


        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body should not be empty" })
        }

        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "bookId is invalid" })
        }
        let book = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: "book not found" })
        }

        if (!isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "reviewId is invalid" })
        }

        let reviewID = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!reviewID) {
            return res.status(404).send({ status: false, message: "review not found" })
        }




        // if (!isValid(review)) {
        //     return res.status(400).send({ status: false, message: "review is Required" })
        // }
        // if (!isValid(rating)) {
        //     return res.status(400).send({ status: false, message: "rating is Required" })
        // }
        // if (!isValid(reviewedBy)) {
        //     return res.status(400).send({ status: false, message: "reviewedBy is Required" })
        // }



        let reviewCount = await reviewModel.find({ bookId: bookId, isDeleted: false }).count()


        let updatedReview = await reviewModel.findOneAndUpdate({ _id: reviewId }, { $set: { reviewedBy, rating, review } }, { new: true }).select({ __v: 0, isDeleted: 0, createdAt: 0, updatedAt: 0 })

        let updatedBook = await bookModel.findOne({ _id: bookId, isDeleted: false }).select({ __v: 0, ISBN: 0 }).lean()

        updatedBook["reviewsData"] = updatedReview

        updatedBook["reviews"] = reviewCount

        return res.status(200).send({ status: true, message: "Success", data: updatedBook })

    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
}


//====================Delete Review=============================================
const deletedReview = async function (req, res) {
    try {
        let reviewId = req.params.reviewId
        let bookId = req.params.bookId


        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "bookId is invalid" })
        }
        let book = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: "book not found" })
        }

        if (!isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, mssg: "reviewId is invalid" })
        }

        let reviewID = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!reviewID) {
            return res.status(404).send({ status: false, message: "review not found" })
        }

      await reviewModel.findOneAndUpdate({ _id: reviewId, isDeleted: false }, { $set: { isDeleted: true} })
        await bookModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: -1 } })
        return res.status(200).send({ status: true, message: "Review deleted successfully"})







    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }



}
module.exports = { addReview, updateReview, deletedReview }