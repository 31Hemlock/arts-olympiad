const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");

const ArtworkController = require("./controllers/artwork");
const UserController = require("./controllers/user");
const VotesController = require("./controllers/votes");
const StripeController = require("./controllers/stripe");

const {
  loginUserValidator, registerUserValidator, verifyUserValidator, updateUserValidator,
  generatePresignedValidator, addArtworkValidator, approveArtworkValidator, validationMiddleware,
  forgotPasswordValidator, volunteerUpdateUserValidator, confirmForgotPasswordValidator, resendVerificationValidator
} = require('./validators');

// declare a new express app
const app = express();

// Register this endpoint before adding bodyParser and CORS, as they cause errors
app.post("/api/stripe-webhook", express.raw({type: "application/json"}), StripeController.handleWebhook);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.post("/api/users", registerUserValidator, validationMiddleware, UserController.registerUser);
app.post("/api/login", loginUserValidator, validationMiddleware, UserController.login);
app.post("/api/logout", UserController.logout);
app.post("/api/verify", verifyUserValidator, validationMiddleware, UserController.verifyUser);
app.get("/api/users", UserController.getUser);
app.patch("/api/users", updateUserValidator, validationMiddleware, UserController.updateUser);
app.delete("/api/users", UserController.deleteUser);
app.post("/api/users/presigned-url", generatePresignedValidator, validationMiddleware, ArtworkController.generatePresigned);
app.post("/api/forgot-password", forgotPasswordValidator, validationMiddleware, UserController.forgotPassword);
app.post("/api/confirm-forgot-password", confirmForgotPasswordValidator, validationMiddleware, UserController.confirmForgotPassword);
app.get("/api/auth-status", UserController.getAuthStatus);
app.get("/api/voted", UserController.getUserVoted);
app.post("/api/resend-verification", resendVerificationValidator, validationMiddleware, UserController.sendVerificationEmail);
app.post("/api/refund-user/:userSk", UserController.refundUser);
app.delete("/api/users/user-delete-account", UserController.userDeleteAccount);

app.patch("/api/volunteer/update-user/:userSk", volunteerUpdateUserValidator, validationMiddleware, UserController.volunteerUpdateUser);
app.get("/api/volunteer/auth-status", UserController.getVolunteerAuthStatus);

app.get("/api/artworks", ArtworkController.getArtworks);
app.post("/api/artworks", addArtworkValidator, validationMiddleware, ArtworkController.addArtwork);
app.get("/api/artworks/:artworkSk", ArtworkController.getArtwork);
app.patch("/api/artworks/:artworkSk", approveArtworkValidator, validationMiddleware, ArtworkController.approveArtwork);
app.delete("/api/artworks/:artworkSk", ArtworkController.deleteArtwork);
app.patch("/api/artworks/:artworkSk/votes/increment", ArtworkController.incrementVoteArtwork);
app.patch("/api/artworks/:artworkSk/votes/decrement", ArtworkController.decrementVoteArtwork);
app.patch("/api/vote/:artworkSk", ArtworkController.voteArtwork);

app.get("/api/votes", VotesController.getTotalVotes);


app.listen(3000, function() {
  console.log("App started");
});

module.exports = app;
