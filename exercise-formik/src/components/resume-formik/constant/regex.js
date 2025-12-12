export const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}


export const isInternationalPhoneValid = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone)
}


export const isWebsiteValid = (website) => {
    const websiteRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/
    return websiteRegex.test(website)
}

export const isAzerbaijanPhoneValid = (phone) => {
    const phoneAzeRegex = /^(?:\+994|0)(50|51|55|70|77|99|10|60)\d{7}$/
    return phoneAzeRegex.test(phone)
}


export const isPasswordStrong = (password) => {
    // At least 8 characters, one uppercase letter, one lowercase letter, one number and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
}