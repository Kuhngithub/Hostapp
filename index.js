import express from "express";
import session from 'express-session';
import flash from 'connect-flash';
import exphbs from 'express-handlebars';
import helpers from 'handlebars-helpers';
import * as path from "path";
import { fileURLToPath } from "url";
import { body, validationResult } from 'express-validator';
import bodyParser from 'body-parser';
import mongoose from "mongoose";
import multer from "multer";
import bcrypt from "bcryptjs";
import clientSessions from "client-sessions";


const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout : 'main',
  layoutsDir : path.join(__dirname,'views/layouts'),
  helpers : helpers
})

// SET APPS
app.set('view engine', 'hbs');
app.set('views','views');

// USE APPS
app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret : 'hostapp',
    cookie : { maxAge : 6000},
    resave : true,
    saveUninitialized : true
}));
app.use(flash())
// Setup client-sessions
app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "secretKey13574Adef_ca", //
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));


function ensureLogin(req, res, next) {
  if (!req.session.customers) {
    res.redirect("/login");
  } else {
    next();
  }
}

function ensureAdminLogin(req, res, next) {
  if (!req.session.customers) {
    res.redirect("/login");
  } else {
    next();
  }
}

// function confirmCustomersFullname(req, res, next) {
//   const findFullname = customers.find(function(err, fullname){
//     console.log('user details' + fullname);
//   })
//   if(findFullname){
//     console.log('Hnmmm Good!' + findFullname.fullname)
//   }
// }

// SET ROUTERS
app.get('/', ensureLogin , (req, res) => {
  articleCollection.find(function(err,article){
    console.log("article from home page" + article)
    res.render('home', { articles : article, customers: req.session.customers})
  })
})

app.get('/article', (req, res)=>{
    res.render('read_more');
})

app.get('/dashboard', (req, res)=>{
  res.render('dashboard');
})


app.get('/admin', ensureAdminLogin , (req, res)=>{
  articleCollection.find(function(err,article){
    res.render('admin', { articles : article, admin: req.session.customers})
  })
})


app.get('/registration', (req, res)=>{
    res.render('registration')
})

app.get('/login', (req, res)=>{
    res.render('login', { messages: req.flash('message')})
})

//Mongoose DATA BASE (ASSIGNMENT4)
mongoose.connect("mongodb+srv://professorkuhn:Atlas.123@senecaweb.souvhle.mongodb.net/DB1?retryWrites=true&w=majority")

const customers_schema = new mongoose.Schema ({
"fullname" : String,
"phone":  String,
"email" : String,
"company" : String,
"street_address_1" : String,
"city" : String,
"postalcode" : String,
"country" : String,
"tax_id" : String,
"password" : String,
"role" : Boolean
});
const customers = mongoose.model("customers", customers_schema);

// let cust = new customers({
// fullname: "Olakunle Olatunji",
// phone: "6729850399",
// email: "oolatunji6@myseneca.ca",
// company: "Seneca College",
// street_address_1 : "5 Assiniboin Rd",
// city : "North York",
// postalcode : "1245",
// tax_id : "123456",
// password: "web322.123"
// }).save((e, data) => {
// if(e){
//   console.log('the data' + data);
// }else {
//   console.log(data);
// }
// });
//END

// CREATE SCHEMA FOR ARTICLE
const createArticle = new mongoose.Schema ({

  title: String,
  date:  String,
  content : String,
  image : String,
  
});
const articleCollection = mongoose.model("articleCollection", createArticle);



