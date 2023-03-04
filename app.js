require("dotenv").config();
require("./config/db").connect();
const express = require("express");
const User = require("./model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());

// Routes goes here

app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!(email && password && username)) {
            res.status(400).send("All input is required!");
        }
        const oldUser = await User.findOne({email});
        if (oldUser){
            return res.status(409).send("User Already Exists. Please Login")
        }

        // Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in db
        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password: encryptedPassword,
        });

        // Create token
        const token = jwt.sign(
            { user_id: user._id, email},
           ` ${process.env.TOKEN_SECRET}`,
            {
                expiresIn: "2h",
            }
        );
        // save user token
        user.token = token;

        // return new user
        res.status(201).json(user);
    } catch (error) {
        console.log(error)
    }
});

app.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body;

        // validate user input
        if (!(email, password)) {
            res.status(400).send("All input is required")
        }

        // validate if user exists in the db
        const user = await User.findOne({email});

        if (user && (await bcrypt.compare(password, user.password))) {
            // create token
            const token = jwt.sign(
                {user_id: user._id, email},
                ` ${process.env.TOKEN_KEY}`,
                {
                    expiresIn: "2h",
                }
            );

            // save user token
            user.token = token;

            // user
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");

    } catch (err) {
        console.log(err)
    }
});

app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome!")
});


module.exports = app;