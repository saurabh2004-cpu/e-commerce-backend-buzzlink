import express from 'express'
import { config } from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'


config()
const app = express()

//middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(cookieParser())
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(express.json()); // 
app.use(express.urlencoded({ extended: true }));

//routes
import adminRoutes from './routes/admin.routes.js'
import userRoutes from './routes/user.routes.js'
import brandRoutes from './routes/brand.routes.js'
import categoryRoutes from './routes/category.routes.js'
import subCategoryRoutes from './routes/subCategory.routes.js'
import badgeRoutes from './routes/badge.routes.js'
import pricingGroupsRoutes from './routes/pricingGroups.routes.js'
import pricingGroupsDiscountRoutes from './routes/pricingGroupsDiscount.routes.js'
import texRoutes from './routes/tax.routes.js'
import deliveryVendorRoutes from './routes/deliveryVendor.routes.js'
import packsTypesRoutes from './routes/packsTypes.routes.js'
import productroutes from './routes/products.routes.js'
import salesOrderroutes from './routes/salesOrder.routes.js'
import itemBasedDiscountroutes from './routes/itemBasedDiscount.routes.js'



app.use('/api/v1/admin', adminRoutes)

app.use('/api/v1/user', userRoutes)

app.use('/api/v1/brand', brandRoutes)

app.use('/api/v1/category', categoryRoutes)

app.use('/api/v1/subcategory', subCategoryRoutes)

app.use('/api/v1/badge', badgeRoutes)

app.use('/api/v1/pricing-groups', pricingGroupsRoutes)

app.use('/api/v1/pricing-groups-discount', pricingGroupsDiscountRoutes)

app.use('/api/v1/tax', texRoutes)

app.use('/api/v1/delivery-vendor', deliveryVendorRoutes)

app.use('/api/v1/packs-types', packsTypesRoutes)

app.use('/api/v1/products', productroutes)

app.use('/api/v1/sales-order', salesOrderroutes)

app.use('/api/v1/item-based-discount', itemBasedDiscountroutes)


export { app }