// SERVER-SIDE FORM VALIDATION FOR REGISTRATION
app.post('/registration', 
  body('fullname', 'First Name cannot be empty').notEmpty(),
  body('email', 'Email cannot be empty').notEmpty(),
  body('email', 'Input a valid email Address').isEmail(),
  body('phone', 'Phone cannot be empty').notEmpty(),
  body('phone', 'Numbers only').isInt(),
  body('company_name', 'Company Name cannot be empty').notEmpty(),
  body('street_address_1', 'Street Address cannot be empty').notEmpty(),
  body('city', 'City cannot be empty').notEmpty(),
  body('postcode', 'Postcode cannot be empty').notEmpty(),
  body('country', 'Country Address cannot be empty').notEmpty(),
  body('tax_id', 'Tax Id cannot be empty').notEmpty(),
  body('password', 'Password cannot be empty').notEmpty(),
  body('password', 'Password must be between 6 and 12 characters plus number').isLength({min:6,max:12}),
  body('confirm_password', 'Confirm Password cannot be empty').notEmpty(),

  
  (req,res) => {
    const validation_result = validationResult(req);
    if(validation_result.isEmpty())
    {
      res.redirect('/login');
    }else{
        let sendError = validation_result.array({ onlyFirstError : true });
      req.flash('messages', sendError);
      res.redirect('/registration');
    }


    bcrypt.genSalt(10, function (err, Salt) {
      bcrypt.hash(req.body.password, Salt, function (err, hash) {
        var customerData = new customers({
          fullname : req.body.fullname,
          phone : req.body.phone,
          email : req.body.email,
          street_address_1 : req.body.street_address_1,
          city : req.body.city,
          postalcode: req.body.postalcode,
          country: req.body.country,
          tax_id: req.body.tax_id,
          password: hash,
          role : true
        });
          customerData.save()
          .then(item => {
            console.log(item);
          })
          .catch(err => {
          res.status(400).send("unable to save to database");
          });

          if (err) {
              return console.log('Cannot encrypt');
          }
      });
    })

  }
)

// SERVER-SIDE FORM VALIDATION FOR LOGIN
app.post('/login', 
  body('email', 'Email cannot be empty').notEmpty(),
  body('email', 'Input a valid email Address').isEmail(),
  body('password', 'Password cannot be empty').notEmpty(),
  body('password', 'Password must be between 6 and 12 characters plus number').isLength({min:6,max:12}),

  (req,res) => {
customers.find({email:req.body.email} , function(err,data){
    if(err)
    {
      console.log('this is the error' + err)
      console.log('data is = ' + data)
    }else{
      if(data != ""){
        bcrypt.compare(req.body.password, data[0].password , function(err,result){
          if(result){
            console.log('You are good to go');
            req.session.customers = {
              email: req.body.email,
              password: data[0].password,
              fullname : data[0].fullname,
              role : true
            };
          
            if(req.body.email == 'admin@gmail.com'){
              console.log("data is here" + data)
              res.redirect('/admin');
            }else{
              res.redirect('/');
            }
          }else{
            console.log('password Mismatched');
          }
        });
      }else{
        console.log('Please input a valid Email Address');
      }
    }
  })

  }
)

const storage = multer.diskStorage({
  // destination for files
  destination : function(res,file,cb){
    cb(null, 'public/uploads/')
  },

  // add back the extension
  filename : function(req,file,cb){
    cb(null,Date.now() + file.originalname)
  }
});

// upload parameters for multer
const upload = multer({
  storage : storage,
  limits: {
    fieldSize : 1024 * 1024 * 3,
  }
})

app.post("/admin", upload.single('image'), (req, res) => {
  console.log('content = '+ req.body.content);
  console.log(req.file);
  // if(req.file.mimetype != 'image/png' || req.file.mimetype != 'image/gif' || req.file.mimetype != 'image/jpg'){
  //   console.log('Only Image with an extension of JPG, PNG and GIF are allowed');
  // }
  // console.log('mimetype =' + req.file.mimetype);
  // var myData = new articleCollection(req.body);
  var myData = new articleCollection({
    title : req.body.title,
    date : req.body.date,
    content : req.body.content,
    image : req.file.filename,
  });
  console.log(myData)
    myData.save()
    .then(item => {
      req.flash('articleCreated', 'Created successfully');
      res.redirect('/admin');
      console.log(item);
    })
    .catch(err => {
    res.status(400).send("unable to save to database");
    });
});


// RUN APP ON PORT 3000
// app.listen(3000, console.log('App now running on the view port...'));
app.listen(3000, console.log('App now running on the view port...'));