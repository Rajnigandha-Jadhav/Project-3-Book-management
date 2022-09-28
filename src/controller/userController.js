const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidPassword = function (value) {
    if (/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(value)) return true;
    return false;
};

 





// ======================== user register ============================================
const createUser = async function (req, res) {
    try {
        const data = req.body;
       

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body should not be empty" })
        }


        const titleData = data.title;
        if (!isValid(titleData)) return res.status(400).send({ status: false, message: "title is mandatory in the request" })
        if (!["Mr", "Mrs", "Miss"].includes(titleData)) return res.status(400).send({ status: false, message: "title should be Mr, Mrs, Miss" });

        const nameData = data.name;
        if (!isValid(nameData)) return res.status(400).send({ status: false, message: "name is mandatory in the request" })
        if (!nameData.match(/^(?![\. ])[a-zA-Z\. ]+(?<! )$/)) return res.status(400).send({ status: false, message: "name should be in alphabets" })

        const phone = data.phone;
        if (!isValid(phone)) return res.status(400).send({ status: false, message: "phone number is mandatory in the request" })
        if (!phone.match(/^((0091)|(\+91)|0?)[6789]{1}\d{9}$/)) return res.status(400).send({ status: false, message: "phone number should be of 10 digits" })

        const emailData = data.email;
        if (!isValid(emailData)) return res.status(400).send({ status: false, message: "email is mandatory in the request" })
        if (!emailData.match(/^([a-zA-Z0-9_.]+@[a-z]+\.[a-z]{2,3})?$/)) return res.status(400).send({ status: false, message: "email is not valid" });
        let uniquePhone = await userModel.findOne({ phone: phone })
        if (uniquePhone) return res.status(400).send({ status: false, message: "phone no. Already Exists." })
        let uniqueEmail = await userModel.findOne({ email: emailData })
        if (uniqueEmail) return res.status(400).send({ status: false, message: "email Id Already Exists." })


        const passwordData = data.password;
        if (!isValid(passwordData)) return res.status(400).send({ status: false, message: "password is mandatory in the request" })
    
        if (!isValidPassword(passwordData)) return res.status(400).send({status: false, message: "enter valid password"})
        let uniquePassword = await userModel.findOne({ password: passwordData })
        if (uniquePassword) return res.status(400).send({ status: false, message: "password Already Exists." })


        address = data.address
            if (Object.keys(address).length == 0) {
                return res.status(400).send({ status: false, message: "Address should not be empty" })
            }
    
    

            if (!isValid(address.street)) return res.status(400).send({ status: false, message: "please enter street " })
            if (!isValid(address.city)) return res.status(400).send({ status: false, message: "please enter city" })
            if (!isValid(address.pincode)) return res.status(400).send({ status: false, message: "please enter pincode" })
            if (address.pincode) {

                if (!(/^[1-9][0-9]{5}$/).test(address.pincode)) return res.status(400).send({ status: false, message: "please enter valied pincode " })
            }

           

        let savedData = await userModel.create(data);

        res.status(201).send({ status: true, message: "Success", data: savedData })

    } catch (error) {
        console.log(error); res.status(500).send({ status: false, message: error.message });

    }
}




// ================================= User Login ====================================

const loginUser = async function (req, res) {
    try {

        let email = req.body.email;
        let password = req.body.password;
        if (!(email)) {
            return res.status(400).send({ status: false, message: "please provide emailid" })
        }

        if (!(password)) {
            return res.status(400).send({ status: false, message: "please provide password" })
        }


        let user = await userModel.findOne({ email: email, password: password });
        if (!user) {
            return res.status(404).send({ status: false, message: "user not found" })
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60
            

        },
            "JyotiVinayikaRajnigandha50groupsecretkey",
           
        );
        res.status(201).send({ status: true,message:"success",data: token });
    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
};




module.exports = { createUser, loginUser }