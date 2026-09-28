const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
            index: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        status: {
            type: String,
            enum: ["open", "in-progress", "resolved"],
            default: "open",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SupportRequest", supportRequestSchema);
