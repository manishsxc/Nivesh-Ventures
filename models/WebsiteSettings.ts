import { Schema, model, models } from "mongoose";

const WebsiteSettingsSchema = new Schema(
  {
    key: { type: String, default: "singleton", unique: true },
    websiteName: { type: String, default: "NexaChain" },
    logoUrl: { type: String, default: "/logo.png" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    paymentUsdtAddress: { type: String, default: "" },
    termsUrl: { type: String, default: "" },
    privacyUrl: { type: String, default: "" },
    shareRewardAmount: { type: Number, default: 0 },
    maintenanceMode: { type: Boolean, default: true }, // true = live, false = blocked
    paymentQrUrl: { type: String, default: "" },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifsc: String,
      accountHolder: String,
    },
    pricing: {
      unlockAccessPrice: { type: Number, default: 30 },
      minInvestment: { type: Number, default: 100 },
      minWithdrawal: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

export default models.WebsiteSettings || model("WebsiteSettings", WebsiteSettingsSchema);
