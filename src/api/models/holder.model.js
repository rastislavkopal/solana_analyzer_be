import { Schema, model } from 'mongoose';

/**
 * Holder schema
 * @private
 */
const holderSchema = new Schema({
  walletId: {
    type: String,
    required: true,
    index: true,
    maxLength: 64,
  },
  owns: [
    {
      collectionId: {
        type: Schema.Types.ObjectId,
        ref: 'Collection',
        required: true,
      },
      items_count: Number,
    },
  ],
});

/**
 * @typedef Holder
 */
export default model('Holder', holderSchema);
