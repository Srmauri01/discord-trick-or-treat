import { Schema, model } from 'mongoose';

const setsupportSchema = new Schema(
  {
    id: { type: String, require: true },
    server_id: { type: String, require: true },
    name: { type: String, require: true },
    emoji: { type: Array, require: true },
    alias: { type: String, default: null },
    status_logdm: { type: Boolean, default: false },
    channel_log: { type: String, default: null },
    enabled: { type: Boolean, default: false },
    category_id: { type: String, default: null },
    permissions: { type: Array, default: [] },
  },
  { versionKey: false }
);

export default model('setsupport', setsupportSchema, 'setsupport');
