import { Schema, model } from 'mongoose';

const halloween_podiumSchema = new Schema(
  {
    server_id: { type: String, required: true },
    member_id: { type: String, required: true },
    position: { type: Number },
  },
  { versionKey: false }
);

export default model('halloween_podium', halloween_podiumSchema, 'halloween_podium');
