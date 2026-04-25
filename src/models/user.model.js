import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // optimal: Add an index for faster queries/searches
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [{
            type: Schema.Types.ObjectId,
            ref: "Video",
        }],
        password: {
            type: String, //encrypted password
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// middleware to hash password before saving user, also handles password updates, if password is modified or new user is created then hash it, otherwise skip hashing, check if condition

// callback gets complex here
// userSchema.pre("save", async function (next) {
//     if (!this.isModified("password")) {
//         return next(); // skip hashing if password is not modified
//     }
//     this.password = await bcrypt.hash(this.password, 10);
//     next(); //runs every time 
//     // only when password is modified or new user is created then do it, otherwise skip hashing, check if condition
// });
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// method to compare password during login
userSchema.methods.isPasswordCorrect = async function (passwordEntered) {
    return await bcrypt.compare(passwordEntered, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign( // payload, secret, options
        { _id: this._id, username: this.username, email: this.email, fullname: this.fullname },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id}, // refresh token have less info
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}

export const User = mongoose.model("User", userSchema);