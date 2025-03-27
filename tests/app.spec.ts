import { name, version } from '@root/package.json'
import request from 'supertest'
import { authenticator } from 'otplib'

import { app, server } from '@/app'
import { DetectionRequest, DetectionResponse } from '@/modules/detection-module/dtos'
import { HTTP_STATUS_CODES } from '@/types'
import { TwoFactorAuthService } from '@/modules/detection-module/services/two-factor-auth.service'

const ethereumAddress = '0xfdD055Cf3EaD343AD51f4C7d1F12558c52BaDFA5'
const zeroAddress = '0x0000000000000000000000000000000000000000'

describe('Service Tests', () => {
    afterAll(async () => {
        server.close()
    })

    describe('App Controller', () => {
        test('version', async () => {
            // Arrange
            const expectedData = { version, name }

            // Act
            const response = await request(app).get('/app/version')

            // Assert
            expect(response.status).toBe(HTTP_STATUS_CODES.OK)
            expect(response.body).toEqual(expectedData)
        })

        test('health check', async () => {
            // Arrange
            const expectedData = { message: 'OK' }

            // Act
            const response = await request(app).get('/app/health-check')

            // Assert
            expect(response.status).toBe(HTTP_STATUS_CODES.OK)
            expect(response.body).toEqual(expectedData)
        })
    })

    describe('Detection Controller', () => {
        const userSecret = TwoFactorAuthService.generateSecret()
        const twoFactorCode = authenticator.generate(userSecret)

        const requestPayload: Partial<DetectionRequest> = {
            id: 'unique-id',
            detectorName: 'test-detector',
            chainId: 1,
            hash: 'some hash',
            protocolName: 'some protocol',
            protocolAddress: zeroAddress,
            trace: {
                blockNumber: 12345,
                from: ethereumAddress,
                to: ethereumAddress,
                transactionHash: 'some hash',
                input: 'input',
                output: 'output',
                gas: '100000',
                gasUsed: '100',
                value: '10',
                pre: {
                    [zeroAddress]: {
                        balance: '0x..',
                        nonce: 2,
                    },
                },
                post: {
                    [zeroAddress]: {
                        balance: '0x..',
                    },
                },
                logs: [
                    {
                        address: ethereumAddress,
                        data: '0x...',
                        topics: ['0x...'],
                    },
                ],
                calls: [
                    {
                        from: ethereumAddress,
                        to: ethereumAddress,
                        input: 'input',
                        output: 'output',
                        gasUsed: '100',
                        value: '10',
                    },
                ],
            },
            additionalData: {
                twoFactorCode,
                userSecret
            }
        }

        test('detect success', async () => {
            // Act
            const response = await request(app)
                .post('/detect')
                .send(requestPayload)
                .set('Content-Type', 'application/json')

            const body: DetectionResponse = response.body

            // Assert
            expect(response.status).toBe(HTTP_STATUS_CODES.OK)
            expect(body.protocolName).toBe(requestPayload.protocolName)
            expect(body.protocolAddress).toBe(requestPayload.protocolAddress)
            expect(body.chainId).toBe(requestPayload.chainId)
            expect(body.error).toBeFalsy()
        })

        test('detect validation', async () => {
            const response = await request(app)
                .post('/detect')
                .send({ ...requestPayload, protocolAddress: 'definitely not address' })
                .set('Content-Type', 'application/json')

            expect(response.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST)
        })

        test('detect validation nested', async () => {
            const response = await request(app)
                .post('/detect')
                .send({
                    ...requestPayload,
                    trace: {
                        ...requestPayload.trace,
                        from: 'not valid address',
                        to: 'not valid as well',
                        logs: [
                            {
                                address: 'not address deeply nested',
                                data: '0x...',
                                topics: ['0x...'],
                            },
                        ],
                    },
                })
                .set('Content-Type', 'application/json')

            expect(response.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST)
            expect(response.body.message).toContain('trace.from')
            expect(response.body.message).toContain('trace.to')
            expect(response.body.message).toContain('trace.logs.0.address')
        })

        test('detect 2FA required', async () => {
            const highValueRequest = {
                ...requestPayload,
                trace: {
                    ...requestPayload.trace,
                    value: '2000000000000000000' // 2 ETH
                }
            }

            const response = await request(app)
                .post('/detect')
                .send(highValueRequest)
                .set('Content-Type', 'application/json')

            const body: DetectionResponse = response.body
            expect(response.status).toBe(HTTP_STATUS_CODES.OK)
            expect(body.detected).toBeFalsy()
            expect(body.message).toBe('2FA verification successful')
        })

        test('detect 2FA missing', async () => {
            const highValueRequest = {
                ...requestPayload,
                trace: {
                    ...requestPayload.trace,
                    value: '2000000000000000000' // 2 ETH
                },
                additionalData: undefined
            }

            const response = await request(app)
                .post('/detect')
                .send(highValueRequest)
                .set('Content-Type', 'application/json')

            const body: DetectionResponse = response.body
            expect(response.status).toBe(HTTP_STATUS_CODES.OK)
            expect(body.detected).toBeTruthy()
            expect(body.error).toBeTruthy()
            expect(body.message).toBe('2FA verification required but missing code or secret')
        })
    })
})
