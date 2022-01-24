const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const multer = require("multer");
const upload = multer();
const multipart = require("connect-multiparty");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { response } = require("express");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.set("appSecret", "secretforinvoicingapp");

// Multiparty Middleware
const multipartMiddleware = multipart();

// register route
app.post("/register", multipartMiddleware, (req, res) => {
  const { name, email, company_name, password } = req.body;
  if (!(name || email || company_name || password)) {
    return res
      .json({ status: false, message: "All fields are required" });
  }
  const db = new sqlite3.Database("./database/InvoicingApp.db");
  bcrypt.hash(password, saltRounds).then((hash) => {
    const sql = `INSERT INTO users(name, email, company_name, password) VALUES('${name}', '${email}', '${company_name}', '${hash}')`;
    db.run(sql, (err) => {
      if (err) {
        throw new Error(err);
      } else {
        let user_id = this.lastID;
        let query = `SELECT * FROM users WHERE id='${user_id}'`;
        db.all(query, [], (err, rows) => {
          if (err) throw new Error(err);
          let user = rows[0];
          delete user.password;
          // create payload for JWT
          const payload = { user };
          // create token
          let token = jwt.sign(payload, app.get("appSecret"), {
            expiresIn: "24h",
          });
          // send response back to client
          return res.json({ status: true, token: token });
        });
      }
    });
    db.close();
  });
});

// login route
app.post("/login", multipartMiddleware, (req, res) => {
  const db = new sqlite3.Database("./database/InvoicingApp.db");
  const sql = `SELECT * from users where email='${req.body.email}'`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.log("inside err");
      throw new Error(err);
    }
    db.close();
    if (rows.length == 0) {
      // console.log("user not exist");
      return res.json({ status: false, message: "Sorry, wrong email." });
    }
    let user = rows[0];
    bcrypt
      .compare(req.body.password, user.password)
      .then((result) => {
        if (result) {
          console.log(result);
          const payload = { user };
          let token = jwt.sign(payload, app.get("appSecret"), {
            expiresIn: "24h",
          });
          delete user.password;
          return res.status(200).json({ status: "true", user, token });
        }
        return res
          .json({ status: false, message: "Wrong Password. Please retry." });
        // console.log("wrong password")
      })
  });
});

app.use(function (req, res, next) {
  let token =
    req.body.token || req.query.token || req.headers["x-access-token"];
  if (token) {
    jwt.verify(token, app.get("appSecret"), (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token.",
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: "No token provided.",
    });
  }
});

app.post("/sendmail", multipartMiddleware, async (req, res) => {
  let sender = JSON.parse(req.body.user);
  let recipient = JSON.parse(req.body.recipient);
  console.log(sender.id)
  console.log(recipient.name)
  let testAccount = await nodemailer.createTestAccount()
  // console.log(testAccount)
  let mailOptions = {
    from: "<foo@example.com>",
    to: recipient.email,
    subject: `Hi, ${recipient.name}. Here's an Invoice from ${sender.company_name}`,
    text: `You owe ${sender.company_name}`,
  };
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  })
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
      return res
        .json({ message: `Error sending mail to ${recipient.name}` });
    } else {
      return res
        .status(200)
        .json({ message: `Email sent to ${recipient.name}` });
    }
  });
});

// POST invoice route
app.post("/invoice", multipartMiddleware, (req, res) => {
  let txn_names = req.body.txn_names.split(",")
  let txn_prices = req.body.txn_prices.split(",")

  if (req.body.name == "") {
    return res
      .json({ status: false, message: "Invoice needs a name." });
  }
  const db = new sqlite3.Database("./database/InvoicingApp.db");
  let sql = `INSERT INTO invoices(name, user_id, paid) VALUES('${req.body.name}', '${req.body.user_id}', '0')`;
  db.serialize(function () {
    db.run(sql, function (err) {
      if (err) {
        return res.json({
          status: false, message: "Sorry, there was an error creating your invoice :("
        })
      }
      let invoice_id = this.lastID;
      for (let i = 0; i < txn_names.length; i++) {
        let query = `INSERT INTO transactions(name, price, invoice_id) VALUES('${txn_names[i]}', '${txn_prices[i]}', '${invoice_id}')`;
        db.run(query, (err) => {
          if(err) {
            return res.json({status: false, message: "Sorry, there was an error creating your invoice :("})
          }
        });
      }
      return res
        .status(201)
        .json({ status: false, message: "Invoice created." });
    });
  });
});

// get /invoice/user/{user_id}
app.get("/invoice/user/:user_id", multipartMiddleware, (req, res) => {
  const db = new sqlite3.Database("./database/InvoicingApp.db");
  let sql = `SELECT * FROM invoices WHERE user_id='${req.params.user_id}' ORDER BY invoices.id`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw new Error(err);
    }
    return res.status(200).json({ status: true, invoices: rows });
  });
});

// get /invoice/user/{user_id}/{invoice_id}
app.get(
  "/invoice/user/:user_id/:invoice_id",
  multipartMiddleware,
  (req, res) => {
    const db = new sqlite3.Database("./database/InvoicingApp.db");
    let sql = `SELECT * FROM invoices LEFT JOIN transactions ON invoices.id=transactions.invoice_id WHERE user_id='${req.params.user_id}' AND invoice_id='${req.params.invoice_id}' ORDER BY transactions.id`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        throw new Error(err);
      }
      return res.status(200).json({ status: true, transactions: rows });
    });
  }
);

app.get("/", (req, res) => {
  res.send("Welcome To Invoicing App.");
});

app.listen(PORT, () => {
  console.log(`App running on localhost:${PORT}`);
});
