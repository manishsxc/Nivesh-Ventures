import { Schema, model, models } from "mongoose";

const BusinessRuleSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ["referral", "matching", "returns", "rewards", "booster", "general"],
    },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    value: { type: Schema.Types.Mixed, required: true }, // number | string | boolean
    type: { type: String, enum: ["number", "string", "boolean", "percentage"], default: "number" },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    unit: { type: String, default: "" }, // e.g., "%", "$", "days"
    isEditable: { type: Boolean, default: true },
    updatedBy: { type: String, default: "system" },
    // Version history — last 10 changes
    history: [
      {
        previousValue: { type: Schema.Types.Mixed },
        changedBy: { type: String },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

export default models.BusinessRule || model("BusinessRule", BusinessRuleSchema);
