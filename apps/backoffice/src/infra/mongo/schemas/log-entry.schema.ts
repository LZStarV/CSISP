import mongoose from 'mongoose';

const LogEntrySchema = new mongoose.Schema(
  {
    level: { type: String, required: true },
    message: { type: String, required: true },
    traceId: { type: String },
    context: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'log_entries' }
);

export const LogEntry =
  mongoose.models.LogEntry || mongoose.model('LogEntry', LogEntrySchema);
