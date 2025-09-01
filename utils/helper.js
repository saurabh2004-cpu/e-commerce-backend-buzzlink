import User from '../models/user.schema.js'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })   //without validation save to database because password is not modified
        return { accessToken, refreshToken }

    } catch (error) {
        throw new error(500, "someonething went wrong while generating refresh and access token")
    }


}

export { generateAccessAndRefreshTokens }
