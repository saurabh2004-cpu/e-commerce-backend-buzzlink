import mongoose from "mongoose";

const SalesOrderSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    documentNumber: {
        type: String,
        required: true,
        index: true
    },
    customerName: {
        type: String,
        required: true
    },
    salesChannel: {
        type: String,
        enum: ['Online', 'Email', 'Metcash ChargeThrough'],
        required: true
    },
    trackingNumber: {
        type: String,
        default: null
    },
    shippingAddress: {
        type: String,
        required: true
    },
    billingAddress: {
        type: String,
        required: true
    },
    customerPO: {
        type: String,
        default: null
    },
    itemSku: {
        type: String,
        required: true
    },
    packQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    amount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate final amount before saving
SalesOrderSchema.pre('save', function (next) {
    if (this.packQuantity && this.quantity) {
        const total = this.packQuantity * this.quantity;
        this.finalAmount = total * this.amount;
    }
    next();
});


// Index for better query performance
SalesOrderSchema.index({ documentNumber: 1 });
SalesOrderSchema.index({ date: 1 });
SalesOrderSchema.index({ customerName: 1 });
SalesOrderSchema.index({ itemSku: 1 });

const SalesOrder = mongoose.model('SalesOrder', SalesOrderSchema);

export default SalesOrder;