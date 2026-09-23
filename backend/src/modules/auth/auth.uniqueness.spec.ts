import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { CompanyKeyService } from './company-key.service';
import { MailService } from './mail.service';

describe('AuthService - Company Registration Uniqueness Rules', () => {
  let authService: AuthService;
  let prismaService: any;
  let mailService: any;

  const mockOrg = {
    id: 'org_123',
    name: 'Existing Enterprises Pvt Ltd',
    adminEmail: 'vikram.admin@acme.com',
    adminName: 'Vikram Singh',
    phone: '+91 98765 43210',
    gstNumber: '27AAACA1234F1Z5',
    panNumber: 'AAACA1234F',
    settings: { panNumber: 'AAACA1234F' },
    registrationKeyId: 'ACME-REG-0001',
  };

  beforeEach(async () => {
    prismaService = {
      organization: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([mockOrg]),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    mailService = {
      sendCompanyAlreadyRegisteredNotice: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: OtpService, useValue: {} },
        { provide: CompanyKeyService, useValue: {} },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('1. should reject registration with duplicate Email and send admin notification', async () => {
    prismaService.organization.findFirst.mockImplementation(({ where }: any) => {
      if (where?.adminEmail?.equals === 'vikram.admin@acme.com') {
        return Promise.resolve(mockOrg);
      }
      return Promise.resolve(null);
    });

    try {
      await authService.validateCompanyUniqueness({
        email: 'vikram.admin@acme.com',
        phone: '9123456780',
        gstNumber: '07BBBCB5678G1Z1',
        panNumber: 'BBBCB5678G',
      });
      fail('Expected ConflictException to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConflictException);
      const res = err.getResponse();
      expect(res.message).toBe('The company is already registered. Please check the Admin email for details.');
      expect(res.code).toBe('COMPANY_ALREADY_REGISTERED');
      expect(res.matchedField).toBe('Email');
      expect(mailService.sendCompanyAlreadyRegisteredNotice).toHaveBeenCalledWith(
        expect.objectContaining({
          adminEmail: 'vikram.admin@acme.com',
          companyName: 'Existing Enterprises Pvt Ltd',
          matchedField: 'Email',
        }),
      );
    }
  });

  it('2. should reject registration with duplicate Phone / Number and send admin notification', async () => {
    prismaService.organization.findFirst.mockImplementation(({ where }: any) => {
      if (where?.OR) {
        return Promise.resolve(mockOrg);
      }
      return Promise.resolve(null);
    });

    try {
      await authService.validateCompanyUniqueness({
        email: 'newperson@othercorp.com',
        phone: '9876543210', // 10-digit core match
        gstNumber: '07BBBCB5678G1Z1',
        panNumber: 'BBBCB5678G',
      });
      fail('Expected ConflictException to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConflictException);
      const res = err.getResponse();
      expect(res.message).toBe('The company is already registered. Please check the Admin email for details.');
      expect(res.code).toBe('COMPANY_ALREADY_REGISTERED');
      expect(res.matchedField).toBe('Phone Number');
    }
  });

  it('3. should reject registration with duplicate GST Number and send admin notification', async () => {
    prismaService.organization.findFirst.mockImplementation(({ where }: any) => {
      if (where?.gstNumber?.equals === '27AAACA1234F1Z5') {
        return Promise.resolve(mockOrg);
      }
      return Promise.resolve(null);
    });

    try {
      await authService.validateCompanyUniqueness({
        email: 'newperson@othercorp.com',
        phone: '9123456780',
        gstNumber: '27aaaca1234f1z5', // lowercase check
        panNumber: 'AAACA1234F',
      });
      fail('Expected ConflictException to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConflictException);
      const res = err.getResponse();
      expect(res.message).toBe('The company is already registered. Please check the Admin email for details.');
      expect(res.code).toBe('COMPANY_ALREADY_REGISTERED');
      expect(res.matchedField).toBe('GST Number');
    }
  });

  it('4. should reject registration with duplicate Business PAN and send admin notification', async () => {
    prismaService.organization.findFirst.mockImplementation(({ where }: any) => {
      if (where?.OR && where.OR.some((cond: any) => cond.panNumber || cond.gstNumber)) {
        return Promise.resolve(mockOrg);
      }
      return Promise.resolve(null);
    });

    try {
      await authService.validateCompanyUniqueness({
        email: 'newperson@othercorp.com',
        phone: '9123456780',
        panNumber: 'AAACA1234F',
      });
      fail('Expected ConflictException to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConflictException);
      const res = err.getResponse();
      expect(res.message).toBe('The company is already registered. Please check the Admin email for details.');
      expect(res.code).toBe('COMPANY_ALREADY_REGISTERED');
      expect(res.matchedField).toBe('Business PAN');
    }
  });

  it('5. should reject inconsistent PAN and GSTIN (mismatched entity)', async () => {
    await expect(
      authService.validateCompanyUniqueness({
        email: 'fresh@company.com',
        phone: '9111122222',
        gstNumber: '27AAACA1234F1Z5', // Embedded PAN is AAACA1234F
        panNumber: 'ZZZZZ9999Z',        // Mismatched
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('6. should allow registration when all 4 fields are unique', async () => {
    prismaService.organization.findFirst.mockResolvedValue(null);
    prismaService.organization.findMany.mockResolvedValue([]);
    prismaService.user.findFirst.mockResolvedValue(null);

    const result = await authService.validateCompanyUniqueness({
      email: 'unique.owner@brandnewco.com',
      phone: '9888877777',
      gstNumber: '06XXXXX0000X1Z9',
      panNumber: 'XXXXX0000X',
    });

    expect(result.isUnique).toBe(true);
  });
});
