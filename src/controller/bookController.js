const bookModel = require("../models/bookModel")
const userModel = require("../models/userModel")
const reviewModel = require("../models/reviewModel")
const moment = require("moment")
const mongoose = require("mongoose")
const aws = require("aws-sdk")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};


const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}



aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",  //HERE
            Key: "abc/" + file.originalname, //HERE 
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, Mydata) {
            if (err) {
                return reject({ "error": err })
            }
            console.log(Mydata)
            console.log("file uploaded succesfully")
            return resolve(Mydata.Location) 
        })

        // let data= await s3.upload( uploadParams)
        // if( data) return data.Location
        // else return "there is an error"

    })
}



//====================Create Books================================================
const createBook = async function (req, res) {
    try {
        let Body = req.body.data
        
        let file = req.files
       // console.log(file[0])
        let data = JSON.parse(Body)
       // console.log(data)
        if (!data) return res.status(400).send({ status: false, message: "Body should not be empty" })


        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body should not be empty" })
        }

        // const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = req.body

        if (!isValid(data.title)) return res.status(400).send({ status: false, msg: "title is Required" })
        let titleCheck = await bookModel.findOne({ title: data.title })
        if (titleCheck) return res.status(400).send({ status: false, message: "title already exists" })

        if (!isValid(data.excerpt)) return res.status(400).send({ status: false, msg: "excerpt is Required" })
        if (!isValid(data.userId)) return res.status(400).send({ status: false, msg: "userId is Required" })

        if (!isValidObjectId(data.userId)) return res.status(400).send({ status: false, msg: "userId is invalid" })

        if (!isValid(data.ISBN)) return res.status(400).send({ status: false, msg: "ISBN is Required" })
        if (data.ISBN.length > 13 || data.ISBN.length < 13) return res.status(400).send({ status: false, message: "ISBN no must be of 13 digits" })
        let ISBNcheck = await bookModel.findOne({ ISBN: data.ISBN })
        if (ISBNcheck) return res.status(400).send({ status: false, message: "ISBN already exists" })

        if (!isValid(data.category)) return res.status(400).send({ status: false, msg: "category is Required" })
        if (!isValid(data.subcategory)) return res.status(400).send({ status: false, msg: "subcategory is Required" })
        if (!isValid(data.releasedAt)) return res.status(400).send({ status: false, msg: "releasedAt is Required" })
        if (!moment.utc(data.releasedAt, "YYYY-MM-DD", true).isValid()) return res.status(400).send({ status: false, message: "enter date in valid format eg. (YYYY-MM-DD)...!" })


        let userID = await userModel.findById(data.userId)
        if (!userID) {
            return res.status(404).send({ status: false, msg: "userId is not valid" })
        }
        let URL = await uploadFile(file[0])
        data["BookCover"] = URL
        let savedData = await bookModel.create(data)
        res.status(201).send({ status: true, message: "Success", data: savedData })



    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//====================getApi by Books=============================================

const getBooks = async function (req, res) {
    try {
        let data = req.query


        if (data.title || data.excerpt || data.ISBN || data.review || data.isDeleted) {
            return res.status(400).send({ status: false, message: "Only userId, category and subcategory are accepted" })

        }

        const check = await bookModel.find(data).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })
        console.log(check)



        if (check.length == 0)
            return res.status(404).send({ status: false, message: "No books found" });
        let sortingtitle = check.sort(function (a, b) { return a.title.localeCompare(b.title) })

        return res.status(200).send({ status: true, message: 'Books list', data: sortingtitle });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};


//   =================================get book by id ========================================

const getBooksbyId = async function (req, res) {
    try {
        let bookId = req.params.bookId
        if (!bookId) { return res.status(404).send({ status: false, message: "Not a valid Book Id" }) }
        if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, msg: "bookId is invalid" })

        let Books = await bookModel.findOne({ _id: bookId, isDeleted: false })

        if (!Books) { return res.status(404).send({ status: false, message: "No Book Found" }) }

        const reviewData = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ __v: 0, isDeleted: 0, createdAt: 0, updatedAt: 0 })

        const { _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, releasedAt, createdAt, updatedAt } = Books
        let Output = {
            _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, releasedAt, createdAt, updatedAt, reviewData
        }
        res.status(200).send({ status: true, message: 'Books list', data: Output })

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

//====================Update Books===============================================
const updateBook = async function (req, res) {
    try {
        let data = req.body

        let bookId = req.params.bookId



        let Books = await bookModel.findOne({ _id: bookId, isDeleted: false })

        if (!Books) { return res.status(404).send({ status: false, message: "No Book Found" }) }

        let { title, excerpt, releasedAt, ISBN } = data

        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "Body should not be empty" })


        if (!isValid(title)) return res.status(400).send({ status: false, message: "please write title in correct way" })


        let titleInfo = await bookModel.findOne({ title: title })
        if (titleInfo) {
            return res.status(400).send({ status: false, message: "title already used" })
        }

        if (!isValid(excerpt)) return res.status(400).send({ status: false, message: "please write excerpt in correct way" })

        if (!isValid(ISBN)) return res.status(400).send({ status: false, message: "please write ISBN in correct way" })

        let ISBNinfo = await bookModel.findOne({ ISBN: ISBN })
        if (ISBNinfo) return res.status(400).send({ status: false, message: "ISBN already used" })

        isValidDate = moment(releasedAt, 'YYYY-MM-DD', true).isValid()
        if (!isValidDate) return res.status(400).send({ status: false, message: "please write correct Date, and format of date  - YYYY-MM-DD" })






        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $set: data }, { new: true });

        return res.status(200).send({ status: true, message: "success", data: updatedBook });
    }
    catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


//====================Delete Books By ID=============================================
const deleteBookById = async function (req, res) {
    try {
        let BookId = req.params.bookId

        let Book = await bookModel.findOne({ _id: BookId, isDeleted: false })
        if (!Book) { return res.status(404).send({ status: false, message: " Book not found" }) }

        await bookModel.findOneAndUpdate({ _id: BookId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: Date.now() } })
        return res.status(200).send({ status: true, message: "book deleted successfully" })

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}







module.exports = { createBook, getBooks, getBooksbyId, updateBook, deleteBookById }