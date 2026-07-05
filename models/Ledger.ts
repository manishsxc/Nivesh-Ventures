import { Schema, model, models } from "mongoose";

/**
 * Double-entry ledger system.
 * Every wallet transaction creates one credit entry and one debit entry.
 * debitAccount  = source of funds (e.g., "system", "admin_pool")
 * creditAccount = destination   (e.g., "member:MBR001:referral_wallet")
 */
const LedgerSchema = new Schema(
  {
    // Reference to Transaction document
    transactionId: { type: String, default: "", index: true },
    // Reference to MonthlyClosing document (if applicable)
    closingId: { type: String, default: "", index: true },
    closingMonth: { type: String, default: "", index: true }, // YYYY-MM

    memberId: { type: String, default: "", index: true },
    adminId: { type: String, default: "" }, // if admin-initiated

    // Double-entry accounts
    debitAccount: { type: String, required: true },   // e.g., "system_pool", "admin_pool"
    creditAccount: { type: String, required: true },  // e.g., "member:MBR001:main_wallet"

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["USDT", "INR"], default: "USDT" },
    incomeType: { type: String, default: "" }, // referral_income, withdrawal, etc.
    description: { type: String, default: "" },

    // Balance snapshot at time of entry (for reconciliation)
    memberBalanceBefore: { type: Number, default: null },
    memberBalanceAfter: { type: Number, default: null },
  },
  {
    // Immutable — createdAt only
    timestamps: { createdAt: true, updatedAt: false },
    indexes: [
      { memberId: 1, createdAt: -1 },
      { closingMonth: 1, createdAt: -1 },
      { transactionId: 1 },
    ],
  }
);

export default models.Ledger || model("Ledger", LedgerSchema);
