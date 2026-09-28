const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    ownerName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    businessEmail: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9+()\-\s]{7,20}$/
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    productionCapacity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: "Production capacity must be a whole number"
        }
    },
    gstNumber: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true,
        minlength: 5,
        maxlength: 20,
        match: /^[A-Z0-9]+$/
    },
    accountHolderName: {
        type: String,
        trim: true,
        minlength: 2,
        select: false
    },
    accountNumber: {
        type: String,
        trim: true,
        match: /^\d{9,18}$/,
        select: false
    },
    ifscCode: {
        type: String,
        uppercase: true,
        trim: true,
        match: /^[A-Z]{4}0[A-Z0-9]{6}$/,
        select: false
    },
    fssaiCertificate: {
        type: String,
        select: false
    },
    gstCertificate: {
        type: String,
        select: false
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ["customer", "supplier", "admin"],
        default: "supplier"
    },
    isActive: {
        type: Boolean,
        default: false
    },
    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "removed", "suspended"],
        default: "pending"
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    removedAt: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    payoutEnabled: {
        type: Boolean,
        default: false
    },
    payoutStatus: {
        type: String,
        enum: ["not_eligible", "pending", "processing", "processed", "failed"],
        default: "not_eligible"
    },
    payoutOnboardingStatus: {
        type: String,
        enum: ["not_started", "pending", "verified", "failed"],
        default: "not_started"
    },
    razorpayLinkedAccountId: {
        type: String,
        default: null
    },
    bankAccountLast4: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Supplier", supplierSchema);