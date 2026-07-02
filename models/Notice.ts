import { Schema, model, models } from "mongoose";

const NoticeSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    audience: { type: String, enum: ["all", "specific"], default: "all" },
    targetMemberId: { type: String, default: null },
  },
  { timestamps: true }
);

export default models.Notice || model("Notice", NoticeSchema);
