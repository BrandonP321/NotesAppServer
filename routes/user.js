const router = require('express').Router();
const mongoose = require("mongoose");
const db = require('../models');

router.get("/users", (req, res) => {
    db.User.find({}, (err, data) => {
        res.json(data).end();
    })
})

router.get("/user/login", (req, res) => {
    const { email, password } = req.body;

    db.User.findOne({ email: email }, async (err, user) => {
        // if no user found, send status 401 for incorrect email or password
        if (!user) return res.status(401).send("Incorrect email or password");

        // validate password give by user
        const isValidPassword = await user.validatePassword(password);
        // if password is incorrect, send status 401 for incorrect email or password
        if (!isValidPassword) return res.status(401).send("Incorrect email or password");

        // otherwise password is correct and user can be logged in
        const userObj = { id: user._id, email: user.email, fullName: user.fullName }
        res.json(userObj).end();
    })
})

router.post("/user/account/create", (req, res) => {
    db.User.create(req.body, (err, data) => {
        if (err) {
            const missingProperties = err.errors;
            const isEmailTaken = err.keyValue && err.keyValue.email;
            
            if (missingProperties) {
                // get all missing properties due to them being required fields by the db
                const missingPropertiesKeys = Object.keys(missingProperties).filter(p => missingProperties[p].kind === "required");
                if (missingPropertiesKeys.length > 0) {
                    // send missing property to client to alert user
                    // TODO: Refine error status codes
                    return res.status(401).json({ missingProperty: missingPropertiesKeys[0] });
                } else {
                    // if for some reason a missing property couldn't be found even though it should have been, send general 500 status
                    return res.status(500).send("An error has occurred while creating a new account");
                }
            } else if (isEmailTaken) {
                return res.status(402).send("Email Taken");
            } else {
                // else send stats 500 if some other unknown error shows up
                return res.status(500).send("An error has occurred while creating a new account");
            }
        }

        res.json(data).end();
    })
})

module.exports = router;