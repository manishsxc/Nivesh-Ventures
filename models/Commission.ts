import { Schema, model, models } from "mongoose";

const CommissionSchema = new Schema(
  {
    key: { type: String, default: "singleton", unique: true },
    level1: { type: Number, default: 5 },
    level2: { type: Number, default: 3 },
    level3: { type: Number, default: 2 },
    level4: { type: Number, default: 1 },
    level5: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default models.Commission || model("Commission", CommissionSchema);
