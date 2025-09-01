import mongoose from "mongoose"


 const connectDb = async () => {
    try {
        const connetionInstance = await mongoose.connect(`${process.env.MONGO_DB_URI || 'mongodb+srv://e-commerce-db:RQUjAsOmCbzn9D9K@cluster0.9ambul2.mongodb.net/'}`)
        console.log(`\n MongoDB connected: DB HOST: ${connetionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB CONNECTION FAILED !!:", error)
        process.exit(1)
    }
}

export default connectDb