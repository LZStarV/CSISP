import mongoose from 'mongoose';

const I18nEntrySchema = new mongoose.Schema(
  {
    namespace: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    locale: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'i18n_entries' }
);

export const I18nEntry =
  mongoose.models.I18nEntry || mongoose.model('I18nEntry', I18nEntrySchema);
