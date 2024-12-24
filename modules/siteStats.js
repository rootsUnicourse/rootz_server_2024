import mongoose from "mongoose";

const siteStatsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: ["siteVisits"] },
    value: { type: Number, default: 0, min: 0 },
    visitors: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // For logged-in users
        userName: { type: String, default: null }, // For new visitors
        userEmail: { type: String, default: null },
        location: { type: String, default: null }, // Visitor location
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("SiteStats", siteStatsSchema);

