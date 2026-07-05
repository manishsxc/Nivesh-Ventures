import { Schema, model, models } from "mongoose";

const PinSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    value: { type: Number, default: 30 },
    status: { type: String, enum: ["unused", "used"], default: "unused", index: true },
    type: { type: String, enum: ["paid", "free"], default: "paid", index: true },
    generatedBy: { type: String, default: "admin" },
    usedBy: { type: String, default: null, index: true }, // memberId
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

export default models.Pin || model("Pin", PinSchema);
