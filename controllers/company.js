import CompanyObject from "../modules/company.js"


export const getCompanies = async (req, res) => {
    try {
        const companys = await CompanyObject.find();
        res.status(200).json(companys)
    } catch (error) {
        res.status(404).json({ message: error.message })
    }
}

export const getCompanyBySearch = async (req, res) => {
    const { searchQuery } = req.query;
    try {
        const regex = new RegExp(searchQuery, "i"); // 'i' for case-insensitive
        const companies = await CompanyObject.find({ title: regex });
        res.status(200).json(companies); // Return the array directly
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};


export const createCompany = async (req, res) => {
    const company = req.body;
    const newCompany = new CompanyObject(company);
    try {
        await newCompany.save();
        res.status(201).json(newCompany)
    } catch (error) {
        ews.status(409).json({ message: error.message })
    }
}

export const getCompanyByUrl = async (req, res) => {
    let { url } = req.body;
    url = new URL(url).origin;  // This will remove extra parameters

    try {
        const company = await CompanyObject.findOne({ siteUrl: { $regex: url, $options: 'i' } });
        if (company) {
            res.status(200).json(company)
        } else {
            res.status(404).json({ message: "Company not found" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


