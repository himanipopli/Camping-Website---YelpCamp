//Start
var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    session = require("express-session"),
    methodOverride = require("method-override"),
    middleware = require("./middleware");
    
mongoose.connect("mongodb://localhost/yelpcamp", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride('_method'));


// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "This is going to be Awesome!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

app.get("/", function (req, res) {
    res.render("landing");
});

//==========================
// CAMPGROUND ROUTES
//==========================
// display all campgrounds
app.get("/campgrounds", function (req, res) {
    Campground.find({}, function (err, campgrounds) {
        res.render("campgrounds/index", { campgrounds: campgrounds });
    });
});


// add new campground form
app.get("/campgrounds/new",middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new");
});

//add new campground to db
app.post("/campgrounds", middleware.isLoggedIn, function (req, res) {
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newCampground = { name: name, image: image, description: desc, author: author }
    Campground.create(newCampground, function (err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/campgrounds");
        }
    });
});
// shows more info about one campground
app.get("/campgrounds/:id", function (req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/show", { campground: foundCampground });
        }
    });
});

app.get("/campgrounds/:id/edit", middleware.checkUserCampground, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/edit", { campground: foundCampground });
        }
    });
});

app.put("/campgrounds/:id", function (req, res) {
    var newData = { name: req.body.name, image: req.body.image, description: req.body.desc };
    Campground.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, campground) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

app.delete("/campgrounds/:id", middleware.checkUserCampground, function (req, res) {
    Campground.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/campgrounds");
        }
    })
});


//===================
// COMMENT ROUTES
//===================
app.get("/campgrounds/:id/comments/new", middleware.isLoggedIn, function (req, res) {
    console.log(req.params.id);
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", { campground: campground });
        }
    })
});

app.post("/campgrounds/:id/comments", middleware.isLoggedIn, function (req, res) {
    console.log(req.params.id);
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect('/campgrounds/' + campground._id);
                }
            });
        }
    });
});

app.get("/campgrounds/:id/comments/:commentId/edit", middleware.isLoggedIn, function (req, res) {
    Comment.findById(req.params.commentId, function (err, comment) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/edit", { campground_id: req.params.id, comment: comment });
        }
    })
});

app.put("/campgrounds/:id/comments/:commentId", function (req, res) {
    Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function (err, comment) {
        if (err) {
            res.render("edit");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

app.delete("/campgrounds/:id/comments/:commentId", middleware.checkUserComment, function (req, res) {
    Comment.findByIdAndRemove(req.params.commentId, function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});




//==========================
//      AUTH ROUTES
//==========================

// show register form
app.get("/register", function (req, res) {
    res.render("register");
});

//handle sign up logic
app.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/campgrounds");
        });
    });
});

//show login form
app.get("/login", function (req, res) {
    res.render("login");
});

//handling login logic
app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function (req, res) {
    });

// logout route
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/campgrounds");
});

app.listen(3000, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started!");
});
//End
