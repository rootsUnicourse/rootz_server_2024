import mongoose from "mongoose";

const siteStatsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ["siteVisits"], // Add additional keys here if needed
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

export default mongoose.model("SiteStats", siteStatsSchema);
