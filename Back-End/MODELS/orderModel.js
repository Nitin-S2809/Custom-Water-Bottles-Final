const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    bottleType: {
      type: String,
      enum: ["250ml", "500ml", "1000ml", "2000ml"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    brandName: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    printing: {
      type: String,
      default: "Single Color Logo",
    },

    logoUrl: {
      type: String,
      default: "",
    },

    specialInstructions: {
      type: String,
      maxlength: 200,
      default: "",
    },

    pricing: {
      unitPrice: {
        type: Number,
        required: true,
      },
      subtotal: {
        type: Number,
        required: true,
      },
      shipping: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "in-production",
        "ready",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    deliveryStatus: {
      type: String,
      enum: ["pending", "ready", "shipped", "out-for-delivery", "completed"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "captured"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
      select: false,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    deliveryOtpHash: {
      type: String,
      default: null,
      select: false,
    },

    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
    },

    deliveryOtpAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryOtpVerifiedAt: {
      type: Date,
      default: null,
    },

    deliveryOtpGeneratedAt: {
      type: Date,
      default: null,
    },

    supplierPayoutStatus: {
      type: String,
      enum: ["not_eligible", "pending", "processing", "processed", "failed"],
      default: "not_eligible",
    },

    supplierPayoutId: {
      type: String,
      default: null,
    },

    supplierPayoutAmount: {
      type: Number,
      default: 0,
    },

    supplierPayoutInitiatedAt: {
      type: Date,
      default: null,
    },

    supplierPayoutCompletedAt: {
      type: Date,
      default: null,
    },

    supplierPayoutFailedAt: {
      type: Date,
      default: null,
    },

    supplierPayoutFailureReason: {
      type: String,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);