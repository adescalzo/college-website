import express from 'express';
import bcrypt from 'bcryptjs';
import dataAccess from '../config/data-access';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const router = express.Router();
const { MY_APPLICATION_NAME } = process.env;

const ads = [
    { title: `Hello, world. From ${MY_APPLICATION_NAME}` }
];

router.get("/hello", async (req, res) => {
    res.status(200).send(ads);
});

router.post("/register", async (req, res) => {

  // Our register logic starts here
    try {
      // Get user input
      const { first_name, last_name, email, password } = req.body;
  
      // Validate user input
      if (!(email && password && first_name && last_name)) {
        res.status(400).send("All input is required");
      }

      // check if user already exist. Validate if user exist in our database
      const resultUsers = await dataAccess.query(`SELECT * FROM Users WHERE Email = @email`, [
        { name: 'email', value: email }
      ]);
      const oldUser = resultUsers.recordset.length ? resultUsers.recordset[0] : null;
  
      if (oldUser) {
        return res.status(409).send("User Already Exist. Please Login");
      }
  
      //Encrypt user password
      const encryptedPassword = await bcrypt.hash(password, 10);
  
      // Create user in our database
      const result = await dataAccess.queryEntity(
        `   INSERT INTO Users (Email, Password, FirstName, LastName)
            OUTPUT inserted.Id
            VALUES (@email, @password, @first_name, @last_name);
        `, { first_name, last_name, email: email.toLowerCase(), password: encryptedPassword }
      );

      const user = req.body;
      user.id = result.recordset[0].Id;
  
      // Create token
      const token = jwt.sign(
        { user_id: user.id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // return user information
      res.status(201).json({
        id: user.id,
        token,
        email
      });

    } catch (err) {
      console.log(err);
    }
});

router.post("/login", async (req, res) => {

    try {
        // Get user input
        const { email, password } = req.body;

        // Validate user input
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }
        
        // Validate if user exist in our database
        const result = await dataAccess.query(`SELECT * FROM Users WHERE Email = @email`, [
          { name: 'email', value: email }
        ]);

        const user = result.recordset.length ? result.recordset[0] : null;
        console.log(user);


        if (user && (await bcrypt.compare(password, user.Password))) {
            // Create token
            const token = jwt.sign(
                { 
                    user_id: user.Id, email 
                },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );

            // user
            res.status(200).json({
              token,
              email: user.Email,
              password
            });

            return;
        }

        res.status(400).send("Invalid Credentials");        
      } catch (err) {
        console.log(err);
    }
});


export default router;