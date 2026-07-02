import { Schema, model, models } from "mongoose";

const OfferSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, default: "" },
    price: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Offer || model("Offer", OfferSchema);
