import { Schema, model } from 'mongoose';

const halloween_logSchema = new Schema(
  {
    server_id: { type: String, required: true },
    member_id: { type: String, required: true },
    cards: { type: Array, default: [] },
    count: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export default model('halloween_log', halloween_logSchema, 'halloween_log');
