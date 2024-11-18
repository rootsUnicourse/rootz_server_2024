import mongoose from 'mongoose';

const companySchema = mongoose.Schema({
    image: String,
    title: String,
    discount: String,
    clickCount: {
        type: Number,
        default: 0
    },
    siteUrl: String,
    description: String,
})

const CompanyObject = mongoose.model('CompanyObject', companySchema);

export default CompanyObject;