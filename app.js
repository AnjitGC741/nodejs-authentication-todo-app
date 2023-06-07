const express = require("express");
const bodyParser = require("body-parser");
const getConnection = require("./config/db");
const helmet = require("helmet");
const session = require("express-session");

// init
const app = express();
app.use(helmet());
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("Public"));
const conn = getConnection();
app.use(
  session({
    name: "todo task",
    resave: false,
    saveUninitialized: true,
    secret: "this-is-very-secret",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //for one day
    },
  })
);

//middleware
app.use("/", (req, res, next) => {
  req.conn = conn;
  next();
});

// router
app.get("/", (req, res) => {
  res.render("login", { error: "" });
});

app.post("/login", function (req, res) {
  var emailValue = req.body.email;
  var passwordValue = req.body.password;
  if (emailValue === "" || passwordValue === "") {
    res.render("login", { error: "Empty Fields!!" });
  }
  req.conn.query(
    "SELECT * FROM users WHERE email=$1 AND password=$2",
    [emailValue, passwordValue],
    (error, result) => {
      if (error) {
        res.status(500).send("Cannot perform action");
      } else {
        if (result.rows.length === 0) {
            res.render("login", { error: "Incorrect Information!!" });
        }
           else {
            req.session.isloggedin = true;
            res.redirect("/task");
          }
        }
      }
  );
});

app.get("/task", (req, res) => {
  if(req.session.isloggedin){
    req.conn.query("SELECT * FROM todo", (error, result) => {
        if (error) {
          res.status(500).send("Cannot fetch the data");
        }
        res.render("index", { tasks: result.rows });
      });
  }
  else{
  res.render("login", { error: "" });
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.idValue;
  req.conn.query("delete from todo where id=$1", [id], (error, result) => {
    if (error) {
      res.status(500).send("Cannot delete the value");
    }
    res.redirect('/task');
  });
});

app.post("/add-task", (req, res) => {
  const task = req.body.task;
  const id = Math.floor(Math.random() * 100) + 1;
  req.conn.query(
    "insert into todo (id,task) values ($1,$2)",
    [id, task],
    (error, result) => {
      if (error) {
        res.status(500).send("Cannot add the value");
      }
      res.redirect('/task');
    }
  );
});

app.get("/logout",function(req,res){
    req.session.destroy();
    res.redirect('/');
  })

// starting server
app.listen(8005, () => {
  console.log("Server is starting in 8005");
});
