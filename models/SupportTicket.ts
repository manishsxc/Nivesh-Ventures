import { Schema, model, models } from "mongoose";

const SupportTicketSchema = new Schema(
  {
    memberId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    replies: [
      {
        from: { type: String, enum: ["member", "admin"] },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default models.SupportTicket || model("SupportTicket", SupportTicketSchema);
