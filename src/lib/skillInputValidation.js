export const SKILL_INPUT_LIMITS = {
    skillNameMaxLength: 100,
    descriptionMaxLength: 4000,
    refinementInstructionMaxLength: 2000,
    previousMarkdownMaxBytes: 1024 * 1024,
    maxImages: 4,
    maxImageBytes: 5 * 1024 * 1024,
    maxCombinedImageBytes: 12 * 1024 * 1024,
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']

const ERROR_MESSAGES = {
    skillNameRequired: 'Skill name is required.',
    skillNameTooLong: `Skill name must be ${SKILL_INPUT_LIMITS.skillNameMaxLength} characters or fewer.`,
    descriptionTooLong: `Description must be ${SKILL_INPUT_LIMITS.descriptionMaxLength} characters or fewer.`,
    refinementTooLong: `Refinement instruction must be ${SKILL_INPUT_LIMITS.refinementInstructionMaxLength} characters or fewer.`,
    markdownTooLarge: 'Previous markdown is too large.',
    tooManyImages: `You can upload up to ${SKILL_INPUT_LIMITS.maxImages} reference images.`,
    imageTooLarge: 'Each reference image must be 5MB or smaller.',
    imagesTooLarge: 'Combined reference images must be 12MB or smaller.',
    unsupportedImageType: 'Only PNG, JPEG, and WEBP images are supported.',
    malformedImage: 'Reference image data is malformed.',
    duplicateImage: 'That image has already been added.',
}

function trimmedString(value) {
    return typeof value === 'string' ? value.trim() : ''
}

function byteLength(value) {
    return new TextEncoder().encode(typeof value === 'string' ? value : '').length
}

function imageError(message, status = 400) {
    return { message, status }
}

function isValidBase64(base64) {
    if (!base64 || base64.length % 4 !== 0) return false

    const firstPadding = base64.indexOf('=')
    const contentEnd = firstPadding === -1 ? base64.length : firstPadding
    const padding = firstPadding === -1 ? '' : base64.slice(firstPadding)

    if (padding && padding !== '=' && padding !== '==') return false

    for (let i = 0; i < contentEnd; i += 1) {
        const code = base64.charCodeAt(i)
        const isUpper = code >= 65 && code <= 90
        const isLower = code >= 97 && code <= 122
        const isDigit = code >= 48 && code <= 57
        if (!isUpper && !isLower && !isDigit && base64[i] !== '+' && base64[i] !== '/') {
            return false
        }
    }

    return true
}

export function parseImageDataUri(dataUri) {
    if (typeof dataUri !== 'string') {
        return { isValid: false, error: imageError(ERROR_MESSAGES.malformedImage) }
    }

    const match = dataUri.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/)
    if (!match) {
        return { isValid: false, error: imageError(ERROR_MESSAGES.malformedImage) }
    }

    const mimeType = match[1].toLowerCase()
    const base64 = match[2]

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
        return { isValid: false, error: imageError(ERROR_MESSAGES.unsupportedImageType, 415) }
    }

    if (!isValidBase64(base64)) {
        return { isValid: false, error: imageError(ERROR_MESSAGES.malformedImage) }
    }

    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
    const size = Math.floor((base64.length * 3) / 4) - padding

    return { isValid: true, mimeType, size }
}

export function validateImageFile(file, existingImages = []) {
    const errors = []

    if (!file || !ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        errors.push(ERROR_MESSAGES.unsupportedImageType)
    }

    if (file?.size > SKILL_INPUT_LIMITS.maxImageBytes) {
        errors.push(ERROR_MESSAGES.imageTooLarge)
    }

    if (existingImages.length + 1 > SKILL_INPUT_LIMITS.maxImages) {
        errors.push(ERROR_MESSAGES.tooManyImages)
    }

    const duplicate = existingImages.some((image) => (
        image.fileName === file?.name && image.size === file?.size
    ))
    if (duplicate) {
        errors.push(ERROR_MESSAGES.duplicateImage)
    }

    const existingSize = existingImages.reduce((total, image) => total + (image.size || 0), 0)
    if (existingSize + (file?.size || 0) > SKILL_INPUT_LIMITS.maxCombinedImageBytes) {
        errors.push(ERROR_MESSAGES.imagesTooLarge)
    }

    return { isValid: errors.length === 0, errors }
}

export function validateImages(images = []) {
    const errors = []
    let status = 400

    if (!Array.isArray(images)) {
        return { isValid: false, errors: [ERROR_MESSAGES.malformedImage], status }
    }

    if (images.length > SKILL_INPUT_LIMITS.maxImages) {
        return { isValid: false, errors: [ERROR_MESSAGES.tooManyImages], status: 413 }
    }

    let totalSize = 0
    for (const image of images) {
        const parsed = parseImageDataUri(image)
        if (!parsed.isValid) {
            return { isValid: false, errors: [parsed.error.message], status: parsed.error.status }
        }

        if (parsed.size > SKILL_INPUT_LIMITS.maxImageBytes) {
            return { isValid: false, errors: [ERROR_MESSAGES.imageTooLarge], status: 413 }
        }

        totalSize += parsed.size
        if (totalSize > SKILL_INPUT_LIMITS.maxCombinedImageBytes) {
            return { isValid: false, errors: [ERROR_MESSAGES.imagesTooLarge], status: 413 }
        }
    }

    return { isValid: true, errors, status }
}

export function validateSkillGenerationInput(input = {}) {
    const skillName = trimmedString(input.skillName)
    const description = trimmedString(input.description)
    const refinementInstruction = trimmedString(input.refinementInstruction)
    const previousMarkdown = typeof input.previousMarkdown === 'string' ? input.previousMarkdown : ''
    const images = input.images == null ? [] : input.images
    const errors = []
    let status = 400

    function addError(message, errorStatus = 400) {
        if (errors.length === 0) status = errorStatus
        errors.push(message)
    }

    if (!skillName) addError(ERROR_MESSAGES.skillNameRequired)
    if (skillName.length > SKILL_INPUT_LIMITS.skillNameMaxLength) addError(ERROR_MESSAGES.skillNameTooLong)
    if (description.length > SKILL_INPUT_LIMITS.descriptionMaxLength) addError(ERROR_MESSAGES.descriptionTooLong)
    if (refinementInstruction.length > SKILL_INPUT_LIMITS.refinementInstructionMaxLength) addError(ERROR_MESSAGES.refinementTooLong)

    if (byteLength(previousMarkdown) > SKILL_INPUT_LIMITS.previousMarkdownMaxBytes) {
        addError(ERROR_MESSAGES.markdownTooLarge, 413)
    }

    const imageValidation = validateImages(images)
    if (!imageValidation.isValid) {
        imageValidation.errors.forEach((error) => addError(error, imageValidation.status))
    }

    return {
        isValid: errors.length === 0,
        errors,
        status,
        value: {
            skillName,
            description,
            refinementInstruction,
            previousMarkdown,
            images: Array.isArray(images) ? images : [],
        },
    }
}

export function validatePreviousMarkdown(markdown) {
    if (byteLength(markdown) > SKILL_INPUT_LIMITS.previousMarkdownMaxBytes) {
        return { isValid: false, errors: [ERROR_MESSAGES.markdownTooLarge] }
    }

    return { isValid: true, errors: [] }
}
