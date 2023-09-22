const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
let db = null;
const initializedDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message};`);
    process.exit(1);
  }
};

initializedDBAndServer();

app.post(`/register`, async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUsernameQuery = `SELECT * FROM user WHERE username='${username}';`;
  const getUsername = await db.get(selectUsernameQuery);

  if (getUsername === undefined) {
    const passwordLength = password.length;
    const hashedPassword = await bcrypt.hash(password, 10);
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUserDataInsertQuery = `INSERT INTO user(username,password,gender,location)
           VALUES('${username}','${hashedPassword}','${gender}','${location}');`;
      const dbUser = await db.run(newUserDataInsertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post(`/login`, async (request, response) => {
  const { username, password } = request.body;
  const getUsernameQuery = `SELECT * FROM user WHERE username='${username}'`;
  const getUsername = await db.get(getUsernameQuery);
  if (getUsername === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      getUsername.password
    );
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put(`/change-password`, async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUsernameQuery = `SELECT * FROM user WHERE username='${username}';`;
  const getUsername = await db.get(getUsernameQuery);
  if (getUsername === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      getUsername.password
    );
    if (isPasswordMatched === true) {
      const newPasswordLength = newPassword.length;
      if (newPasswordLength >= 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user SET password='${hashedPassword}' WHERE username='${username}';`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
