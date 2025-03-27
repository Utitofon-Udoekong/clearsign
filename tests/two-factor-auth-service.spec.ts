import { TwoFactorAuthService } from '../src/modules/detection-module/services/two-factor-auth.service'
import { DetectionRequest } from '../src/modules/detection-module/dtos/requests'
import { ethers } from 'ethers'
import { authenticator } from 'otplib'

describe('TwoFactorAuthService', () => {
    describe('requires2FA', () => {
        it('should require 2FA for high-value transactions', () => {
            const request = {
                trace: {
                    value: ethers.parseEther('2.0').toString(),
                    calls: []
                },
                protocolName: 'unknown'
            } as unknown as DetectionRequest

            expect(TwoFactorAuthService.requires2FA(request)).toBe(true)
        })

        it('should not require 2FA for low-value transactions', () => {
            const request = {
                trace: {
                    value: ethers.parseEther('0.5').toString(),
                    calls: []
                },
                protocolName: 'unknown'
            } as unknown as DetectionRequest

            expect(TwoFactorAuthService.requires2FA(request)).toBe(false)
        })

        it('should require 2FA for known protocol transactions', () => {
            const request = {
                trace: {
                    value: '0',
                    calls: []
                },
                protocolName: 'uniswap'
            } as unknown as DetectionRequest

            expect(TwoFactorAuthService.requires2FA(request)).toBe(true)
        })

        it('should require 2FA for contract calls', () => {
            const request = {
                trace: {
                    value: '0',
                    calls: [{ from: '0x1', to: '0x2', input: '0x' }]
                },
                protocolName: 'unknown'
            } as DetectionRequest

            expect(TwoFactorAuthService.requires2FA(request)).toBe(true)
        })
    })

    describe('2FA verification', () => {
        it('should verify valid 2FA codes', () => {
            const secret = TwoFactorAuthService.generateSecret()
            const code = authenticator.generate(secret)

            expect(TwoFactorAuthService.verify2FACode(secret, code)).toBe(true)
        })

        it('should reject invalid 2FA codes', () => {
            const secret = TwoFactorAuthService.generateSecret()
            const invalidCode = '000000'

            expect(TwoFactorAuthService.verify2FACode(secret, invalidCode)).toBe(false)
        })

        it('should generate valid QR code URLs', () => {
            const secret = TwoFactorAuthService.generateSecret()
            const account = '0x1234567890123456789012345678901234567890'
            const url = TwoFactorAuthService.generateQRCodeURL(secret, account)

            expect(url).toContain('otpauth://totp/Venn2FA:')
            expect(url).toContain(account)
        })
    })
}) 