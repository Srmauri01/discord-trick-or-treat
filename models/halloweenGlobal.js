import { Schema, model } from 'mongoose';

const halloweenGlobalSchema = new Schema(
  {
    tag: { type: String, required: true },
    interval_time_min: { type: Number, default: 60000 },
    interval_time_max: { type: Number, default: 120000 },
  },
  { versionKey: false }
);

export default model('halloweenGlobal', halloweenGlobalSchema, 'halloweenGlobal');
