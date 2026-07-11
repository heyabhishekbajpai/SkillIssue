import { describe, expect, it } from 'vitest'
import {
    SKILL_INPUT_LIMITS,
    validateSkillGenerationInput,
} from './skillInputValidation'

const pngDataUri = 'data:image/png;base64,aGVsbG8='

describe('skillInputValidation', () => {
    it('accepts a valid generation request', () => {
        const validation = validateSkillGenerationInput({
            skillName: 'Blog Writer',
            description: 'Write concise blog posts.',
            images: [pngDataUri],
        })

        expect(validation.isValid).toBe(true)
        expect(validation.value.skillName).toBe('Blog Writer')
        expect(validation.value.description).toBe('Write concise blog posts.')
    })

    it('rejects an invalid skill name', () => {
        const validation = validateSkillGenerationInput({
            skillName: '   ',
            description: 'Write concise blog posts.',
        })

        expect(validation.isValid).toBe(false)
        expect(validation.status).toBe(400)
        expect(validation.errors[0]).toMatch(/skill name/i)
    })

    it('rejects an oversized image', () => {
        const base64 = 'a'.repeat(Math.ceil((SKILL_INPUT_LIMITS.maxImageBytes + 1) / 3) * 4)
        const validation = validateSkillGenerationInput({
            skillName: 'Visual System',
            description: 'Extract a design system.',
            images: [`data:image/png;base64,${base64}`],
        })

        expect(validation.isValid).toBe(false)
        expect(validation.status).toBe(413)
        expect(validation.errors[0]).toMatch(/5MB/i)
    })

    it('rejects an invalid MIME type', () => {
        const validation = validateSkillGenerationInput({
            skillName: 'Icon System',
            description: 'Extract an icon style.',
            images: ['data:image/svg+xml;base64,aGVsbG8='],
        })

        expect(validation.isValid).toBe(false)
        expect(validation.status).toBe(415)
        expect(validation.errors[0]).toMatch(/png, jpeg, and webp/i)
    })

    it('rejects a malformed data URI', () => {
        const validation = validateSkillGenerationInput({
            skillName: 'Visual System',
            description: 'Extract a design system.',
            images: ['data:image/png;base64,not-valid***'],
        })

        expect(validation.isValid).toBe(false)
        expect(validation.status).toBe(400)
        expect(validation.errors[0]).toMatch(/malformed/i)
    })

    it('accepts refinement without a description', () => {
        const validation = validateSkillGenerationInput({
            skillName: 'Blog Writer',
            description: '',
            previousMarkdown: '# Blog Writer\n\nWrite posts.',
            refinementInstruction: 'Make it more concise.',
        })

        expect(validation.isValid).toBe(true)
        expect(validation.value.description).toBe('')
        expect(validation.value.refinementInstruction).toBe('Make it more concise.')
    })

    it('rejects oversized markdown', () => {
        const validation = validateSkillGenerationInput({
            skillName: 'Blog Writer',
            previousMarkdown: 'a'.repeat(SKILL_INPUT_LIMITS.previousMarkdownMaxBytes + 1),
            refinementInstruction: 'Improve it.',
        })

        expect(validation.isValid).toBe(false)
        expect(validation.status).toBe(413)
        expect(validation.errors[0]).toMatch(/markdown/i)
    })
})
