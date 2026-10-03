const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    enum: [
      'Food & Dining',
      'Shopping',
      'Transport',
      'Bills & Utilities',
      'Entertainment',
      'Income',
      'Other'
    ],
    default: 'Other'
  },
  merchant: {
    type: String,
    trim: true,
    default: 'General'
  },
  type: {
    type: String,
    enum: ['expense', 'income'],
    default: 'expense'
  },
  rawInput: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
