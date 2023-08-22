import { Schema, model } from 'mongoose';

const halloweenLocalSchema = new Schema(
  {
    server_id: { type: String, required: true },
    status: { type: Boolean, default: false },
    channel: { type: String, default: null },
    time_catch: { type: Number, default: 10000 },
  },
  { versionKey: false }
);

export default model('halloweenLocal', halloweenLocalSchema, 'halloweenLocal');
