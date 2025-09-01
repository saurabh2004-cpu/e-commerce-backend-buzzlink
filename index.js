
import { app } from "./app.js";
import connectDb from "./Db/db.js";
import dotenv from "dotenv";
dotenv.config();
const port  = process.env.PORT || '3000'

connectDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running at PORt: ${process.env.PORT}`);
        })

        app.on("error", (error) => {
            console.log("error", error)
            throw error
        })

    })
    .catch((error) => {
        console.log("MONGO db connection failed !!", error)
    })

