if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
//const { reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const userRouter=require("./routes/user.js");
const {isLoggedIn, isOwner} = require("./middleware.js");
const multer  = require('multer')
const {storage} = require("./cloudconfig.js");
const upload = multer({ storage });


const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to DB");
})
.catch(err => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}
app.engine("ejs", ejsMate);
app.set("view engine","ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());

const store= MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});
store.on("error", () => {
    console.log("Error in Mongo session store",err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    },
};

// app.get("/", (req, res) => {
//     res.send("hi, i m root");
// });


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.currUser= req.user;
    next();
});

app.use("/", userRouter);

// app.get("/demouser", async(req, res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:"delta-student"
//     });

//     let registeredUser= await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// });


//const validateReview = (req, res, next) => {
 //   let { error } = reviewSchema.validate(req.body);
   // if (error) {
    //    let errMsg = error.details.map((el) => el.message).join(",");
       // throw new Error(errMsg);
   // } else {
   //     next();
   // }
//};

//INDEX ROUTE
//   app.get("/listings", upload.single("listing[image]"), async (req, res)=>{
//     let url=req.file.path;
//     let filename=req.file.filename;
//     console.log(url,"..", filename);
//    const allListings = await Listing.find({});
// res.render("listings/index.ejs", {allListings});
// });
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
});
app.post("/listings", isLoggedIn, upload.single("listing[image][url]"), async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
});

//New Route
app.get("/listings/new", isLoggedIn,(req, res)=>{
    res.render("listings/new.ejs");
});



//show Route
app.get("/listings/:id", async(req, res)=> {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({ path:'reviews',
        populate:{
        path:'author'

    },
    })
    .populate('owner');
    if (!listing) {
    return res.status(404).send("Listing not found");
  }
    res.render("listings/show", { listing });
});


//Create Route
app.post("/listings", isLoggedIn,
    async (req, res, next)=>{
         const newListing = new Listing(req.body.listing);
         newListing.owner=req.user._id;
    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
    })
;


// EDIT ROUTE
app.get("/listings/:id/edit",isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

// UPDATE ROUTE
app.put("/listings/:id",isLoggedIn, isOwner, upload.single("listing[image][url]"), async (req, res) => {
  let { id } = req.params;
  let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if(typeof req.file !=="undefined"){
  let url= req.file.path;
  let filename= req.file.filename;
  listing.image={url,filename};
  await listing.save();
  }
  req.flash("success","Update Listing Created!");
  res.redirect(`/listings/${id}`);
});

// DELETE ROUTE
app.delete("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success","Listing Deleted!");
  res.redirect("/listings");
});

//REVIEW ROUTE
//post route
app.post("/listings/:id/reviews", async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success","New Review Created!");

    res.redirect(`/listings/${listing._id}`);

});
//review route
//delete route
app.delete("/listings/:id/reviews/:reviewId",isLoggedIn, async(req, res) => {
    let{ id,reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted!");

    res.redirect(`/listings/${id}`);
});




// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "my home",
//         description: "by the red fort",
//         price: 1200,
//         location: "new delhi",
//         country: "India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });
app.post("/chatbot", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "Message is missing." });
  }

  let reply = "Sorry, I didn't understand that.";

  if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
    reply = "Hello! I'm Trip bot, How can I help you today?";
  } else if (message.toLowerCase().includes("price")) {
    reply = "Our prices start from ₹1,000 per night.";
  } else if (message.toLowerCase().includes("book")) {
    reply = "You can book a listing by clicking on it and filling out the form.";
  }

  res.json({ reply });
});


app.listen(8080, () => {
    console.log("server is listening to port 8080");
});