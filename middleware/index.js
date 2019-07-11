var Comment = require("../models/comment");
var Campground = require("../models/campground");
module.exports = {
    isLoggedIn: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        res.redirect("/login");
    },
    checkUserCampground: function(req, res, next){
        if(req.isAuthenticated()){
            Campground.findById(req.params.id, function(err, campground){
               if(campground.author.id.equals(req.user._id)){
                   next();
               } else {
                   res.redirect("/campgrounds/" + req.params.id);
               }
            });
        } else {
            res.redirect("/login");
        }
    },
    checkUserComment: function(req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.commentId, function(err, comment){
               if(comment.author.id.equals(req.user._id)){
                   next();
               } else {
                   res.redirect("/campgrounds/" + req.params.id);
               }
            });
        } else {
            res.redirect("login");
        }
    }
}